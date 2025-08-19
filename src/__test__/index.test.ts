import type { PartitionKeyOptions, SortKeyOptions } from '../index';
import { CompositeIndexBuilder } from '../index';

interface Entity {
  firstName: string;
  lastName: string;
  createdAt?: number;
}

const encode = (...v: any[]) => v as any;

describe('CompositeIndex Builder', () => {
  const pk: PartitionKeyOptions<Entity, ['firstName', 'lastName']> = {
    prefix: 'users-by-name',
    fields: ['firstName', 'lastName'],
  };

  const sk: SortKeyOptions<Entity, ['createdAt']> = {
    prefix: 'created-at',
    fields: ['createdAt'],
    transformValues<V extends { createdAt?: number }>(values: V) {
      return {
        ...values,
        createdAt: values.createdAt ?? new Date('2020-12-01').valueOf(),
      };
    },
  };

  test('Can build CompositeIndex', () => {
    const index = CompositeIndexBuilder.forEntity<Entity>()
      .withName('test1')
      .withPartitionKey(pk)
      .withSortKey(sk)
      .withEncodingMethod(encode)
      .build();

    expect(index.name()).toBe('test1');
    expect(
      index.partitionKey({ firstName: 'Josh', lastName: 'Smith' }),
    ).toEqual(['users-by-name', 'Josh', 'Smith']);
    expect(index.sortKey()).toEqual([
      'created-at',
      new Date('2020-12-01').valueOf(),
    ]);
  });

  test('Fail to build if missing args', () => {
    expect(() => CompositeIndexBuilder.forEntity().build()).toThrow(
      new Error('Missing CompositeIndex index name'),
    );

    expect(() =>
      CompositeIndexBuilder.forEntity().withName('test2').build(),
    ).toThrow(new Error('Missing CompositeIndex index PK options'));

    expect(() =>
      CompositeIndexBuilder.forEntity<Entity>()
        .withName('test3')
        .withPartitionKey(pk)
        .build(),
    ).toThrow(new Error('Missing CompositeIndex index SK options'));

    expect(() =>
      CompositeIndexBuilder.forEntity<Entity>()
        .withName('test4')
        .withPartitionKey(pk)
        .withSortKey(sk)
        .build(),
    ).toThrow(new Error('Missing CompositeIndex index encoding method'));
  });
});

describe('CompositeIndex', () => {
  const pk: PartitionKeyOptions<Entity, ['firstName', 'lastName']> = {
    prefix: 'users-by-name',
    fields: ['firstName', 'lastName'],
  };

  const sk: SortKeyOptions<Entity, ['firstName', 'lastName', 'createdAt']> = {
    prefix: 'created-at',
    fields: ['firstName', 'lastName', 'createdAt'],
  };

  test('sortKey', () => {
    const index = CompositeIndexBuilder.forEntity<Entity>()
      .withName('test1')
      .withPartitionKey(pk)
      .withSortKey({ prefix: sk.prefix, fields: sk.fields })
      .withEncodingMethod(encode)
      .build();

    expect(index.sortKey()).toEqual(['created-at']);
    expect(index.sortKey({ firstName: 'John' })).toEqual([
      'created-at',
      'John',
    ]);
    expect(index.sortKey({ firstName: 'John', lastName: 'Smith' })).toEqual([
      'created-at',
      'John',
      'Smith',
    ]);
    expect(
      index.sortKey({ firstName: 'John', lastName: 'Smith', createdAt: 10 }),
    ).toEqual(['created-at', 'John', 'Smith', 10]);

    // undefined fields are ignored, it is the callers responsibility to ensure this still creates a valid sort key in context of the DB records
    expect(index.sortKey({ firstName: 'Cher', createdAt: 10 })).toEqual([
      'created-at',
      'Cher',
      10,
    ]);
    expect(
      index.sortKey({
        firstName: 'Cher',
        lastName: undefined as any,
        createdAt: 10,
      }),
    ).toEqual(['created-at', 'Cher', 10]);
  });
});
