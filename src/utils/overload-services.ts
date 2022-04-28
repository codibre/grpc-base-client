import { CallOptions, Metadata, ServiceError } from '@grpc/grpc-js';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { ServiceClient } from '@grpc/grpc-js/build/src/make-client';
import { ClientConfig } from '../client-config';
import { ClientPool } from '../client-pool';

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

export function handlePanic(client: ServiceClient, config: ClientConfig) {
	ClientPool.renewConnect(config.url, client);
}

function promisifyUnary<P, R>(
	unaryCall: UnaryCall<P>,
	client: ServiceClient,
	config: ClientConfig,
): UnaryCallPromisify<P, R> {
	return (param: P, ...args: unknown[]) =>
		new Promise<R>((resolve, reject) =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(unaryCall as any)(param, ...args, (error: ServiceError, value: R) => {
				if (error) {
					if (
						error.code === Status.UNAVAILABLE ||
						error.code === Status.INTERNAL
					) {
						handlePanic(client, config);
					}
					reject(error);
				} else {
					resolve(value);
				}
			}),
		);
}

export function overloadServices(
	client: ServiceClient,
	config: ClientConfig,
): ServiceClient {
	const services = Object.keys(client.__proto__);
	services.forEach((serviceName) => {
		const action = client[serviceName] as any;
		if (!action) {
			return;
		}
		const isUnary = !action?.requestStream && !action?.responseStream;
		if (isUnary) {
			(client as any)[serviceName] = promisifyUnary(
				action.bind(client),
				client,
				config,
			);
		}

		if (action?.requestStream || action?.responseStream) {
			try {
				client[serviceName] = (...args: any[]) => {
					const stream = action.apply(client, args);
					stream.on('error', (error: ServiceError) => {
						if (error?.code === Status.UNAVAILABLE) {
							handlePanic(client, config);
						}
					});

					return stream;
				};
			} catch (error) {
				console.log(serviceName);
			}
		}
	});

	return client;
}
