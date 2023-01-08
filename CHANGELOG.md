## [2.1.2](https://github.com/Codibre/grpc-base-client/compare/v2.1.1...v2.1.2) (2023-01-08)


### Bug Fixes

* adding method for metadata creation ([ca80841](https://github.com/Codibre/grpc-base-client/commit/ca808417994688553dab7cb7557acba18b5fada7))

## [2.1.1](https://github.com/Codibre/grpc-base-client/compare/v2.1.0...v2.1.1) (2023-01-08)


### Bug Fixes

* passing method name to default middleware ([e11d4be](https://github.com/Codibre/grpc-base-client/commit/e11d4beb0adf7c3842d433c64ed151010216dab2))

# [2.1.0](https://github.com/Codibre/grpc-base-client/compare/v2.0.0...v2.1.0) (2023-01-08)


### Features

* adding support for middleware ending result ([ac9d9f0](https://github.com/Codibre/grpc-base-client/commit/ac9d9f04a8af272d7808b27881edff787b3eebeb))

# [2.0.0](https://github.com/Codibre/grpc-base-client/compare/v1.4.0...v2.0.0) (2023-01-07)


### Features

* adding legacy grpc lib support ([#9](https://github.com/Codibre/grpc-base-client/issues/9)) ([45a7f3d](https://github.com/Codibre/grpc-base-client/commit/45a7f3d89c81a00afc63cf71061aa94aa4b78b1a))


### BREAKING CHANGES

* The library contract needed to be changed in order to keep functionalities compatible between both versions.
Although the contract must be almost equal some things like error catching have behaved differently between them. Due to that,
we chose an approach that works for both packages, but we need to break the contract.

# [1.4.0](https://github.com/Codibre/grpc-base-client/compare/v1.3.0...v1.4.0) (2023-01-07)


### Features

* adding noPanicControl option ([#10](https://github.com/Codibre/grpc-base-client/issues/10)) ([1e16f18](https://github.com/Codibre/grpc-base-client/commit/1e16f188a615495df44d5f436cd2b213d9dae3f4))

# [1.3.0](https://github.com/Codibre/grpc-base-client/compare/v1.2.0...v1.3.0) (2023-01-07)


### Features

* adding gRPC middleware support ([#8](https://github.com/Codibre/grpc-base-client/issues/8)) ([a36a92d](https://github.com/Codibre/grpc-base-client/commit/a36a92d5829986949082208891ced81ecbc6ffc3))

# [1.2.0](https://github.com/Codibre/grpc-base-client/compare/v1.1.0...v1.2.0) (2022-06-03)


### Features

* supports renewing connect on error ([#6](https://github.com/Codibre/grpc-base-client/issues/6)) ([fcbd362](https://github.com/Codibre/grpc-base-client/commit/fcbd3624a64156a3907423ef1596bab1653b7683))

# [1.1.0](https://github.com/Codibre/grpc-base-client/compare/v1.0.2...v1.1.0) (2022-04-28)


### Features

* Supports non Pool connection ([#4](https://github.com/Codibre/grpc-base-client/issues/4)) ([ea35a4d](https://github.com/Codibre/grpc-base-client/commit/ea35a4dc5120a625e0b1036e0cc688bbadd99e76))

## [1.0.2](https://github.com/Codibre/grpc-base-client/compare/v1.0.1...v1.0.2) (2022-04-26)


### Bug Fixes

* Overload Unary call ([#3](https://github.com/Codibre/grpc-base-client/issues/3)) ([e5f2790](https://github.com/Codibre/grpc-base-client/commit/e5f2790c30dbf85119ad1544ee6de2f103c01661))

## [1.0.1](https://github.com/Codibre/grpc-base-client/compare/v1.0.0...v1.0.1) (2022-04-22)


### Bug Fixes

* Overload gRPC unary functions ([#2](https://github.com/Codibre/grpc-base-client/issues/2)) ([071cff2](https://github.com/Codibre/grpc-base-client/commit/071cff28168d3bc03085b2be5a27a238b64b55bc))

# 1.0.0 (2022-04-20)


### Features

* first gRPC client ([#1](https://github.com/Codibre/grpc-base-client/issues/1)) ([18a4e97](https://github.com/Codibre/grpc-base-client/commit/18a4e97c4845b40863314ec914f04859c0924567))

# Changelog
  All notable changes to this project will be documented in this file.

  The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
  and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

  ## Next Release



-v2.0.0

- Updating empty project for new standards

-v1.0.3

- Adequation of configurations and project for a lib example

-v1.0.2

- Updating libraries


-v1.0.1
  Removing unneeded dependencies

-v1.0.0
  First release
