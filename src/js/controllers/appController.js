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
            };

            /**
             * Keep the height to 0 until we get data
             * @type {number}
             */
            $scope.defaultHeight = 450;

            /**
             * Listener for page:info, we get here the event id from pageParam
             */
            $scope.$on('PAGE:INFO', function(e, data) {
            });

            /**
             * Request the page info in order to obtain the event id
             */
            kambiWidgetService.requestPageInfo();

            /**
             * Init the controller and get the poll data based on the event id
             */
            $scope.init().then(function () {

            });
         }]);
   })(angular.module('headToHeadWidget'));
})();
