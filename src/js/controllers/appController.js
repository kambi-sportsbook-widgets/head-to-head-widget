(function () {

   'use strict';

   (function ( $app ) {
      return $app.controller('appController',
         ['$scope', '$controller', '$http', '$localStorage', 'kambiAPIService', 'kambiWidgetService',
         function ( $scope, $controller, $http, $localStorage, kambiAPIService, kambiWidgetService ) {

            angular.extend(this, $controller('widgetCoreController', {
               '$scope': $scope
            }));

            $scope.defaultArgs = {
               'poll_api_url': 'http://127.0.0.1:3000/api'
            };

            /**
             * Keep the height to 0 until we get data
             * @type {number}
             */
            $scope.defaultHeight = 0;


            /**
             * Listener for page:info, we get here the event id from pageParam
             */
            $scope.$on('PAGE:INFO', function(e, data) {
               $scope.defaultArgs.poll_group_id = parseInt(data.pageParam);
            });

            /**
             * Retrieve and assign to scope the group name
             * @param groupId
             * @returns {*}
             */
            $scope.getGroupName = function ( groupId ) {
               return kambiAPIService.getGroupById(groupId).then(function ( response ) {
                  $scope.groupName = response.data.group.name;
               }, function ( response ) {
                  console.warn('Failed to fetch group: ' + groupId);
               });
            };

            /**
             * Request the page info in order to obtain the event id
             */
            kambiWidgetService.requestPageInfo();

            /**
             * Init the controller and get the poll data based on the event id
             */
            $scope.init().then(function () {
               $scope.getPoll($scope.defaultArgs.poll_group_id);
            });
         }]);
   })(angular.module('headToHeadWidget'));
})();
