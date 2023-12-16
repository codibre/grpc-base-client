import { GrpcServiceDefinition } from './types';
import type { GrpcReflection as GrpcReflectionType } from 'grpc-js-reflection-client';
import { BaseClientConfig } from './client-config';

let GrpcReflection: new (...args: unknown[]) => GrpcReflectionType;

export const ReflectorProvider = {
	getReflector<T extends GrpcServiceDefinition<keyof T>>(
		config: BaseClientConfig<T>,
	) {
		const grpc = require('@grpc/grpc-js');
		const credentials =
			grpc.credentials[config.secure ? 'createSsl' : 'createInsecure']();
		GrpcReflection ??= require('grpc-js-reflection-client')?.GrpcReflection;
		const reflection = new GrpcReflection(
			config.url,
			credentials,
			config.grpcOptions,
		);
		return reflection;
	},
};
