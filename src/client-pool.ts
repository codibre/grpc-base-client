/* eslint-disable @typescript-eslint/no-shadow */
type Con = Object;
interface ConnectionPool {
	position: number;
	connections: any[];
	proxy?: any;
}

export class ClientPool {
	private static clientsPools: Map<string, ConnectionPool> = new Map();
	public static create<T>(
		alias: string,
		size: number,
		createClient: () => T,
	): T {
		let connectionPool: ConnectionPool | undefined =
			ClientPool.clientsPools.get(alias);
		if (!connectionPool) {
			connectionPool = {
				position: -1,
				connections: [createClient()],
			};
			ClientPool.clientsPools.set(alias, connectionPool);

			connectionPool.proxy = new Proxy(connectionPool.connections[0], {
				get(_target, name) {
					connectionPool!.position =
						(connectionPool!.position + 1) % connectionPool!.connections.length;
					const client = connectionPool!.connections[connectionPool!.position];
					if (name in client) {
						if (typeof client[name as keyof Con] === 'function') {
							return client[name as keyof Con].bind(client);
						}
						return client[name as keyof Con];
					}
				},
			});
		}

		while (connectionPool.connections.length < size) {
			connectionPool.connections.push(createClient());
		}

		return connectionPool.proxy;
	}
}
