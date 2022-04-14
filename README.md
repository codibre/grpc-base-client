
[![Actions Status](https://github.com/Codibre/grpc-base-client/workflows/build/badge.svg)](https://github.com/Codibre/boilerplate-base/actions)

[![Actions Status](https://github.com/Codibre/grpc-base-client/workflows/test/badge.svg)](https://github.com/Codibre/boilerplate-base/actions)

[![Actions Status](https://github.com/Codibre/grpc-base-client/workflows/lint/badge.svg)](https://github.com/Codibre/boilerplate-base/actions)

[![Test Coverage](https://api.codeclimate.com/v1/badges/40fe7b4d1db04175f87d/test_coverage)](https://codeclimate.com/github/Codibre/grpc-base-client/test_coverage)

[![Maintainability](https://api.codeclimate.com/v1/badges/40fe7b4d1db04175f87d/maintainability)](https://codeclimate.com/github/Codibre/grpc-base-client/maintainability)

[![Packages](https://david-dm.org/Codibre/grpc-base-client.svg)](https://david-dm.org/Codibre/grpc-base-client)

[![npm version](https://badge.fury.io/js/%40codibre%2Fgrpc-base-client.svg)](https://badge.fury.io/js/%40codibre%2Fgrpc-base-client)

- This library auto-apply promise into Unary calls
- This library implements a consistent Connection Pool with a Round-Robin strategy auto manageable for its instance or new instances;
- It's supports gRPC and gRPC-js implementations;

## How to Install


```
npm i @codibre/grpc-base-client
```

  
## How to Use
  

```typescript

import { Client as gRPCCLient } from '@codibre/grpc-base-client';

interface Health {
	Check(props: { service: string }): Promise<any>;
}

const grpcCLient = new gRPCCLient<Health>({
	namespace: 'abc.def',
	protoFile: 'health-check.proto',
	url: 'test.service',
	maxConnections: 2,
	service: 'Health',
	secure: true,
});

  

await grpcCLient.getInstance().Check({service: 'foo'}); // { status: 'SERVING' }

```

  

## License

  

Licensed under [MIT](https://en.wikipedia.org/wiki/MIT_License).