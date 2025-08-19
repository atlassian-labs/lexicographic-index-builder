type AnyElementOf<T extends any[]> = T[number];
type TransformValues<V> = (values: V) => V;
type Segment = string | number;
export interface PartitionKeyOptions<Entity, PK extends (keyof Entity)[]> {
  prefix: string;
  fields: PK;
  transformValues?: TransformValues<Pick<Entity, AnyElementOf<PK>>>;
}
export interface SortKeyOptions<Entity, SK extends (keyof Entity)[]> {
  prefix: string;
  fields: SK;
  transformValues?: TransformValues<Partial<Pick<Entity, AnyElementOf<SK>>>>;
}
type EncodingMethod = (...segments: Segment[]) => string;

const isEmptySegment = (segment: Segment | undefined | null) =>
  segment === null || segment === undefined;

export class CompositeIndex<
  Entity,
  PK extends (keyof Entity)[],
  SK extends (keyof Entity)[],
> {
  public constructor(
    private indexName: string,
    private partitionKeyOptions: PartitionKeyOptions<Entity, PK>,
    private sortKeyOptions: SortKeyOptions<Entity, SK>,
    private encodingMethod: EncodingMethod,
  ) {}

  public name() {
    return this.indexName;
  }

  public partitionKey(partitionKeyFields: Pick<Entity, AnyElementOf<PK>>) {
    const transformedPk =
      this.partitionKeyOptions.transformValues?.(partitionKeyFields) ||
      partitionKeyFields;
    const segments = this.partitionKeyOptions.fields.map(
      (field) => transformedPk[field] as unknown as Segment,
    );

    return this.encodingMethod(this.partitionKeyOptions.prefix, ...segments);
  }

  /**
   * Allows you to specify a partial sort key. Any field can be undefined and will be filtered out of the encoded sort key.
   * It is the callers responsibility to ensure that the sort key is valid in context of the DB records.
   *
   * e.g. index.sortKey({ firstName: 'Cher', lastName: undefined, createdAt: 10 }) will encode ['created-at', 'Cher', 10]
   * This is useful if your DB supports records like created-at#firstName#createdAt (lastName is optional) AND created-at#firstName#lastName#createdAt in the same SK.
   */
  public sortKey(sortKeyFields: Partial<Pick<Entity, AnyElementOf<SK>>> = {}) {
    const transformedSk =
      this.sortKeyOptions.transformValues?.(sortKeyFields) || sortKeyFields;
    const segments = this.sortKeyOptions.fields
      .map((field) => transformedSk[field] as unknown as Segment)
      .filter((segment) => !isEmptySegment(segment));

    return this.encodingMethod(this.sortKeyOptions.prefix, ...segments);
  }
}

/**
 * Used to construct CompositeIndex.
 * Define properties used in the partition key and sort key.
 * The encoding method for the properties and name of the index must also be specified.
 */
export class CompositeIndexBuilder<
  Entity,
  PK extends (keyof Entity)[] = [],
  SK extends (keyof Entity)[] = [],
> {
  public constructor(
    private state: Partial<{
      name: string;
      partitionKeyOptions: PartitionKeyOptions<Entity, PK>;
      sortKeyOptions: SortKeyOptions<Entity, SK>;
      encodingMethod: EncodingMethod;
    }> = {},
  ) {}

  public static forEntity<Entity>(): CompositeIndexBuilder<Entity> {
    return new CompositeIndexBuilder<Entity>();
  }

  public withName(name: string): CompositeIndexBuilder<Entity, PK, SK> {
    return new CompositeIndexBuilder<Entity, PK, SK>({ ...this.state, name });
  }

  public withEncodingMethod(
    encodingMethod: EncodingMethod,
  ): CompositeIndexBuilder<Entity, PK, SK> {
    return new CompositeIndexBuilder<Entity, PK, SK>({
      ...this.state,
      encodingMethod,
    });
  }

  public withPartitionKey<PK extends (keyof Entity)[]>(
    partitionKeyOptions: PartitionKeyOptions<Entity, PK>,
  ): CompositeIndexBuilder<Entity, PK, SK> {
    return new CompositeIndexBuilder<Entity, PK, SK>({
      ...this.state,
      partitionKeyOptions,
    });
  }

  public withSortKey<SK extends (keyof Entity)[]>(
    sortKeyOptions: SortKeyOptions<Entity, SK>,
  ): CompositeIndexBuilder<Entity, PK, SK> {
    return new CompositeIndexBuilder<Entity, PK, SK>({
      ...this.state,
      sortKeyOptions,
    });
  }

  public build(): CompositeIndex<Entity, PK, SK> {
    const state = this.state;
    if (!state.name) {
      throw new Error('Missing CompositeIndex index name');
    }

    if (!state.partitionKeyOptions) {
      throw new Error('Missing CompositeIndex index PK options');
    }

    if (!state.sortKeyOptions) {
      throw new Error('Missing CompositeIndex index SK options');
    }

    if (!state.encodingMethod) {
      throw new Error('Missing CompositeIndex index encoding method');
    }

    return new CompositeIndex<Entity, PK, SK>(
      state.name,
      state.partitionKeyOptions,
      state.sortKeyOptions,
      state.encodingMethod,
    );
  }
}
