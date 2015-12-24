'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _schemaChange = require('./schema-change');

var _schemaChange2 = _interopRequireDefault(_schemaChange);

var _util = require('util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SchemaGenerator {
  constructor(differ, options) {
    this.differ = differ;
    this.changes = differ.diff();
    this.options = options != null ? options : {};
    this.tableSchema = '';
    this.tablePrefix = '';
  }

  generate() {
    this.schemaChanges = _underscore2.default.flatten(_underscore2.default.map(this.transform(), this.statementForChange.bind(this)));
    return this.schemaChanges;
  }

  transform() {
    const changes = [];

    if (this.options.beforeTransform) {
      this.options.beforeTransform(changes);
    }

    const columnRenamesAndDrops = _underscore2.default.select(this.changes, function (change) {
      return change.type === 'drop-column' || change.type === 'rename-column';
    });

    let tablesWithColumnDrops = _underscore2.default.map(columnRenamesAndDrops, function (change) {
      return change.newTable;
    });

    tablesWithColumnDrops = _underscore2.default.uniq(tablesWithColumnDrops, false, function (table) {
      return table.id;
    });

    const tablesIdentifiersWithColumnDrops = _underscore2.default.map(tablesWithColumnDrops, function (table) {
      return table.id;
    });

    for (const change of this.changes) {
      const isSimpleChange = _underscore2.default.contains(['add-column', 'drop-column', 'rename-column'], change.type);

      const shouldReplaceWithRecreate = isSimpleChange && _underscore2.default.contains(tablesIdentifiersWithColumnDrops, change.newTable.id);

      if (!shouldReplaceWithRecreate) {
        changes.push(change);
      }
    }

    const ids = [];

    for (const drop of columnRenamesAndDrops) {
      if (!_underscore2.default.contains(ids, drop.newTable.id)) {
        changes.push(new _schemaChange2.default('recreate-table', { oldTable: drop.oldTable, newTable: drop.newTable }));

        ids.push(drop.newTable.id);
      }
    }

    if (this.options.afterTransform) {
      this.options.afterTransform(changes);
    }

    return changes;
  }

  statementForChange(change) {
    switch (change.type) {
      case 'create-table':
        return this.createTable(change);
      case 'recreate-table':
        return this.recreateTable(change);
      case 'drop-table':
        return this.dropTable(change);
      case 'add-column':
        return this.addColumn(change);
      case 'drop-column':
        return this.dropColumn(change);
      case 'rename-column':
        return this.renameColumn(change);
      case 'drop-view':
        return this.dropView(change);
      case 'create-view':
        return this.createView(change);
      case 'create-index':
        return this.createIndex(change);
      default:
        throw new Error('Invalid change type ' + change.type);
    }
  }

  escape(identifier) {
    if (identifier == null || identifier.length === 0) {
      return '';
    }

    return '"' + identifier.replace(/"/g, '""') + '"';
  }

  columnDefinition(column) {
    return this.escape(column.name) + ' ' + this.typeForColumn(column) + this.columnModifiers(column);
  }

  columnModifiers(column) {
    return column.allowNull ? '' : ' NOT NULL';
  }

  columnsForTable(table) {
    return _underscore2.default.map(table.columns, this.columnDefinition.bind(this));
  }

  projectionForTable(table) {
    return _underscore2.default.map(table.columns, function (column) {
      return column.name;
    });
  }

  projectionForView(table) {
    const definitions = [];
    const columnNames = {};

    for (const column of table.columns) {
      let alias = column.name.substring(0, 63);

      if (this.options.viewColumnName) {
        alias = this.options.viewColumnName(table, column);
      }

      if (alias == null) {
        continue;
      }

      if (!columnNames[alias]) {
        definitions.push((0, _util.format)('%s AS %s', this.escape(column.name), this.escape(alias)));
        columnNames[alias] = column;
      }
    }

    return definitions;
  }

  mappingForTables(oldTable, newTable) {
    const mappings = [];

    for (const newColumn of newTable.columns) {
      const oldColumn = _underscore2.default.find(oldTable.columns, function (column) {
        return column.id === newColumn.id;
      });

      if (oldColumn) {
        mappings.push({
          oldColumn: oldColumn,
          newColumn: newColumn
        });
      }
    }

    return mappings;
  }

  escapedSchema() {
    if (this.tableSchema == null || this.tableSchema.length === 0) {
      return '';
    }

    return this.escape(this.tableSchema) + '.';
  }

  createTable(change) {
    return (0, _util.format)('CREATE TABLE %s (%s);', this.tableName(change.newTable), this.columnsForTable(change.newTable).join(', '));
  }

  recreateTable(change) {
    const newTableName = change.newTable.name;
    const oldTableName = change.oldTable.name;

    const newTemporaryTableName = 'tmp_new_' + newTableName;
    const oldTemporaryTableName = 'tmp_old_' + oldTableName;

    const parts = [];

    parts.push(this.createTable({ newTable: { name: newTemporaryTableName,
        columns: change.newTable.columns } }));

    parts.push(this.insertInto({ name: newTemporaryTableName, columns: change.newTable.columns }, change.oldTable));

    parts.push(this.renameTable({ oldTable: { name: oldTableName },
      newTable: { name: oldTemporaryTableName } }));

    parts.push(this.renameTable({ oldTable: { name: newTemporaryTableName },
      newTable: { name: newTableName } }));

    parts.push(this.dropTable({ oldTable: { name: oldTemporaryTableName } }));

    return parts;
  }

  insertInto(into, from) {
    const mappings = this.mappingForTables(from, into);

    const newColumns = _underscore2.default.map(mappings, pair => {
      return this.escape(pair.newColumn.name);
    });

    const oldColumns = _underscore2.default.map(mappings, column => {
      // handle data type changes
      if (column.oldColumn.type !== 'double' && column.newColumn.type === 'double') {
        return this.transformToDouble(this.escape(column.oldColumn.name));
      } else if (column.oldColumn.type === 'double' && column.newColumn.type !== 'double') {
        return this.transformToText(this.escape(column.oldColumn.name));
      } else {
        return this.escape(column.oldColumn.name);
      }
    });

    return (0, _util.format)('INSERT INTO %s (%s) SELECT %s FROM %s;', this.tableName(into), newColumns.join(', '), oldColumns.join(', '), this.tableName(from));
  }

  renameTable(change) {
    return (0, _util.format)('ALTER TABLE %s RENAME TO %s;', this.tableName(change.oldTable), this.escape(this.tablePrefix + change.newTable.name));
  }

  dropTable(change) {
    return (0, _util.format)('DROP TABLE IF EXISTS %s;', this.tableName(change.oldTable));
  }

  addColumn(change) {
    return (0, _util.format)('ALTER TABLE %s ADD COLUMN %s;', this.tableName(change.newTable), this.columnDefinition(change.column));
  }

  dropColumn(change) {
    return (0, _util.format)('ALTER TABLE %s DROP COLUMN %s;', this.tableName(change.newTable), this.escape(change.column));
  }

  renameColumn(change) {
    return (0, _util.format)('ALTER TABLE %s RENAME COLUMN %s TO %s;', this.tableName(change.newTable), this.escape(change.oldColumn.name), this.escape(change.newColumn.name));
  }

  tableName(table) {
    return this.escapedSchema() + this.escape(this.tablePrefix + table.name);
  }

  viewName(table) {
    return this.escapedSchema() + this.escape(this.tablePrefix + table.name + '_view');
  }

  indexName(table, columns) {
    return this.escape('idx_' + this.tablePrefix + table.name + '_' + columns.join('_'));
  }

  dropView(change) {
    return (0, _util.format)('DROP VIEW IF EXISTS %s;', this.viewName(change.oldTable));
  }

  createView(change) {
    return (0, _util.format)('CREATE VIEW IF NOT EXISTS %s AS SELECT %s FROM %s;', this.viewName(change.newTable), this.projectionForView(change.newTable), this.tableName(change.newTable));
  }

  createIndex(change) {
    return (0, _util.format)('CREATE INDEX %s ON %s (%s);', this.indexName(change.newTable, change.columns), this.tableName(change.newTable), change.columns.map(c => this.escape(c)).join(', '));
  }
}
exports.default = SchemaGenerator;
//# sourceMappingURL=schema-generator.js.map