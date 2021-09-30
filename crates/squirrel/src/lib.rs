use futures_util::stream::StreamExt;
use include_dir::Dir;
use once_cell::sync::Lazy;
use petgraph::algo::astar;
use petgraph::graphmap::DiGraphMap;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgDatabaseError;
use sqlx::{Connection, Executor};
use sqlx::{PgPool, Postgres, Transaction};
use std::cmp::{max, Ordering};
use std::collections::HashMap;
use std::convert::{TryFrom, TryInto};
use std::error::Error;
use std::fmt;
use std::fmt::Debug;
use std::num::NonZeroU32;
use std::str::FromStr;
use std::sync::atomic::AtomicU16;
use std::sync::RwLock;

static SQL_NODE_PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^([0-9]{1,4})\.sql$").unwrap());
static SQL_EDGE_PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^([0-9]{1,4})-([0-9]{1,4})\.sql$").unwrap());
const DEFAULT_SCHEMA_COMMENT: &str = "standard public schema";

/// Opaque handle representing a database state recognized by the issuing resolver.
#[derive(Clone, Copy)]
pub struct SchemaStateRef<'r> {
  resolver: &'r SchemaResolver,
  state: SchemaState,
}

impl<'r> PartialEq for SchemaStateRef<'r> {
  fn eq(&self, other: &Self) -> bool {
    std::ptr::eq(self.resolver, other.resolver) && self.state == other.state
  }
}

impl<'r> Eq for SchemaStateRef<'r> {}

impl<'r> Debug for SchemaStateRef<'r> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> std::fmt::Result {
    write!(
      f,
      "SchemaStateRef {{ resolver: {:?}, state: {:?} }}",
      self.resolver as *const _, self.state
    )
  }
}

/// Opaque handle representing a database version recognized by the issuing resolver.
#[derive(Clone, Copy)]
pub struct SchemaVersionRef<'r> {
  resolver: &'r SchemaResolver,
  version: SchemaVersion,
}

impl<'r> PartialEq for SchemaVersionRef<'r> {
  fn eq(&self, other: &Self) -> bool {
    std::ptr::eq(self.resolver, other.resolver) && self.version == other.version
  }
}

impl<'r> Eq for SchemaVersionRef<'r> {}

impl<'r> Debug for SchemaVersionRef<'r> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> std::fmt::Result {
    write!(
      f,
      "SchemaVersionRef {{ resolver: {:?}, version: {:?} }}",
      self.resolver as *const _, self.version
    )
  }
}

impl<'r> From<SchemaVersionRef<'r>> for SchemaStateRef<'r> {
  fn from(version: SchemaVersionRef<'r>) -> Self {
    Self {
      resolver: version.resolver,
      state: version.version.into(),
    }
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
enum SchemaState {
  Empty,
  Version(SchemaVersion),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct SchemaVersion(NonZeroU32);

impl FromStr for SchemaVersion {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let version = s.parse::<u32>().map_err(|_| ())?;
    let version = NonZeroU32::new(version).ok_or(())?;
    Ok(Self(version))
  }
}

impl From<SchemaVersion> for SchemaState {
  fn from(version: SchemaVersion) -> Self {
    Self::Version(version)
  }
}

pub struct SchemaMigration<'a> {
  resolver: &'a SchemaResolver,
  states: Vec<SchemaState>,
}

impl<'r> Debug for SchemaMigration<'r> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> std::fmt::Result {
    write!(
      f,
      "SchemaMigration {{ resolver: {:?}, states: [",
      self.resolver as *const _
    )?;
    for (i, s) in self.states.iter().enumerate() {
      write!(f, "{}{:?}", if i == 0 { "" } else { ", " }, s)?;
    }
    write!(f, "] }}")
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
struct SaturatingU32(u32);

impl SaturatingU32 {
  const MAX: Self = Self(u32::MAX);
}

impl core::ops::Add for SaturatingU32 {
  type Output = SaturatingU32;

