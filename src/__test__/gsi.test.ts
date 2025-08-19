import { GSIBuilder, PartitionKeyOptions, SortKeyOptions } from '../index';

interface Entity {
  firstName: string;
  lastName: string;
  createdAt?: number;
}

const encode = (...v: any[]) => v as any;

describe('GSI Builder', () => {
  const pk: PartitionKeyOptions<Entity, ['firstName', 'lastName']> = {
    prefix: 'users-by-name',
    fields: ['firstName', 'lastName'],
  };

  const sk: SortKeyOptions<Entity, ['createdAt']> = {
    prefix: 'created-at',
    fields: ['createdAt'],
    transformValues<V extends { createdAt?: number }>(values: V) {
      return { ...values, createdAt: values.createdAt || new Date('2020-12-01').valueOf() };
    },
  };

  test('Can build GSI', () => {
    const gsi = GSIBuilder.forEntity<Entity>()
      .withName('test1')
      .withPartitionKey(pk)
      .withSortKey(sk)
      .withEncodingMethod(encode)
      .build();

    expect(gsi.name()).toBe('test1');
    expect(gsi.partitionKey({ firstName: 'Josh', lastName: 'Smith' })).toEqual(['users-by-name', 'Josh', 'Smith']);
    expect(gsi.sortKey()).toEqual(['created-at', new Date('2020-12-01').valueOf()]);
  });

  test('Fail to build if missing args', () => {
    expect(() => GSIBuilder.forEntity().build()).toThrow(new Error('Missing GSI index name'));

    expect(() => GSIBuilder.forEntity().withName('test2').build()).toThrow(new Error('Missing GSI index PK options'));

    expect(() => GSIBuilder.forEntity<Entity>().withName('test3').withPartitionKey(pk).build()).toThrow(
      new Error('Missing GSI index SK options'),
    );

    expect(() => GSIBuilder.forEntity<Entity>().withName('test4').withPartitionKey(pk).withSortKey(sk).build()).toThrow(
      new Error('Missing GSI index encoding method'),
    );
  });
});

describe('GSI', () => {
  const pk: PartitionKeyOptions<Entity, ['firstName', 'lastName']> = {
    prefix: 'users-by-name',
    fields: ['firstName', 'lastName'],
  };

  const sk: SortKeyOptions<Entity, ['firstName', 'lastName', 'createdAt']> = {
    prefix: 'created-at',
    fields: ['firstName', 'lastName', 'createdAt'],
  };

  test('sortKey', () => {
    const gsi = GSIBuilder.forEntity<Entity>()
      .withName('test1')
      .withPartitionKey(pk)
      .withSortKey({ prefix: sk.prefix, fields: sk.fields })
      .withEncodingMethod(encode)
      .build();

    expect(gsi.sortKey()).toEqual(['created-at']);
    expect(gsi.sortKey({ firstName: 'John' })).toEqual(['created-at', 'John']);
    expect(gsi.sortKey({ firstName: 'John', lastName: 'Smith' })).toEqual(['created-at', 'John', 'Smith']);
    expect(gsi.sortKey({ firstName: 'John', lastName: 'Smith', createdAt: 10 })).toEqual([
      'created-at',
      'John',
      'Smith',
      10,
    ]);

    // undefined fields are ignored, it is the callers responsibility to ensure this still creates a valid sort key in context of the DB records
    expect(gsi.sortKey({ firstName: 'Cher', createdAt: 10 })).toEqual(['created-at', 'Cher', 10]);
    expect(gsi.sortKey({ firstName: 'Cher', lastName: undefined, createdAt: 10 })).toEqual(['created-at', 'Cher', 10]);
  });
});
