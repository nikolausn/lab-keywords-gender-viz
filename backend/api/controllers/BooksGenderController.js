'use strict';

var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

/**
 * BooksGenderController
 *
 * @description :: Server-side logic for managing Booksgenders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var BooksGenderController = {
    group: function group(request, response) {
        var Model = actionUtil.parseModel(request);

        var keyword = request.param('keyword');
        if (keyword === undefined) {
            response.json(400, { message: 'keyword must be defined' });
        }
        var grouptype = request.param('grouptype');
        if (grouptype === undefined) {
            response.json(400, { message: 'grouptype must be defined' });
        }
        var type = ""
        if (grouptype === "authgender" || grouptype === "chargender") {
            type = grouptype;
        } else {
            response.json(400, { message: 'grouptype is not in [\'authgender\',\'chargender\']' });
        }

        Model.query("select a.date,a." + type + " as gender,a.role,a.total as total_keywords,b.total total_words,a.total*1.0/b.total as frequency from" +
            " (SELECT date," + type + ",role,SUM(count) as total FROM booksgender WHERE word = '" + keyword + "' GROUP BY date,"+type+") a," +
            " (SELECT date," + type + ",SUM(count) as total FROM booksgender GROUP BY date," + type + ") b" +
            " where a.date = b.date" +
            " and a." + type + "=b." + type + " order by a.date asc"
            //"select a.date,a.authgender,a.total as total_keywords,b.total total_words,a.total*1.0/b.total as frequency from"+
            //" (SELECT date,authgender,SUM(count) as total FROM booksgender WHERE word = ? GROUP BY date,authgender) a,"+
            //" (SELECT date,SUM(count) as total FROM booksgender GROUP BY date) b"+
            //" where a.date = b.date"
            , [keyword],
            function(error, results) {
                if (error) return response.serverError(error);
                // Do something with the results here.        
                //console.log(results);
                response.json(200, results);
            });
        //  .done(function(error, responsegroup) {
        //  	response.json(200,responsegroup);
        //  });		
    }
};

module.exports = BooksGenderController;
