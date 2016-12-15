/**
 * KeywordsHelperService to get keywords
 * @todo add more these helpers :D
 */
(function() {
        'use strict';

        angular.module('frontend.core.services')
            .factory('KeywordsHelperService', [
                '$sailsSocket',
                '_',
                'DataModel',
                '$q',
                function factory(
                    $sailsSocket,
                    _,
                    DataModel,
                    $q
                ) {
                    var resultPromise = $q.defer();
                    var keywordsModel = new DataModel('BooksGender/keywords');
                    var load = keywordsModel
                        .load()
                        .then(
                            function onSuccess(response) {
                                resultPromise.resolve(response)
                            });
                    return resultPromise.promise;
                }
            ]);
}());
