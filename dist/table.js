'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _column = require('./column');

var _column2 = _interopRequireDefault(_column);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Table {
  constructor(id, name) {
    this.id = id;
    this.name = name || id;
    this.columns = [];
  }

  addColumn(opts) {
    if (opts.id == null) {
      opts.id = opts.name;
    }

    if (opts.name == null) {
      opts.name = opts.id;
    }

    if (opts.allowNull == null) {
      opts.allowNull = true;
    }

    const hasParameters = opts.id && opts.name && opts.type;

    if (!hasParameters) {
      throw new Error('must provide id, name, type parameters');
    }

    const column = new _column2.default({ id: opts.id, name: opts.name, type: opts.type, allowNull: opts.allowNull });

    this.columns.push(column);

    return this;
  }
}
exports.default = Table;
//# sourceMappingURL=table.js.map