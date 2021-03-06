'use strict';

var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

/**
 * BooksGenderController
 *
 * @description :: Server-side logic for managing Booksgenders
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var BooksGenderController = {
    keywords: function keywords(request, response) {
        var Model = actionUtil.parseModel(request);

        Model.query("select distinct(word) from booksgender where word<>'#totalforcategory' ", [],
            function(error, results) {
                if (error) return response.serverError(error);
                //transform keywords
                var arrResult = [];
                for (var i = 0; i < results.length; i++) {
                    var row = results[i];
                    arrResult.push(row.word);
                };
                response.json(200, arrResult);
            });
    },
    group: function group(request, response) {
        var Model = actionUtil.parseModel(request);

        var keyword = request.param('keyword');
        if (keyword === undefined) {
            response.json(400, { message: 'keyword must be defined' });
        }
        /*
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
        */

        sails.services.booksgendersummary.getSummaries(Model).promise.then(function(sumBooks) {
            //console.log(JSON.stringify(sumBooks.years));
            /*
            parse yearlySummary into hash table
            */
            var yearlySummary = sumBooks.total;

            Model.query("select date,authgender,chargender,role,count from booksgender where word = ? order by date asc", [keyword],
                function(error, results) {
                    if (error) return response.serverError(error);
                    var summarizer = {};
                    for (var i = 0; i < results.length; i++) {
                        var result = results[i];

                        //console.log(yearSum);
                        if (summarizer[result.date] === undefined) {
                            summarizer[result.date] = {};
                            summarizer[result.date].date = result.date;
                            summarizer[result.date].authgender = {};
                            summarizer[result.date].chargender = {};
                        }

                        var aggregator = summarizer[result.date];

                        if (aggregator.authgender[result.role] === undefined) {
                            aggregator.authgender[result.role] = {};
                        }

                        if (aggregator.authgender[result.role][result.authgender] === undefined) {
                            aggregator.authgender[result.role][result.authgender] = {}
                            aggregator.authgender[result.role][result.authgender]['total'] = 0;
                        }

                        aggregator.authgender[result.role][result.authgender]['total'] += parseInt(result.count);
                        aggregator.authgender[result.role][result.authgender].frequency = aggregator.authgender[result.role][result.authgender].total / yearlySummary[result.date].authgender[result.role][result.authgender].total;

                        if (aggregator.chargender[result.role] === undefined) {
                            aggregator.chargender[result.role] = {};
                        }

                        if (aggregator.chargender[result.role][result.chargender] === undefined) {
                            aggregator.chargender[result.role][result.chargender] = {}
                            aggregator.chargender[result.role][result.chargender]['total'] = 0;
                        }

                        aggregator.chargender[result.role][result.chargender]['total'] += parseInt(result.count);
                        aggregator.chargender[result.role][result.chargender].frequency = aggregator.chargender[result.role][result.chargender].total / yearlySummary[result.date].chargender[result.role][result.chargender].total;
                    }

                    /* reorder list */
                    var summarizerResult = [];
                    for (var i = 0; i < sumBooks.years.length; i++) {
                        //console.log(JSON.stringify(sumBooks.years[i]));
                        if (summarizer[sumBooks.years[i]] === undefined) {
                            summarizerResult.push({ date: sumBooks.years[i] });
                        } else {
                            summarizerResult.push(summarizer[sumBooks.years[i]]);
                        }
                    }
                    var myResult = {};
                    myResult.years = sumBooks.years;
                    myResult.rows = summarizerResult;
                    response.json(200, myResult);
                });

            /*
            Model.query("select a.date,a." + type + " as gender,a.role,a.total as total_keywords,b.total total_words,a.total*1.0/b.total as frequency from" +
                " (SELECT date," + type + ",role,SUM(count) as total FROM booksgender WHERE word = '" + keyword + "' GROUP BY date," + type + ") a," +
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
            */
            //  .done(function(error, responsegroup) {
            //      response.json(200,responsegroup);
            //  });     
        });
    }
};

module.exports = BooksGenderController;
