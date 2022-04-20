import {
	CallOptions,
	Metadata,
	ServiceClientConstructor,
	ServiceError,
} from '@grpc/grpc-js';
import { ServiceClient } from '@grpc/grpc-js/build/src/make-client';

export interface UnaryCall<P> {
	(param: P, ...args: unknown[]): void;
}

export interface UnaryCallPromisified<P, R> {
	(param: P, deadline?: Partial<CallOptions> | undefined): PromiseLike<R>;
	(
		param: P,
		metadata: Metadata,
		deadline: Partial<CallOptions> | undefined,
	): PromiseLike<R>;
}

export function promisifyUnary<P, R>(
	unaryCall: UnaryCall<P>,
): UnaryCallPromisified<P, R> {
	return (param: P, ...args: unknown[]) =>
		new Promise<R>((resolve, reject) =>
			(unaryCall as any)(param, ...args, (error: ServiceError, value: R) => {
				if (error) {
					reject(error);
				} else {
					resolve(value);
				}
			}),
		);
}

export function overloadUnaryServices(
	constructor: ServiceClientConstructor,
	client: ServiceClient,
): ServiceClient {
	const services = Object.keys(constructor.service);
	services.forEach((serviceName) => {
		const action = client[serviceName] as any;
		if (!action) {
			return;
		}
		const isUnary = !action?.requestStream && !action?.responseStream;
		if (isUnary) {
			(client as any)[serviceName] = promisifyUnary(action.bind(client));
		}
	});

	return client;
}
