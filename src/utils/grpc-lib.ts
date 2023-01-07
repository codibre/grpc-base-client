import type * as grpc from '@grpc/grpc-js';

export function getGrpc(
	legacy: boolean | undefined,
): Pick<typeof grpc, 'loadPackageDefinition' | 'credentials' | 'Metadata'> {
	return legacy ? require('grpc') : require('@grpc/grpc-js');
}
