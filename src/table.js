import Column from './column';

export default class Table {
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

    const column = new Column({id: opts.id, name: opts.name, type: opts.type, allowNull: opts.allowNull});

    this.columns.push(column);

    return this;
  }
}
