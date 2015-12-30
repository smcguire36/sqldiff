import View from './view';
import Table from './table';
import Sqlite from './generators/sqlite';
import Postgres from './generators/postgres';
import SchemaDiffer from './schema-differ';
import SchemaChange from './schema-change';

export default {
  View: View,
  Table: Table,
  Sqlite: Sqlite,
  Postgres: Postgres,
  SchemaDiffer: SchemaDiffer,
  SchemaChange: SchemaChange
};
