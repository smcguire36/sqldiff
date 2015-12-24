'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _table = require('./table');

var _table2 = _interopRequireDefault(_table);

var _sqlite = require('./generators/sqlite');

var _sqlite2 = _interopRequireDefault(_sqlite);

var _postgres = require('./generators/postgres');

var _postgres2 = _interopRequireDefault(_postgres);

var _schemaDiffer = require('./schema-differ');

var _schemaDiffer2 = _interopRequireDefault(_schemaDiffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  Table: _table2.default,
  Sqlite: _sqlite2.default,
  Postgres: _postgres2.default,
  SchemaDiffer: _schemaDiffer2.default
};
//# sourceMappingURL=index.js.map