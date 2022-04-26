/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/no-empty-function */

import { overloadUnaryServices } from '../../../src/utils/overload-unary-services';
afterEach(() => {
	delete require.cache[
		require.resolve('../../../src/utils/overload-unary-services')
	];
});

it('should start things', () => {
	require('../../../src/utils/overload-unary-services');

	expect(jest.fn()).toHaveCallsLike();
});

describe(overloadUnaryServices.name, () => {
	it('Should overload correct functions with promise and without promise', async () => {
		class Callable extends Function {
			requeStream: boolean;
			responseStream: boolean;
			constructor() {
				super(
					'return arguments.callee._call.apply(arguments.callee, arguments)',
				);
				this.requeStream = true;
				this.responseStream = true;
			}
			_call(arg: any) {
				return arg;
			}
		}

		class UnaryCallFn extends Function {
			requeStream: boolean;
			responseStream: boolean;
			constructor() {
				super(
					'return arguments.callee._call.apply(arguments.callee, arguments)',
				);
				this.requeStream = false;
				this.responseStream = false;
			}
			_call = (param: any, callback: any): void => {
				callback(null, param + 'UnaryCall');
			};
		}

		const client = {
			test: new UnaryCallFn(),
			stream: new Callable(),
			__proto__: {
				test: jest.fn(),
				stream: jest.fn(),
			},
		};

		const overService = overloadUnaryServices(client as any);
		const resultAsync = await overService.test('any');
		const resultSync = overService.test('any');
		const streamCall = overService.stream('any');

		expect(resultAsync).toBe('anyUnaryCall');
		expect(resultSync).not.toBe('anyUnaryCall');
		expect(streamCall).toBe('any');
	});
});
