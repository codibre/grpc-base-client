import {
	loadPackageDefinition,
	sendUnaryData,
	Server,
	ServerCredentials,
	ServerDuplexStream,
	ServerReadableStream,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

interface TestRequest {
	foo: string;
}

interface TestResponse {
	bar: string;
}

function unary(
	call: ServerUnaryCall<TestRequest, TestResponse>,
	callback: sendUnaryData<TestResponse>,
) {
	const req = call.request.foo;
	if (req === 'error') {
		const error = new Error('error') as any;
		error.code = 14;
		return callback(error, null);
	}
	callback(null, { bar: req });
}

function requestStream(
	call: ServerReadableStream<TestRequest, TestResponse>,
	callback: sendUnaryData<TestResponse>,
) {
	const messages: string[] = [];
	call.on('data', (stream) => {
		if (stream.foo === 'error') {
			const error = new Error('error') as any;
			error.code = 14;
			return callback(error, null);
		}
	});
	call.on('end', () => {
		callback(null, { bar: messages.length ? messages.join(',') : '' });
	});
}

function responseStream(call: ServerWritableStream<TestRequest, TestResponse>) {
	const messages = call.request.foo;
	if (messages === 'error') {
		const error = new Error('error') as any;
		error.code = 14;
		return call.emit('error', error);
	}
	messages.split(',').forEach((message) => {
		call.write({ bar: message });
	});

	call.end();
}

function duplexStream(call: ServerDuplexStream<TestRequest, TestResponse>) {
	call.on('data', (stream) => {
		if (stream.foo === 'error') {
			const error = new Error('error') as any;
			error.code = 14;
			return call.emit('error', error);
		}
		call.write({ bar: stream.foo });
		if (stream.foo === 'end') {
			return call.end();
		}
	});
}

export async function createServer(
	route: string = '0.0.0.0:50051',
): Promise<Server> {
	const proto = loadSync('./test/test.proto', {
		keepCase: false,
		enums: String,
		defaults: true,
	});

	const packageDefinition = (await loadPackageDefinition(proto)) as any;

	const server = new Server();
	server.addService(packageDefinition.test.Test.service, {
		Unary: unary,
		RequestStream: requestStream,
		ResponseStream: responseStream,
		DuplexStream: duplexStream,
	});

	await server.bindAsync(
		route,
		ServerCredentials.createInsecure(),
		async (err) => {
			if (!err) {
				await server.start();
			}
		},
	);

	return server;
}
