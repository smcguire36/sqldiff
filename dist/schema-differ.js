'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _schemaChange = require('./schema-change');

var _schemaChange2 = _interopRequireDefault(_schemaChange);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SchemaDiff {
  constructor(oldSchema, newSchema) {
    this.oldSchema = oldSchema;
    this.newSchema = newSchema;
  }

  diff() {
    this.changes = [];

    this.diffTables();

    this.diffColumns();

    this.conflate();

    return this.changes;
  }

  addChange(type, params) {
    this.changes.push(new _schemaChange2.default(type, params));
  }

  diffTables() {
    const newTables = this.newSchema ? this.newSchema.tables : null;
    const oldTables = this.oldSchema ? this.oldSchema.tables : null;

    if (this.oldSchema) {
      for (const oldTable of this.oldSchema.tables) {
        let newTable = null;

        if (newTables) {
          newTable = _underscore2.default.find(newTables, t => t.id === oldTable.id);
        }

        if (newTable) {
          if (newTable.name !== oldTable.name) {
            this.addChange('rename-table', { oldTable: oldTable, newTable: newTable });
          }
        } else {
          this.addChange('drop-table', { oldTable: oldTable });
        }
      }
    }

    if (this.newSchema) {
      for (const newTable of this.newSchema.tables) {
        let oldTable = null;

        if (oldTables) {
          oldTable = _underscore2.default.find(oldTables, t => t.id === newTable.id);
        }

        if (!oldTable) {
          this.addChange('create-table', { newTable: newTable });
        }
      }
    }
  }

  conflate() {
    // if we're re-creating a table, we don't need to rename, drop, or add any new columns because
    // the recreate handles all of those.
    const recreates = _underscore2.default.select(this.changes, change => {
      return change.type === 'recreate-table';
    });

    const ids = _underscore2.default.map(recreates, change => change.newTable.id);

    this.changes = _underscore2.default.reject(this.changes, change => {
      const isSimpleChange = _underscore2.default.contains(['rename-column', 'drop-column', 'add-column'], change.type);

      let isTableAlreadyBeingRecreated = false;

      if (change.newTable) {
        isTableAlreadyBeingRecreated = _underscore2.default.contains(ids, change.newTable.id);
      }

      return isSimpleChange && isTableAlreadyBeingRecreated;
    });
  }

  get tablesPairsForColumnDiff() {
    // only tables that exist in the old and new schemas should be diff'd for columns
    let pairs = [];

    if (this.newSchema) {
      pairs = this.newSchema.tables.map(newTable => {
        let oldTable = null;

        if (this.oldSchema) {
          oldTable = _underscore2.default.find(this.oldSchema.tables, t => t.id === newTable.id);
        }

        return { oldTable: oldTable, newTable: newTable };
      });
    }

    // only process column-level changes on tables that exist already
    pairs = _underscore2.default.filter(pairs, pair => {
      return pair.oldTable && pair.newTable && pair.oldTable.id === pair.newTable.id;
    });

    return pairs;
  }

  diffColumns() {
    const tablePairs = this.tablesPairsForColumnDiff;

    // Some changes (like column re-ordering) require completely recreating the table.
    // Track the tables we've determined need to be re-created so we don't re-create
    // it multiple times for multiple column re-orderings on the same table.
    const recreatedTableIdentifiers = [];

    for (const pair of tablePairs) {
      const oldColumns = pair.oldTable ? pair.oldTable.columns : [];
      const newColumns = pair.newTable ? pair.newTable.columns : [];

      for (let oldIndex = 0; oldIndex < oldColumns.length; ++oldIndex) {
        const oldColumn = oldColumns[oldIndex];

        let exists = false;

        for (let newIndex = 0; newIndex < newColumns.length; ++newIndex) {
          const newColumn = newColumns[newIndex];

          if (oldColumn.id === newColumn.id) {
            // The column still exists, but something could've changed about it.
            // If the index changed or anything about the column changed, action needs
            // to be taken.
            if (oldIndex !== newIndex || !newColumn.isEqualTo(oldColumn)) {
              // column reordering requires rebuilding the entire table, 1 per table
              if (!_underscore2.default.contains(recreatedTableIdentifiers, pair.newTable.id)) {
                this.addChange('recreate-table', { oldTable: pair.oldTable, newTable: pair.newTable });

                recreatedTableIdentifiers.push(pair.newTable.id);
              }
            } else if (oldColumn.name !== newColumn.name) {
              // TODO(zhm) this can't be hit because isEqualTo checks the names
              // SQLite cannot rename columns, so column renames are a bit special
              this.addChange('rename-column', { oldTable: pair.oldTable, newTable: pair.newTable, column: oldColumn });
            }

            exists = true;
          }
        }

        if (!exists) {
          this.addChange('drop-column', { oldTable: pair.oldTable, newTable: pair.newTable, column: oldColumn });
        }
      }

      for (let newIndex = 0; newIndex < newColumns.length; ++newIndex) {
        const newColumn = newColumns[newIndex];

        let exists = false;

        for (let oldIndex = 0; oldIndex < oldColumns.length; ++oldIndex) {
          const oldColumn = oldColumns[oldIndex];

          if (oldColumn.id === newColumn.id) {
            exists = true;
          }
        }

        if (!exists) {
          this.addChange('add-column', { oldTable: pair.oldTable, newTable: pair.newTable, column: newColumn });
        }
      }
    }
  }
}
exports.default = SchemaDiff;
//# sourceMappingURL=schema-differ.js.map