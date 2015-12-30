'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _column = require('./column');

var _column2 = _interopRequireDefault(_column);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Table = (function () {
  function Table(id, name, options) {
    _classCallCheck(this, Table);

    this.id = id;
    this.name = name || id;
    this.columns = [];
    this.indexes = [];

    options = options || {};

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(options)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        this[key] = options[key];
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  _createClass(Table, [{
    key: 'addIndex',
    value: function addIndex(opts) {
      if (opts.columns) {
        throw new Error('must provide column parameter');
      }

      this.indexes.push(opts);
    }
  }, {
    key: 'addColumn',
    value: function addColumn(opts) {
      if (opts.id == null) {
        opts.id = opts.name;
      }

      if (opts.name == null) {
        opts.name = opts.id;
      }

      if (opts.allowNull == null) {
        opts.allowNull = true;
      }

      var hasParameters = opts.id && opts.name && opts.type;

      if (!hasParameters) {
        throw new Error('must provide id, name, type parameters');
      }

      var column = new _column2.default(opts);

      this.columns.push(column);

      return this;
    }
  }]);

  return Table;
})();

exports.default = Table;
//# sourceMappingURL=table.js.map