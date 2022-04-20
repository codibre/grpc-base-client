/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/no-empty-function */

import {
	overloadUnaryServices,
	promisifyUnary,
	UnaryCall,
} from '../../../src/utils/promisify-unary';

describe(promisifyUnary.name, () => {
	it('Should return a promise result of a function without errors', async () => {
		const func: UnaryCall<any> = (param: any, callback: any): void => {
			callback(null, param + 'UnaryCall');
		};

		const funPromise = promisifyUnary(func);
		const result = await funPromise('any');
		expect(result).toBe('anyUnaryCall');
	});

	it('Should return a promise result of a function with errors', async () => {
		const func: UnaryCall<any> = (param: any, callback: any): void => {
			callback(new Error(param + 'UnaryCall'));
		};

		const funPromise = promisifyUnary(func);
		try {
			await funPromise('any');
		} catch (err) {
			expect((err as Error).message).toBe('anyUnaryCall');
		}
	});
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
			_call: UnaryCall<any> = (param: any, callback: any): void => {
				callback(null, param + 'UnaryCall');
			};
		}

		const constructor = {
			service: {
				test: (): void => {},
				stream: (): void => {},
			},
		};

		const client = {
			test: new UnaryCallFn(),
			stream: new Callable(),
		};

		const overService = overloadUnaryServices(
			constructor as any,
			client as any,
		);
		const resultAsync = await overService.test('any');
		const resultSync = overService.test('any');
		const streamCall = overService.stream('any');

		expect(resultAsync).toBe('anyUnaryCall');
		expect(resultSync).not.toBe('anyUnaryCall');
		expect(streamCall).toBe('any');
	});
});
