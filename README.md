# lexicographic-keys-builder

Dynamodb provides Global Secondary Indices. GSIs have a Partition Key (PK) and Sort Key (SK).

This library aims to make the creation and usage of these indices easier. Both keys are constructed by appending
properties together as strings.

Use the `GSIBuilder.build()` to construct a `GSI` class that then constructs Partition and Sort keys by the properties
specified in `GSIBuilder.build()`.
