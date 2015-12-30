'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schemaGenerator = require('../schema-generator');

var _schemaGenerator2 = _interopRequireDefault(_schemaGenerator);

var _util = require('util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TYPES = {
  pk: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  string: 'TEXT',
  integer: 'INTEGER',
  date: 'REAL',
  double: 'REAL',
  array: 'TEXT',
  boolean: 'INTEGER',
  timestamp: 'REAL'
};

class Sqlite extends _schemaGenerator2.default {
  typeForColumn(column) {
    return TYPES[column.type] || 'TEXT';
  }

  transformToText(columnName) {
    return (0, _util.format)('CAST(%s AS text)', columnName);
  }

  transformToDouble(columnName) {
    return (0, _util.format)('(CASE ' + 'WHEN LENGTH(TRIM(%s)) = 0 THEN NULL ' + 'WHEN CAST(%s AS REAL) = 0 AND ' + "LENGTH(TRIM(REPLACE(REPLACE(REPLACE(%s, '.', ''), '0', ' '), '-', ''))) > 0 THEN NULL " + 'ELSE CAST(%s AS REAL) ' + 'END)', columnName, columnName, columnName, columnName);
  }

  createIndex(change) {
    return (0, _util.format)('CREATE INDEX IF NOT EXISTS %s ON %s (%s);', this.indexName(change.newTable, change.columns), this.tableName(change.newTable), change.columns.join(', '));
  }

  escape(identifier) {
    if (identifier == null || identifier.length === 0) {
      return '';
    }

    return '`' + identifier + '`';
  }
}
exports.default = Sqlite;
//# sourceMappingURL=sqlite.js.map