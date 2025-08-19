# @lexicographic/index-builder

[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE) [![npm version](https://img.shields.io/npm/v/@lexicographic/index-builder.svg?style=flat-square)](https://www.npmjs.com/package/@lexicographic/index-builder) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

A TypeScript library for building composite database indexes with lexicographic ordering. This library provides a type-safe builder pattern for creating partition keys and sort keys that can be used with databases like DynamoDB GSIs, Cassandra composite keys, MongoDB compound indexes, and other systems that use lexicographically sorted keys.

**Key Features:**

- Type-safe composite key construction
- Support for partial sort keys with undefined field filtering
- Flexible value transformation capabilities
- Database-agnostic design
- Works with any lexicographic encoding method

## Usage

Define your entity type and create a composite index with partition and sort keys:

```typescript
import { CompositeIndexBuilder } from '@lexicographic/index-builder';

interface User {
  firstName: string;
  lastName: string;
  createdAt?: number;
}

// Define your encoding method (use @lexicographic/keys or your own)
const encode = (...segments: (string | number)[]) => segments.join('#');

// Build the composite index
const userIndex = CompositeIndexBuilder.forEntity<User>()
  .withName('users-by-name-and-date')
  .withPartitionKey({
    prefix: 'users-by-name',
    fields: ['firstName', 'lastName']
  })
  .withSortKey({
    prefix: 'created-at',
    fields: ['createdAt'],
    transformValues: (values) => ({
      ...values,
      createdAt: values.createdAt || Date.now()
    })
  })
  .withEncodingMethod(encode)
  .build();

// Generate keys
const partitionKey = userIndex.partitionKey({
  firstName: 'John',
  lastName: 'Smith'
});
// Result: "users-by-name#John#Smith"

const sortKey = userIndex.sortKey({ createdAt: 1640995200000 });
// Result: "created-at#1640995200000"

// Partial sort keys (undefined values are filtered out)
const partialSortKey = userIndex.sortKey({});
// Result: "created-at#[current_timestamp]" (due to transform)
```

## Installation

```bash
npm install @lexicographic/index-builder
```

For lexicographic encoding, you'll likely want to pair this with:

```bash
npm install @lexicographic/keys
```

## Documentation

### API Reference

#### `CompositeIndexBuilder<Entity>`

The main builder class for creating composite indexes.

**Methods:**

- `forEntity<Entity>()` - Static factory method to start building an index for a specific entity type
- `withName(name: string)` - Set the index name
- `withPartitionKey(options: PartitionKeyOptions)` - Define partition key configuration
- `withSortKey(options: SortKeyOptions)` - Define sort key configuration
- `withEncodingMethod(encoder: (...segments) => string)` - Set the encoding method
- `build()` - Create the final CompositeIndex instance

#### `CompositeIndex<Entity, PK, SK>`

The built index that generates keys.

**Methods:**

- `name()` - Returns the index name
- `partitionKey(fields)` - Generate partition key from entity fields
- `sortKey(fields?)` - Generate sort key from entity fields (partial fields supported)

#### Configuration Interfaces

```typescript
interface PartitionKeyOptions<Entity, PK extends (keyof Entity)[]> {
  prefix: string;
  fields: PK;
  transformValues?: (values: Pick<Entity, PK[number]>) => Pick<Entity, PK[number]>;
}

interface SortKeyOptions<Entity, SK extends (keyof Entity)[]> {
  prefix: string;
  fields: SK;
  transformValues?: (values: Partial<Pick<Entity, SK[number]>>) => Partial<Pick<Entity, SK[number]>>;
}
```

### Database Support

This library works with any database that uses lexicographically sorted composite keys:

- **DynamoDB** - Global Secondary Indexes (GSI) and Local Secondary Indexes (LSI)
- **Cassandra/ScyllaDB** - Clustering columns and composite partition keys
- **MongoDB** - Compound indexes
- **Azure Cosmos DB** - Composite indexes
- **Google Cloud Firestore** - Composite indexes
- **Redis** - Sorted sets with lexicographic ordering
- **RocksDB/LevelDB** - Composite key patterns

## Tests

Run the test suite:

```bash
yarn test
```

The tests cover:

- CompositeIndex builder pattern validation
- Partition key generation with transformations
- Sort key generation with partial field support
- Error handling for missing configuration

## Contributions

Contributions to @lexicographic/index-builder are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Copyright (c) 2025 Atlassian US., Inc.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers.png)](https://www.atlassian.com)
