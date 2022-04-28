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

export class Client<T> {
	private packageDefinition!: GrpcObject;
	private grpcInstance: T;

	constructor(config: ClientConfig) {
		if (config.maxConnections === 0) {
			this.grpcInstance = this.createClient(config);
		} else {
			this.grpcInstance = ClientPool.create<T>(
				config.url,
				config.maxConnections,
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

		const client = new grpcDef(config.url, credentials, config.grpcOptions);
		const grpcClient = overloadServices(client) as unknown as T;
		return grpcClient;
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
