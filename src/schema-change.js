export default class SchemaChange {
  constructor(type, options) {
    this.type = type;

    for (const key of Object.keys(options)) {
      this[key] = options[key];
    }
  }
}
