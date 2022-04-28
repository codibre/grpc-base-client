import { CallOptions, Metadata, ServiceError } from '@grpc/grpc-js';
import { ServiceClient } from '@grpc/grpc-js/build/src/make-client';

export interface UnaryCall<P> {
	(param: P, ...args: unknown[]): void;
}
export interface UnaryCallPromisify<P, R> {
	(param: P, deadline: Partial<CallOptions> | undefined): PromiseLike<R>;
	(
		param: P,
		metadata: Metadata,
		deadline: Partial<CallOptions> | undefined,
	): PromiseLike<R>;
}

function promisifyUnary<P, R>(
	unaryCall: UnaryCall<P>,
): UnaryCallPromisify<P, R> {
	return (param: P, ...args: unknown[]) =>
		new Promise<R>((resolve, reject) =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(unaryCall as any)(param, ...args, (error: ServiceError, value: R) => {
				if (error) {
					reject(error);
				} else {
					resolve(value);
				}
			}),
		);
}

export function overloadServices(client: ServiceClient): ServiceClient {
	const services = Object.keys(client.__proto__);
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
