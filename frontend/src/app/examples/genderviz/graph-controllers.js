/**
 * This file contains all necessary Angular controller definitions for 'frontend.examples.book' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
    'use strict';


    // Controller which contains all necessary logic for book list GUI on boilerplate application.
    angular.module('frontend.dataviz.genderviz')
        .controller('GraphController', [
            '$scope', '$q', '$timeout',
            '_',
            'SocketHelperService',
            'UserService', 'GraphModel',
            '_keywords',
            'KeywordsHelperService',
            function controller(
                $scope, $q, $timeout,
                _,
                SocketHelperService,
                UserService, GraphModel,
                _keywords,
                KeywordsHelperService
            ) {
                // Set current scope reference to models
                GraphModel.setScope($scope, false, 'items', 'itemCount');

                $scope.keywordsSuggest = [];

                KeywordsHelperService.then(function(result) {
                    $scope.keywordsSuggest = result;
                    $scope.keyword = '';
                });

                // Set initial data
                $scope.keywords = _keywords;
                $scope.keywordArray = [];
                $scope.keyword = '';
                $scope.user = UserService.user();
                $scope.criteria = 'description';
                $scope.graph = {
                    authgender: {},
                    chargender: {}
                };

                var myGraph = $scope.graph;

                var graphDataSet;

                /*
                  Function to parse keywords separated by comma
                */
                function _parseKeywords(keywords) {
                    return keywords.split(',');
                };

                /*
                  Function to draw graph using jquery
                */
                function Graphics(title) {
                    this.title = title;
                    this.feminime = [];
                    this.masculine = [];
                    this.date = [];
                    this.dateHash = {};
                    this.labels = [];
                    this.series = ['feminine', 'masculine'];
                    this.data = [this.feminime, this.masculine];
                    this.text = "";
                };

                function _renderGraph(graph, criteria) {
                    myGraph.authgender.date = graph.authgender[criteria].date;
                    myGraph.authgender.data = graph.authgender[criteria].data;
                    myGraph.authgender.labels = graph.authgender[criteria].labels;
                    myGraph.authgender.series = graph.authgender[criteria].series;
                    myGraph.authgender.onClick = function(points, evt) {
                        console.log(points, evt);
                    };
                    myGraph.authgender.options = {
                        title: {
                            display: true,
                            text: $scope.keyword + ' - ' + graph.authgender[criteria].title
                        },
                        legend: {
                            display: true,
                            labels: {
                                fontColor: 'rgb(0, 0, 0)'
                            }
                        }
                    };
                    myGraph.authgender.datasetOverride = [{
                        fill: false,
                        borderColor: "rgba(255,0,0,0.5)",
                        pointBorderColor: "rgba(255,0,0,0.5)"
                    }, {
                        fill: false,
                        borderColor: "rgba(0,0,255,0.5)",
                        pointBorderColor: "rgba(0,0,255,0.5)"
                    }];

                    myGraph.chargender.date = graph.chargender[criteria].date;
                    myGraph.chargender.data = graph.chargender[criteria].data;
                    myGraph.chargender.labels = graph.chargender[criteria].labels;
                    myGraph.chargender.series = graph.chargender[criteria].series;
                    myGraph.chargender.onClick = function(points, evt) {
                        console.log(points, evt);
                    };
                    myGraph.chargender.options = {
                        title: {
                            display: true,
                            text: $scope.keyword + ' - ' + graph.chargender[criteria].title
                        },
                        legend: {
                            display: true,
                            labels: {
                                fontColor: 'rgb(0, 0, 0)'
                            }
                        }
                    };
                    myGraph.chargender.datasetOverride = [{
                        fill: false,
                        borderColor: "rgba(255,0,0,0.5)",
                        pointBorderColor: "rgba(255,0,0,0.5)"
                    }, {
                        fill: false,
                        borderColor: "rgba(0,0,255,0.5)",
                        pointBorderColor: "rgba(0,0,255,0.5)"
                    }];

                }

                function _transformGraph(dataset) {
                    //console.log(dataset);
                    var graphStructure = {
                            authgender: {
                                dialogue: new Graphics('Author Gender - Dialogue'),
                                description: new Graphics('Author Gender - Description')
                            },
                            chargender: {
                                dialogue: new Graphics('Character Gender - Dialogue'),
                                description: new Graphics('Character Gender - Description')
                            }
                        }
                        //console.log('finish structure ' + JSON.stringify(graphStructure));
                    for (var i = 0; i < dataset.rows.length; i++) {
                        var row = dataset.rows[i];
                        //console.log(JSON.stringify(row));
                        for (var l1 in graphStructure) {
                            var l1val = graphStructure[l1];
                            for (var l2 in l1val) {
                                var l2val = l1val[l2];
                                //console.log(l1val+','+l2val);
                                var graphIn = graphStructure[l1][l2];
                                //console.log(graphIn);
                                graphIn.date.push(row.date);
                                graphIn.labels.push(new Date(row.date).getFullYear());
                                if (row[l1] === undefined || row[l1][l2] === undefined) {
                                    graphIn.feminime.push(0);
                                    graphIn.masculine.push(0);
                                } else {
                                    if (row[l1][l2].f !== undefined) {
                                        graphIn.feminime.push(row[l1][l2].f.frequency);
                                    } else {
                                        graphIn.feminime.push(0);
                                    }
                                    if (row[l1][l2].m !== undefined) {
                                        graphIn.masculine.push(row[l1][l2].m.frequency);
                                    } else {
                                        graphIn.masculine.push(0);
                                    }
                                }
                            }
                        }
                    }
                    //console.log('finish structure ' + JSON.stringify(graphStructure));
                    return graphStructure;
                };

                function _triggerDrawGraph(keywordArray) {
                    $scope.loading = true;
                    //console.log(keywordArray[0]);
                    var parameters = {
                        //                            grouptype: 'authgender',
                        keyword: keywordArray[0]
                    };
                    $scope.keyword = keywordArray[0];
                    if($scope.keywordsSuggest.indexOf($scope.keyword)<0){
                        window.alert('keyword '+$scope.keyword+' is not in database');
                        return;
                    }

                    // Fetch actual data
                    var load = GraphModel
                        .load(parameters)
                        .then(
                            function onSuccess(response) {
                                graphDataSet = _transformGraph(response);
                                _renderGraph(graphDataSet, $scope.criteria);
                                //console.log(JSON.stringify(response));
                                //$scope.items = response;

                                /*
                                var feminimeData = [];
                                var masculinData = [];
                                var dateData = [];
                                var dateHash = {};
                                for (var i = 0; i < response.length; i++) {
                                    var row = response[i];
                                    var yearDate = new Date(row.date).getFullYear();
                                    if (dateHash[yearDate] === undefined) {
                                        dateHash[yearDate] = {};
                                    }
                                    dateHash[yearDate][row.gender] = row.frequency;
                                }

                                for (var key in dateHash) {
                                    var row = dateHash[key];
                                    dateData.push(key);
                                    if (row['f'] !== undefined) {
                                        feminimeData.push(row['f']);
                                    } else {
                                        feminimeData.push(0);
                                    }
                                    if (row['m'] !== undefined) {
                                        masculinData.push(row['m']);
                                    } else {
                                        masculinData.push(0);
                                    }
                                }

                                $scope.labels = dateData;
                                $scope.series = ['feminime', 'masculine'];
                                $scope.data = [
                                    feminimeData,
                                    masculinData
                                ];
                                $scope.onClick = function(points, evt) {
                                    console.log(points, evt);
                                };
                                $scope.options = {
                                    title: {
                                        display: true,
                                        text:  ' by author gender'
                                    }
                                };

                                $scope.datasetOverride = [{
                                    fill: false,
                                    borderColor: "rgba(0,0,255,0.5)",
                                    pointBorderColor: "rgba(0,0,255,0.5)"
                                }, {
                                    fill: false,
                                    borderColor: "rgba(255,0,0,0.5)",
                                    pointBorderColor: "rgba(255,0,0,0.5)"
                                }];
                                */
                            }
                        );


                    /*
                    parameters = {
                        grouptype: 'chargender',
                        keyword: keywordArray[0]
                    };

                    // Fetch actual data
                    load = GraphModel
                        .load(parameters)
                        .then(
                            function onSuccess(response) {
                                //console.log(JSON.stringify(response));
                                //$scope.items = response;
                                var feminimeData = [];
                                var masculinData = [];
                                var dateData = [];
                                var dateHash = {};
                                for (var i = 0; i < response.length; i++) {
                                    var row = response[i];
                                    var yearDate = new Date(row.date).getFullYear();
                                    if (dateHash[yearDate] === undefined) {
                                        dateHash[yearDate] = {};
                                    }
                                    dateHash[yearDate][row.gender] = row.frequency;
                                }

                                for (var key in dateHash) {
                                    var row = dateHash[key];
                                    dateData.push(key);
                                    if (row['f'] !== undefined) {
                                        feminimeData.push(row['f']);
                                    } else {
                                        feminimeData.push(0);
                                    }
                                    if (row['m'] !== undefined) {
                                        masculinData.push(row['m']);
                                    } else {
                                        masculinData.push(0);
                                    }
                                }

                                $scope.labels_char = dateData;
                                $scope.series = ['feminime', 'masculine'];
                                $scope.data_char = [
                                    feminimeData,
                                    masculinData
                                ];
                                $scope.onClick = function(points, evt) {
                                    console.log(points, evt);
                                };
                                $scope.options_char = {
                                        title: {
                                            display: true,
                                            text:  ' by character gender'
                                        }
                                    };
                                /*
                                $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
                                $scope.options = {
                                    scales: {
                                        yAxes: [{
                                            id: 'y-axis-1',
                                            type: 'linear',
                                            display: true,
                                            position: 'left'
                                        }, {
                                            id: 'y-axis-2',
                                            type: 'linear',
                                            display: true,
                                            position: 'right'
                                        }]
                                    }
                                };
                                */
                    //}
                    //);
                };

                // Function triggered when keywords change
                $scope.keywordsChange = function keywordsChange() {
                    $scope.keywordArray = _parseKeywords($scope.keywords);
                    _triggerDrawGraph($scope.keywordArray);
                };

                $scope.criteriaChange = function() {
                    _renderGraph(graphDataSet, $scope.criteria);
                };

                /**
                 * Simple watcher for 'currentPage' scope variable. If this is changed we need to fetch book data
                 * from server.
                 */
                $scope.$watch('currentPage', function watcher(valueNew, valueOld) {
                    if (valueNew !== valueOld) {
                        _fetchData();
                    }
                });

                /**
                 * Simple watcher for 'itemsPerPage' scope variable. If this is changed we need to fetch book data
                 * from server.
                 */
                $scope.$watch('itemsPerPage', function watcher(valueNew, valueOld) {
                    if (valueNew !== valueOld) {
                        _triggerFetchData();
                    }
                });

                var searchWordTimer;

                /**
                 * Watcher for 'filter' scope variable, which contains multiple values that we're interested
                 * within actual GUI. This will trigger new data fetch query to server if following conditions
                 * have been met:
                 *
                 *  1) Actual filter variable is different than old one
                 *  2) Search word have not been changed in 400ms
                 *
                 * If those are ok, then watcher will call 'fetchData' function.
                 */
                $scope.$watch('filters', function watcher(valueNew, valueOld) {
                    if (valueNew !== valueOld) {
                        if (searchWordTimer) {
                            $timeout.cancel(searchWordTimer);
                        }

                        searchWordTimer = $timeout(_triggerFetchData, 400);
                    }
                }, true);

                /**
                 * Helper function to trigger actual data fetch from backend. This will just check current page
                 * scope variable and if it is 1 call 'fetchData' function right away. Any other case just set
                 * 'currentPage' scope variable to 1, which will trigger watcher to fetch data.
                 *
                 * @private
                 */
                function _triggerFetchData() {
                    if ($scope.currentPage === 1) {
                        _fetchData();
                    } else {
                        $scope.currentPage = 1;
                    }
                }

                /**
                 * Helper function to fetch actual data for GUI from backend server with current parameters:
                 *  1) Current page
                 *  2) Search word
                 *  3) Sort order
                 *  4) Items per page
                 *
                 * Actually this function is doing two request to backend:
                 *  1) Data count by given filter parameters
                 *  2) Actual data fetch for current page with filter parameters
                 *
                 * These are fetched via 'BookModel' service with promises.
                 *
                 * @private
                 */
                function _fetchData() {
                    $scope.loading = true;

                    // Common parameters for count and data query
                    var commonParameters = {
                        where: SocketHelperService.getWhere($scope.filters)
                    };

                    // Data query specified parameters
                    var parameters = {
                        limit: $scope.itemsPerPage,
                        skip: ($scope.currentPage - 1) * $scope.itemsPerPage,
                        sort: $scope.sort.column + ' ' + ($scope.sort.direction ? 'ASC' : 'DESC')
                    };

                    // Fetch data count
                    var count = BookModel
                        .count(commonParameters)
                        .then(
                            function onSuccess(response) {
                                $scope.itemCount = response.count;
                            }
                        );

                    // Fetch actual data
                    var load = BookModel
                        .load(_.merge({}, commonParameters, parameters))
                        .then(
                            function onSuccess(response) {
                                $scope.items = response;
                            }
                        );

                    // Load all needed data
                    $q
                        .all([count, load])
                        .finally(
                            function onFinally() {
                                $scope.loaded = true;
                                $scope.loading = false;
                            }
                        );
                }
            }
        ]);
}());
