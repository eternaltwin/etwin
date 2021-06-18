# Archive

This document describes the technical aspects of the Eternaltwin archive. The
archive is the component storing data from the official Motion Twin websites.
It's purpose is similar to the [archive.org WaybackMachine][wayback_machine] but
tailored for Motion Twin.

## Overview

The archive is organized as a sequence of snapshots, updated when we get
responses from a Motion Twin server.

A snapshot is a group of data that remained the same over a consecutive period
of time. In addition to data itself, we add two extra fields: a time period
for our best guess when the data was valid and the set of timestamps when the
data was retrieved.

**Example**: Every 5 minutes, we check the rank in the leaderboard for a given
Hammerfest player.

Here is a possible archive:

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, inf[ | {35}             | 1         | 1    | 3000
```

The player was the best with a score of 1000, then someone else beat him, and
he fell to the second place. He then improved his score to 2000 (reclaiming the
first place), and after a while could improve it further to 3000.

## Uniqueness

When presented with a new server response, there are two cases:
- The data is the same as the latest known state
- The data is fresh (new or different)

When we already had the data, there is nothing much to do apart from adding the
retrieval time to the `retrieved_at` set for the corresponding row.

When the data is fresh, the first step is to insert it as a new row. But we
also need to invalidate some other rows. The goal is to maintain
"point in time" uniqueness constraints.

If we continue from the example in the _Overview_ section, the first
"point in time" constraint is "at any point in time, there is only one best
score per player". This is derived from the fact that if we only stored the
current state then `player_id` would be a primary key.
At the SQL level, this constraint can be directly enforced by the database
with a statement like "there are no two rows with the same `player_id` and
overlapping `period`".

After inserting a 5th fresh row, we could get:

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, inf[ | {35}             | 1         | 1    | 3000
[40, inf[ | {40}             | 1         | 1    | 4000
```

The row 4 and 5 are now in conflict: we must invalidate the 4th row.

Invalidating a row means setting the upper bound of its time period to a finite
value. In our case it produces:

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, 40[  | {35}             | 1         | 1    | 3000
[40, inf[ | {40}             | 1         | 1    | 4000
```

Invalidation occurs with any uniqueness constraint, not only with primary keys.
In our scenario, we should also enforce a "Point in Time" uniqueness on the
rank: no two players can be at the same rank at the same time.

To see the effect of multiple invalidations, lets start tracking the
player with id `2` now.

At time 45, we retrieve that he is in the second place with a score of 1500.
There is no conflict so far. We have multiple currently valid rows but they
refer to non-conflicting data so it's OK.

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, 40[  | {35}             | 1         | 1    | 3000
[40, inf[ | {40}             | 1         | 1    | 4000
[45, inf[ | {45}             | 2         | 2    | 1500
```

At timee 50, we find out had he had very good run with a score 5000 and is now
at the top of the leaderboard. After adding the row we get:

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, 40[  | {35}             | 1         | 1    | 3000
[40, inf[ | {40}             | 1         | 1    | 4000
[45, inf[ | {45}             | 2         | 2    | 1500
[50, inf[ | {50}             | 2         | 1    | 5000
```

We have two conflicts now: we know that the score of the player 2 is no longer
1500 (primary key) but we also know that the player 1 can no longer be ranked
first. **Inserting a single row may invalidate multiple rows.**

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, 40[  | {35}             | 1         | 1    | 3000
[40, 50[  | {40}             | 1         | 1    | 4000
[45, 50[  | {45}             | 2         | 2    | 1500
[50, inf[ | {50}             | 2         | 1    | 5000
```

At minute 55, we may wish to query the state of the player 1 again :

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
...
[40, 50[  | {40}             | 1         | 1    | 4000
[45, 50[  | {45}             | 2         | 2    | 1500
[50, inf[ | {50}             | 2         | 1    | 5000
[55, inf[ | {50}             | 1         | 3    | 4500
```

He improved its score to 4500, but due to the competition he is now at rank 3!.

## Periods as an optimization

Let's focus on player 1 and ignore the rows from player 2:

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, 40[  | {35}             | 1         | 1    | 3000
[40, 50[  | {40}             | 1         | 1    | 4000
[40, 50[  | {40}             | 1         | 1    | 4000
[55, inf[ | {50}             | 1         | 3    | 4500
```

Notice that all the period are consecutive... except for a gap between minute
50 and 55! What was the state of the player at this point? We have no idea.

Actually it's worse than that. We have no idea about the state at minute 12.
The best score could still be 1000, or already be 2000, or be 1500 (and we
missed it by not querying the server at the right time).

Even in a single row we have this problem. Every week, Hammerfest scores are
reset. It's possible that this reset occured on minute 21 and the player
immediately played a run where he got a score of 2000. There was a reset, the
score changed to zero, but the archive missed it and did not even notice any
change!

The only instant when we actually know the state of player is the instant when
we retrieve it. Any state between two retrievals is only a guess.

This means that this whole representation with time periods is only an
optimization to avoid adding rows when the data does not change: the most
common case is for data to stay the same between two retrievals.

If we accept data duplication, we could use the following (strictly equivalent)
representation:

```
retrieved_at | player_id | rank | score
-------------|-----------|------|------
0            | 1         | 1    | 1000
5            | 1         | 1    | 1000
10           | 1         | 2    | 1000
15           | 1         | 1    | 2000
20           | 1         | 1    | 2000
25           | 1         | 1    | 2000
30           | 1         | 1    | 2000
35           | 1         | 1    | 3000
40           | 1         | 1    | 4000
50           | 1         | 3    | 4500
```

## Partial views and shards

Until now, we considered how to archive data from a single source: the highscore
page. When extracting data from the high-score page, we get
`(player_id, rank, score)` tuples as our input data.

We can also retrieve forum pages. On Hammerfest, each message has some
information about the author, in particular its rank and whether he retrieved
its carrot (has beaten the game). We can extract `(player_id, rank, has_carrot)`
tuples from forum pages.

This is a common situation: we want to get all the data about a player
`(player_id, rank, score, has_carrot)` but can only perform queries returning
partial results: either `(player_id, rank, score)` or
`(player_id, rank, has_carrot)`.

How should we archive such data where we only have access to partial views?

The solution is to list all the responses supported by the server:
- `(player_id, rank, score)` (from the highscore page response)
- `(player_id, rank, has_carrot)` (from the forum page response)

We then group the fields according to a Venn diagram of the sources. Each field
in the same region is grouped together:

```
        +--------------------+
        |       score        |
  +-----+------------+       |
  |     | player_id  |       |
  |     | rank       |       |
  |     +------------+-------+
  |   has_carrot     |
  +------------------+
```

We augment each group with a primary key if needed. The result we get is what
we call shards:
- `(player_id, rank)`
- `(player_id, has_carrot)`
- `(player_id, score)`

A **shard** is a group of data that can only change together. Data in a shard
is tracked together in the same table. Data in different shards
can be retrieved (and archived) at different independent moments.

In this case it means that we would have 3 tables in the database to archive
the response of these two kinds of pages.

Archiving a "highscore page response" now requires us to update the 2 shards
`(player_id, rank)` and `(player_id, score)`.

Archiving a "forum page response" now requires to update the 2 shards
`(player_id, rank)` and `(player_id, has_carrot)`.

Shards for the same response are updated in the same transaction.

## Pagination

Another important source of partial knowledge is pagination. When viewing
paginated content such as a forum thread, we only get to see a small part of
it.

When later asked to return the state of a page at a given point in time, it is
important to be careful about how we model paginated content to avoid
returning a virtual page that could not have existed at the time. This is
especially important when elements can move or be deleted (e.g. the main
page of a forum section has a list of threads, this is a highly dynamic
paginated list).

The main issue is to represent empty list and detect item removals.
This is achieved by explicitly storing the list size along the items.

TODO: Expand on this section (example of the Twinoid comments).

### List

The solution is to instead represent the highscore list directly even if it
involves creating more tables to support referential integrity.

We split it into shards as `(player, ladder_rank, score)` and
`(ladder_rank, highscore_list)` and then represent the `thread_list` as an
immutable collection.

```
(player, ladder_rank, score)
period    | retrieved_at | player | ladder_rank | score
----------|--------------|--------|-------------|-------
[ 0, inf[ | {0,5}        | 1      | 1           | 5000
[ 0, inf[ | {0,5}        | 2      | 1           | 4500
[ 0, inf[ | {0}          | 3      | 1           | 1000


(ladder_rank, highscore_list)
period    | retrieved_at | ladder_rank  | highscore_list
----------|--------------|--------------|--------------------------------------
[ 0, 5  [ | {0}          | 1            | aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
[ 5, inf[ | {5}          | 1            | bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

highscore_lists:
highscore_list
-------------------------------------
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

highscore_list_items:
highscore_list                       | player | offset
-------------------------------------|--------|--------
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | 1      | 0
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | 2      | 1
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa | 3      | 2
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb | 1      | 0
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb | 2      | 1
```

## Upsertion query

**⚠ This section is highly technical and describes how snapshot upsertion is
actually implemented. Feel free to skip it.**

Snapshots are inserted into shard within a single (but complex) query. It
ensures that each shard is updated atomically (even without transactions).

This sections describes this query. At the moment this article is written, the
upsertion query is defined through a Rust macro in [`crates/postgres_tools/src/lib.rs`](https://gitlab.com/eternal-twin/etwin/-/blob/master/crates/postgres_tools/src/lib.rs).

The query uses a syntax called [Common Table Expression (CTE)](https://www.postgresql.org/docs/current/queries-with.html)
to build the query from smaller parts.

1. `input_row`: The new snapshot we wish to insert, written as if the data is
   fresh (new or different).

    ```
    input_row:

    period    | retrieved_at     | player_id | x | y
    ----------|------------------|-----------|---|---
    [40, inf[ | {40}             | 1         | 3 | 7
    ```

2. `current_row_primary` and `current_row_<ukey>`: For each "point in time"
    uniqueness constraint (primary key and extra unique keys), check if we have
    an already valid snaphot (with an infinite upper bound on the time period)
    matching the key in `input_row`.
    We only need to track the identity of such rows, hence why we only keep
    the primary key and period.

3. `matching_current_row`: At this step we take the intersection of all the rows
   from step 2. If they are all the same row we also check if its data fields
   are the same as the one from `input_row`.

   `matching_current_row` can contain only 0 or 1 row. If it has a row, this is
   a pre-existing snapshot where the data fields are exactly the same as the
   ones in `input_row`: the retrieved value is the same as the one we had.
   If there is no row in `matching_current_row`, the `input_row` is new or
   different (and may also invalidate some snapshots due to unique constraints).

4. `missing_input_row`: Following the logic from the previous point we either:
   - accept `input_row` as is and put in `missing_input_row` (if the data is
     fresh / `matching_current_row` is empty)
   - reject `input_row` (by not putting it in `missing_input_row`) and will
     update `matching_current` (it is non-empty).

5. `current_rows` and `rows_to_invalidate`: `current_rows` the union of the rows
   from step 2, we then remove `matching_current_row` from them to get
   `rows_to_invalidate`. `rows_to_invalidate` will either be empty or it will
   be all the rows from `current_rows`. We either update `matching_current_row`
   and there is no invalidation at all (because `matching_current_row` was
   already present) or we invalidate all these rows because they had a common
   unique key with `input_row` but differed in some other fields.

At this point we have 3 categories of rows:
- Rows to **update**: if `matching_current_row` exists, only update its
  `retrieved_at` field.
- Rows to **insert** and **invalidate**: if `matching_current_row` does not
  exist then insert `input_row` (through `maybe_input_row`) and invalidate the
  rows from `rows_to_invalidate` by setting the upper bound of their time period
  to the current time (so it is no longer infinite).

These 3 categories are distinct and can be applied simultaneously. This is the
last step of the query. The top-level query aggregets the 3 mutating queries.

## Sampling window

As we saw in the section "periods as an optimization", the representation we use
already tries to optimize space by reducing data duplication.

This representation is probably one of the most efficient to keep track of all
the data without any ambiguity.

What if we allowed to lose some of the data?

When retrieving archived data, we are mostly interested in the most recent
data. We may also be interested in historic data (after all it's the reason
why we keep a history). But we can probably get away with a less strict
tracking of our retrieval timestamps.

Here is our example from the start:

```
period    | retrieved_at     | player_id | rank | score
----------|------------------|-----------|------|------
[ 0, 10[  | {0, 5}           | 1         | 1    | 1000
[10, 15[  | {10}             | 1         | 2    | 1000
[15, 35[  | {15, 20, 25, 30} | 1         | 1    | 2000
[35, 40[  | {35}             | 1         | 1    | 3000
[40, inf[ | {40}             | 1         | 1    | 4000
```

The third row stores its timestamps: `{15, 20, 25, 30}`. We can imagine a
data that changes fairly rarely but is found on many pages. In such a
scenario the set of timestamps can grow fairly large.

A solution to this is to apply a "sampling window". This operation ensures
that we only keep at most 2 timestamps per window of X units of time.

This allows to optimize retrieval sets when there is a quick burst of closely
related requests that leads to getting the same reply quite often.

For example if we take a window of `12 minutes` and apply it to the timestamps
from our third row, we see that when the window is between `14` and `26` minutes,
we have 3 points: `15`, `20` and `25`.

When there is an excess of values, the sampling window drops the ones in the
middle. The sampling window is applied from the smallest (oldest) to the
largest (most recent) values.

Applying a sampling window of 12 minutes to `{15, 20, 25, 30}` reduces it
to `{15, 25, 30}`.

It is shorter, but we lose the information that we queried the server at
minute 20.

It is currently still debated if a sampling window should be applied and how to
determine its size.

[wayback_machine]: https://archive.org/web/
