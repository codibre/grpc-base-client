import {
	CallOptions,
	Metadata,
	ClientDuplexStream,
	ClientReadableStream,
	ClientWritableStream,
	Client,
} from '@grpc/grpc-js';

export interface RawUnaryCall<P, R> {
	(param: P, callback: (err: Error, response: R) => void): void;
	(
		param: P,
		deadline: Partial<CallOptions> | undefined,
		callback: (err: Error, response: R) => void,
	): void;
	(
		param: P,
		metadata: Metadata,
		callback: (err: Error, response: R) => void,
	): void;
	(
		param: P,
		metadata: Metadata,
		deadline: Partial<CallOptions> | undefined,
		callback: (err: Error, response: R) => void,
	): void;
}

export interface StreamCall<P, R> {
	(param: P, deadline?: Partial<CallOptions> | undefined): ClientDuplexStream<
		P,
		R
	>;
	(
		param: P,
		metadata: Metadata,
		deadline?: Partial<CallOptions> | undefined,
	): ClientDuplexStream<P, R>;
	requestStream: ClientWritableStream<P>;
	responseStream: ClientReadableStream<R>;
}

export interface UnaryCall<P, R> {
	(param: P, deadline?: Partial<CallOptions> | undefined): PromiseLike<R>;
	(
		param: P,
		metadata: Metadata,
		deadline?: Partial<CallOptions> | undefined,
	): PromiseLike<R>;
}

export type GrpcFunction<P, R> = StreamCall<P, R> | UnaryCall<P, R>;

export function isStreamCall<P, R>(
	action: GrpcFunction<P, R>,
): action is StreamCall<P, R> {
	return (action as StreamCall<P, R>).requestStream ||
		(action as StreamCall<P, R>).responseStream
		? true
		: false;
}

type KeyType = string | number | symbol;

export type GrpcServiceDefinition<
	Methods extends KeyType = keyof GrpcServiceDefinition<KeyType>,
> = Record<Methods, GrpcFunction<any, any>>;
export type GrpcServiceClient<Methods extends KeyType = KeyType> = Client &
	GrpcServiceDefinition<Methods>;

export interface FullGrpcParams<
	TService extends GrpcServiceDefinition<KeyType>,
	k extends keyof TService,
> {
	(
		param: Parameters<TService[k]>[0],
		metadata: Metadata,
		options: Partial<CallOptions>,
	): void;
}

export interface OtherGrpcParams {
	(metadata: Metadata, options: Partial<CallOptions>): void;
}

export type DefaultGrpcMiddleware = (
	params: Parameters<OtherGrpcParams>,
) => void;
export type GrpcMethodMiddleware<
	TService extends GrpcServiceDefinition<KeyType>,
	k extends keyof TService,
> = (params: Parameters<FullGrpcParams<TService, k>>) => void;

export type GrpcMiddlewares<TService extends GrpcServiceDefinition<KeyType>> = {
	[k in keyof TService]: GrpcMethodMiddleware<TService, k>[];
} & {
	'*'?: DefaultGrpcMiddleware[];
};
