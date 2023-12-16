
[![Actions Status](https://github.com/Codibre/grpc-base-client/workflows/build/badge.svg)](https://github.com/Codibre/boilerplate-base/actions)
[![Actions Status](https://github.com/Codibre/grpc-base-client/workflows/test/badge.svg)](https://github.com/Codibre/boilerplate-base/actions)
[![Actions Status](https://github.com/Codibre/grpc-base-client/workflows/lint/badge.svg)](https://github.com/Codibre/boilerplate-base/actions)
[![Test Coverage](https://api.codeclimate.com/v1/badges/40fe7b4d1db04175f87d/test_coverage)](https://codeclimate.com/github/Codibre/grpc-base-client/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/40fe7b4d1db04175f87d/maintainability)](https://codeclimate.com/github/Codibre/grpc-base-client/maintainability)
[![npm version](https://badge.fury.io/js/grpc-base-client.svg)](https://badge.fury.io/js/grpc-base-client)

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

## How to retrieve client through reflection

Is your GRPC servers implements [GRPC Reflection Protobol](https://github.com/grpc/grpc/blob/master/doc/server-reflection.md), then you don't need to have a copy of the proto client side and can just get it using it! This package implements a method to create the client using this feature that can be easily used like this:

```ts
import { Client as gRPCCLient } from '@codibre/grpc-base-client';

interface Health {
	Check(props: { service: string }): Promise<any>;
}

const grpcCLient = gRPCCLient.getByReflection<Health>({
	namespace: 'abc.def',
	url: 'test.service',
	maxConnections: 2,
	service: 'Health',
	secure: true,
});

await grpcCLient.getInstance().Check({service: 'foo'}); // { status: 'SERVING' }
```

Notice that you don't inform the protoFile in this call, as it is not needed. Also, this method don't offers a legacy library switch, as it'll only work with the new @grpc/grpc-js library.

If you want to find out how to implement it on your server, it really pretty easy! Just take a look at the official implementation for NodeJs: [@grpc/reflection](https://www.npmjs.com/package/@grpc/reflection). If you're using **NestJs**, another option is [nestjs-grpc-reflection](https://www.npmjs.com/package/nestjs-grpc-reflection), although the official one is preatty straight forward to use alongside with nestjs too.

To use **getByReflection**, you need to install two optional libraries:

* [grpc-js-reflection-client](https://www.npmjs.com/package/grpc-js-reflection-client)
* [google-protobuf](https://www.npmjs.com/package/google-protobuf)

## License



Licensed under [MIT](https://en.wikipedia.org/wiki/MIT_License).
