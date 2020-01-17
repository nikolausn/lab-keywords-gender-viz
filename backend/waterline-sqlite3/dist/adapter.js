'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _sqlite3 = require('sqlite3');

var _sqlite32 = _interopRequireDefault(_sqlite3);

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _waterlineSequel = require('waterline-sequel');

var _waterlineSequel2 = _interopRequireDefault(_waterlineSequel);

var _waterlineErrors = require('waterline-errors');

var _waterlineErrors2 = _interopRequireDefault(_waterlineErrors);

var _waterlineCursor = require('waterline-cursor');

var _waterlineCursor2 = _interopRequireDefault(_waterlineCursor);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _error = require('./error');

var _error2 = _interopRequireDefault(_error);

var Adapter = {

  identity: 'waterline-sqlite3',

  wlSqlOptions: {
    parameterized: true,
    caseSensitive: false,
    escapeCharacter: '"',
    wlNext: false,
    casting: true,
    canReturnValues: false,
    escapeInserts: true,
    declareDeleteAlias: false
  },

  /**
   * Local connections store
   */
  connections: new Map(),

  pkFormat: 'integer',
  syncable: true,

  /**
   * Adapter default configuration
   */
  defaults: {
    schema: true,
    debug: false,
    type: 'disk',
    filename: '.tmp/db.sqlite'
  },

  /**
   * This method runs when a connection is initially registered
   * at server-start-time. This is the only required method.
   *
   * @param  {[type]}   connection
   * @param  {[type]}   collection
   * @param  {Function} cb
   * @return {[type]}
   */
  registerConnection: function registerConnection(connection, collections, cb) {
    var _this = this;

    if (!connection.identity) {
      return cb(_waterlineErrors2['default'].adapter.IdentityMissing);
    }
    if (this.connections.get(connection.identity)) {
      return cb(_waterlineErrors2['default'].adapter.IdentityDuplicate);
    }

    _lodash2['default'].defaults(connection, this.defaults);

    var filename = connection.filename;
    if (connection.type == 'memory') {
      if (!_lodash2['default'].isEmpty(filename) && filename != ':memory:' && filename != this.defaults.filename) {
        console.error('\n          WARNING:\n          The connection config for the sqlite3 connection ' + connection.identity + '\n          specifies the filename "' + filename + '" but specifies type="memory". The\n          file will not be used, and the data will not be persistent.\n        ');
      }
      filename = ':memory:';
    }

    _fs2['default'].mkdir('.tmp', function () {
      _this.connections.set(connection.identity, {
        identity: connection.identity,
        schema: _this.buildSchema(connection, collections),
        collections: collections,
        knex: (0, _knex2['default'])({
          client: 'sqlite3',
          connection: {
            filename: '.tmp/' + connection.identity + '.sqlite'
          },
          debug: process.env.WATERLINE_DEBUG_SQL || connection.debug
        })
      });
      cb();
    });
  },

  /**
   * Construct the waterline schema for the given connection.
   *
   * @param connection
   * @param collections[]
   */
  buildSchema: function buildSchema(connection, collections) {
    return _lodash2['default'].chain(collections).map(function (model, modelName) {
      var definition = _lodash2['default'].get(model, ['waterline', 'schema', model.identity]);
      return _lodash2['default'].defaults(definition, {
        attributes: {},
        tableName: modelName
      });
    }).indexBy('tableName').value();
  },

  /**
   * Describe a table. List all columns and their properties.
   *
   * @see http://www.sqlite.org/pragma.html#pragma_table_info
   * @see http://www.sqlite.org/faq.html#q7
   * @see https://github.com/AndrewJo/sails-sqlite3/blob/master/lib/adapter.js#L156
   *
   * @param connectionName
   * @param tableName
   */
  describe: function describe(connectionName, tableName, cb) {
    var cxn = this.connections.get(connectionName);

    return Promise.all([cxn.knex.raw('pragma table_info("' + tableName + '")'), cxn.knex.raw('pragma index_list("' + tableName + '")')]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var _ref2$0 = _ref2[0];
      var tableInfo = _ref2$0 === undefined ? [] : _ref2$0;
      var _ref2$1 = _ref2[1];
      var indexList = _ref2$1 === undefined ? [] : _ref2$1;

      return Promise.all(indexList.map(function (index) {
        return cxn.knex.raw('pragma index_info("' + index.name + '")').then(function (_ref3) {
          var _ref32 = _slicedToArray(_ref3, 1);

          var _ref32$0 = _ref32[0];
          var indexInfo = _ref32$0 === undefined ? {} : _ref32$0;

          var indexResult = _lodash2['default'].extend(indexInfo, index);
          return indexResult;
        });
      })).then(function (indexes) {
        return _util2['default'].transformTableInfo(tableInfo, _lodash2['default'].flatten(indexes));
      });
    }).then(function (result) {
      if (_lodash2['default'].isEmpty(result)) return cb();

      _lodash2['default'].isFunction(cb) && cb(null, result);
      return result;
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Drop a table
   */
  drop: function drop(connectionName, tableName) {
    var relations = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
    var cb = arguments.length <= 3 || arguments[3] === undefined ? relations : arguments[3];
    return (function () {
      var cxn = Adapter.connections.get(connectionName);

      return cxn.knex.schema.dropTableIfExists(tableName).then(function (result) {
        _lodash2['default'].isFunction(cb) && cb();
      })['catch'](_error2['default'].wrap(cb));
    })();
  },

  /**
   * Create a new table
   *
   * @param connectionName
   * @param tableName
   * @param definition - the waterline schema definition for this model
   * @param cb
   */
  define: function define(connectionName, tableName, definition, cb) {
    var cxn = this.connections.get(connectionName);

    return cxn.knex.schema.createTable(tableName, function (table) {
      _lodash2['default'].each(definition, function (definition, attributeName) {
        var newColumn = _util2['default'].toKnexColumn(table, attributeName, definition);
        _util2['default'].applyColumnConstraints(newColumn, definition);
      });
      _util2['default'].applyTableConstraints(table, definition);
    }).then(function (result) {
      _lodash2['default'].isFunction(cb) && cb();
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Add a column to a table
   */
  addAttribute: function addAttribute(connectionName, tableName, attributeName, definition, cb) {
    var cxn = this.connections.get(connectionName);

    return cxn.knex.schema.table(tableName, function (table) {
      var newColumn = _util2['default'].toKnexColumn(table, attributeName, definition);
      return _util2['default'].applyColumnConstraints(newColumn, definition);
    }).then(function () {
      _lodash2['default'].isFunction(cb) && cb();
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Remove a column from a table
   */
  removeAttribute: function removeAttribute(connectionName, tableName, attributeName, cb) {
    var cxn = this.connections.get(connectionName);

    return cxn.knex.schema.table(tableName, function (table) {
      table.dropColumn(attributeName);
    }).then(function (result) {
      _lodash2['default'].isFunction(cb) && cb(null, result);
      return result;
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Perform a direct SQL query on the database
   *
   * @param connectionName
   * @param tableName
   * @param queryString
   * @param data
   */
  query: function query(connectionName, tableName, queryString) {
    var args = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];
    var cb = arguments.length <= 4 || arguments[4] === undefined ? args : arguments[4];
    return (function () {
      var cxn = this.connections.get(connectionName);
      var query = cxn.knex.raw(_util2['default'].toKnexRawQuery(queryString), _util2['default'].castValues(args));

      return query.then(function (rows) {
        var result = _lodash2['default'].map(rows, function (row) {
          return _util2['default'].castSqlValues(row, cxn.collections[tableName]);
        });
        _lodash2['default'].isFunction(cb) && cb(null, result);
        return result;
      });
    }).apply(this, arguments);
  },

  /**
   * Create a new record
   *
   * @param connectionName {String}
   * @param tableName {String}
   * @param record {Object}
   * @param cb {Function}
   */
  create: function create(connectionName, tableName, record, cb) {
    var cxn = this.connections.get(connectionName);
    var pk = this.getPrimaryKey(cxn, tableName);

    return cxn.knex.transaction(function (txn) {
      return txn.insert(_util2['default'].castRecord(record)).into(tableName).then(function (_ref4) {
        var _ref42 = _slicedToArray(_ref4, 1);

        var rowid = _ref42[0];

        return txn.select().from(tableName).where('rowid', rowid);
      }).then(function (_ref5) {
        var _ref52 = _slicedToArray(_ref5, 1);

        var created = _ref52[0];

        var record = _util2['default'].castSqlValues(created, cxn.collections[tableName]);
        _lodash2['default'].isFunction(cb) && cb(null, record);
        return record;
      })['catch'](_error2['default'].wrap(cb));
    });
  },

  /**
   * Find records
   *
   * @param connectionName {String}
   * @param tableName {String}
   * @param options {Object}
   * @param cb {Function}
   */
  find: function find(connectionName, tableName, options, cb) {
    var _this2 = this;

    var cxn = this.connections.get(connectionName);
    var wlsql = new _waterlineSequel2['default'](cxn.schema, this.wlSqlOptions);

    if (options.select && !options.select.length) {
      delete options.select;
    }

    return new Promise(function (resolve, reject) {
      resolve(wlsql.find(tableName, options));
    }).then(function (_ref6) {
      var _ref6$query = _slicedToArray(_ref6.query, 1);

      var query = _ref6$query[0];

      var _ref6$values = _slicedToArray(_ref6.values, 1);

      var values = _ref6$values[0];

      return _this2.query(connectionName, tableName, query, values);
    }).then(function () {
      var rows = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      _lodash2['default'].isFunction(cb) && cb(null, rows);
      return rows;
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Update a record
   *
   * @param connectionName {String}
   * @param tableName {String}
   * @param options {Object}
   * @param data {Object}
   * @param cb {Function}
   */
  update: function update(connectionName, tableName, options, data, cb) {
    var _this3 = this;

    var cxn = this.connections.get(connectionName);
    var wlsql = new _waterlineSequel2['default'](cxn.schema, this.wlSqlOptions);
    var pk = this.getPrimaryKey(cxn, tableName);
    var updateRows = undefined;

    return cxn.knex.transaction(function (txn) {
      return new Promise(function (resolve, reject) {
        var wlsql = new _waterlineSequel2['default'](cxn.schema, _this3.wlSqlOptions);
        resolve(wlsql.simpleWhere(tableName, _lodash2['default'].pick(options, 'where')));
      }).then(function (_ref7) {
        var where = _ref7.query;
        var values = _ref7.values;

        var _where$split = where.split('WHERE');

        var _where$split2 = _slicedToArray(_where$split, 2);

        var $ = _where$split2[0];
        var whereClause = _where$split2[1];

        return txn.select('rowid').from(tableName).whereRaw(txn.raw(_util2['default'].toKnexRawQuery(whereClause), values));
      }).then(function (rows) {
        updateRows = _lodash2['default'].compact(_lodash2['default'].pluck(rows, pk));
        // TODO cleanup updateRows
        if (updateRows.length === 0) {
          updateRows = _lodash2['default'].compact(_lodash2['default'].pluck(rows, 'rowid'));
        }
        var wlsql = new _waterlineSequel2['default'](cxn.schema, _this3.wlSqlOptions);
        return wlsql.update(tableName, options, data);
      }).then(function (_ref8) {
        var _query = _ref8.query;
        var values = _ref8.values;

        var _query$split = _query.split('SET');

        var _query$split2 = _slicedToArray(_query$split, 2);

        var $ = _query$split2[0];
        var setClause = _query$split2[1];

        var query = 'UPDATE "' + tableName + '" SET ' + setClause;

        return txn.raw(_util2['default'].toKnexRawQuery(query), _util2['default'].castValues(values));
      }).then(function () {
        return txn.select().from(tableName).whereIn('rowid', updateRows);
      });
    }).then(function (rows) {
      var result = _lodash2['default'].map(rows, function (row) {
        return _util2['default'].castSqlValues(row, cxn.collections[tableName]);
      });
      _lodash2['default'].isFunction(cb) && cb(null, result);
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Destroy a record
   *
   * @param connectionName {String}
   * @param tableName {String}
   * @param options {Object}
   * @param cb {Function}
   */
  destroy: function destroy(connectionName, tableName, options, cb) {
    var _this4 = this;

    var cxn = this.connections.get(connectionName);
    var wlsql = new _waterlineSequel2['default'](cxn.schema, this.wlSqlOptions);
    var found = undefined;

    return this.find(connectionName, tableName, options).then(function (_found) {
      found = _found;
      return wlsql.simpleWhere(tableName, _lodash2['default'].pick(options, 'where'));
    }).then(function (_ref9) {
      var where = _ref9.query;
      var values = _ref9.values;

      var query = 'DELETE FROM "' + tableName + '" ' + where;
      return _this4.query(connectionName, tableName, query, values);
    }).then(function (rows) {
      _lodash2['default'].isFunction(cb) && cb(null, found);
      return found;
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Count the number of records
   *
   * @param connectionName {String}
   * @param tableName {String}
   * @param options {Object}
   * @param cb {Function}
   */
  count: function count(connectionName, tableName, options, cb) {
    var _this5 = this;

    var cxn = this.connections.get(connectionName);
    var wlsql = new _waterlineSequel2['default'](cxn.schema, this.wlSqlOptions);

    return new Promise(function (resolve, reject) {
      resolve(wlsql.count(tableName, options));
    }).then(function (_ref10) {
      var _ref10$query = _slicedToArray(_ref10.query, 1);

      var _query = _ref10$query[0];

      var _ref10$values = _slicedToArray(_ref10.values, 1);

      var values = _ref10$values[0];

      var _query$split3 = _query.split('AS');

      var _query$split32 = _slicedToArray(_query$split3, 2);

      var query = _query$split32[0];
      var asClause = _query$split32[1];

      return _this5.query(connectionName, tableName, query.trim(), values);
    }).then(function (_ref11) {
      var _ref112 = _slicedToArray(_ref11, 1);

      var row = _ref112[0];

      var count = Number(row.count);
      _lodash2['default'].isFunction(cb) && cb(null, count);
      return count;
    })['catch'](_error2['default'].wrap(cb));
  },

  /**
   * Populate record associations
   *
   * @param connectionName {String}
   * @param tableName {String}
   * @param options {Object}
   * @param cb {Function}
   */
  join: function join(connectionName, tableName, options, cb) {
    var cxn = this.connections.get(connectionName);

    (0, _waterlineCursor2['default'])({
      instructions: options,
      parentCollection: tableName,

      $find: function $find(tableName, criteria, next) {
        return Adapter.find(connectionName, tableName, criteria, next);
      },

      $getPK: function $getPK(tableName) {
        if (!tableName) return;
        return Adapter.getPrimaryKey(cxn, tableName);
      }

    }, cb);
  },

  /**
   * Get the primary key column of a table
   *
   * @param cxn
   * @param tableName
   */
  getPrimaryKey: function getPrimaryKey(_ref12, tableName) {
    var collections = _ref12.collections;

    var definition = collections[tableName].definition;

    if (!definition._pk) {
      var pk = _lodash2['default'].findKey(definition, function (attr, name) {
        return attr.primaryKey === true;
      });
      definition._pk = pk || 'id';
    }

    return definition._pk;
  },

  /**
   * Fired when a model is unregistered, typically when the server
   * is killed. Useful for tearing-down remaining open connections,
   * etc.
   *
   * @param  {Function} cb [description]
   * @return {[type]}      [description]
   */
  teardown: function teardown(conn) {
    var cb = arguments.length <= 1 || arguments[1] === undefined ? conn : arguments[1];
    return (function () {
      var _this6 = this;

      var connections = conn ? [this.connections.get(conn)] : this.connections.values();
      var promises = [];

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function () {
          var cxn = _step.value;

          if (!cxn) return 'continue';

          promises.push(new Promise(function (resolve) {
            cxn.knex.destroy(resolve);
            _this6.connections['delete'](cxn.identity);
          }));
        };

        for (var _iterator = connections[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ret = _loop();

          if (_ret === 'continue') continue;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return Promise.all(promises).then(function () {
        return cb();
      })['catch'](cb);
    }).apply(this, arguments);
  }
};

_lodash2['default'].bindAll(Adapter);
exports['default'] = Adapter;
module.exports = exports['default'];