import {
	GrpcServiceDefinition,
	GrpcMethodMiddleware,
	DefaultGrpcMiddleware,
	isGrpcFunction,
} from './../types';
import { GrpcMiddlewares } from '../types';
import { CallOptions, Metadata } from '@grpc/grpc-js';

function callMiddlewaresFactory<TService extends GrpcServiceDefinition>(
	defaultMiddlewares: DefaultGrpcMiddleware[],
	methodMiddlewares: GrpcMethodMiddleware<TService, keyof TService>[] = [],
) {
	if (!methodMiddlewares.length && !defaultMiddlewares.length) {
		return undefined;
	}

	return (
		params: [
			Parameters<TService[keyof TService]>[0],
			Metadata,
			Partial<CallOptions>,
		],
	) => {
		const [, ...others] = params;
		for (const middleware of defaultMiddlewares) {
			middleware(others);
		}
		params[1] = others[0];
		params[2] = others[1];
		for (const middleware of methodMiddlewares) {
			middleware(params);
		}
	};
}

function getNewParameters<TService extends GrpcServiceDefinition>(
	args: [
		Parameters<TService[keyof TService]>[0],
		Metadata | Partial<CallOptions> | undefined,
		Partial<CallOptions> | undefined,
	],
	MetadataClass: new () => Metadata,
): [Parameters<TService[keyof TService]>[0], Metadata, Partial<CallOptions>] {
	const [params] = args;
	let [, metadata, options] = args;
	if (!(metadata instanceof Metadata)) {
		options = metadata ? metadata : {};
		metadata = new MetadataClass();
	} else if (!options) {
		options = {};
	}
	return [params, metadata, options];
}

export function applyMiddlewares<TService extends GrpcServiceDefinition>(
	client: TService,
	serviceMiddlewares: GrpcMiddlewares<TService> | undefined,
	MetadataClass: new () => Metadata,
) {
	if (serviceMiddlewares) {
		const defaultMiddlewares = serviceMiddlewares['*'] ?? [];
		for (const k in client) {
			if (client.hasOwnProperty(k)) {
				const middlewares = serviceMiddlewares[k];
				const callMiddlewares = callMiddlewaresFactory(
					defaultMiddlewares,
					middlewares,
				);
				if (callMiddlewares) {
					const rawCall = client[k];
					if (isGrpcFunction(rawCall)) {
						client[k] = ((
							...args: [
								Parameters<TService[keyof TService]>[0],
								Partial<CallOptions> | Metadata | undefined,
								Partial<CallOptions> | undefined,
							]
						) => {
							const newArgs = getNewParameters<TService>(args, MetadataClass);
							callMiddlewares.call(serviceMiddlewares, newArgs);
							return (rawCall as Function).apply(client, newArgs);
						}) as TService[Extract<keyof TService, string>];
					}
				}
			}
		}
	}
}
