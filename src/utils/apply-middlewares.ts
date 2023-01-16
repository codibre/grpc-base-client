import {
	GrpcServiceDefinition,
	DefaultGrpcMiddleware,
	isGrpcFunction,
	GrpcFunction,
	GrpcAsyncIterable,
	MiddlewareResult,
} from './../types';
import { GrpcMiddlewares } from '../types';
import { CallOptions, Metadata } from '@grpc/grpc-js';
import { fluentAsync, FluentAsyncIterable } from '@codibre/fluent-iterable';

function treatMiddlewareResult(
	result: void | MiddlewareResult,
	onEnds: Array<NonNullable<MiddlewareResult['onEnd']>>,
	onItems: Array<NonNullable<MiddlewareResult['onItem']>>,
) {
	if (result) {
		const { onEnd, onItem } = result;
		if (onEnd) onEnds.push(onEnd.bind(result));
		if (onItem) onItems.push(onItem.bind(result));
	}
}

function callMiddlewaresFactory<TService extends GrpcServiceDefinition>(
	defaultMiddlewares: DefaultGrpcMiddleware[],
	grpcMiddlewares: GrpcMiddlewares<TService>,
	key: keyof TService,
) {
	const methodMiddlewares = grpcMiddlewares[key] ?? [];
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
		const onEnds: Array<NonNullable<MiddlewareResult['onEnd']>> = [];
		const onItems: Array<NonNullable<MiddlewareResult['onItem']>> = [];
		const [, ...others] = params;
		for (const middleware of defaultMiddlewares) {
			treatMiddlewareResult(middleware(others, key as string), onEnds, onItems);
		}
		params[1] = others[0];
		params[2] = others[1];
		for (const middleware of methodMiddlewares) {
			treatMiddlewareResult(middleware(params), onEnds, onItems);
		}

		return { onItems, onEnds };
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

function endingWithError(
	onEnds: NonNullable<MiddlewareResult['onEnd']>[],
	err: any,
) {
	for (const onEnd of onEnds) {
		onEnd(err);
	}
}

function endingWithoutError(
	ended: boolean,
	onEnds: NonNullable<MiddlewareResult['onEnd']>[],
) {
	if (!ended) {
		for (const onEnd of onEnds) {
			onEnd(undefined);
		}
	}
}

function procOnItemFactory<T>(
	onItems: NonNullable<MiddlewareResult['onItem']>[],
) {
	return (result: T) => {
		for (const onItem of onItems) {
			result = onItem(result);
		}
		return result;
	};
}

async function wrapPromise<T>(
	promise: PromiseLike<T>,
	onEnds: Array<NonNullable<MiddlewareResult['onEnd']>>,
	onItems: Array<NonNullable<MiddlewareResult['onItem']>>,
) {
	const procOnItem = procOnItemFactory(onItems);
	let ended = false;
	try {
		return procOnItem(await promise);
	} catch (err) {
		ended = true;
		endingWithError(onEnds, err);
	} finally {
		endingWithoutError(ended, onEnds);
	}
}

function wrapIterable<T>(
	iterable: AsyncIterable<T>,
	onEnds: Array<NonNullable<MiddlewareResult['onEnd']>>,
	onItems: Array<NonNullable<MiddlewareResult['onItem']>>,
): FluentAsyncIterable<T> {
	let ended = false;
	return fluentAsync(iterable)
		.map(procOnItemFactory(onItems))
		.catch((err) => {
			ended = true;
			return endingWithError(onEnds, err);
		})
		.finally(() => endingWithoutError(ended, onEnds));
}

function runWrapped<TService extends GrpcServiceDefinition>(
	rawCall: GrpcFunction<any, any>,
	client: TService,
	newArgs: [
		Parameters<TService[keyof TService]>[0],
		Metadata,
		Partial<CallOptions>,
	],
	onEnds: Array<NonNullable<MiddlewareResult['onEnd']>>,
	onItems: Array<NonNullable<MiddlewareResult['onItem']>>,
): GrpcAsyncIterable<any> | PromiseLike<any> {
	const result = (rawCall as Function).apply(client, newArgs);
	if (result[Symbol.asyncIterator]) {
		const iterable = wrapIterable(
			result,
			onEnds,
			onItems,
		) as GrpcAsyncIterable<any>;
		iterable.onMetadata = result.onMetadata;
		return iterable;
	}
	return wrapPromise(result, onEnds, onItems);
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
				const callMiddlewares = callMiddlewaresFactory(
					defaultMiddlewares,
					serviceMiddlewares,
					k,
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
							const { onEnds, onItems } = callMiddlewares.call(
								serviceMiddlewares,
								newArgs,
							);
							return runWrapped(rawCall, client, newArgs, onEnds, onItems);
						}) as TService[Extract<keyof TService, string>];
					}
				}
			}
		}
	}
}
