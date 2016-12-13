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
        model.query("select date,sum(count) as total from booksgender group by date order by date", [],
            function(error, results) {
                summaries.yearlyCounts = results;
                var years = []
                for (var i = 0; i < results.length; i++) {
                  years.push(results[i].date);
                }
                summaries.years = years;
                summaryPromise.resolve(summaries);
            }
        );
    }else{
      summaryPromise.resolve(summaries);
    }
    return summaryPromise;
};
