(function () {

   var arrDependencies;

   // WidgetCore provides common functions like setting up the widget with the api configuration
   arrDependencies = [
      'widgetCore',
      'widgetCore.translate'
   ];

   (function ($app) {
      'use strict';

      return $app;
   })(angular.module('headToHeadWidget', arrDependencies));
})();

(function () {

   'use strict';

   (function ( $app ) {
      return $app.controller('appController',
         ['$scope', '$controller', '$http', function ( $scope, $controller, $http ) {

            angular.extend(this, $controller('widgetCoreController', {
               '$scope': $scope
            }));

            $scope.defaultArgs = {
               'data_url': 'statistics.json',
               'historyLimit': 6
            };

            $scope.headerHeight = 37;
            $scope.lineHeight = 36;

            $scope.widgetTransitions = false;

            /**
             * Retrieve data from api
             */
            $scope.getStatsData = function () {
               $http({
                  method: 'GET',
                  url: $scope.defaultArgs.data_url
               }).then(function successCallback ( objResponse ) {
                  if ( objResponse.data ) {
                     $scope.data = objResponse.data;

                     $scope.setMeetingsGraph($scope.data.statistics.lastMeetings);

                     // Calculate the number of items in the meetings history
                     var historyCount = ($scope.data.statistics.lastMeetings.slice(0, $scope.args.historyLimit)).length;

                     // Set the height of the widget based on the number of history items
                     $scope.setWidgetHeight($scope.headerHeight + ($scope.lineHeight * (historyCount + 1)));
                  }
               }, function errorCallback ( response ) {
               });
            };

            /**
             * Calculate the totals for circle size
             * @param history_data
             */
            $scope.setHistoryGraph = function ( history_data ) {
               var history_max = Object.keys(history_data).map(function ( key ) {
                  return history_data[key];
               });

               $scope.history_total = $scope.getTotals(history_data);
               $scope.history_max = Math.max.apply(Math, history_max);
            };

            /**
             * Calculate the max from meetings data
             * @param meetings_data
             */
            $scope.setMeetingsGraph = function ( meetings_data ) {
               var meeting_home_max = Math.max.apply(Math, meetings_data.map(function ( obj ) {
                  return obj.homeScore;
               }));
               var meeting_away_max = Math.max.apply(Math, meetings_data.map(function ( obj ) {
                  return obj.awayScore;
               }));
               $scope.meetings_max = Math.max.apply(Math, [meeting_home_max, meeting_away_max]);
            };

            /**
             * Set performance graphs
             * @param performance_data
             */
            $scope.setPerformanceGraph = function ( performance_data ) {
               $scope.performance_total = 20 * performance_data['homeTeam'].length; // A wild assumption for mock data
               $scope.performance_home_total = $scope.getTotals(performance_data['homeTeam'], 'points');
               $scope.performance_away_total = $scope.getTotals(performance_data['awayTeam'], 'points');
            };

            /**
             * Set table data
             * @param table
             */
            $scope.setTable = function ( table ) {
               $scope.columnLabels = table.columnLabels;
               $scope.leagueTableRows = table.leagueTableRows;
            };

            /**
             * Get total of a given object
             * @param data
             * @returns {number}
             */
            $scope.getTotals = function ( data, data_key ) {
               var total = 0;
               var i = 0;
               var len = data.length;
               if ( typeof data === 'object' ) {
                  len = Object.keys(data).length;
               }
               for ( ; i < len; ++i ) {
                  var key = i;
                  if ( typeof data === 'object' ) {
                     key = Object.keys(data)[i];
                  }
                  var item = data[key];
                  if ( data_key ) {
                     item = item[data_key];
                  }
                  total = total + parseInt(item, 10);
               }
               return total;
            };

            /**
             * Init the controller and get the poll data based on the event id
             */
            $scope.init().then(function () {
               $scope.getStatsData();
            });

         }]);
   })(angular.module('headToHeadWidget'));
})();
