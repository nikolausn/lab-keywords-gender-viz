'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var Errors = {
  SQLITE_CONSTRAINT: function SQLITE_CONSTRAINT(sqliteError) {
    return {
      code: 'E_UNIQUE',
      message: sqliteError.message,
      invalidAttributes: []
    };
  }
};

var AdapterError = {
  wrap: function wrap(cb, txn) {
    return function (sqliteError) {
      var errorWrapper = Errors[sqliteError.code] || sqliteError;
      var error = sqliteError;

      if (_lodash2['default'].isFunction(errorWrapper)) {
        error = errorWrapper(sqliteError);
      }

      _lodash2['default'].isFunction(cb) && cb(error);
    };
  }
};

exports['default'] = AdapterError;
module.exports = exports['default'];