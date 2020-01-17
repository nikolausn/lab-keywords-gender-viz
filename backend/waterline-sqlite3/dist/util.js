'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _adapter = require('./adapter');

var _adapter2 = _interopRequireDefault(_adapter);

var _waterlineSequelSequelLibCriteriaProcessor = require('waterline-sequel/sequel/lib/criteriaProcessor');

var _waterlineSequelSequelLibCriteriaProcessor2 = _interopRequireDefault(_waterlineSequelSequelLibCriteriaProcessor);

var Util = {

  /**
   * Create a column for Knex from a Waterline atribute definition
   * https://www.sqlite.org/datatype3.html
   */
  toKnexColumn: function toKnexColumn(table, _name, attrDefinition) {
    var attr = _lodash2['default'].isObject(attrDefinition) ? attrDefinition : { type: attrDefinition };
    var type = attr.autoIncrement ? 'serial' : attr.type;
    var name = attr.columnName || _name;

    switch (type.toLowerCase()) {
      case 'text':
      case 'mediumtext':
      case 'longtext':
      case 'string':
      case 'json':
      case 'array':
        return table.text(name, type);

      /**
       * table.integer(name) 
       * Adds an integer column.
       */
      case 'boolean':
      case 'serial':
      case 'smallserial':
      case 'bigserial':
      case 'int':
      case 'integer':
      case 'smallint':
      case 'bigint':
      case 'biginteger':
      case 'datestamp':
      case 'datetime':
      case 'date':
        return table.integer(name);

      /**
       * table.float(column, [precision], [scale]) 
       * Adds a float column, with optional precision and scale.
       */
      case 'real':
      case 'float':
      case 'double':
      case 'decimal':
        return table.specificType(name, 'REAL');

      case 'binary':
      case 'bytea':
        return table.binary(name);

      case 'sqltype':
      case 'sqlType':
        return table.specificType(name, type);

      default:
        console.error('Unregistered type given for attribute. name=', name, '; type=', type);
        return table.text(name);
    }
  },

  /**
   * Apply a primary key constraint to a table
   *
   * @param table - a knex table object
   * @param definition - a waterline attribute definition
   */
  applyPrimaryKeyConstraints: function applyPrimaryKeyConstraints(table, definition) {
    var primaryKeys = _lodash2['default'].keys(_lodash2['default'].pick(definition, function (attribute) {
      return attribute.primaryKey;
    }));

    return table.primary(primaryKeys);
  },

  applyTableConstraints: function applyTableConstraints(table, definition) {
    return this.applyPrimaryKeyConstraints(table, definition);
  },

  applyColumnConstraints: function applyColumnConstraints(column, definition) {
    var _this = this;

    if (_lodash2['default'].isString(definition)) {
      return;
    }
    return _lodash2['default'].map(definition, function (value, key) {
      if (key == 'defaultsTo' && definition.autoIncrement && value == 'AUTO_INCREMENT') {
        return;
      }

      return _this.applyParticularColumnConstraint(column, key, value, definition);
    });
  },

  applyParticularColumnConstraint: function applyParticularColumnConstraint(column, constraintName, value, definition) {
    if (!value) return;

    switch (constraintName) {

      case 'index':
        return column.index(_lodash2['default'].get(value, 'indexName'), _lodash2['default'].get(value, 'indexType'));

      /**
       * Acceptable forms:
       * attr: { unique: true }
       * attr: {
       *   unique: {
       *     unique: true, // or false
       *     composite: [ 'otherAttr' ]
       *   }
       * }
       */
      case 'unique':
        if ((value === true || _lodash2['default'].get(value, 'unique') === true) && !definition.primaryKey) {
          column.unique();
        }
        return;

      case 'notNull':
        return column.notNullable();

      case 'defaultsTo':
        return column.defaultTo(value);

      case 'type':
        return;
      case 'primaryKey':
        return;
      case 'autoIncrement':
        return;
      case 'on':
        return;
      case 'via':
        return;
      case 'foreignKey':
        return;
      case 'references':
        return;
      case 'model':
        return;
      case 'alias':
        return;

      default:
        console.error('Unknown constraint [', constraintName, '] on column');
    }
  },

  /**
   * Convert a paramterized waterline query into a knex-compatible query string
   */
  toKnexRawQuery: function toKnexRawQuery() {
    var sql = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    return sql.replace(/\$\d+/g, '?');
  },

  castSqlValues: function castSqlValues(values, model) {
    return _lodash2['default'].mapValues(values, function (value, attr) {
      var definition = model.definition[attr];
      if (!definition) {
        return value;
      }
      if (_lodash2['default'].contains(['date', 'datetime', 'datestamp'], definition.type)) {
        return new Date(value);
      }
      if (definition.type == 'json' && _lodash2['default'].isString(value)) {
        return JSON.parse(value);
      }
      if (definition.type == 'array' && _lodash2['default'].isString(value)) {
        return JSON.parse(value);
      }

      return value;
    });
  },

  castRecord: function castRecord(record) {
    return _lodash2['default'].object(_lodash2['default'].keys(record), this.castValues(record));
  },

  /**
   * Cast values to the correct type
   */
  castValues: function castValues(values) {
    return _lodash2['default'].map(values, function (value) {
      if (_lodash2['default'].isArray(value)) {
        return JSON.stringify(value);
      }
      if (_lodash2['default'].isPlainObject(value)) {
        return JSON.stringify(value);
      }
      if (_lodash2['default'].isNumber(value)) {
        return Number(value);
      }
      if (Buffer.isBuffer(value)) {
        return value;
      }
      if (_lodash2['default'].isString(value)) {
        var stripped = value.replace(/\"/g, '');
        if ((0, _moment2['default'])(stripped, _moment2['default'].ISO_8601, true).isValid()) {
          return new Date(stripped).valueOf();
        }
      }
      if (_lodash2['default'].isDate(value)) {
        return value.valueOf();
      }

      return value;
    });
  },

  transformTableInfo: function transformTableInfo(tableInfo, indexes) {
    return _lodash2['default'].chain(tableInfo).map(function (column) {
      var index = _lodash2['default'].findWhere(indexes, { cid: column.cid });

      return {
        columnName: column.name,
        primaryKey: !!column.pk,
        type: column.type,
        indexed: !!(column.pk || index),
        unique: !!(column.pk || index && index.unique)
      };
    }).indexBy('columnName').value();
  }
};

_lodash2['default'].bindAll(Util);
exports['default'] = Util;
module.exports = exports['default'];