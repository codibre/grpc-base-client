import { ChannelOptions } from '@grpc/grpc-js';
import { Options as PackageOptions } from '@grpc/proto-loader';
import { GrpcMiddlewares, GrpcServiceDefinition } from './types';

export interface ClientConfig<TService extends GrpcServiceDefinition = any> {
	url: string;
	protoFile: string;
	namespace: string;
	service: string;
	secure?: boolean;
	maxConnections: number;
	PackageOptions?: PackageOptions;
	grpcOptions?: Partial<ChannelOptions>;
	middlewares?: GrpcMiddlewares<TService>;
}
