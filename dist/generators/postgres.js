'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schemaGenerator = require('../schema-generator');

var _schemaGenerator2 = _interopRequireDefault(_schemaGenerator);

var _util = require('util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
  fts: 'tsvector'
};

class Postgres extends _schemaGenerator2.default {
  typeForColumn(column) {
    return TYPES[column.type] || 'text';
  }

  transformToText(columnName) {
    return (0, _util.format)('CAST(%s AS text)', columnName);
  }

  // alternate:
  // select '-1.2e10' ~ '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';
  transformToDouble(columnName) {
    return (0, _util.format)('convert_to_float(%s)', columnName);
  }

  createIndex(change) {
    const type = change.type || 'btree';
    const indexName = this.indexName(change.newTable, change.columns);
    const tableName = this.tableName(change.newTable);
    const columns = change.columns.join(', ');

    return (0, _util.format)('CREATE INDEX %s ON %s USING %s (%s);', indexName, tableName, type, columns);
  }

  dropTable(change) {
    return (0, _util.format)('DROP TABLE IF EXISTS %s%s CASCADE;', this.escapedSchema(), this.escape(this.tablePrefix + change.oldTable.name));
  }

  createView(change) {
    const viewName = this.viewName(change.newTable);
    const viewDefinition = this.projectionForView(change.newTable);
    const tableName = this.tableName(change.newTable);

    return (0, _util.format)('CREATE OR REPLACE VIEW %s AS SELECT %s FROM %s;', viewName, viewDefinition, tableName);
  }
}
exports.default = Postgres;
//# sourceMappingURL=postgres.js.map