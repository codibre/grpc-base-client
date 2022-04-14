/* eslint-disable unused-imports/no-unused-vars-ts */
/* eslint-disable no-empty */
let grpcLib: any;

export function getGrpcLib() {
	try {
		return (grpcLib = require('@grpc/grpc-js'));
	} catch (err) {}

	try {
		return (grpcLib = require('grpc'));
	} catch (err) {}

	throw new Error('Can not find any grpc or @grpc/grpc-js module');
}
