"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
class SchemaChange {
  constructor(type, options) {
    this.type = type;

    for (const key of Object.keys(options)) {
      this[key] = options[key];
    }
  }
}
exports.default = SchemaChange;
//# sourceMappingURL=schema-change.js.map