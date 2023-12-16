import { ReflectorProvider } from './reflector-provider';
import type { GrpcServiceClient, GrpcServiceDefinition } from './types';
import type {
	BaseClientConfig,
	ClientConfig,
	ReflectedClientConfig,
} from './client-config';
import type { GrpcObject, ServiceClientConstructor } from '@grpc/grpc-js';
import {
	loadFileDescriptorSetFromObject,
	loadSync,
	Options as PackageOptions,
} from '@grpc/proto-loader';
import { getGrpc } from './utils/grpc-lib';
import { ClientPool } from './client-pool';
import { overloadServices } from './utils/overload-services';

export class Client<T extends GrpcServiceDefinition<keyof T>> {
	private packageDefinition!: GrpcObject;
	private grpcInstance: T;
	readonly config: ClientConfig<T> | ReflectedClientConfig<T>;
	public poolPosition?: number;

	constructor(
		config: ClientConfig<T> | ReflectedClientConfig<T>,
		poolService = ClientPool,
	) {
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

	public createMetadata() {
		const grpc = getGrpc(this.config.legacy);
		return new grpc.Metadata();
	}

	public static async getByReflection<T extends GrpcServiceDefinition<keyof T>>(
		config: BaseClientConfig<T>,
		poolService = ClientPool,
	) {
		const reflection = ReflectorProvider.getReflector<T>(config);
		const descriptor = await reflection.getDescriptorBySymbol(
			`${config.namespace}.${config.service}`,
		);
		const proto = descriptor.getProtobufJsRoot().toDescriptor('3');

		return new Client<T>(
			{
				...config,
				proto,
				legacy: false,
			},
			poolService,
		);
	}

	private createClient(config: ClientConfig | ReflectedClientConfig<T>): T {
		const grpc = getGrpc(config.legacy);
		const credentials =
			grpc.credentials[config.secure ? 'createSsl' : 'createInsecure']();

		const proto = 'protoFile' in config ? config.protoFile : config.proto;
		const grpcPackage = this.loadPackage(
			proto,
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
		path: string | protobuf.Root,
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
			const pkgDef =
				typeof path === 'string'
					? loadSync(path, conf)
					: loadFileDescriptorSetFromObject(path);
			this.packageDefinition = grpc.loadPackageDefinition(pkgDef);
		}
		return this.packageDefinition;
	}
}
