import { BaseClientConfig } from './client-config';
import { ReflectorProvider } from './reflector-provider';

export async function getServerHash(
	config: Pick<BaseClientConfig, 'grpcOptions' | 'secure' | 'url'>,
) {
	const { hash } = await ReflectorProvider.getReflector(config);

	return hash;
}
