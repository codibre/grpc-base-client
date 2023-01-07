import {
	GrpcServiceClient,
	isGrpcFunction,
	StreamCall,
	GrpcAsyncIterable,
} from './../types';
import { ClientDuplexStream, ServiceError } from '@grpc/grpc-js';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { ServiceClient } from '@grpc/grpc-js/build/src/make-client';
import { ClientConfig } from '../client-config';
import { ClientPool } from '../client-pool';
import { isStreamCall, RawUnaryCall, UnaryCall } from '../types';
import { applyMiddlewares } from './apply-middlewares';
import { getGrpc } from './grpc-lib';

const panicStatuses = new Set<Status | undefined>([
	Status.UNAVAILABLE,
	Status.INTERNAL,
]);

export function handlePanic(client: ServiceClient, config: ClientConfig) {
	if (config.noPanicControl !== true && config.maxConnections) {
    ClientPool.renewConnect(config, client);
	}
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
					if (panicStatuses.has(error.code)) {
						handlePanic(client, config);
					}
					reject(error);
				} else {
					resolve(value);
				}
			}),
		);
}

async function* getGrpcAsyncIterable<TService extends GrpcServiceClient>(
	stream: ClientDuplexStream<unknown, unknown>,
	client: TService,
	config: ClientConfig<any>,
): AsyncIterable<unknown> {
	try {
		yield* stream;
	} catch (error) {
		if (panicStatuses.has(error?.code)) {
			handlePanic(client, config);
		}
		throw error;
	}
}

function applyPanicHandling<TService extends GrpcServiceClient>(
	client: TService,
	serviceName: string,
	action: StreamCall<unknown, unknown>,
	config: ClientConfig<any>,
) {
	try {
		client[serviceName as keyof TService] = ((...args: any) => {
			const stream = action.apply(
				client,
				args,
			) as unknown as ClientDuplexStream<unknown, unknown>;
			const result = getGrpcAsyncIterable(
				stream,
				client,
				config,
			) as GrpcAsyncIterable<unknown>;
			result.onMetadata = (callback) => {
				stream.on('metadata', callback);
			};
			return result;
		}) as unknown as TService[keyof TService];
	} catch (error) {
		console.log(serviceName);
	}
}

function applyPromisify<TService extends GrpcServiceClient>(
	client: TService,
	serviceName: string,
	action: any,
	config: ClientConfig<any>,
) {
	(client as any)[serviceName] = promisifyUnary(
		action.bind(client),
		client,
		config,
	);
}

export function overloadServices<TService extends GrpcServiceClient>(
	client: TService,
	config: ClientConfig,
): TService {
	for (const serviceName in client.__proto__!) {
		if (client.__proto__!.hasOwnProperty(serviceName)) {
			const action = client[serviceName] as any;
			if (isGrpcFunction(action)) {
				if (isStreamCall(action)) {
					applyPanicHandling(client, serviceName, action, config);
				} else {
					applyPromisify(client, serviceName, action, config);
				}
			}
		}
	}

	const grpc = getGrpc(config.legacy);
	applyMiddlewares(client, config.middlewares, grpc.Metadata);

	return client;
}
