/* eslint-disable @typescript-eslint/no-shadow */
type Con = Object;
interface ConnectionPool {
	position: number;
	connections: any[];
	proxy?: any;
}

export class ClientPool {
	private static clientsPools: Map<string, ConnectionPool> = new Map();
	public static create<T extends Con>(
		alias: string,
		size: number,
		createClient: () => T,
	): T {
		const connectionPool: ConnectionPool | undefined =
			ClientPool.clientsPools.get(alias) ||
			ClientPool.proxify(alias, createClient, size);

		if (connectionPool.connections.length > size) {
			connectionPool.connections.length = size;
		}

		while (connectionPool.connections.length < size) {
			connectionPool.connections.push(createClient());
		}

		return connectionPool.proxy;
	}

	private static proxify<T extends Con>(
		alias: string,
		createClient: () => T,
		size: number,
	): ConnectionPool {
		const baseConn = createClient();
		const connectionPool: ConnectionPool = {
			position: -1,
			connections: [],
		};
		ClientPool.clientsPools.set(alias, connectionPool);
		connectionPool.proxy = new Proxy(baseConn, {
			get(_target, name) {
				const client = ClientPool.chooseClient(connectionPool, createClient);
				const method = client[name as keyof Con];
				return typeof method === 'function' ? method.bind(client) : method;
			},
		});
		if (size > 0) {
			connectionPool.connections.push(baseConn);
		}

		return connectionPool;
	}

	private static chooseClient<T extends Con>(
		connectionPool: ConnectionPool,
		createClient: () => T,
	) {
		const { length } = connectionPool.connections;
		let client: T;
		if (length > 0) {
			connectionPool.position = (connectionPool.position + 1) % length;
			client = connectionPool.connections[connectionPool.position];
		} else {
			client = createClient();
		}
		return client;
	}
}
