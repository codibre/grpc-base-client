import type { GrpcServiceClient, GrpcServiceDefinition } from './types';
import type { ClientConfig } from './client-config';
import type { GrpcObject, ServiceClientConstructor } from '@grpc/grpc-js';
import type { Options as PackageOptions } from '@grpc/proto-loader';
import { getGrpc } from './utils/grpc-lib';
import { loadSync } from '@grpc/proto-loader';
import { ClientPool } from './client-pool';
import { overloadServices } from './utils/overload-services';

export class Client<T extends GrpcServiceDefinition<keyof T>> {
	private packageDefinition!: GrpcObject;
	private grpcInstance: T;
	readonly config: ClientConfig<T>;
	public poolPosition?: number;

	constructor(config: ClientConfig<T>, poolService = ClientPool) {
		this.config = config;
		if (config.maxConnections === 0) {
			this.grpcInstance = this.createClient(config);
		} else {
			this.grpcInstance = poolService.create<T>(config, () =>
				this.createClient(config),
			);
		}
	}

	public getInstance(): T {
		return this.grpcInstance;
	}

	private createClient(config: ClientConfig): T {
		const grpc = getGrpc(config.legacy);
		const credentials =
			grpc.credentials[config.secure ? 'createSsl' : 'createInsecure']();

		const grpcPackage = this.loadPackage(
			config.protoFile,
			config.PackageOptions,
			config.legacy,
		);

		const grpcDef = config.namespace
			.split('.')
			.reduce((prev: any, current: any) => {
				current = prev[current];
				return current;
			}, grpcPackage)[config.service] as ServiceClientConstructor;

		const client = new grpcDef(
			config.url,
			credentials,
			config.grpcOptions,
		) as GrpcServiceClient;
		const grpcClient = overloadServices(client, config) as unknown as T;
		return grpcClient as unknown as T;
	}

	private loadPackage(
		address: string,
		config: PackageOptions | undefined,
		legacy: boolean | undefined,
	): GrpcObject {
		if (!this.packageDefinition) {
			const grpc = getGrpc(legacy);
			const conf = {
				keepCase: false,
				enums: String,
				defaults: true,
				...config,
			};
			const pkgDef = loadSync(address, conf);
			this.packageDefinition = grpc.loadPackageDefinition(pkgDef);
		}
		return this.packageDefinition;
	}
}
