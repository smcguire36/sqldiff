import SchemaGenerator from '../schema-generator';
import {format as fmt} from 'util';

// This function is required in the database

/*
CREATE OR REPLACE FUNCTION convert_to_float(input_value text)
RETURNS FLOAT AS $$
DECLARE float_value FLOAT DEFAULT NULL;
BEGIN
  BEGIN
    float_value := input_value::float;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
RETURN float_value;
END;
$$ LANGUAGE plpgsql;
*/

const TYPES = {
  pk: 'bigserial NOT NULL',
  string: 'text',
  integer: 'bigint',
  date: 'float',
  double: 'float',
  timestamp: 'timestamp without time zone',
  geometry: 'geometry(Geometry, 4326)',
  array: 'text[]',
  boolean: 'boolean',
  fts: 'tsvector'
};

export default class Postgres extends SchemaGenerator {
  typeForColumn(column) {
    return TYPES[column.type] || 'text';
  }

  transformToText(columnName) {
    return fmt('CAST(%s AS text)', columnName);
  }

  // alternate:
  // select '-1.2e10' ~ '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';
  transformToDouble(columnName) {
    return fmt('convert_to_float(%s)', columnName);
  }

  createIndex(change) {
    const method = change.method || 'btree';
    const indexName = this.indexName(change.newTable, change.columns);
    const tableName = this.tableName(change.newTable);
    const columns = change.columns.join(', ');
    const unique = change.unique ? 'UNIQUE ' : '';

    return fmt('CREATE %sINDEX CONCURRENTLY %s ON %s USING %s (%s);',
               unique, indexName, tableName, method, columns);
  }

  dropTable(change) {
    return fmt('DROP TABLE IF EXISTS %s%s CASCADE;',
               this.escapedSchema(),
               this.escape(this.tablePrefix + change.oldTable.name));
  }

  createView(change) {
    const viewName = this.viewName(change.newView);
    const viewDefinition = this.projectionForView(change.newView);
    const tableName = this.tableName(change.newView.table);

    return fmt('CREATE OR REPLACE VIEW %s AS SELECT %s FROM %s;',
               viewName, viewDefinition.join(', '), tableName);
  }
}
