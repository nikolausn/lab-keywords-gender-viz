/**
 * Book component to wrap all book specified stuff together. This component is divided to following logical components:
 *
 *  Controllers
 *  Models
 *
 * All of these are wrapped to 'frontend.examples.book' angular module.
 */
(function() {
    'use strict';

    // Define frontend.examples.book angular module
    angular.module('frontend.dataviz.genderviz', ['chart.js']);

    // Module configuration
    angular.module('frontend.dataviz.genderviz')
        .config([
            '$stateProvider',
            function config($stateProvider) {
                $stateProvider
                // Book list
                    .state('examples.genderviz', {
                    url: '/dataviz/genderviz',
                    data: {
                        access: 0
                    },
                    views: {
                        'content@': {
                            templateUrl: '/frontend/examples/genderviz/graph.html',
                            controller: 'GraphController',
                            resolve: {
                                _keywords: [
                                    function resolve(GraphModel) {
                                        return '';
                                    }
                                ]
                            }
                        }
                    }
                });
            }
        ]);
}());
