/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
	handlePanic,
	overloadServices,
} from '../../../src/utils/overload-services';
import * as overload from '../../../src/utils/overload-services';
import { GrpcServiceClient, UnaryCall } from '../../../src';

class UnaryCallFn extends Function {
	requeStream: boolean;
	responseStream: boolean;
	constructor() {
		super('return arguments.callee._call.apply(arguments.callee, arguments)');
		this.requeStream = false;
		this.responseStream = false;
	}
	_call = (param: any, callback: any): void => {
		callback(null, param + 'UnaryCall');
	};
}
class UnaryCallFnFail extends UnaryCallFn {
	_call = (param: any, callback: any): void => {
		const error = new Error('Fake error');
		(error as any).code = 14;
		callback(error, param + 'UnaryCall');
	};
}

class Callable extends Function {
	requeStream: boolean;
	responseStream: boolean;
	constructor() {
		super('return arguments.callee._call.apply(arguments.callee, arguments)');
		this.requeStream = true;
		this.responseStream = true;
	}
	_call(arg: any) {
		return arg;
	}
	on(...args: any[]) {
		return args;
	}
}

afterEach(() => {
	delete require.cache[require.resolve('../../../src/utils/overload-services')];
});

it('should start things', () => {
	require('../../../src/utils/overload-services');

	expect(jest.fn()).toHaveCallsLike();
});

describe(overloadServices.name, () => {
	it('Should overload correct functions with promise and without promise', async () => {
		const config = {
			namespace: 'abc.def',
			protoFile: 'health-check.proto',
			url: 'test.service2',
			maxConnections: 3,
			service: 'Health',
			secure: true,
		};

		const client = {
			test: new UnaryCallFn(),
			stream: new Callable(),
			__proto__: {
				test: jest.fn(),
			},
		};

		const overService = overloadServices(client as any, config);
		const resultAsync = await overService.test('any');
		const resultSync = overService.test('any');

		expect(resultAsync).toBe('anyUnaryCall');
		expect(resultSync).not.toBe('anyUnaryCall');
	});

	it('Should call unary and trigger Panic on error', async () => {
		jest.spyOn(overload, 'handlePanic').mockImplementation(() => {
			return 'handlePanic';
		});

		const config = {
			namespace: 'abc.def',
			protoFile: 'health-check.proto',
			url: 'test.service2',
			maxConnections: 3,
			service: 'Health',
			secure: true,
		};

		const client = {
			test: new UnaryCallFnFail(),
			url: 'test.service2',
			close: jest.fn(),
			__proto__: {
				test: jest.fn(),
			},
		} as unknown as GrpcServiceClient & {
			test: UnaryCall<string, unknown>;
		};

		const overService = overload.overloadServices(client, config);
		let resultAsync = undefined;
		let err!: Error;
		try {
			resultAsync = await overService.test('any');
		} catch (error) {
			err = error as Error;
		}

		expect(handlePanic).toHaveBeenCalledOnce;
		expect(resultAsync).toBe(undefined);
		expect(err.message).toBe(
			'Not found pool test.service2 to renew connection',
		);
	});

	it('Should not trigger Panic when noPanicControl is true', async () => {
		jest.spyOn(overload, 'handlePanic').mockImplementation(() => {
			return 'handlePanic';
		});

		const config = {
			namespace: 'abc.def',
			protoFile: 'health-check.proto',
			url: 'test.service2',
			maxConnections: 3,
			service: 'Health',
			secure: true,
			noPanicControl: true,
		};

		const client = {
			test: new UnaryCallFnFail(),
			url: 'test.service2',
			close: jest.fn(),
			__proto__: {
				test: jest.fn(),
			},
		} as unknown as GrpcServiceClient & {
			test: UnaryCall<string, unknown>;
		};

		const overService = overload.overloadServices(client, config);
		let resultAsync = undefined;
		let err!: Error;
		try {
			resultAsync = await overService.test('any');
		} catch (error) {
			err = error as Error;
		}

		expect(handlePanic).toHaveCallsLike();
		expect(resultAsync).toBe(undefined);
		expect(err.message).toBe('Fake error');
	});

	it('Should not trigger Panic when maxConnections is 0', async () => {
		jest.spyOn(overload, 'handlePanic').mockImplementation(() => {
			return 'handlePanic';
		});

		const config = {
			namespace: 'abc.def',
			protoFile: 'health-check.proto',
			url: 'test.service2',
			maxConnections: 0,
			service: 'Health',
			secure: true,
		};

		const client = {
			test: new UnaryCallFnFail(),
			url: 'test.service2',
			close: jest.fn(),
			__proto__: {
				test: jest.fn(),
			},
		} as unknown as GrpcServiceClient & {
			test: UnaryCall<string, unknown>;
		};

		const overService = overload.overloadServices(client, config);
		let resultAsync = undefined;
		let err!: Error;
		try {
			resultAsync = await overService.test('any');
		} catch (error) {
			err = error as Error;
		}

		expect(handlePanic).toHaveCallsLike();
		expect(resultAsync).toBe(undefined);
		expect(err.message).toBe('Fake error');
	});
});
