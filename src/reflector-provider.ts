import { createHash } from 'crypto';
import { GrpcServiceDefinition } from './types';
import type { GrpcReflection as GrpcReflectionType } from 'grpc-js-reflection-client';
import { BaseClientConfig } from './client-config';
import { fluentAsync } from '@codibre/fluent-iterable';
import { Metadata } from '@grpc/grpc-js';

let GrpcReflection: new (...args: unknown[]) => GrpcReflectionType;

export interface ReflectionResult {
	reflection: GrpcReflectionType;
	hash: string;
}

const reflectors = new Map<string, ReflectionResult>();

async function getReflectionHash(reflector: GrpcReflectionType) {
	const buffer = Buffer.concat(
		await fluentAsync(reflector.listServices())
			.sort()
			.map((x) => reflector.getDescriptorBySymbol(x))
			.map((x) => x.getBuffer())
			.toArray(),
	);

	return createHash('md5').update(buffer).digest('base64');
}

export const ReflectorProvider = {
	async getReflector<T extends GrpcServiceDefinition<keyof T>>(
		config: Pick<BaseClientConfig, 'grpcOptions' | 'secure' | 'url'>,
		forceUpdate = false,
	): Promise<ReflectionResult> {
		let result = reflectors.get(config.url);
		if (!result || !forceUpdate) {
			const grpc = require('@grpc/grpc-js');
			const credentials =
				grpc.credentials[config.secure ? 'createSsl' : 'createInsecure']();
			GrpcReflection ??= require('grpc-js-reflection-client')?.GrpcReflection;
			const reflection = new GrpcReflection(
				config.url,
				credentials,
				config.grpcOptions,
			);
			result = { reflection, hash: await getReflectionHash(reflection) };
			reflectors.set(config.url, result);
		}
		return result;
	},
	refreshReflector(
		meta: Metadata,
		config: Pick<BaseClientConfig, 'grpcOptions' | 'secure' | 'url'>,
	) {
		setImmediate(async () => {
			try {
				const serverHash = meta.get('x-proto-hash')?.[0];
				if (serverHash) {
					const { hash } = await ReflectorProvider.getReflector(config);
					if (hash !== serverHash) {
						await ReflectorProvider.getReflector(config, true);
					}
				}
			} catch {
				// Ignore
			}
		});
	},
};
