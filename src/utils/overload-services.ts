import { GrpcServiceClient } from './../types';
import { ServiceError } from '@grpc/grpc-js';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { ServiceClient } from '@grpc/grpc-js/build/src/make-client';
import { ClientConfig } from '../client-config';
import { ClientPool } from '../client-pool';
import { isStreamCall, RawUnaryCall, UnaryCall } from '../types';
import { applyMiddlewares } from './apply-middlewares';

export function handlePanic(client: ServiceClient, config: ClientConfig) {
	ClientPool.renewConnect(config.url, client);
}

function promisifyUnary<P, R>(
	unaryCall: RawUnaryCall<P, R>,
	client: ServiceClient,
	config: ClientConfig,
): UnaryCall<P, R> {
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

export function overloadServices<TService extends GrpcServiceClient>(
	client: TService,
	config: ClientConfig,
): TService {
	for (const serviceName in client.__proto__!) {
		if (client.__proto__!.hasOwnProperty(serviceName)) {
			const action = client[serviceName] as any;
			if (action) {
				if (isStreamCall(action)) {
					try {
						client[serviceName as keyof TService] = ((...args: any) => {
							const stream = action.apply(client, args);
							stream.on('error', (error: ServiceError) => {
								if (error?.code === Status.UNAVAILABLE) {
									handlePanic(client, config);
								}
							});

							return stream;
						}) as unknown as TService[keyof TService];
					} catch (error) {
						console.log(serviceName);
					}
				} else {
					(client as any)[serviceName] = promisifyUnary(
						action.bind(client),
						client,
						config,
					);
				}
			}
		}
	}

	applyMiddlewares(client, config.middlewares);

	return client;
}
