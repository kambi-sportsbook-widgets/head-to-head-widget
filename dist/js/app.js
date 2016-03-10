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

   (function ($app) {
      return $app.controller('appController',
         ['$scope', '$controller', '$http', 'kambiAPIService', 'kambiWidgetService', '$timeout',
            function ($scope, $controller, $http, kambiAPIService, kambiWidgetService, $timeout) {

               angular.extend(this, $controller('widgetCoreController', {
                  '$scope': $scope
               }));

               $scope.defaultArgs = {
                  'data_url': 'statistics.json',
                  'history_height': 0.15,
                  'enabled': {
                     'history': true,
                     'performance': true,
                     'leagueTable': true,
                     'meetings': true
                  }
               };

               /**
                * Keep the height to 0 until we get data
                * @type {number}
                */
               $scope.defaultHeight = 37 + 36 * 6;

               // Percentage of the Widget height minus the header
               $scope.circle_height = ($scope.defaultHeight - 40) * $scope.defaultArgs.history_height;

               /**
                * Retrieve data from api
                */
               $scope.getStatsData = function () {
                  $http({
                     method: 'GET',
                     url: $scope.defaultArgs.data_url
                  }).then(function successCallback (objResponse) {
                     if (objResponse.data) {
                        $scope.data = objResponse.data;

                        $scope.setHistoryGraph($scope.data.statistics.history);

                        // Applied a small delay for nice animation effect
                        $timeout(function () {
                           $scope.setMeetingsGraph($scope.data.statistics.lastMeetings);
                        }, 100);

                        // Applied a small delay for nice animation effect
                        $timeout(function () {
                           $scope.setPerformanceGraph($scope.data.statistics.performance);
                        }, 300);

                        // Applied a small delay for nice animation effect
                        $timeout(function () {
                           $scope.setTable($scope.data.statistics.leagueTable);
                        }, 300);
                     }
                  }, function errorCallback (response) {
                  });
               };

               /**
                * Calculate the totals for circle size
                * @param history_data
                */
               $scope.setHistoryGraph = function (history_data) {
                  var history_max = Object.keys(history_data).map(function (key) {
                     return history_data[key];
                  });

                  $scope.history_total = $scope.getTotals(history_data);
                  $scope.history_max = Math.max.apply(Math, history_max);
               };

               /**
                * Calculate the max from meetings data
                * @param meetings_data
                */
               $scope.setMeetingsGraph = function (meetings_data) {
                  var meeting_home_max = Math.max.apply(Math, meetings_data.map(function (obj) {
                     return obj.homeScore;
                  }));
                  var meeting_away_max = Math.max.apply(Math, meetings_data.map(function (obj) {
                     return obj.awayScore;
                  }));
                  $scope.meetings_max = Math.max.apply(Math, [meeting_home_max, meeting_away_max]);
               };

               /**
                * Set performance graphs
                * @param performance_data
                */
               $scope.setPerformanceGraph = function (performance_data) {
                  $scope.performance_total = 20 * performance_data['homeTeam'].length; // A wild assumption for mock data
                  $scope.performance_home_total = $scope.getTotals(performance_data['homeTeam'], 'points');
                  $scope.performance_away_total = $scope.getTotals(performance_data['awayTeam'], 'points');
               };

               /**
                * Set table data
                * @param table
                */
               $scope.setTable = function (table) {
                  $scope.columnLabels = table.columnLabels;
                  $scope.leagueTableRows = table.leagueTableRows;
               };

               /**
                * Get total of a given object
                * @param data
                * @returns {number}
                */
               $scope.getTotals = function (data, data_key) {
                  var total = 0;
                  var i = 0;
                  var len = data.length;
                  if (typeof data === 'object') {
                     len = Object.keys(data).length;
                  }
                  for (; i < len; ++i) {
                     var key = i;
                     if (typeof data === 'object') {
                        key = Object.keys(data)[i];
                     }
                     var item = data[key];
                     if (data_key) {
                        item = item[data_key];
                     }
                     total = total + parseInt(item, 10);
                  }
                  return total;
               };

               /**
                * Listener for page:info, we get here the event id from pageParam
                */
               $scope.$on('PAGE:INFO', function (e, data) {
               });

               /**
                * Request the page info in order to obtain the event id
                */
               kambiWidgetService.requestPageInfo();

               /**
                * Init the controller and get the poll data based on the event id
                */
               $scope.init().then(function () {
                  $scope.getStatsData();
               });

            }]);
   })(angular.module('headToHeadWidget'));
})();
