'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const TYPES = {
  createTable: 'create-table',
  recreateTable: 'recreate-table',
  dropTable: 'drop-table',
  addColumn: 'add-column',
  dropColumn: 'drop-column',
  renameColumn: 'rename-column'
};

class SchemaChange {
  constructor(type, options) {
    this.type = type;

    for (const key of Object.keys(options)) {
      this[key] = options[key];
    }
  }

  static get TYPES() {
    return TYPES;
  }
}
exports.default = SchemaChange;
//# sourceMappingURL=schema-change.js.map