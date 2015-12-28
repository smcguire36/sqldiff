import Column from './column';

export default class Table {
  constructor(id, name, options) {
    this.id = id;
    this.name = name || id;
    this.columns = [];
    this.options = options || {};
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

    const column = new Column(opts);

    this.columns.push(column);

    return this;
  }
}
