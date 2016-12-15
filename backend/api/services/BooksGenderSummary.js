'use strict';

/**
 * /api/services/BooksGender.js
 *
 * Generic function to get summary one time only
 */

/*
Create summary at runtime
*/

//var BooksGender = require('BooksGender');
var _ = require('lodash');
var summaries = {};

var q = require('q');


/*
sails.models.BooksGender.query("select date,sum(count) from booksgender group by date order by date", [],
    function(error, results) {
        summaries.yearlyCounts = results;
    });
*/
//console.log(sails.models);


/**
 * get Summaries properties
 */
exports.getSummaries = function getSummaries(model) {
    var summaryPromise = q.defer();
    if (_.isEmpty(summaries)) {
        summaries = {
            date: {
                authgender: {
                    description: {},
                    dialogue: {}
                },
                chargender: {
                    description: {},
                    dialogue: {}
                }
            }
        };
        model.query("SELECT date,authgender,chargender,role,sum(count) as count FROM booksgender where word = '#totalforcategory' " +
            "group by date,authgender,chargender,role " +
            "order by date asc", [],
            function(error, results) {
                var dateArr = [];

                var summarizer = {};
                for (var i = 0; i < results.length; i++) {
                    var result = results[i];

                    if (summarizer[result.date] === undefined) {
                        summarizer[result.date] = {};
                        summarizer[result.date].date = result.date;
                        summarizer[result.date].authgender = {};
                        summarizer[result.date].chargender = {};
                        dateArr.push(result.date);
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

                    if (aggregator.chargender[result.role] === undefined) {
                        aggregator.chargender[result.role] = {};
                    }

                    if (aggregator.chargender[result.role][result.chargender] === undefined) {
                        aggregator.chargender[result.role][result.chargender] = {}
                        aggregator.chargender[result.role][result.chargender]['total'] = 0;
                    }

                    aggregator.chargender[result.role][result.chargender]['total'] += parseInt(result.count);
                }

                summaries.years = dateArr;
                summaries.total = summarizer;
                summaryPromise.resolve(summaries);
            }
        );
    } else {
        summaryPromise.resolve(summaries);
    }
    return summaryPromise;
};
