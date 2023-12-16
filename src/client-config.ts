import { ChannelOptions } from '@grpc/grpc-js';
import { Options as PackageOptions } from '@grpc/proto-loader';
import { GrpcMiddlewares, GrpcServiceDefinition } from './types';

export interface BaseClientConfig<
	TService extends GrpcServiceDefinition = any,
> {
	url: string;
	secure?: boolean;
	maxConnections: number;
	PackageOptions?: PackageOptions;
	grpcOptions?: Partial<ChannelOptions>;
	middlewares?: GrpcMiddlewares<TService>;
	noPanicControl?: boolean;
	namespace: string;
	service: string;
}

export interface ReflectedClientConfig<
	TService extends GrpcServiceDefinition = any,
> extends BaseClientConfig<TService> {
	proto: any;
	legacy: false;
}

export interface ClientConfig<TService extends GrpcServiceDefinition = any>
	extends BaseClientConfig<TService> {
	protoFile: string;
	/**
	 * Due to memory leak in the current @grpc/grpc-js version (https://github.com/grpc/grpc-node/issues/1339),
	 * you may want to stick with the legacy package. With this option, you can do this seamlessly
	 */
	legacy?: boolean;
}
