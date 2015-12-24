import Table from './table';
import Sqlite from './generators/sqlite';
import Postgres from './generators/postgres';
import SchemaDiffer from './schema-differ';

export default {
  Table: Table,
  Sqlite: Sqlite,
  Postgres: Postgres,
  SchemaDiffer: SchemaDiffer
};
