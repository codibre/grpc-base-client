import { GrpcServiceClient, GrpcServiceDefinition } from './types';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	GrpcObject,
	loadPackageDefinition,
	ServiceClientConstructor,
	credentials as gRPCCredentials,
} from '@grpc/grpc-js';

import { Options as PackageOptions, loadSync } from '@grpc/proto-loader';
import { ClientConfig } from './client-config';
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
			this.grpcInstance = poolService.create<T>(
				config.url,
				config.maxConnections,
				config,
				() => this.createClient(config),
			);
		}
	}

	public getInstance(): T {
		return this.grpcInstance;
	}

	private createClient(config: ClientConfig): T {
		const credentials =
			gRPCCredentials[config.secure ? 'createSsl' : 'createInsecure']();

		const grpcPackage = this.loadPackage(
			config.protoFile,
			config.PackageOptions,
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

	private loadPackage(address: string, config?: PackageOptions): GrpcObject {
		if (!this.packageDefinition) {
			const conf = {
				keepCase: false,
				enums: String,
				defaults: true,
				...config,
			};
			const pkgDef = loadSync(address, conf);
			this.packageDefinition = loadPackageDefinition(pkgDef);
		}
		return this.packageDefinition;
	}
}
