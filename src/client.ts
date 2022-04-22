/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	GrpcObject as GrpcObjectNew,
	ServiceClientConstructor,
} from '@grpc/grpc-js';
import { GrpcObject as GrpcObjectOld } from 'grpc';
import { Options as PackageOptions, loadSync } from '@grpc/proto-loader';
import { ClientConfig } from './client-config';
import { getGrpcLib } from './utils/get-grpc-lib';
import { ClientPool } from './client-pool';
import { overloadUnaryServices } from './utils/overload-unary-services';

export type GrpcObject = GrpcObjectNew | GrpcObjectOld;

export class Client<T> {
	private packageDefinition!: GrpcObject;
	private grpcInstance: T;

	constructor(config: ClientConfig) {
		this.grpcInstance = ClientPool.create<T>(
			config.url,
			+(config.maxConnections || 1),
			() => this.createClient(config),
		);
	}

	public getInstance(): T {
		return this.grpcInstance;
	}

	private createClient(config: ClientConfig): T {
		const credentials =
			getGrpcLib().credentials[
				config.secure ? 'createSsl' : 'createInsecure'
			]();

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
		const grpcClient = overloadUnaryServices(client) as unknown as T;
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
			this.packageDefinition = getGrpcLib().loadPackageDefinition(
				pkgDef,
			) as GrpcObject;
		}
		return this.packageDefinition;
	}
}
