[fluent-iterable - v0.0.0](../README.md) / ClientPool

# Class: ClientPool

## Table of contents

### Constructors

- [constructor](ClientPool.md#constructor)

### Properties

- [clientsPools](ClientPool.md#clientspools)

### Methods

- [create](ClientPool.md#create)

## Constructors

### constructor

• **new ClientPool**()

## Properties

### clientsPools

▪ `Static` `Private` **clientsPools**: `Map`<`string`, `ConnectionPool`\>

## Methods

### create

▸ `Static` **create**<`T`\>(`alias`, `size`, `createClient`): `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `alias` | `string` |
| `size` | `number` |
| `createClient` | () => `T` |

#### Returns

`T`
