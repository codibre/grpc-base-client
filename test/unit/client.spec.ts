import { Client } from '../../src/client';
import { ClientPool } from '../../src/client-pool';

describe('client.ts', () => {
	afterEach(() => {
		delete require.cache[require.resolve('../../src/client')];
	});

	it('should start things', () => {
		require('../../src/client');

		expect(jest.fn()).toHaveCallsLike();
	});

	interface Health {
		Check(props: { service: string }): Promise<any>;
	}

	it('should Create a Client and exec a call with correct pool', async () => {
		jest
			.spyOn(Client.prototype, 'createClient' as any)
			.mockImplementation(() => {
				return {
					Check: () => 'result',
				};
			});
		const client = new Client<Health>({
			namespace: 'abc.def',
			protoFile: 'health-check.proto',
			url: 'test.service',
			maxConnections: 2,
			service: 'Health',
			secure: true,
		});

		const pool = ClientPool['clientsPools'].get('test.service')!.connections;
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
		const client = new Client<Health>({
			namespace: 'abc.def',
			protoFile: 'health-check.proto',
			url: 'test.service2',
			maxConnections: 2,
			service: 'Health',
			secure: true,
		});

		const chosenInstance = client.getInstance();
		const pool = ClientPool['clientsPools'].get('test.service2')!.connections;
		pool.forEach((cli) => {
			jest.spyOn(cli, 'Check');
		});
		try {
			await chosenInstance.Check({ service: '1' });
			await chosenInstance.Check({ service: '2' });
			await chosenInstance.Check({ service: '3' });
		} catch (err) {
			console.error(err);
		}
		expect(pool[0].Check).toHaveCallsLike(
			[{ service: '1' }],
			[{ service: '3' }],
		);
		expect(pool[1].Check).toHaveCallsLike([{ service: '2' }]);
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
		});

		const chosenInstance = client.getInstance();
		const pool = ClientPool['clientsPools'].get('test.service2')?.connections;

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
});
