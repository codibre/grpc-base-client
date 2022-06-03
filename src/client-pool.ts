import { Client } from '@grpc/grpc-js';
import { ClientConfig } from './client-config';

/* eslint-disable @typescript-eslint/no-shadow */
type Con = Object;
interface ConnectionPool {
	position: number;
	connections: any[];
	config: ClientConfig;
	factory: Function;
	proxy?: any;
}

function factoryPoolProxy(connectionPool: ConnectionPool): ConnectionPool {
	return new Proxy(connectionPool.connections[0], {
		get(_target, name) {
			connectionPool.position =
				(connectionPool.position + 1) % connectionPool.connections.length;
			const client = connectionPool.connections[connectionPool.position];
			client.poolPosition = connectionPool.position;
			if (name in client) {
				if (typeof client[name as keyof Con] === 'function') {
					return client[name as keyof Con].bind(client);
				}
				return client[name as keyof Con];
			}
		},
	});
}

export class ClientPool {
	private static clientsPools: Map<string, ConnectionPool> = new Map();
	public static create<T>(
		alias: string,
		size: number,
		config: ClientConfig,
		createClient: () => T,
	): T {
		let connectionPool: ConnectionPool | undefined =
			ClientPool.clientsPools.get(alias);
		if (!connectionPool) {
			const client = createClient();
			(client as any).poolPosition = -1;
			connectionPool = {
				position: -1,
				config,
				factory: createClient,
				connections: [client],
			};
			ClientPool.clientsPools.set(alias, connectionPool);

			connectionPool.proxy = factoryPoolProxy(connectionPool);
		}

		while (connectionPool.connections.length < size) {
			this.addConnection(alias, createClient);
		}

		return connectionPool.proxy;
	}

	public static addConnection<T>(alias: string, createClient: () => T): T {
		const pool = ClientPool.clientsPools.get(alias);
		if (!pool) {
			throw new Error(`Not found pool ${alias} to add a new connection`);
		}
		const client = createClient() as any;

		pool.connections.push(client);
		return pool.proxy;
	}

	public static renewConnect<T>(alias: string, client: Client): T {
		const position = (client as any).poolPosition;
		const pool = ClientPool.clientsPools.get(alias);
		if (!pool) {
			throw new Error(`Not found pool ${alias} to renew connection`);
		}
		client.close();
		const newClient = pool.factory();
		pool.connections[position] = newClient;
		return pool.proxy;
	}
}
