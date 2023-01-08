import { Server } from '@grpc/grpc-js';
import { Client, ClientPool, StreamCall, UnaryCall } from '../../src';
import { createServer } from '../server';

describe('client.ts', () => {
	const internal = '0.0.0.0:50052';
	const external = 'localhost:50052';
	let server: Server;
	jest.setTimeout(10000);

	beforeAll(async () => {
		server = await createServer(internal);
	});

	afterAll(() => {
		server.tryShutdown(() => undefined);
	});

	[false, true].forEach((legacy) => {
		describe(`legacy mode ${legacy}`, () => {
			it('should start things', () => {
				require('../../src/client');

				expect(jest.fn()).toHaveCallsLike();
			});

			interface Health {
				Check: UnaryCall<{ service: string }, any>;
			}

			it('should Create a Client and exec a call with correct pool', async () => {
				jest
					.spyOn(Client.prototype, 'createClient' as any)
					.mockImplementation(() => {
						return {
							Check: () => 'result',
						};
					});
				const config = {
					namespace: 'abc.def',
					protoFile: 'health-check.proto',
					url: 'test.service',
					maxConnections: 2,
					service: 'Health',
					secure: true,
					legacy,
				};
				const client = new Client<Health>(config);

				const pool = ClientPool['clientsPools'].get(
					ClientPool.getAlias(config),
				)!.connections;
				pool.forEach((cli) => {
					jest.spyOn(cli, 'Check');
				});
				try {
					await client.getInstance().Check({ service: '1' });
					await client.getInstance().Check({ service: '2' });
					await client.getInstance().Check({ service: '3' });
				} catch (err) {
					console.error(err);
				}
				expect(pool[0].poolPosition).toBe(0);
				expect(pool[1].poolPosition).toBe(1);
				expect(pool[0].Check).toHaveCallsLike(
					[{ service: '1' }],
					[{ service: '3' }],
				);
				expect(pool[1].Check).toHaveCallsLike([{ service: '2' }]);
			});

			it('should Create a Client and exec a call with correct pool with another instance', async () => {
				jest
					.spyOn(Client.prototype, 'createClient' as any)
					.mockImplementation(() => {
						return {
							Check: () => 'result',
						};
					});
				const config = {
					namespace: 'abc.def',
					protoFile: 'health-check.proto',
					url: 'test.service2',
					maxConnections: 3,
					service: 'Health',
					secure: true,
					legacy,
				};
				const client = new Client<Health>(config);

				const chosenInstance = client.getInstance();
				const pool = ClientPool['clientsPools'].get(
					ClientPool.getAlias(config),
				)!.connections;
				pool.forEach((cli) => {
					jest.spyOn(cli, 'Check');
				});
				try {
					await chosenInstance.Check({ service: '1' });
					await chosenInstance.Check({ service: '2' });
					await chosenInstance.Check({ service: '3' });
					await chosenInstance.Check({ service: '4' });
				} catch (err) {
					console.error(err);
				}
				expect(pool[0].Check).toHaveCallsLike(
					[{ service: '1' }],
					[{ service: '4' }],
				);
				expect(pool[0].poolPosition).toBe(0);
				expect(pool[1].poolPosition).toBe(1);
				expect(pool[2].poolPosition).toBe(2);
				expect(pool[1].Check).toHaveCallsLike([{ service: '2' }]);
				expect(pool[2].Check).toHaveCallsLike([{ service: '3' }]);
			});

			it('should Create a Client and exec a call without pool', async () => {
				jest
					.spyOn(Client.prototype, 'createClient' as any)
					.mockImplementation(() => {
						return {
							Check: jest.fn(),
						};
					});
				const client = new Client<Health>({
					namespace: 'abc.def',
					protoFile: 'health-check.proto',
					url: 'test.service2',
					maxConnections: 0,
					service: 'Health',
					secure: true,
					legacy,
				});

				const chosenInstance = client.getInstance();
				const pool =
					ClientPool['clientsPools'].get('test.service2')?.connections;

				try {
					await chosenInstance.Check({ service: '1' });
					await chosenInstance.Check({ service: '2' });
					await chosenInstance.Check({ service: '3' });
				} catch (err) {
					console.error(err);
				}

				expect(pool).toBeUndefined;
				expect(chosenInstance.Check).toHaveCallsLike(
					[{ service: '1' }],
					[{ service: '2' }],
					[{ service: '3' }],
				);
			});

			it('should apply middlewares and updated parameters', async () => {
				const endingDefaultMiddleware = jest.fn();
				const defaultMiddleware = jest
					.fn()
					.mockReturnValue({ onEnd: endingDefaultMiddleware });
				const middleware = jest.fn();
				const deadline = Date.now() + 9999999;
				const client = new Client<{
					Unary: UnaryCall<{ foo: string }, unknown>;
				}>({
					namespace: 'test',
					protoFile: './test/test.proto',
					url: external,
					maxConnections: 0,
					service: 'Test',
					secure: false,
					middlewares: {
						'*': [defaultMiddleware],
						Unary: [
							(params) => {
								params[0] = {
									foo: params[0].foo + '2',
								};
								params[1].set('myMeta', 'myValue');
								params[2] = {
									...params[2],
									deadline,
								};
							},
							(params) => {
								params[0].foo += '3';
							},
							middleware,
						],
					},
					legacy,
				});
				const chosenInstance = client.getInstance();

				const result = await chosenInstance.Unary({ foo: '1' });

				const metadata = client.createMetadata();
				metadata.set('myMeta', 'myValue');
				expect(defaultMiddleware).toHaveCallsLike([[metadata, {}], 'Unary']);
				expect(endingDefaultMiddleware).toHaveCallsLike([undefined]);
				expect(middleware).toHaveCallsLike([
					[{ foo: '123' }, metadata, expect.objectContaining({ deadline })],
				]);
				expect(result).toEqual({ bar: '123' });
			});

			it('should renew connection on stream error', async () => {
				const create = jest.spyOn(ClientPool, 'renewConnect' as any);
				const client = new Client<{
					ResponseStream: StreamCall<{ foo: string }, unknown>;
				}>(
					{
						namespace: 'test',
						protoFile: './test/test.proto',
						url: external,
						maxConnections: 1,
						service: 'Test',
						secure: false,
						legacy,
					},
					ClientPool,
				);
				let thrownError: any;
				let result: any;

				try {
					const stream = client.getInstance().ResponseStream({ foo: 'error' });
					for await (const item of stream) {
						result = item;
					}
				} catch (err) {
					thrownError = err;
				}

				expect(create).toHaveBeenCalledTimes(1);
				expect(thrownError).toBeDefined();
				expect(result).toBeUndefined();
			});

			it('should renew connection on unary error', async () => {
				const create = jest.spyOn(ClientPool, 'renewConnect' as any);

				const client = new Client<{
					Unary: UnaryCall<{ foo: string }, unknown>;
				}>(
					{
						namespace: 'test',
						protoFile: './test/test.proto',
						url: external,
						maxConnections: 1,
						service: 'Test',
						secure: false,
						legacy,
					},
					ClientPool,
				);
				let thrownError: any;
				let result: any;

				try {
					result = await client.getInstance().Unary({ foo: 'error' });
				} catch (error) {
					thrownError = error;
				}

				expect(create).toHaveBeenCalledTimes(1);
				expect(thrownError).toBeDefined();
				expect(result).toBeUndefined();
			});
		});
	});
});
