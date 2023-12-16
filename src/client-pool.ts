import { Client } from '@grpc/grpc-js';
import { BaseClientConfig, ClientConfig } from './client-config';

/* eslint-disable @typescript-eslint/no-shadow */
type Con = Object;
interface ConnectionPool {
	position: number;
	connections: any[];
	config: BaseClientConfig;
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
	public static create<T>(config: BaseClientConfig, createClient: () => T): T {
		const alias = this.getAlias(config);
		const size = config.maxConnections;
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
	static getAlias(config: BaseClientConfig) {
		return `${config.url}~${
			(config as ClientConfig).legacy ? 'legacy' : 'current'
		}`;
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

	public static renewConnect<T>(config: BaseClientConfig, client: Client): T {
		const alias = this.getAlias(config);
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
