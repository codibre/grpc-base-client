import { ServiceClient } from '@grpc/grpc-js/build/src/make-client';
import { promisify } from 'util';

export function overloadUnaryServices(client: ServiceClient): ServiceClient {
	const services = Object.keys(client.__proto__);
	services.forEach((serviceName) => {
		const action = client[serviceName] as any;
		if (!action) {
			return;
		}
		const isUnary = !action?.requestStream && !action?.responseStream;
		if (isUnary) {
			(client as any)[serviceName] = promisify(action);
		}
	});

	return client;
}
