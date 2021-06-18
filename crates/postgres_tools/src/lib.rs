/// Generates the query string for an upsert in an archive table
#[macro_export]
macro_rules! upsert_archive_query {
  ($table:ident (
    time ( $($)?$tid:literal $period:ident, $retrieved_at:ident ),
    primary ( $( $($)?$pid:literal $pname:ident :: $pty:ident ),* $(,)? ),
    data ( $( $($)?$did:literal $dname:ident :: $dty:ident $(?)? ),* $(,)? )
    $(, unique($(
      $ukey:ident( $( $uname:ident ),* $(,)? )
    ),* $(,)?))?
    $(,)?
  )) => {
    upsert_archive_query!(
      @inner $table (
        time ( $tid $period, $retrieved_at ),
        primary ( $( $pid $pname :: $pty ),* ),
        primary_keys ( concat!(stringify!($period) $(, ", ", stringify!($pname))*) ),
        data ( $( $did $dname :: $dty ),* )
        $(, unique($(
          $ukey( stringify!( $( $uname ),* ) )
        ),*))?
      )
    )
  };
  (@inner $table:ident (
    time ( $($)?$tid:literal $period:ident, $retrieved_at:ident ),
    primary ( $( $($)?$pid:literal $pname:ident :: $pty:ident ),* $(,)? ),
    primary_keys( $primary_keys:expr ),
    data ( $( $($)?$did:literal $dname:ident :: $dty:ident ),* $(,)? )
    $(, unique($(
      $ukey:ident( $ulist:expr )
    ),* $(,)?))?
    $(,)?
  )) => {
    concat!(
      "WITH input_row(",
        $primary_keys, ", ", stringify!($retrieved_at), $(", ", stringify!($dname)),*,
      ") AS (VALUES(",
        "PERIOD($", stringify!($tid), "::INSTANT, NULL)", $(", $", stringify!($pid), "::", stringify!($pty)),*,
        ", ARRAY[$", stringify!($tid), "::INSTANT]",
        $(", $", stringify!($did), "::", stringify!($dty)),*,
      ")), ",
      "current_row_primary AS (",
        "SELECT ", $primary_keys, " ",
        "FROM ", stringify!($table), " ",
        "WHERE upper_inf(period)" $(, " AND $", stringify!($pid), "::", stringify!($pty), " = ", stringify!($pname))*, " ",
        "LIMIT 1",
      "), ",
      $($(
      "current_row_", stringify!($ukey), " AS (",
        "SELECT ", $primary_keys, " ",
        "FROM ", stringify!($table), " ",
        "WHERE upper_inf(period) AND ROW(", $ulist, ") = (SELECT ", $ulist, " FROM input_row) ",
        "LIMIT 1",
      "), ",
      )*)?
      "matching_current_row AS (",
        "SELECT ", $primary_keys, " ",
        "FROM ", stringify!($table), " ",
          "INNER JOIN current_row_primary USING(", $primary_keys, ") ",
          $($(
          "INNER JOIN current_row_", stringify!($ukey), " USING(", $primary_keys, ") ",
          )*)?
        "WHERE TRUE" $(, " AND $", stringify!($did), "::", stringify!($dty), " IS NOT DISTINCT FROM ", stringify!($table), ".", stringify!($dname))*,
      "), ",
      "missing_input_row AS (",
        "SELECT * ",
        "FROM input_row ",
        "WHERE NOT EXISTS (SELECT 1 FROM matching_current_row)",
      "), ",
      "current_rows AS (",
        "SELECT * FROM current_row_primary ",
        $($(
        "UNION SELECT * FROM current_row_", stringify!($ukey),
        )*)?
      "), ",
      "rows_to_invalidate AS (",
        "SELECT * FROM current_rows ",
        "EXCEPT ",
        "SELECT * FROM matching_current_row",
      "), ",
      "invalidated_rows AS (",
        "UPDATE ", stringify!($table), " ",
        "SET ", stringify!($period), " = PERIOD(lower(", stringify!($period), "), $", stringify!($tid), "::INSTANT) ",
        "WHERE ROW(", $primary_keys, ") IN (SELECT ", $primary_keys, " FROM rows_to_invalidate) ",
        "RETURNING ", $primary_keys,
      "), ",
      "updated_row AS (",
        "UPDATE ", stringify!($table), " ",
        "SET ", stringify!($retrieved_at), " = ordered_set_insert(", stringify!($retrieved_at), "::ANYARRAY, $", stringify!($tid), "::INSTANT::ANYELEMENT) ",
        "WHERE ROW(", $primary_keys, ") = (SELECT ", $primary_keys, " FROM matching_current_row) ",
        "RETURNING ", $primary_keys,
      "), ",
      "inserted_row AS (",
        "INSERT ",
        "INTO ", stringify!($table), "(", $primary_keys, ", ", stringify!($retrieved_at) $(, ", ", stringify!($dname))*, ") ",
        "SELECT * FROM missing_input_row ",
        "RETURNING ", $primary_keys,
      ") ",
      "SELECT * FROM invalidated_rows ",
      "UNION ALL ",
      "SELECT * FROM updated_row ",
      "UNION ALL ",
      "SELECT * FROM inserted_row;",
    )
  };
}