  fn add(self, rhs: Self) -> Self::Output {
    SaturatingU32(u32::saturating_add(self.0, rhs.0))
  }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct SchemaMeta {
  version: NonZeroU32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum MigrationDirection {
  UpgradeOnly,
  DowngradeOnly,
}

#[derive(Debug)]
struct EdgeState {
  /// SQL script to transition the schema version
  schema: &'static str,
  /// SQL script to populate data
  data: Option<&'static str>,
}

#[derive(Debug)]
pub struct SchemaResolver {
  graph: DiGraphMap<SchemaState, EdgeState>,
  states: HashMap<SchemaState, ()>,
  latest: SchemaVersion,
  drop: Option<&'static str>,
  grant: Option<&'static str>,
  latest_force_created_state: RwLock<Option<SchemaState>>,
  cache_buster_len: AtomicU16,
}

impl SchemaResolver {
  pub fn new(d: &'static Dir) -> Self {
    let mut graph: DiGraphMap<SchemaState, EdgeState> = DiGraphMap::new();
    let mut states: HashMap<SchemaState, ()> = HashMap::new();
    graph.add_node(SchemaState::Empty);
    states.insert(SchemaState::Empty, ());
    let mut latest = SchemaState::Empty;
    if let Some(create_dir) = d.get_dir("create") {
      for f in create_dir.files() {
        let file_name: &str = f.path().file_name().unwrap().to_str().unwrap();
        let caps = if let Some(caps) = SQL_NODE_PATTERN.captures(file_name) {
          caps
        } else {
          eprintln!("Unexpected file name format: {:?}", f.path());
          continue;
        };
        let schema = f.contents_utf8().unwrap();
        let edge = EdgeState { schema, data: None };
        let state: SchemaState = caps[1].parse::<SchemaVersion>().unwrap().into();
        graph.add_node(state);
        assert!(states.insert(state, ()).is_none());
        graph.add_edge(SchemaState::Empty, state, edge);
        latest = max(latest, state);
      }
    }
    if let Some(upgrade_dir) = d.get_dir("upgrade") {
      for f in upgrade_dir.files() {
        let file_name: &str = f.path().file_name().unwrap().to_str().unwrap();
        let caps = if let Some(caps) = SQL_EDGE_PATTERN.captures(file_name) {
          caps
        } else {
          eprintln!("Unexpected file name format: {:?}", f.path());
          continue;
        };
        let schema = f.contents_utf8().unwrap();
        let edge = EdgeState { schema, data: None };
        let start: SchemaState = caps[1].parse::<SchemaVersion>().unwrap().into();
        let end: SchemaState = caps[2].parse::<SchemaVersion>().unwrap().into();
        assert!(start < end);
        graph.add_node(start);
        states.insert(start, ());
        graph.add_node(end);
        states.insert(end, ());
        graph.add_edge(start, end, edge);
        latest = max(latest, end);
      }
    }
    let drop = d
      .get_file("drop.sql")
      .map(|f| f.contents_utf8().expect("Invalid drop script encoding"));
    let grant = d
      .get_file("grant.sql")
      .map(|f| f.contents_utf8().expect("Invalid drop script encoding"));
    let latest = match latest {
      SchemaState::Empty => panic!("No schema version found"),
      SchemaState::Version(v) => v,
    };
    SchemaResolver {
      graph,
      states,
      latest,
      drop,
      grant,
      latest_force_created_state: RwLock::new(None),
      cache_buster_len: AtomicU16::new(0),
    }
  }

  pub fn get_version(&self, v: NonZeroU32) -> Option<SchemaVersionRef> {
    let version = SchemaVersion(v);
    if self.states.contains_key(&version.into()) {
      Some(self.issue_version(version))
    } else {
      None
    }
  }

  pub fn get_empty(&self) -> SchemaStateRef {
    self.issue_state(SchemaState::Empty)
  }

  pub fn get_latest(&self) -> SchemaVersionRef {
    self.issue_version(self.latest)
  }

  fn validate_state(&self, state: SchemaStateRef) -> SchemaState {
    assert!(std::ptr::eq(self, state.resolver));
    state.state
  }

  fn validate_version(&self, version: SchemaVersionRef) -> SchemaVersion {
    assert!(std::ptr::eq(self, version.resolver));
    version.version
  }

  fn issue_state(&self, state: SchemaState) -> SchemaStateRef {
    SchemaStateRef { resolver: self, state }
  }

  fn issue_version(&self, version: SchemaVersion) -> SchemaVersionRef {
    SchemaVersionRef {
      resolver: self,
      version,
    }
  }

  pub fn create_migration(
    &self,
    start: SchemaStateRef,
    end: SchemaVersionRef,
    dir: MigrationDirection,
  ) -> Option<SchemaMigration> {
    let start = self.validate_state(start);
    let end = self.validate_version(end).into();
    self.inner_create_migration(start, end, dir)
  }

  pub async fn apply_migration(&self, db: &PgPool, migration: &'_ SchemaMigration<'_>) -> Result<(), Box<dyn Error>> {
    let mut tx = db.begin().await?;
    self.tx_apply_migration(&mut tx, migration).await?;
    tx.commit().await?;
    Ok(())
  }

  fn inner_create_migration(
    &self,
    start: SchemaState,
    end: SchemaState,
    dir: MigrationDirection,
  ) -> Option<SchemaMigration> {
    let edge_cost: Box<dyn FnMut((SchemaState, SchemaState, &EdgeState)) -> SaturatingU32> = match dir {
      MigrationDirection::UpgradeOnly => Box::new(
        |(source, target, _): (SchemaState, SchemaState, &EdgeState)| -> SaturatingU32 {
          match source.cmp(&target) {
            Ordering::Less => SaturatingU32(1),
            Ordering::Equal => SaturatingU32(0),
            Ordering::Greater => SaturatingU32::MAX,
          }
        },
      ),
      MigrationDirection::DowngradeOnly => Box::new(
        |(source, target, _): (SchemaState, SchemaState, &EdgeState)| -> SaturatingU32 {
          match source.cmp(&target) {
            Ordering::Less => SaturatingU32::MAX,
            Ordering::Equal => SaturatingU32(0),
            Ordering::Greater => SaturatingU32(1),
          }
        },
      ),
    };
    let estimate_cost = match dir {
      MigrationDirection::UpgradeOnly => |_| SaturatingU32(1),
      MigrationDirection::DowngradeOnly => |_| SaturatingU32(1),
    };
    let (cost, path) = astar(&self.graph, start, |n| n == end, edge_cost, estimate_cost)?;
    if cost == SaturatingU32::MAX {
      return None;
    }
    let migration = SchemaMigration {
      resolver: self,
      states: path,
    };
    Some(migration)
  }

  pub async fn get_state(&self, db: &PgPool) -> Result<SchemaStateRef<'_>, Box<dyn Error>> {
    let mut tx = db.begin().await?;
    let state = self.inner_get_state(&mut tx).await?;
    tx.commit().await?;
    Ok(self.issue_state(state))
  }

  async fn inner_get_state(&self, tx: &mut Transaction<'_, Postgres>) -> Result<SchemaState, Box<dyn Error>> {
    let mut meta: Option<SchemaMeta> = self.inner_get_schema_meta_from_fn(&mut *tx).await?;
    if meta.is_none() {
      meta = self.inner_get_schema_meta_from_comment(&mut *tx).await?;
    }
    let state: SchemaState = match meta {
      None => SchemaState::Empty,
      Some(meta) => SchemaVersion(meta.version).into(),
    };
    assert!(self.states.contains_key(&state));
    Ok(state)
  }

  async fn inner_get_schema_meta_from_comment<'e, E: Executor<'e, Database = Postgres>>(
    &self,
    db: E,
  ) -> Result<Option<SchemaMeta>, Box<dyn Error>> {
    let row: Option<(String,)> = sqlx::query_as(
      r"
      SELECT description AS meta
      FROM   pg_catalog.pg_namespace INNER JOIN pg_catalog.pg_description ON (oid = objoid)
      WHERE  nspname = CURRENT_SCHEMA();
    ",
    )
    .fetch_optional(db)
    .await?;

    match &row {
      None => Ok(None),
      Some((ref meta,)) if meta == DEFAULT_SCHEMA_COMMENT => Ok(None),
      Some((ref meta,)) => {
        let meta: SchemaMeta = serde_json::from_str(meta)?;
        Ok(Some(meta))
      }
    }
  }

  async fn inner_get_schema_meta_from_fn(
    &self,
    db: &mut Transaction<'_, Postgres>,
  ) -> Result<Option<SchemaMeta>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      version: i32,
    }

