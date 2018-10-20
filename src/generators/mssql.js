import SchemaGenerator from '../schema-generator';
import {format as fmt} from 'util';

const TYPES = {
  pk: 'bigint NOT NULL IDENTITY(1,1) PRIMARY KEY',
  string: 'varchar(max)',
  integer: 'bigint',
  date: 'date',
  time: 'time',
  double: 'float',
  timestamp: 'datetime',
  geometry: 'geography',
  json: 'varchar(max)',
  array: 'varchar(max)',
  boolean: 'bit',
  fts: 'varchar(max)'
};

export default class MSSQL extends SchemaGenerator {
  escape(identifier) {
    if (identifier == null || identifier.length === 0) {
      return '';
    }

    return '[' + identifier + ']';
  }

  typeForColumn(column) {
    if (column.type === 'string') {
      if (/_id$/.test(column.name) || column.length != null) {
        return 'varchar(' + (column.length || '100') + ')';
      }
    }

    return TYPES[column.type] || 'varchar(max)';
  }

  transformToText(columnName) {
    return fmt('CAST(%s AS varchar(max))', columnName);
  }

  transformToDouble(columnName) {
    return fmt('IIF(ISNUMERIC(%s), %s, NULL)', columnName, columnName);
  }

   createTable(change) {
     return fmt('IF (NOT EXISTS(SELECT * FROM sysobjects WHERE (name=\'%s\')))\nCREATE TABLE %s (\n%s\n);',
               this.tableName(change.newTable).replace(/[\[\]]/g, ''),
               this.tableName(change.newTable),
               this.columnsForTable(change.newTable).join(',\n'));
   }

  createIndex(change) {
    const method = change.method || 'btree';
    const indexName = this.indexName(change.newTable, change.columns);
    const tableName = this.tableName(change.newTable);
    const columns = change.columns.map(c => this.escape(c)).join(', ');
    const unique = change.unique ? 'UNIQUE ' : '';
    // const withClause = method === 'gin' ? ' WITH (fastupdate = off)' : '';

    const spatial = method === 'spatial' ? ' SPATIAL' : '';

    return fmt('CREATE%s %sINDEX %s ON %s (%s);',
               spatial, unique, indexName, tableName, columns);
  }

  dropTable(change) {
    return fmt('DROP TABLE IF EXISTS %s%s;',
       this.escapedSchema(),
       this.escape(this.tablePrefix + change.oldTable.name));
  }

  renameTable(change) {
    return fmt('EXEC sp_rename \'%s\', \'%s\', \'OBJECT\';',
       this.tableName(change.oldTable).replace(/[\[\]]/g, ''),
       this.tableName(change.newTable).replace(/[\[\]]/g, ''));
  }

  createView(change) {
    let whereClause = '';

    if (change.newView.filter) {
      const parts = [];

      for (const field of Object.keys(change.newView.filter)) {
        parts.push(this.escape(field) + " = '" + change.newView.filter[field] + "'");
      }

      whereClause = ' WHERE ' + parts.join(' AND ');
    }

    const parts = [];

    // If the view already exists, drop it first before trying to create it
    parts.push(fmt('DROP VIEW IF EXISTS %s;\n',
        this.viewName(change.newView)));
    // Now create the view
    parts.push(fmt('CREATE VIEW %s AS\nSELECT\n  %s\nFROM %s%s;',
        this.viewName(change.newView),
        this.projectionForView(change.newView).join(',\n  '),
        this.tableName(change.newView.table),
        whereClause));

    return parts;
  }

  insertInto(into, from) {
    const parts = [];

    // Turn ON Identity Insert
    parts.push(fmt('SET IDENTITY_INSERT %s ON;', this.tableName(into)));
    // Insert Data
    parts.push(super.insertInto(into, from));
    // Turn OFF Identity Insert
    parts.push(fmt('SET IDENTITY_INSERT %s OFF;', this.tableName(into)));

    return parts;
  }
}
