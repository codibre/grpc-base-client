[fluent-iterable - v0.0.0](../README.md) / Client

# Class: Client<T\>

## Type parameters

| Name |
| :------ |
| `T` |

## Table of contents

### Constructors

- [constructor](Client.md#constructor)

### Properties

- [grpcInstance](Client.md#grpcinstance)
- [packageDefinition](Client.md#packagedefinition)

### Methods

- [createClient](Client.md#createclient)
- [getInstance](Client.md#getinstance)
- [loadPackage](Client.md#loadpackage)

## Constructors

### constructor

• **new Client**<`T`\>(`config`)

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`ClientConfig`](../interfaces/ClientConfig.md) |

## Properties

### grpcInstance

• `Private` **grpcInstance**: `T`

___

### packageDefinition

• `Private` **packageDefinition**: [`GrpcObject`](../README.md#grpcobject)

## Methods

### createClient

▸ `Private` **createClient**(`config`): `T`

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`ClientConfig`](../interfaces/ClientConfig.md) |

#### Returns

`T`

___

### getInstance

▸ **getInstance**(): `T`

#### Returns

`T`

___

### loadPackage

▸ `Private` **loadPackage**(`address`, `config?`): [`GrpcObject`](../README.md#grpcobject)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `config?` | `Options` |

#### Returns

[`GrpcObject`](../README.md#grpcobject)