    impl TryFrom<Row> for SchemaMeta {
      type Error = Box<dyn Error>;

      fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
          version: NonZeroU32::try_from(u32::try_from(row.version)?)?,
        })
      }
    }

    let mut tx = db.begin().await?;

    let res: Result<Row, _> = sqlx::query_as("SELECT version FROM get_schema_meta();")
      .fetch_one(&mut tx)
      .await;

    let mut commit_tx: bool = true;
    let res: Result<Option<SchemaMeta>, Box<dyn Error>> = match res {
      Ok(row) => SchemaMeta::try_from(row).map(Some),
      Err(sqlx::Error::Database(e)) => match e.try_downcast::<PgDatabaseError>() {
        Ok(e) => match e.code() {
          "42883" => {
            commit_tx = false;
            Ok(None)
          }
          _ => Err(Box::new(e)),
        },
        Err(e) => Err(Box::new(sqlx::Error::Database(e))),
      },
      Err(e) => Err(Box::new(e)),
    };

    if commit_tx {
      tx.commit().await?;
    } else {
      tx.rollback().await?;
    }
    res
  }

  async fn tx_set_schema_meta(
    &self,
    tx: &mut Transaction<'_, Postgres>,
    meta: &SchemaMeta,
  ) -> Result<(), Box<dyn Error>> {
    // Workaround for PG issue #17053 causing a memory corruption issue when the
    // request below is used as a prepared statement. The workaround is to
    // slightly change the request each time by adding whitespace.
    // <https://www.postgresql.org/message-id/17053-3ca3f501bbc212b4%40postgresql.org>
    let cache_buster_len = self.cache_buster_len.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    let cache_buster = " ".repeat(cache_buster_len.into());
    let create_type = format!(
      "CREATE DOMAIN schema_meta AS raw_schema_meta CHECK ((value).version IS NOT NULL AND (value).version >= 1){};",
      cache_buster
    );

    let create_meta_fn = format!("CREATE FUNCTION get_schema_meta() RETURNS schema_meta LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$ SELECT ROW({version}); $$;", version = meta.version);

    let queries = [
      "DROP FUNCTION IF EXISTS get_schema_meta;",
      "DROP TYPE IF EXISTS schema_meta;",
      "DROP TYPE IF EXISTS raw_schema_meta;",
      "CREATE TYPE raw_schema_meta AS (version int4);",
      create_type.as_str(),
      create_meta_fn.as_str(),
    ];

    for query in std::array::IntoIter::new(queries) {
      sqlx::query(query).execute(&mut *tx).await?;
    }

    Ok(())
  }

  pub async fn empty(&self, db: &PgPool) -> Result<(), Box<dyn Error>> {
    let mut tx = db.begin().await?;
    self.tx_empty(&mut tx).await?;
    tx.commit().await?;
    Ok(())
  }

  async fn tx_empty(&self, tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error>> {
    let drop_sql = self.drop.unwrap();
    let mut stream = tx.execute_many(drop_sql);
    while let Some(r) = stream.next().await {
      r.unwrap();
    }
    drop(stream);
    if let Some(grant_sql) = self.grant {
      let mut stream = tx.execute_many(grant_sql);
      while let Some(r) = stream.next().await {
        r.unwrap();
      }
    }
    Ok(())
  }

  async fn tx_truncate_all(&self, tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error>> {
    let row: Vec<(String,)> = sqlx::query_as(
      r"
      SELECT tablename
      FROM   pg_catalog.pg_tables
      WHERE  schemaname = CURRENT_SCHEMA();
    ",
    )
    .fetch_all(&mut *tx)
    .await?;

    let row: Vec<&str> = row.iter().map(|r| r.0.as_str()).collect();

    self.tx_truncate(tx, &row).await
  }

  async fn tx_truncate(&self, tx: &mut Transaction<'_, Postgres>, tables: &[&str]) -> Result<(), Box<dyn Error>> {
    let mut query = String::new();
    query.push_str("TRUNCATE TABLE ");
    for (i, table) in tables.iter().cloned().enumerate() {
      if i != 0 {
        query.push_str(", ");
      }
      query.push('"');
      query.push_str(table);
      query.push('"');
    }
    query.push_str(" CASCADE;");

    sqlx::query(&query).execute(tx).await?;

    Ok(())
  }

  pub async fn force_create_latest(&self, db: &PgPool, void: bool) -> Result<(), Box<dyn Error>> {
    self.inner_force_create(db, self.latest.into(), void).await
  }

  pub async fn force_create(&self, db: &PgPool, state: SchemaStateRef<'_>, void: bool) -> Result<(), Box<dyn Error>> {
    self.inner_force_create(db, self.validate_state(state), void).await
  }

  async fn inner_force_create(&self, db: &PgPool, state: SchemaState, void: bool) -> Result<(), Box<dyn Error>> {
    let mut tx = db.begin().await?;
    let mut latest_force_created_state = self.latest_force_created_state.write().unwrap();
    if void && *latest_force_created_state == Some(state) {
      let cur = self.inner_get_state(&mut tx).await?;
      if cur == state {
        self.tx_truncate_all(&mut tx).await?;
        tx.commit().await?;
        return Ok(());
      }
    }

    let migration = self
      .inner_create_migration(SchemaState::Empty, state, MigrationDirection::UpgradeOnly)
      .expect("Unreachable state from empty DB");
    self.tx_empty(&mut tx).await?;
    self.tx_apply_migration(&mut tx, &migration).await?;
    *latest_force_created_state = Some(state);
    tx.commit().await?;
    Ok(())
  }

  async fn tx_apply_migration(
    &self,
    tx: &mut Transaction<'_, Postgres>,
    migration: &'_ SchemaMigration<'_>,
  ) -> Result<(), Box<dyn Error>> {
    for w in migration.states.windows(2) {
      let [start, end] = *TryInto::<&[SchemaState; 2]>::try_into(w).unwrap();
      self.tx_apply_edge(tx, start, end).await?;
    }
    Ok(())
  }

  async fn tx_apply_edge(
    &self,
    tx: &mut Transaction<'_, Postgres>,
    start: SchemaState,
    end: SchemaState,
  ) -> Result<(), Box<dyn Error>> {
    let old_state = self.inner_get_state(&mut *tx).await?;
    assert_eq!(start, old_state);
    {
      let edge = self.graph.edge_weight(start, end).unwrap();
      let mut stream = tx.execute_many(edge.schema);
      while let Some(r) = stream.next().await {
        r.unwrap();
      }
    }
    match end {
      SchemaState::Empty => panic!("UnexpectedEmptyEndState"),
      SchemaState::Version(v) => {
        self.tx_set_schema_meta(&mut *tx, &SchemaMeta { version: v.0 }).await?;
      }
    }
    let new_state = self.inner_get_state(&mut *tx).await?;
    debug_assert_eq!(end, new_state);
    Ok(())
  }
}
