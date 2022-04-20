import { ChannelOptions } from '@grpc/grpc-js';
import { Options as PackageOptions } from '@grpc/proto-loader';

export interface ClientConfig {
	url: string;
	protoFile: string;
	namespace: string;
	service: string;
	secure?: boolean;
	maxConnections: number;
	PackageOptions?: PackageOptions;
	grpcOptions?: Partial<ChannelOptions>;
}
