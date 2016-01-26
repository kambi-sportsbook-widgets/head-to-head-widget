(function () {

   var arrDependencies;

   // widgetCore provides common functions like setting up the widget with the api configuration
   arrDependencies = [
      'widgetCore',
      'widgetCore.translate',
      'ngStorage',
      'ngAnimate'
   ];

   (function ( $app ) {
      'use strict';

      return $app;
   })(angular.module('headToHeadWidget', arrDependencies));
})();

(function () {

   'use strict';

   (function ( $app ) {
      return $app.controller('appController',
         ['$scope', '$controller', '$http', '$localStorage', 'kambiAPIService', 'kambiWidgetService', '$timeout',
            function ( $scope, $controller, $http, $localStorage, kambiAPIService, kambiWidgetService, $timeout ) {

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
               $scope.defaultHeight = 700;

               // percentage of the Widget height minus the header
               $scope.circle_height = ($scope.defaultHeight - 40) * $scope.defaultArgs.history_height;

               /**
                * Retrieve data from api
                */
               $scope.getStatsData = function () {
                  $http({
                     method: 'GET',
                     url: $scope.defaultArgs.data_url
                  }).then(function successCallback( objResponse ) {
                     if ( objResponse.data ) {
                        $scope.data = objResponse.data;

                        $scope.setHistoryGraph($scope.data.statistics.history);

                        // Applied a small delay for nice animation effect
                        $timeout(function() {
                           $scope.setMeetingsGraph($scope.data.statistics.lastMeetings);
                        }, 100);

                        // Applied a small delay for nice animation effect
                        $timeout(function() {
                           $scope.setPerformanceGraph($scope.data.statistics.performance);
                        }, 300);

                        // Applied a small delay for nice animation effect
                        $timeout(function() {
                           $scope.setTable($scope.data.statistics.leagueTable);
                        }, 300);
                     }
                  }, function errorCallback( response ) {
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
               $scope.setPerformanceGraph = function (  performance_data ) {
                  $scope.performance_total = 20 * performance_data['homeTeam'].length; // a wild assumption for mock data
                  $scope.performance_home_total = $scope.getTotals(performance_data['homeTeam'], 'points');
                  $scope.performance_away_total = $scope.getTotals(performance_data['awayTeam'], 'points');
               };

               /**
                * Set table data
                * @param table
                */
               $scope.setTable = function( table ) {
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
                     if ( data_key ) item = item[data_key];
                     total = total + parseInt(item, 10);
                  }
                  return total;
               };

               /**
                * Listener for page:info, we get here the event id from pageParam
                */
               $scope.$on('PAGE:INFO', function ( e, data ) {
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

/**
 * This controller takes care of the common widget implementations and should be extended by the widgets own controller(s)
 * @author Michael Blom <michael@globalmouth.com>
 */
(function () {

   'use strict';

   /**
    * @ngdoc controller
    * @name widgetCore.controller:widgetCoreController
    * @requires ng.$scope
    * @requires widgetCore.kambiWidgetService
    * @requires widgetCore.kambiAPIService
    * @requires widgetCore.coreUtilsService
    * @requires ng.$q
    * @requires ng.$controller
    * @description
    * This controller takes care of the common widget implementations and should be extended by the widgets own controller(s)
    * @author <michael@globalmouth.com>
    */
   function widgetCoreController( $scope, $widgetService, $apiService, $coreUtilsService, $q, $controller ) {


      /**
       * @ngdoc property
       * @name widgetCore.controller:apiConfigSet
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Flag to indicate that the config parameters are set for the json API service
       * @returns {Boolean} Default false
       * @type {Object}
       */
      $scope.apiConfigSet = false;

      /**
       * @ngdoc property
       * @name widgetCore.controller:appArgsSet
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Flag to indicate that the widget arguments have been received and set
       * @returns {Boolean} Default false
       */
      $scope.appArgsSet = false;

      /**
       * @ngdoc property
       * @name widgetCore.controller:pageInfoSet
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Flag to indicate that the page info have been received and set
       * @returns {Boolean} Default false
       */
      $scope.pageInfoSet = false;

      /**
       * @ngdoc property
       * @name widgetCore.controller:oddsFormat
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description The odds format,
       * @returns {String} Default 'decimal'
       */
      $scope.oddsFormat = 'decimal';

      /**
       * @ngdoc property
       * @name widgetCore.controller:defaultHeight
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Default Widget height, used when resetting the list
       * @returns {Number} Default 350
       */
      $scope.defaultHeight = 350;

      /**
       * @ngdoc property
       * @name widgetCore.controller:currentHeight
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description The actual list of the widget
       * @returns {Number} Default 350
       */
      $scope.currentHeight = 350;

      /**
       * @ngdoc property
       * @name widgetCore.controller:apiVersion
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description What version of the JSON api to use
       * @returns {String} Default 'v2'
       */
      $scope.apiVersion = 'v2';

      /**
       * @ngdoc property
       * @name widgetCore.controller:streamingAllowedForPlayer
       * @propertyOf widgetCore.controller:widgetCoreController
       * @description Flag for allowing streaming
       * @returns {Boolean} Default false
       * @type {Object}
       */
      $scope.streamingAllowedForPlayer = false;

      /**
       * @ngdoc property
       * @name widgetCore.controller:defaultArgs
       * @propertyOf widgetCore.controller:widgetCoreController
       * @returns {Object} Object
       * @type {Object}
       */
      $scope.defaultArgs = {};

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#init
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Sets up the basic configurations and makes the initial requests to the widget API to setup the json and widget api
       * This should be called from the extending controller after the appropriate values are set so that we use those values
       *
       * @returns {Promise} A promise that resolve after the config and args have been set
       */
      $scope.init = function () {
         var initDeferred = $q.defer();

         // Setup a self-removing listener for the CLIENT:CONFIG event
         var clientConfigListener = $scope.$on('CLIENT:CONFIG', function ( event, data ) {
            if ( data.oddsFormat != null ) {
               $scope.setOddsFormat(data.oddsFormat);
            }
            data.version = $scope.apiVersion;

            // Set the configuration in the api Service and then set the flag to indicate that we have done so
            $apiService.setConfig(data);

            $scope.apiConfigSet = true;
            // Check if api configuration, page info and widget args have been received, if so resolve the init promise
            if ( $scope.apiConfigSet && $scope.appArgsSet && $scope.pageInfoSet ) {
               initDeferred.resolve();
            }
            // Remove this listener
            clientConfigListener();
         });

         // Self-removing listener for the WIDGET:ARGS event
         var removeWidgetArgsListener = $scope.$on('WIDGET:ARGS', function ( event, data ) {
            // Set the arguments for the app and then set the flag to indicate that this is done
            $scope.setArgs(data);
            // Set the offering in the API service
            if ( data != null && data.hasOwnProperty('offering') ) {
               $apiService.setOffering(data.offering);
            } else {
               console.warn('No offering has been set, API requests will not work');
            }

            $scope.appArgsSet = true;
            // Check if api configuration, page info and widget args have been received, if so resolve the init promise
            if ( $scope.apiConfigSet && $scope.appArgsSet && $scope.pageInfoSet ) {
               initDeferred.resolve();
            }
            // Remove this listener
            removeWidgetArgsListener();
         });

         // Self-removing listener for the PAGE:INFO event
         var removePageInfoListener = $scope.$on('PAGE:INFO', function ( event, data ) {
            $scope.setPageInfo(data);
            $scope.pageInfoSet = true;
            // Check if api configuration, page info and widget args have been received, if so resolve the init promise
            if ( $scope.apiConfigSet && $scope.appArgsSet && $scope.pageInfoSet ) {
               initDeferred.resolve();
            }

            removePageInfoListener();
         });

         // Set the height of the widget and request the height so we can be sure that we have the correct value from the Sportsbook
         $widgetService.setWidgetHeight($scope.defaultHeight);
         $widgetService.requestWidgetHeight();
         // Enable transitions to make height changes purdy
         $widgetService.enableWidgetTransition(true);

         // Request the client configuration
         $widgetService.requestClientConfig();

         // Request the widget arguments
         $widgetService.requestWidgetArgs();

         // Request the page info
         $widgetService.requestPageInfo();


         // Request the outcomes from the betslip so we can update our widget, this will also sets up a subscription for future betslip updates
         $widgetService.requestBetslipOutcomes();
         // Request the odds format that is set in the sportsbook, this also sets up a subscription for future odds format changes
         $widgetService.requestOddsFormat();

         return initDeferred.promise;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#getConfigValue
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Gets a value from configuration set in the Kambi API Service
       * @param {String} key  The configured property to retrieve
       * @returns {*} The value of the configured property, null if the property is not found
       */
      $scope.getConfigValue = function ( key ) {
         if ( $apiService.config.hasOwnProperty(key) ) {
            return $apiService.config[key];
         } else {
            return null;
         }
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#navigateToLiveEvent
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Navigate to a live event
       * @param {number} eventId Event id
       */
      $scope.navigateToLiveEvent = function ( eventId ) {
         $widgetService.navigateToLiveEvent(eventId);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#getWidgetHeight
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request widget height
       */
      $scope.getWidgetHeight = function () {
         $widgetService.requestWidgetHeight();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setWidgetHeight
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Set the height of the widget
       * @param {number} height Height in pixels
       */
      $scope.setWidgetHeight = function ( height ) {
         $scope.currentHeight = height;
         $widgetService.setWidgetHeight(height);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setWidgetEnableTransition
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Enable or disable CSS3 Transitions
       * @param {boolean} enable Enable transition
       */
      $scope.setWidgetEnableTransition = function ( enable ) {
         $widgetService.enableWidgetTransition(enable);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#removeWidget
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Remove the widget
       */
      $scope.removeWidget = function () {
         $widgetService.removeWidget();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#addOutcomeToBetslip
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Add an outcome to the betslip
       * @param {Object} outcome The outcome object
       */
      $scope.addOutcomeToBetslip = function ( outcome ) {
         $widgetService.addOutcomeToBetslip(outcome.id);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#removeOutcomeFromBetslip
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Remove an outcome from the betslip
       * @param {Object} outcome The outcome object
       */
      $scope.removeOutcomeFromBetslip = function ( outcome ) {
         $widgetService.removeOutcomeFromBetslip(outcome.id);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestBetslipOutcomes
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request the outcomes in the betslip
       */
      $scope.requestBetslipOutcomes = function () {
         $widgetService.requestBetslipOutcomes();
      };


      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestWidgetArgs
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request the widget arguments from the API
       */
      $scope.requestWidgetArgs = function () {
         $widgetService.requestWidgetArgs();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestPageInfo
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request page info from the API
       */
      $scope.requestPageInfo = function () {
         $widgetService.requestPageInfo();
      };


      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#requestOddsFormat
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Request the odds format set on the SportsBook
       */
      $scope.requestOddsFormat = function () {
         $widgetService.requestOddsFormat();
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setOddsFormat
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Set the odds format of the widget
       * @param {String} oddsFormat - Odds format (decimal, american or fractional)
       */
      $scope.setOddsFormat = function ( oddsFormat ) {
         $scope.oddsFormat = oddsFormat;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#getFormattedOdds
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Takes an outcome object and returns the odds format based on the current oddsFormat setting
       * @param {Object} outcome An outcome object
       * @returns {number|String} The odds value for the current format
       */
      $scope.getFormattedOdds = function ( outcome ) {
         switch ( $scope.oddsFormat ) {
            case 'fractional':
               return outcome.oddsFractional;
            case 'american':
               return outcome.oddsAmerican;
            default:
               return outcome.odds / 1000;

         }
      };


      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#multiplyOdds
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Takes an array of outcomes and multiplies them according to the current oddsFormat setting
       * @param {Array.<Object>} outcomes An array of outcome objects
       * @returns {number|String} The combined odds based on the current oddsFormat setting
       */
      $scope.multiplyOdds = function ( outcomes ) {

         var i = 0, result = 1, len = outcomes.length;
         for ( ; i < len; ++i ) {
            result = result * outcomes[i].odds / 1000;
         }
         switch ( $scope.oddsFormat ) {
            case 'american':
               result = Math.round(result * 100) / 100;
               if ( result < 2 ) {
                  result = Math.round(-100 / (result - 1 ));
               } else {
                  result = Math.round((result - 1) * 100);
               }
               break;
            case 'fractional':
               /*
                This is all guesswork and needs to be fixed
                */
               if ( result <= 3 ) {
                  // Odds less than 10 are limited to one decimal
                  //console.debug('Less than 3: ' + result + ' -> ' + $coreUtilsService.roundDown(result, 100));
                  //result = Number(result).toFixed(1);
                  result = $coreUtilsService.roundDown(result, 100);

               } else if ( result <= 10 ) {
                  // Odds less than 10 are limited to one decimal
                  //console.debug('Less than 10: ' + result + ' -> ' + $coreUtilsService.roundDown(result, 10));
                  //result = Number(result).toFixed(1);
                  result = $coreUtilsService.roundDown(result, 10);

               } else if ( result <= 14 ) {
                  //Odd greater than 10 and lower 15 are rounded down to nearest 0.5, Note: 0.76 rounds down to 0.5 not 1
                  //console.debug('Less than 10: ' + result + ' -> ' + $coreUtilsService.roundHalf(result));
                  result = $coreUtilsService.roundHalf(result);

               } else {
                  //Odds greater than 14 are rounded down to nearest integer
                  //console.debug('Greater than 14: ' + result + ' -> ' + Math.floor(result));
                  result = Math.floor(result);
               }
               result = $coreUtilsService.convertToFraction(Number(result - 1).toFixed(2));
               console.debug('Calculated fractional: ' + result.n + '/' + result.d);
               result = result.n + '/' + result.d;
               // Todo: Implement fractional odds
               /*
                For now we'll return nothing
                */
               result = '';
               break;
            default:
               // Decimals are just rounded off to two decimal points
               result = Math.round(result * 100) / 100;
               break;
         }
         return result;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#findEvent
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Iterates over the events and finds the one with the matching id
       * @param {Array.<Object>} events An array of events
       * @param {number} eventId the event id to search for
       * @returns {Object|null} Returns the event if found, otherwise null
       */
      $scope.findEvent = function ( events, eventId ) {
         var i = 0, len = events.length;
         for ( ; i < len; ++i ) {
            if ( events[i].id === eventId ) {
               return events[i];
            }
         }
         return null;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#getOutcomeLabel
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Parses the label based on it's type and the passed event
       * @param {Object} outcome Outcome object
       * @param {Object} event Event object
       */
      $scope.getOutcomeLabel = function ( outcome, event ) {
         return $apiService.getOutcomeLabel(outcome, event);
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setArgs
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Sets the base configuration for the app based on what we get from the WIDGET:ARGS event
       * @param {Object} newArgs Arguments
       */
      $scope.setArgs = function ( newArgs ) {
         var args = $scope.defaultArgs;
         // Iterate over the default arguments, if the property exists in both the data and default arguments, set the value
         for ( var i in newArgs ) {
            if ( newArgs.hasOwnProperty(i) && args.hasOwnProperty(i) ) {
               args[i] = newArgs[i];
            }
         }
         $scope.args = args;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setPageInfo
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * sets the page info for the app based on what we get from the PAGE:INFO event
       * @param {Object} pageInfo Object containing date from the PAGE:INFO event
       */
      $scope.setPageInfo = function ( pageInfo ) {
         // Check if the last character in the pageParam property is a slash, if not add it so we can use this property in filter requests
         if ( pageInfo.pageType === 'filter' && pageInfo.pageParam.substr(-1) !== '/' ) {
            pageInfo.pageParam += '/';
         }


         $scope.pageInfo = pageInfo;
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#setPages
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Sets the pages based on the length of the provided list
       * @param {Array} list  An array of items that are to be paginated
       * @param {number} listLimit  How many items are shown in a page
       * @param {number} [listLength]  The total length of the list, if not passed list.length is used
       */
      $scope.setPages = function ( list, listLimit, listLength ) {
         var eventCount = listLength || list.length;
         var len = Math.ceil(eventCount / listLimit);
         var i = 0;
         $scope.pages = [];
         for ( ; i < len; ++i ) {
            // Set the page number and starting point for easier filtering in the view
            $scope.pages.push({
               startFrom: listLimit * i,
               page: i + 1
            });
         }
      };

      /**
       * @ngdoc method
       * @name widgetCore.controller:widgetCoreController#updateBetOfferOutcomes
       * @methodOf widgetCore.controller:widgetCoreController
       * @description
       * Updates the bet offer with new odds and flags the outcomes as selected if they are found
       * @param {Object} betOffer The betoffer to be updated
       * @param {Array.<Object>} outcomes The outcomes to update the bet offer data with
       */
      $scope.updateBetOfferOutcomes = function ( betOffer, outcomes ) {
         var i = 0, eventOutcomesLen = betOffer.outcomes.length, outcomesLen = outcomes.length;
         for ( ; i < eventOutcomesLen; ++i ) {
            var j = 0;
            var foundIndex = -1;
            betOffer.outcomes[i].selected = false;
            for ( ; j < outcomesLen; j++ ) {
               if ( betOffer.outcomes[i].id === outcomes[j].id ) {
                  betOffer.outcomes[i].odds = outcomes[j].odds;
                  foundIndex = i;
               }

               if ( foundIndex !== -1 ) {
                  betOffer.outcomes[foundIndex].selected = true;
               }
            }
         }
      };

      // We check if the translate module is loaded, if it is we extend this controller with it
      // This will provide translations automatically without the need to do anything in the widget
      try {
         angular.module('widgetCore.translate'); // Will throw an error if the module is not loaded
         // Extend this controller with the translate controller
         angular.extend(widgetCoreController, $controller('translateController', {
               '$scope': $scope
            })
         );
      } catch ( e ) {
         // The translate controller is not loaded, don't do anything
         console.log('widgetCore.translate not loaded');
      }

      // Add a listener for the WIDGET:HEIGHT event and update the current height
      $scope.$on('WIDGET:HEIGHT', function ( event, height ) {
         $scope.currentHeight = height;
      });

      // Add a listener for the odds format change, set the format and call $apply() to force an update in the view
      $scope.$on('ODDS:FORMAT', function ( event, format ) {
         $scope.setOddsFormat(format);
         $scope.$apply();
      });
   }

   (function ( $app ) {
      return $app.controller('widgetCoreController', ['$scope', 'kambiWidgetService', 'kambiAPIService', 'coreUtilsService', '$q', '$controller',
         widgetCoreController]);
   })(angular.module('widgetCore', []));

})();

/**
 * A pagination directive used for client-side pagination
 */
(function () {

   'use strict';

   /**
    * @ngdoc directive
    * @name widgetCore.directive:kambiPaginationDirective
    * @description
    * A pagination directive used for client-side pagination
    * @restrict E
    * @scope    *
    * @author teo@globalmouth.com
    */
   (function ( $app ) {
      return $app.directive('kambiPaginationDirective', [function () {

         return {
            restrict: 'E',
            scope: {
               'list': '=list',
               'listLimit': '=',
               'pages': '=',
               'startFrom': '=',
               'activePage': '='
            },
            template: '<span ng-class="{disabled:activePage === 1}" ng-if="pages.length > 1" ng-click="pagePrev()" class="kw-page-link kw-pagination-arrow">' +
            '<i class="ion-ios-arrow-left"></i></span>' +
            '<span ng-if="pages.length > 1" ng-repeat="page in getPagination()" ng-click="setActivePage(page)" ng-class="{active:page === activePage}" ' +
            'class="kw-page-link l-pack-center l-align-center">{{page}}</span>' +
            '<span ng-class="{disabled:activePage === pages.length}" ng-if="pages.length > 1" ng-click="pageNext()" class="kw-page-link kw-pagination-arrow">' +
            '<i class="ion-ios-arrow-right"></i></span>',
            controller: ['$scope', function ( $scope ) {

               /**
                * @name widgetCore.directive:kambiPaginationDirective#activePage
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Default active page
                * @type {number} Default active page
                */
               $scope.activePage = 1;

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#setPage
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the page
                * @param {Object} page Page object
                * @param {Integer} page.startFrom Display page starting with this index
                * @param {Object} page.page Page object
                */
               $scope.setPage = function ( page ) {
                  $scope.startFrom = page.startFrom;
                  $scope.activePage = page.page;
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#setActivePage
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the current page. Takes in an integer, the index in array
                * @param {Integer} page Page index
                */
               $scope.setActivePage = function ( page ) {
                  $scope.setPage($scope.pages[page - 1]);
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#pagePrev
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the page to the previous one, if it's not already at the first page
                */
               $scope.pagePrev = function () {
                  if ( $scope.activePage > 1 ) {
                     $scope.setPage($scope.pages[$scope.activePage - 2]);
                  }
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#pageNext
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Sets the page to the next one, if it's not already at the last page
                */
               $scope.pageNext = function () {
                  if ( $scope.activePage < $scope.pages.length ) {
                     $scope.setPage($scope.pages[$scope.activePage]);
                  }
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#pageCount
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Get the pagination amount of items based on liveevent and list limit
                * @returns {Number} Returns the page count
                */
               $scope.pageCount = function () {
                  return Math.ceil($scope.list.length / $scope.listLimit);
               };

               /**
                * @ngdoc method
                * @name widgetCore.directive:kambiPaginationDirective#getPagination
                * @methodOf widgetCore.directive:kambiPaginationDirective
                * @description
                * Get the pagination items.
                * @returns {Array} An array with the pagination items, used in ng-repeat
                */
               $scope.getPagination = function () {
                  var paginationItems = [],
                     paginationLimit = 5,
                     activePage = $scope.activePage,
                     pageCount = $scope.pageCount();

                  var startPage = 1, endPage = pageCount;

                  if ( paginationLimit < pageCount ) {
                     // Keep active page in middle by adjusting start and end
                     startPage = Math.max(activePage - Math.floor(paginationLimit / 2), 1);
                     endPage = startPage + paginationLimit - 1;

                     // Shift the list start and end
                     if ( endPage > pageCount ) {
                        endPage = pageCount;
                        startPage = endPage - paginationLimit + 1;
                     }
                  }

                  // Add page number links
                  for ( var i = startPage; i <= endPage; i++ ) {
                     paginationItems.push(i);
                  }

                  //Return to first page if activePage is beyond the pagecount. Useful when pagecount changes due to filtering.
                  if ( pageCount !== 0 && activePage > pageCount) {
                     $scope.setActivePage(1);
                  }

                  return paginationItems;
               };
            }]
         };
      }]);
   })(angular.module('widgetCore'));

})();

/**
 * A simple filter to start an ng-repeat at an offset
 */
(function () {
   (function ( $app ) {

      'use strict';

      /**
       * @ngdoc filter
       * @name widgetCore.filter:startFrom
       * @kind function
       * @description
       * A simple filter to start an ng-repeat at an offset
       * @author michael@globalmouth.com
       */
      $app.filter('startFrom', function () {
         return function ( input, start ) {
            if ( input ) {
               start = +start; //parse to int
               return input.slice(start);
            }
            return [];
         };
      });
   })(angular.module('widgetCore'));

})();


(function () {

   'use strict';

   (function ( $app ) {

      /**
       * @ngdoc service
       * @name widgetCore.coreUtilsService
       * @description
       * Service that provides some utility methods
       */
      return $app.service('coreUtilsService', [function () {
         var coreUtilsService = {};

         /**
          * @ngdoc overview
          * @name widgetCore.coreUtilsService#roundHalf
          * @methodOf widgetCore.coreUtilsService
          * @description
          * Rounds down a number to it's nearest multiple of 0.5
          * @param {number} num The number to round down
          * @returns {number} Returns a number
          */
         coreUtilsService.roundHalf = function ( num ) {
            return Math.floor(num * 2) / 2;
         };

         /**
          * @ngdoc overview
          * @name widgetCore.coreUtilsService#roundDown
          * @methodOf widgetCore.coreUtilsService
          * @description
          * Rounds down a number based on the specified divider
          * @param {number} num The number to round down
          * @param {number} divider The divider to use, 2 will round down to nearest 0.5 value. 4 down to nearest 0.25 etc.
          * @returns {number} Returns a number
          */
         coreUtilsService.roundDown = function(num, divider) {
            return Math.floor(num * divider) / divider;
         };

         /**
          * @ngdoc overview
          * @name widgetCore.coreUtilsService#convertToFraction
          * @methodOf widgetCore.coreUtilsService
          * @description
          * Converts a number to an object describing a fraction
          * @param {number} fraction The number to convert
          * @returns {number} An object containing the numerator and denumerator - {n: number, d: number}
          */
         coreUtilsService.convertToFraction = function ( fraction ) {
            var len = fraction.toString().length - 2;

            var denominator = Math.pow(10, len);
            var numerator = fraction * denominator;

            var divisor = coreUtilsService.gcd(numerator, denominator);

            numerator /= divisor;
            denominator /= divisor;

            return {
               n: numerator,
               d: denominator
            };
         };

         /**
          * @ngdoc overview
          * @name widgetCore.coreUtilsService#gcd
          * @methodOf widgetCore.coreUtilsService
          * @description
          * Finds the greatest common denominator based on a numerator and denominator
          * @param {number} a The numerator
          * @param {number} b The denominator
          * @returns {number} Returns a number
          */
         coreUtilsService.gcd = function ( a, b ) {
            if ( b < 0.0000001 ) {
               return a;
            }

            return coreUtilsService.gcd(b, Math.floor(a % b));
         };

         return coreUtilsService;
      }]);
   })(angular.module('widgetCore'));
})();

(function () {

   'use strict';

   (function ( $app ) {

      /**
       * @ngdoc service
       * @name widgetCore.kambiAPIService
       * @requires ng.$http
       * @requires ng.$q
       * @description
       * Service that integrates the Kambi Sportsbook JSON API
       */
      return $app.service('kambiAPIService', ['$http', '$q', '$rootScope', function ( $http, $q, $rootScope ) {
         var kambiAPIService = {};

         /**
          * Specify what configuration properties will be available to set
          * @type {{apiBaseUrl: null, channelId: null, currency: null, locale: null, market: null, offering: null, clientId: null, version: string}}
          */
         kambiAPIService.configDefer = $q.defer();
         kambiAPIService.configSet = false;
         kambiAPIService.offeringSet = false;

         kambiAPIService.config = {
            apiBaseUrl: null,
            apiUrl: null,
            channelId: null,
            currency: null,
            locale: null,
            market: null,
            offering: null,
            clientId: null,
            version: null
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#setConfig
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Set the configuration of the API service, these settings are provided by the widget API
          * Only settings that correspond to the kambiAPIService.config properties will be set
          * @param {Object} config An object with configuration parameters
          */
         kambiAPIService.setConfig = function ( config ) {
            // Iterate over the passed object properties, if the exist in the predefined config object then we set them
            for ( var i in config ) {
               if ( config.hasOwnProperty(i) && kambiAPIService.config.hasOwnProperty(i) ) {
                  kambiAPIService.config[i] = config[i];
                  switch ( i ) {
                     case 'locale':
                        $rootScope.$broadcast('LOCALE:CHANGE', config[i]);
                        break;
                  }
               }
            }
            kambiAPIService.configSet = true;
            if ( kambiAPIService.configSet && kambiAPIService.offeringSet ) {
               kambiAPIService.configDefer.resolve();
            }
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#setOffering
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Set the offering in the configuration
          * We will normally get this from the Widget Args and not the Client config, so it gets its own method
          * @param {String} offering Offering string
          *
          */
         kambiAPIService.setOffering = function ( offering ) {
            kambiAPIService.config.offering = offering;
            kambiAPIService.offeringSet = true;
            if ( kambiAPIService.configSet && kambiAPIService.offeringSet ) {
               kambiAPIService.configDefer.resolve();
            }
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getGroupEvents
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the events for a specific group
          * @param {number} groupId The group Id
          * @returns {Promise} Returns a promise
          */
         kambiAPIService.getGroupEvents = function ( groupId ) {
            var requesPath = '/event/group/' + groupId + '.json';
            return kambiAPIService.doRequest(requesPath);
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getEventsByFilterParameters
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the events based on the provided filter parameters
          * @param {Array.<String>|String} sports An array of strings or a string (comma separated) containing the sports to filter
          * @param {Array.<String>|Array.<Array.<String>>|String} regions An array of arrays, strings or a single string (comma separated)
          * containing the regions to filter
          * @param {Array.<String>|Array.<Array.<String>>|String} leagues An array of arrays, strings or a single string (comma separated)
          * containing the leagues to filter
          * @param {Object|Array.<String>} participants Participants, undocumented
          * @param {Array.<String>|String} attributes An array of strings or a single string (comma separated) containing the attributes to filter
          * @param {Object} params An object containing the parameters to pass in the request
          * @returns {Promise} Returns a promise
          */
         kambiAPIService.getEventsByFilterParameters = function ( sports, regions, leagues, participants, attributes, params ) {
            // Todo: Update this method once documentation is available
            var requestPath = '/listView/';

            // Sports
            if ( sports != null ) {
               requestPath += kambiAPIService.parseFilterParameter(sports);
            } else {
               requestPath += 'all/';
            }

            //Regions
            if ( regions != null ) {
               requestPath += kambiAPIService.parseFilterParameter(regions);
            } else {
               requestPath += 'all/';
            }

            //Leagues
            if ( leagues != null ) {
               requestPath += kambiAPIService.parseFilterParameter(leagues);
            } else {
               requestPath += 'all/';
            }

            //Participants
            // Todo: implement participants once there is documentation for it
            requestPath = requestPath + 'all/';

            if ( attributes != null ) {
               requestPath += kambiAPIService.parseFilterParameter(sports);
            } else {
               requestPath += 'all/';
            }

            return kambiAPIService.doRequest(requestPath, params, 'v3');
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#parseFilterParameter
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Parses filter parameters that can either be 2-level arrays, flat arrays or a string
          * @param {Array.<String>} filter Filter array
          * @returns {string} Returns a string
          */
         kambiAPIService.parseFilterParameter = function ( filter ) {
            var requestPath = '';
            if ( filter != null ) {
               if ( angular.isArray(filter) ) {
                  var i = 0, filterLen = filter.length;
                  for ( ; i < filterLen; ++i ) {
                     if ( angular.isArray(filter[i]) ) {
                        var j = 0, innerLen = filter[i].length;
                        requestPath += '[';
                        for ( ; j < innerLen; ++j ) {
                           requestPath += filter[i][j];
                           if ( j < innerLen - 1 ) {
                              requestPath += ',';
                           }
                        }
                        requestPath += ']';
                     } else {
                        requestPath += filter[i];
                     }
                     if ( i < filterLen - 1 ) {
                        requestPath += ',';
                     }
                  }
                  requestPath += '/';
               } else if ( angular.isstring(filter) ) {
                  requestPath = requestPath + filter;
               }
            } else {
               requestPath += 'all/';
            }

            return requestPath;
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getEventsByFilter
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the events based on the provided filter string
          * @param {String} filter A preformatted filter string
          * @param {Object} params An object containing the parameters to pass in the request
          * @returns {Promise} Returns a promise
          */
         kambiAPIService.getEventsByFilter = function ( filter, params ) {
            // Todo: Update this method once documentation is available
            var requestPath = '/listView/' + filter;
            return kambiAPIService.doRequest(requestPath, params, 'v3');
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getLiveEventsByFilter
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches and restructures the live events by filter, returns a promise
          * @param {String} filter A preformatted filter string
          * @param {Object} params An object containing the parameters to pass in the request
          * @returns {Promise} Promise
          */
         kambiAPIService.getLiveEventsByFilter = function ( filter, params ) {
            var requestPath = '/listView/' + filter;
            return kambiAPIService.doRequest(requestPath, params, 'v3').then(function ( responce ) {
               var liveEvents = responce.data.events;
               //Itterate through the events to change structure of mainBetOffer and remove the non live events
               for ( var i in liveEvents ) {
                  //Check if the event is live and restructure object
                  if ( liveEvents[i].liveData ) {
                     //Add mainBetOffer
                     if ( liveEvents[i].betOffers[0] ) {
                        liveEvents[i].mainBetOffer = liveEvents[i].betOffers[0];
                     }
                     if ( liveEvents[i].liveData.statistics ) {
                        //Add sets statistics
                        if ( liveEvents[i].liveData.statistics.setBasedStats ) {
                           var sets = liveEvents[i].liveData.statistics.setBasedStats;
                           liveEvents[i].liveData.statistics.sets = sets;
                           delete liveEvents[i].liveData.statistics.setBasedStats;
                        }
                        //Add football statistics
                        if ( liveEvents[i].liveData.statistics.footballStats) {
                           var football = liveEvents[i].liveData.statistics.footballStats;
                           liveEvents[i].liveData.statistics.football = football;
                           delete liveEvents[i].liveData.statistics.footballStats;
                        }
                     }
                     delete liveEvents[i].betOffers;
                  } else {
                     break;
                  }
               }
               liveEvents.splice(i);
               responce.data.liveEvents = liveEvents;
               delete responce.data.events;
               return responce;
            });
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getLiveEvents
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the live events, returns a promise
          * @returns {Promise} Promise
          */
         kambiAPIService.getLiveEvents = function () {
            var requestPath = '/event/live/open.json';
            return kambiAPIService.doRequest(requestPath);
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getBetoffersByGroup
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the prematch bet offers for a specific group or list of groups
          * @param {number|Array.<number>} groupId The group id or list of group ids to get offers from
          * @param {number} [type] The bet offer type identifier
          * @param {String} [market] The geographical market
          * @param {String} [start] Starting date/time, restricts the result to events close to this date. ISO-8601
          * @param {number} [interval] The interval in minutes to include results, counting from start. Unlimited if not set
          * @returns {Promise} Promise
          */
         kambiAPIService.getBetoffersByGroup = function ( groupId, type, market, start, interval ) {
            var requestPath = '/betoffer/main/group/' + groupId + '.json';
            return kambiAPIService.doRequest(requestPath, {
               'include': 'participants'
            });
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getGroupById
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Fetches the specified group based on the id and it's contained groups, limited by depth
          * @param {number} groupId The id of the group to fetch
          * @param {number} depth The limiting depth of the contained groups
          * @returns {Promise} Promise
          */
         kambiAPIService.getGroupById = function ( groupId, depth ) {
            var requestPath = '/group/' + groupId + '.json';
            return kambiAPIService.doRequest(requestPath, {
               depth: depth
            });
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#doRequest
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Core method for calling the API, returns a promise
          * @param {string} requestPath The path to the request, following the offering id
          * @param {params} [params] parameters An object containing additional parameters to pass in the request
          * @param {version} [version] A string with the api version to call, defaults to the configured version
          * @returns {Promise} Promise
          */
         kambiAPIService.doRequest = function ( requestPath, params, version ) {
            return kambiAPIService.configDefer.promise.then(function () {
               if ( kambiAPIService.config.offering == null ) {
                  return $q.reject('The offering has not been set, please provide it in the widget arguments');
               } else {
                  var apiUrl = kambiAPIService.config.apiBaseUrl.replace('{apiVersion}', (version != null ? version : kambiAPIService.config.version));
                  var requestUrl = apiUrl + kambiAPIService.config.offering + requestPath;
                  var overrideParams = params || {};
                  var requestParams = {
                     lang: overrideParams.locale || kambiAPIService.config.locale,
                     market: overrideParams.market || kambiAPIService.config.market,
                     client_id: overrideParams.clientId || kambiAPIService.config.clientId,
                     include: overrideParams.include || null,
                     callback: 'JSON_CALLBACK'
                  };
                  return $http.jsonp(requestUrl, {
                     params: requestParams,
                     cache: false
                  });
               }
            });
         };

         /**
          * @ngdoc overview
          * @name widgetCore.kambiAPIService#getOutcomeLabel
          * @methodOf widgetCore.kambiAPIService
          * @description
          * Parses the label based on it's type and the passed event
          * @param {Object} outcome Outcome object
          * @param {Object} event Event object
          */
         kambiAPIService.getOutcomeLabel = function ( outcome, event ) {
            switch ( outcome.type ) {
               case 'OT_ONE': //Outcome has label 1. Applies to Threeway bet offers.
                  return event.homeName;
               case 'OT_CROSS': //Outcome has label X. Applies to Threeway bet offers.
                  // Todo: Translation
                  return 'Draw';
               case 'OT_TWO': //Outcome has label 2. Applies to Threeway bet offers.
                  return event.awayName;
               // Todo: Impelement these responses with translations

               //case 'OT_OVER': //The “Over” outcome in Over/Under bet offer.
               //break;
               //case 'OT_UNDER': //The “Under” outcome in Over/Under bet offer.
               //break;
               //case 'OT_ODD': //The “Odd” outcome in Odd/Even bet offer.
               //break;
               //case 'OT_EVEN': //The “Even” outcome in Odd/Even bet offer.
               //break;
               //case 'OT_ONE_ONE': //1-1 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_ONE_TWO': //1-2 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_ONE_CROSS': //1-X outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_TWO_ONE': //2-1 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_TWO_TWO': //2-2 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_TWO_CROSS': //2-X outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_CROSS_ONE': //X-1 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_CROSS_TWO': //X-2 outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_CROSS_CROSS': //X-X outcome in Halftime/fulltime bet offer.
               //break;
               //case 'OT_ONE_OR_TWO': //1 or 2 outcome in Double Chance bet offer.
               //break;
               //case 'OT_ONE_OR_CROSS': //1 or X outcome in Double Chance bet offer.
               //break;
               //case 'OT_CROSS_OR_TWO': //X or 2 outcome in Double Chance bet offer.
               //break;
               //case 'OT_YES': //“Yes” outcome in Head To Head and Yes/No bet offer.
               //break;
               //case 'OT_NO': //“No” outcome in Head To Head and Yes/No bet offer.
               //break;
               //case 'OT_OTHER': //“Other results” outcome in Result bet offer.
               //break;
               //case 'OT_UNTYPED': //Outcome does not have type.
               //break;
               //case 'OT_WC_HOME': //Outcome has label Home Win. Applies to WinCast bet offers.
               //break;
               //case 'OT_WC_DRAW': //Outcome has label Draw. Applies to WinCast bet offers.
               //break;
               //case 'OT_WC_AWAY': //Outcome has label Away Win. Applies to WinCast bet offers.
               //break;

               default:
                  console.warn('Unhandled outcome type: ' + outcome.type, outcome);
                  return outcome.label;
            }
         };

         return kambiAPIService;
      }]);
   })(angular.module('widgetCore'));
})();

/**
 * Service that implements the Kambi Widget API
 * Requests that call the widget API are all deferred so that the we ensure that the API is loaded when trying to call it
 * @author michael@globalmouth.com
 */
(function () {

   'use strict';

   (function ( $app ) {

      /**
       * @ngdoc service
       * @name widgetCore.kambiWidgetService
       * @requires ng.$rootScope
       * @requires ng.$window
       * @requires ng.$q
       * @description
       * Service that implements the Kambi Widget API
       * Requests that call the widget API are all deferred so that the we ensure that the API is loaded when trying to call it
       * @author michael@globalmouth.com
       */
      return $app.service('kambiWidgetService', ['$rootScope', '$window', '$q', function ( $rootScope, $window, $q ) {
         var kambiWidgetService = {}, KWpromise, KWdefer;


         //Setup the Kambi Widget API
         //To ensure that the API is loaded we set up a promise to resolve once the apiReady callback has fired

         if ( $window.KambiWidget ) {
            KWdefer = $q.defer();
            KWpromise = KWdefer.promise;

            $window.KambiWidget.apiReady = function ( api ) {
               kambiWidgetService.api = api;
               KWdefer.resolve(api);
            };
            $window.KambiWidget.receiveResponse = function ( dataObject ) {
               kambiWidgetService.handleResponse(dataObject);
            };
         } else {
            console.warn('Kambi widget api not loaded');
         }


         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#handleResponse
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Handle responses from the Kambi widget API
          * This should only be triggered from the Widget API, so there is nothing to return here
          * @param {Object} response the object has the parameters type and data
          * @param {String} response.type the type of the response
          * @param {*} response.data the response data
          */
         kambiWidgetService.handleResponse = function ( response ) {
            switch ( response.type ) {
               case  kambiWidgetService.api.WIDGET_HEIGHT:
                  // We've received a height response
                  $rootScope.$broadcast('WIDGET:HEIGHT', response.data);
                  break;
               case kambiWidgetService.api.BETSLIP_OUTCOMES:
                  // We've received a response with the outcomes currently in the betslip
                  $rootScope.$broadcast('OUTCOMES:UPDATE', response.data);
                  break;
               case kambiWidgetService.api.WIDGET_ARGS:
                  // We've received a response with the arguments set in the
                  $rootScope.$broadcast('WIDGET:ARGS', response.data);
                  break;
               case kambiWidgetService.api.PAGE_INFO:
                  // Received page info response
                  $rootScope.$broadcast('PAGE:INFO', response.data);
                  break;
               case kambiWidgetService.api.CLIENT_ODDS_FORMAT:
                  // Received odds format response
                  $rootScope.$broadcast('ODDS:FORMAT', response.data);
                  break;
               case kambiWidgetService.api.CLIENT_CONFIG:
                  $rootScope.$broadcast('CLIENT:CONFIG', response.data);
                  break;
               case kambiWidgetService.api.USER_LOGGED_IN:
                  console.debug('User logged in', response.data);
                  $rootScope.$broadcast('USER:LOGGED_IN', response.data);
                  break;
               default:
                  // Unahdled response
                  console.info('Unhandled response type: ' + response.type);
                  console.info(response);
                  break;
            }
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestWidgetHeight
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the height setting of the widget from the Sportsbook
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestWidgetHeight = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.WIDGET_HEIGHT);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#setWidgetHeight
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Uses the Kambi Widget API to set the height of the widgets iframe
          * @param {number} height the height to set the iframe to
          * @returns {Promise} Promise
          */
         kambiWidgetService.setWidgetHeight = function ( height ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.set(api.WIDGET_HEIGHT, height);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#enableWidgetTransition
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Uses the Kambi Widget API to enable or disable CSS3 Transitions, which will animate the widget iframe when it's resized or removed
          * @param   {boolean} enableTransition Set true to enable transition
          * @returns {Promise} Promise
          */
         kambiWidgetService.enableWidgetTransition = function ( enableTransition ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               if ( enableTransition ) {
                  api.set(api.WIDGET_ENABLE_TRANSITION);
               } else {
                  api.set(api.WIDGET_DISABLE_TRANSITION);
               }
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#removeWidget
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Removes the widgets iframe from the parent window
          * @returns {Promise} Promise
          */
         kambiWidgetService.removeWidget = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.remove();
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToLiveEvent
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates the Sportsbook to a live event
          * @param {number} eventId the id of the live event
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToLiveEvent = function ( eventId ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#event/live/' + eventId);
            });
            return deferred.promise;

         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToEvent
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates the Sportsbook to a pre-live event
          * @param {number} eventId the id of the pre-live event
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToEvent = function ( eventId ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#event/' + eventId);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToGroup
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates te Sportsbook to a specific group
          * @param {number} groupId the id of the group
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToGroup = function ( groupId ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#group/' + groupId);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#navigateToLiveEvents
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Navigates the Sportsbook to a listing of all live events
          * @returns {Promise} Promise
          */
         kambiWidgetService.navigateToLiveEvents = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.navigateClient('#events/live');
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#addOutcomeToBetslip
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Adds one or more outcomes to the betslip
          * @param {number|Array} outcomes An id of an outcome, or an array of outcome ids
          * @param {number|Array} [stakes] A stake or an array of stakes corresponding to the outcomes
          * @param {String} [updateMode=replace] The update mode, 'append' or 'replace'
          * @param {String} [source] Optional campaign code
          * @returns {Promise} Promise
          */
         kambiWidgetService.addOutcomeToBetslip = function ( outcomes, stakes, updateMode, source ) {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               var arrOutcomes = [];
               // Check if the outcomes parameter is an array and add it, otherwise add the the single value as an array
               if ( angular.isArray(outcomes) ) {
                  arrOutcomes = outcomes;
               } else {
                  arrOutcomes.push(outcomes);
               }

               // Setup the data object to be sent to the widget API
               var data = {
                  outcomes: arrOutcomes
               };

               // Check if we got any stakes passed to use, add them to the data object if so
               if ( stakes != null ) {
                  if ( angular.isArray(stakes) ) {
                     data.stakes = stakes;
                  } else {
                     data.stakes = [stakes];
                  }
               }

               // Set the coupon type, defaults to TYPE_SINGLE
               data.couponType = arrOutcomes.length === 1 ? api.BETSLIP_OUTCOMES_ARGS.TYPE_SINGLE :
                  api.BETSLIP_OUTCOMES_ARGS.TYPE_COMBINATION;

               // Set the update mode, defaults to UPDATE_APPEND
               data.updateMode = updateMode !== 'replace' ? api.BETSLIP_OUTCOMES_ARGS.UPDATE_APPEND :
                  api.BETSLIP_OUTCOMES_ARGS.UPDATE_REPLACE;
               if ( source != null ) {
                  data.source = source;
               }

               // Send the data to the widget api
               api.set(api.BETSLIP_OUTCOMES, data);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#removeOutcomeFromBetslip
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Remove one or more outcomes from the betslip
          * @param {number|Array} outcomes An array of outcome ids or a single outcome id
          * @returns {Promise} Promise
          */
         kambiWidgetService.removeOutcomeFromBetslip = function ( outcomes ) {
            var deferred = $q.defer();

            KWpromise.then(function ( api ) {
               var arrOutcomes = [];
               if ( angular.isArray(outcomes) ) {
                  arrOutcomes = outcomes;
               } else {
                  arrOutcomes.push(outcomes);
               }
               api.set(api.BETSLIP_OUTCOMES_REMOVE, { outcomes: arrOutcomes });
            });

            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestBetslipOutcomes
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the outcomes that are in the betslip, also sets up a subscription for future updates
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestBetslipOutcomes = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.BETSLIP_OUTCOMES);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestPageInfo
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the page info
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestPageInfo = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.PAGE_INFO);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestWidgetArgs
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Requests the parameters sent to the widget from the Widget API
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestWidgetArgs = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.WIDGET_ARGS);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestClientConfig
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Requests the client configuration from the Widget API
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestClientConfig = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.CLIENT_CONFIG);
            });
            return deferred.promise;
         };

         /**
          * @ngdoc method
          * @name widgetCore.kambiWidgetService#requestOddsFormat
          * @methodOf widgetCore.kambiWidgetService
          * @description
          * Request the odds format from the widget api, also sets up a subscription for future updates
          * @returns {Promise} Promise
          */
         kambiWidgetService.requestOddsFormat = function () {
            var deferred = $q.defer();
            KWpromise.then(function ( api ) {
               api.request(api.CLIENT_ODDS_FORMAT);
            });
            return deferred.promise;
         };

         return kambiWidgetService;
      }]);
   })(angular.module('widgetCore'));
})();

(function () {

   'use strict';

   function appController( $scope, $translate ) {
      void 0;
      /**
       * Changes the language
       * @param {String} key The language to change to
       */
      $scope.changeLanguage = function ( key ) {
         $translate.use(key);
      };

      $scope.$on('LOCALE:CHANGE', function(event, locale){
         $scope.changeLanguage(locale);
      });
   }

   (function ( $app ) {
      return $app
         .config(['$translateProvider', function ( $translateProvider ) {
            $translateProvider.preferredLanguage('en_GB');
            $translateProvider.useSanitizeValueStrategy('escapeParameters');
            $translateProvider.useStaticFilesLoader({
               prefix: './i18n/',
               suffix: '.json'
            });
         }])
         .controller('translateController', ['$scope', '$translate', appController]);
   })(angular.module('widgetCore.translate', [
      'ngSanitize',
      'pascalprecht.translate'
   ]));
})();

/*!
 * angular-translate - v2.8.1 - 2015-10-01
 * 
 * Copyright (c) 2015 The angular-translate team, Pascal Precht; Licensed MIT
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function () {
      return (factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    factory();
  }
}(this, function () {

/**
 * @ngdoc overview
 * @name pascalprecht.translate
 *
 * @description
 * The main module which holds everything together.
 */
angular.module('pascalprecht.translate', ['ng'])
  .run(runTranslate);

function runTranslate($translate) {

  'use strict';

  var key = $translate.storageKey(),
    storage = $translate.storage();

  var fallbackFromIncorrectStorageValue = function () {
    var preferred = $translate.preferredLanguage();
    if (angular.isString(preferred)) {
      $translate.use(preferred);
      // $translate.use() will also remember the language.
      // So, we don't need to call storage.put() here.
    } else {
      storage.put(key, $translate.use());
    }
  };

  fallbackFromIncorrectStorageValue.displayName = 'fallbackFromIncorrectStorageValue';

  if (storage) {
    if (!storage.get(key)) {
      fallbackFromIncorrectStorageValue();
    } else {
      $translate.use(storage.get(key))['catch'](fallbackFromIncorrectStorageValue);
    }
  } else if (angular.isString($translate.preferredLanguage())) {
    $translate.use($translate.preferredLanguage());
  }
}
runTranslate.$inject = ['$translate'];

runTranslate.displayName = 'runTranslate';

/**
 * @ngdoc object
 * @name pascalprecht.translate.$translateSanitizationProvider
 *
 * @description
 *
 * Configurations for $translateSanitization
 */
angular.module('pascalprecht.translate').provider('$translateSanitization', $translateSanitizationProvider);

function $translateSanitizationProvider () {

  'use strict';

  var $sanitize,
      currentStrategy = null, // TODO change to either 'sanitize', 'escape' or ['sanitize', 'escapeParameters'] in 3.0.
      hasConfiguredStrategy = false,
      hasShownNoStrategyConfiguredWarning = false,
      strategies;

  /**
   * Definition of a sanitization strategy function
   * @callback StrategyFunction
   * @param {string|object} value - value to be sanitized (either a string or an interpolated value map)
   * @param {string} mode - either 'text' for a string (translation) or 'params' for the interpolated params
   * @return {string|object}
   */

  /**
   * @ngdoc property
   * @name strategies
   * @propertyOf pascalprecht.translate.$translateSanitizationProvider
   *
   * @description
   * Following strategies are built-in:
   * <dl>
   *   <dt>sanitize</dt>
   *   <dd>Sanitizes HTML in the translation text using $sanitize</dd>
   *   <dt>escape</dt>
   *   <dd>Escapes HTML in the translation</dd>
   *   <dt>sanitizeParameters</dt>
   *   <dd>Sanitizes HTML in the values of the interpolation parameters using $sanitize</dd>
   *   <dt>escapeParameters</dt>
   *   <dd>Escapes HTML in the values of the interpolation parameters</dd>
   *   <dt>escaped</dt>
   *   <dd>Support legacy strategy name 'escaped' for backwards compatibility (will be removed in 3.0)</dd>
   * </dl>
   *
   */

  strategies = {
    sanitize: function (value, mode) {
      if (mode === 'text') {
        value = htmlSanitizeValue(value);
      }
      return value;
    },
    escape: function (value, mode) {
      if (mode === 'text') {
        value = htmlEscapeValue(value);
      }
      return value;
    },
    sanitizeParameters: function (value, mode) {
      if (mode === 'params') {
        value = mapInterpolationParameters(value, htmlSanitizeValue);
      }
      return value;
    },
    escapeParameters: function (value, mode) {
      if (mode === 'params') {
        value = mapInterpolationParameters(value, htmlEscapeValue);
      }
      return value;
    }
  };
  // Support legacy strategy name 'escaped' for backwards compatibility.
  // TODO should be removed in 3.0
  strategies.escaped = strategies.escapeParameters;

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateSanitizationProvider#addStrategy
   * @methodOf pascalprecht.translate.$translateSanitizationProvider
   *
   * @description
   * Adds a sanitization strategy to the list of known strategies.
   *
   * @param {string} strategyName - unique key for a strategy
   * @param {StrategyFunction} strategyFunction - strategy function
   * @returns {object} this
   */
  this.addStrategy = function (strategyName, strategyFunction) {
    strategies[strategyName] = strategyFunction;
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateSanitizationProvider#removeStrategy
   * @methodOf pascalprecht.translate.$translateSanitizationProvider
   *
   * @description
   * Removes a sanitization strategy from the list of known strategies.
   *
   * @param {string} strategyName - unique key for a strategy
   * @returns {object} this
   */
  this.removeStrategy = function (strategyName) {
    delete strategies[strategyName];
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateSanitizationProvider#useStrategy
   * @methodOf pascalprecht.translate.$translateSanitizationProvider
   *
   * @description
   * Selects a sanitization strategy. When an array is provided the strategies will be executed in order.
   *
   * @param {string|StrategyFunction|array} strategy The sanitization strategy / strategies which should be used. Either a name of an existing strategy, a custom strategy function, or an array consisting of multiple names and / or custom functions.
   * @returns {object} this
   */
  this.useStrategy = function (strategy) {
    hasConfiguredStrategy = true;
    currentStrategy = strategy;
    return this;
  };

  /**
   * @ngdoc object
   * @name pascalprecht.translate.$translateSanitization
   * @requires $injector
   * @requires $log
   *
   * @description
   * Sanitizes interpolation parameters and translated texts.
   *
   */
  this.$get = ['$injector', '$log', function ($injector, $log) {

    var cachedStrategyMap = {};

    var applyStrategies = function (value, mode, selectedStrategies) {
      angular.forEach(selectedStrategies, function (selectedStrategy) {
        if (angular.isFunction(selectedStrategy)) {
          value = selectedStrategy(value, mode);
        } else if (angular.isFunction(strategies[selectedStrategy])) {
          value = strategies[selectedStrategy](value, mode);
        } else if (angular.isString(strategies[selectedStrategy])) {
          if (!cachedStrategyMap[strategies[selectedStrategy]]) {
            try {
              cachedStrategyMap[strategies[selectedStrategy]] = $injector.get(strategies[selectedStrategy]);
            } catch (e) {
              cachedStrategyMap[strategies[selectedStrategy]] = function() {};
              throw new Error('pascalprecht.translate.$translateSanitization: Unknown sanitization strategy: \'' + selectedStrategy + '\'');
            }
          }
          value = cachedStrategyMap[strategies[selectedStrategy]](value, mode);
        } else {
          throw new Error('pascalprecht.translate.$translateSanitization: Unknown sanitization strategy: \'' + selectedStrategy + '\'');
        }
      });
      return value;
    };

    // TODO: should be removed in 3.0
    var showNoStrategyConfiguredWarning = function () {
      if (!hasConfiguredStrategy && !hasShownNoStrategyConfiguredWarning) {
        $log.warn('pascalprecht.translate.$translateSanitization: No sanitization strategy has been configured. This can have serious security implications. See http://angular-translate.github.io/docs/#/guide/19_security for details.');
        hasShownNoStrategyConfiguredWarning = true;
      }
    };

    if ($injector.has('$sanitize')) {
      $sanitize = $injector.get('$sanitize');
    }

    return {
      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translateSanitization#useStrategy
       * @methodOf pascalprecht.translate.$translateSanitization
       *
       * @description
       * Selects a sanitization strategy. When an array is provided the strategies will be executed in order.
       *
       * @param {string|StrategyFunction|array} strategy The sanitization strategy / strategies which should be used. Either a name of an existing strategy, a custom strategy function, or an array consisting of multiple names and / or custom functions.
       */
      useStrategy: (function (self) {
        return function (strategy) {
          self.useStrategy(strategy);
        };
      })(this),

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translateSanitization#sanitize
       * @methodOf pascalprecht.translate.$translateSanitization
       *
       * @description
       * Sanitizes a value.
       *
       * @param {string|object} value The value which should be sanitized.
       * @param {string} mode The current sanitization mode, either 'params' or 'text'.
       * @param {string|StrategyFunction|array} [strategy] Optional custom strategy which should be used instead of the currently selected strategy.
       * @returns {string|object} sanitized value
       */
      sanitize: function (value, mode, strategy) {
        if (!currentStrategy) {
          showNoStrategyConfiguredWarning();
        }

        if (arguments.length < 3) {
          strategy = currentStrategy;
        }

        if (!strategy) {
          return value;
        }

        var selectedStrategies = angular.isArray(strategy) ? strategy : [strategy];
        return applyStrategies(value, mode, selectedStrategies);
      }
    };
  }];

  var htmlEscapeValue = function (value) {
    var element = angular.element('<div></div>');
    element.text(value); // not chainable, see #1044
    return element.html();
  };

  var htmlSanitizeValue = function (value) {
    if (!$sanitize) {
      throw new Error('pascalprecht.translate.$translateSanitization: Error cannot find $sanitize service. Either include the ngSanitize module (https://docs.angularjs.org/api/ngSanitize) or use a sanitization strategy which does not depend on $sanitize, such as \'escape\'.');
    }
    return $sanitize(value);
  };

  var mapInterpolationParameters = function (value, iteratee) {
    if (angular.isObject(value)) {
      var result = angular.isArray(value) ? [] : {};

      angular.forEach(value, function (propertyValue, propertyKey) {
        result[propertyKey] = mapInterpolationParameters(propertyValue, iteratee);
      });

      return result;
    } else if (angular.isNumber(value)) {
      return value;
    } else {
      return iteratee(value);
    }
  };
}

/**
 * @ngdoc object
 * @name pascalprecht.translate.$translateProvider
 * @description
 *
 * $translateProvider allows developers to register translation-tables, asynchronous loaders
 * and similar to configure translation behavior directly inside of a module.
 *
 */
angular.module('pascalprecht.translate')
.constant('pascalprechtTranslateOverrider', {})
.provider('$translate', $translate);

function $translate($STORAGE_KEY, $windowProvider, $translateSanitizationProvider, pascalprechtTranslateOverrider) {

  'use strict';

  var $translationTable = {},
      $preferredLanguage,
      $availableLanguageKeys = [],
      $languageKeyAliases,
      $fallbackLanguage,
      $fallbackWasString,
      $uses,
      $nextLang,
      $storageFactory,
      $storageKey = $STORAGE_KEY,
      $storagePrefix,
      $missingTranslationHandlerFactory,
      $interpolationFactory,
      $interpolatorFactories = [],
      $loaderFactory,
      $cloakClassName = 'translate-cloak',
      $loaderOptions,
      $notFoundIndicatorLeft,
      $notFoundIndicatorRight,
      $postCompilingEnabled = false,
      $forceAsyncReloadEnabled = false,
      $nestedObjectDelimeter = '.',
      $isReady = false,
      loaderCache,
      directivePriority = 0,
      statefulFilter = true,
      uniformLanguageTagResolver = 'default',
      languageTagResolver = {
        'default': function (tag) {
          return (tag || '').split('-').join('_');
        },
        java: function (tag) {
          var temp = (tag || '').split('-').join('_');
          var parts = temp.split('_');
          return parts.length > 1 ? (parts[0].toLowerCase() + '_' + parts[1].toUpperCase()) : temp;
        },
        bcp47: function (tag) {
          var temp = (tag || '').split('_').join('-');
          var parts = temp.split('-');
          return parts.length > 1 ? (parts[0].toLowerCase() + '-' + parts[1].toUpperCase()) : temp;
        }
      };

  var version = '2.8.1';

  // tries to determine the browsers language
  var getFirstBrowserLanguage = function () {

    // internal purpose only
    if (angular.isFunction(pascalprechtTranslateOverrider.getLocale)) {
      return pascalprechtTranslateOverrider.getLocale();
    }

    var nav = $windowProvider.$get().navigator,
        browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
        i,
        language;

    // support for HTML 5.1 "navigator.languages"
    if (angular.isArray(nav.languages)) {
      for (i = 0; i < nav.languages.length; i++) {
        language = nav.languages[i];
        if (language && language.length) {
          return language;
        }
      }
    }

    // support for other well known properties in browsers
    for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
      language = nav[browserLanguagePropertyKeys[i]];
      if (language && language.length) {
        return language;
      }
    }

    return null;
  };
  getFirstBrowserLanguage.displayName = 'angular-translate/service: getFirstBrowserLanguage';

  // tries to determine the browsers locale
  var getLocale = function () {
    var locale = getFirstBrowserLanguage() || '';
    if (languageTagResolver[uniformLanguageTagResolver]) {
      locale = languageTagResolver[uniformLanguageTagResolver](locale);
    }
    return locale;
  };
  getLocale.displayName = 'angular-translate/service: getLocale';

  /**
   * @name indexOf
   * @private
   *
   * @description
   * indexOf polyfill. Kinda sorta.
   *
   * @param {array} array Array to search in.
   * @param {string} searchElement Element to search for.
   *
   * @returns {int} Index of search element.
   */
  var indexOf = function(array, searchElement) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (array[i] === searchElement) {
        return i;
      }
    }
    return -1;
  };

  /**
   * @name trim
   * @private
   *
   * @description
   * trim polyfill
   *
   * @returns {string} The string stripped of whitespace from both ends
   */
  var trim = function() {
    return this.toString().replace(/^\s+|\s+$/g, '');
  };

  var negotiateLocale = function (preferred) {

    var avail = [],
        locale = angular.lowercase(preferred),
        i = 0,
        n = $availableLanguageKeys.length;

    for (; i < n; i++) {
      avail.push(angular.lowercase($availableLanguageKeys[i]));
    }

    if (indexOf(avail, locale) > -1) {
      return preferred;
    }

    if ($languageKeyAliases) {
      var alias;
      for (var langKeyAlias in $languageKeyAliases) {
        var hasWildcardKey = false;
        var hasExactKey = Object.prototype.hasOwnProperty.call($languageKeyAliases, langKeyAlias) &&
          angular.lowercase(langKeyAlias) === angular.lowercase(preferred);

        if (langKeyAlias.slice(-1) === '*') {
          hasWildcardKey = langKeyAlias.slice(0, -1) === preferred.slice(0, langKeyAlias.length-1);
        }
        if (hasExactKey || hasWildcardKey) {
          alias = $languageKeyAliases[langKeyAlias];
          if (indexOf(avail, angular.lowercase(alias)) > -1) {
            return alias;
          }
        }
      }
    }

    if (preferred) {
      var parts = preferred.split('_');

      if (parts.length > 1 && indexOf(avail, angular.lowercase(parts[0])) > -1) {
        return parts[0];
      }
    }

    // If everything fails, just return the preferred, unchanged.
    return preferred;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#translations
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Registers a new translation table for specific language key.
   *
   * To register a translation table for specific language, pass a defined language
   * key as first parameter.
   *
   * <pre>
   *  // register translation table for language: 'de_DE'
   *  $translateProvider.translations('de_DE', {
   *    'GREETING': 'Hallo Welt!'
   *  });
   *
   *  // register another one
   *  $translateProvider.translations('en_US', {
   *    'GREETING': 'Hello world!'
   *  });
   * </pre>
   *
   * When registering multiple translation tables for for the same language key,
   * the actual translation table gets extended. This allows you to define module
   * specific translation which only get added, once a specific module is loaded in
   * your app.
   *
   * Invoking this method with no arguments returns the translation table which was
   * registered with no language key. Invoking it with a language key returns the
   * related translation table.
   *
   * @param {string} key A language key.
   * @param {object} translationTable A plain old JavaScript object that represents a translation table.
   *
   */
  var translations = function (langKey, translationTable) {

    if (!langKey && !translationTable) {
      return $translationTable;
    }

    if (langKey && !translationTable) {
      if (angular.isString(langKey)) {
        return $translationTable[langKey];
      }
    } else {
      if (!angular.isObject($translationTable[langKey])) {
        $translationTable[langKey] = {};
      }
      angular.extend($translationTable[langKey], flatObject(translationTable));
    }
    return this;
  };

  this.translations = translations;

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#cloakClassName
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   *
   * Let's you change the class name for `translate-cloak` directive.
   * Default class name is `translate-cloak`.
   *
   * @param {string} name translate-cloak class name
   */
  this.cloakClassName = function (name) {
    if (!name) {
      return $cloakClassName;
    }
    $cloakClassName = name;
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#nestedObjectDelimeter
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   *
   * Let's you change the delimiter for namespaced translations.
   * Default delimiter is `.`.
   *
   * @param {string} delimiter namespace separator
   */
  this.nestedObjectDelimeter = function (delimiter) {
    if (!delimiter) {
      return $nestedObjectDelimeter;
    }
    $nestedObjectDelimeter = delimiter;
    return this;
  };

  /**
   * @name flatObject
   * @private
   *
   * @description
   * Flats an object. This function is used to flatten given translation data with
   * namespaces, so they are later accessible via dot notation.
   */
  var flatObject = function (data, path, result, prevKey) {
    var key, keyWithPath, keyWithShortPath, val;

    if (!path) {
      path = [];
    }
    if (!result) {
      result = {};
    }
    for (key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
      val = data[key];
      if (angular.isObject(val)) {
        flatObject(val, path.concat(key), result, key);
      } else {
        keyWithPath = path.length ? ('' + path.join($nestedObjectDelimeter) + $nestedObjectDelimeter + key) : key;
        if(path.length && key === prevKey){
          // Create shortcut path (foo.bar == foo.bar.bar)
          keyWithShortPath = '' + path.join($nestedObjectDelimeter);
          // Link it to original path
          result[keyWithShortPath] = '@:' + keyWithPath;
        }
        result[keyWithPath] = val;
      }
    }
    return result;
  };
  flatObject.displayName = 'flatObject';

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#addInterpolation
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Adds interpolation services to angular-translate, so it can manage them.
   *
   * @param {object} factory Interpolation service factory
   */
  this.addInterpolation = function (factory) {
    $interpolatorFactories.push(factory);
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useMessageFormatInterpolation
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use interpolation functionality of messageformat.js.
   * This is useful when having high level pluralization and gender selection.
   */
  this.useMessageFormatInterpolation = function () {
    return this.useInterpolation('$translateMessageFormatInterpolation');
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useInterpolation
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate which interpolation style to use as default, application-wide.
   * Simply pass a factory/service name. The interpolation service has to implement
   * the correct interface.
   *
   * @param {string} factory Interpolation service name.
   */
  this.useInterpolation = function (factory) {
    $interpolationFactory = factory;
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useSanitizeStrategy
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Simply sets a sanitation strategy type.
   *
   * @param {string} value Strategy type.
   */
  this.useSanitizeValueStrategy = function (value) {
    $translateSanitizationProvider.useStrategy(value);
    return this;
  };

 /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#preferredLanguage
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells the module which of the registered translation tables to use for translation
   * at initial startup by passing a language key. Similar to `$translateProvider#use`
   * only that it says which language to **prefer**.
   *
   * @param {string} langKey A language key.
   */
  this.preferredLanguage = function(langKey) {
    if (langKey) {
      setupPreferredLanguage(langKey);
      return this;
    }
    return $preferredLanguage;
  };
  var setupPreferredLanguage = function (langKey) {
    if (langKey) {
      $preferredLanguage = langKey;
    }
    return $preferredLanguage;
  };
  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#translationNotFoundIndicator
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Sets an indicator which is used when a translation isn't found. E.g. when
   * setting the indicator as 'X' and one tries to translate a translation id
   * called `NOT_FOUND`, this will result in `X NOT_FOUND X`.
   *
   * Internally this methods sets a left indicator and a right indicator using
   * `$translateProvider.translationNotFoundIndicatorLeft()` and
   * `$translateProvider.translationNotFoundIndicatorRight()`.
   *
   * **Note**: These methods automatically add a whitespace between the indicators
   * and the translation id.
   *
   * @param {string} indicator An indicator, could be any string.
   */
  this.translationNotFoundIndicator = function (indicator) {
    this.translationNotFoundIndicatorLeft(indicator);
    this.translationNotFoundIndicatorRight(indicator);
    return this;
  };

  /**
   * ngdoc function
   * @name pascalprecht.translate.$translateProvider#translationNotFoundIndicatorLeft
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Sets an indicator which is used when a translation isn't found left to the
   * translation id.
   *
   * @param {string} indicator An indicator.
   */
  this.translationNotFoundIndicatorLeft = function (indicator) {
    if (!indicator) {
      return $notFoundIndicatorLeft;
    }
    $notFoundIndicatorLeft = indicator;
    return this;
  };

  /**
   * ngdoc function
   * @name pascalprecht.translate.$translateProvider#translationNotFoundIndicatorLeft
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Sets an indicator which is used when a translation isn't found right to the
   * translation id.
   *
   * @param {string} indicator An indicator.
   */
  this.translationNotFoundIndicatorRight = function (indicator) {
    if (!indicator) {
      return $notFoundIndicatorRight;
    }
    $notFoundIndicatorRight = indicator;
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#fallbackLanguage
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells the module which of the registered translation tables to use when missing translations
   * at initial startup by passing a language key. Similar to `$translateProvider#use`
   * only that it says which language to **fallback**.
   *
   * @param {string||array} langKey A language key.
   *
   */
  this.fallbackLanguage = function (langKey) {
    fallbackStack(langKey);
    return this;
  };

  var fallbackStack = function (langKey) {
    if (langKey) {
      if (angular.isString(langKey)) {
        $fallbackWasString = true;
        $fallbackLanguage = [ langKey ];
      } else if (angular.isArray(langKey)) {
        $fallbackWasString = false;
        $fallbackLanguage = langKey;
      }
      if (angular.isString($preferredLanguage)  && indexOf($fallbackLanguage, $preferredLanguage) < 0) {
        $fallbackLanguage.push($preferredLanguage);
      }

      return this;
    } else {
      if ($fallbackWasString) {
        return $fallbackLanguage[0];
      } else {
        return $fallbackLanguage;
      }
    }
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#use
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Set which translation table to use for translation by given language key. When
   * trying to 'use' a language which isn't provided, it'll throw an error.
   *
   * You actually don't have to use this method since `$translateProvider#preferredLanguage`
   * does the job too.
   *
   * @param {string} langKey A language key.
   */
  this.use = function (langKey) {
    if (langKey) {
      if (!$translationTable[langKey] && (!$loaderFactory)) {
        // only throw an error, when not loading translation data asynchronously
        throw new Error('$translateProvider couldn\'t find translationTable for langKey: \'' + langKey + '\'');
      }
      $uses = langKey;
      return this;
    }
    return $uses;
  };

 /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#storageKey
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells the module which key must represent the choosed language by a user in the storage.
   *
   * @param {string} key A key for the storage.
   */
  var storageKey = function(key) {
    if (!key) {
      if ($storagePrefix) {
        return $storagePrefix + $storageKey;
      }
      return $storageKey;
    }
    $storageKey = key;
    return this;
  };

  this.storageKey = storageKey;

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useUrlLoader
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use `$translateUrlLoader` extension service as loader.
   *
   * @param {string} url Url
   * @param {Object=} options Optional configuration object
   */
  this.useUrlLoader = function (url, options) {
    return this.useLoader('$translateUrlLoader', angular.extend({ url: url }, options));
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useStaticFilesLoader
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use `$translateStaticFilesLoader` extension service as loader.
   *
   * @param {Object=} options Optional configuration object
   */
  this.useStaticFilesLoader = function (options) {
    return this.useLoader('$translateStaticFilesLoader', options);
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useLoader
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use any other service as loader.
   *
   * @param {string} loaderFactory Factory name to use
   * @param {Object=} options Optional configuration object
   */
  this.useLoader = function (loaderFactory, options) {
    $loaderFactory = loaderFactory;
    $loaderOptions = options || {};
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useLocalStorage
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use `$translateLocalStorage` service as storage layer.
   *
   */
  this.useLocalStorage = function () {
    return this.useStorage('$translateLocalStorage');
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useCookieStorage
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use `$translateCookieStorage` service as storage layer.
   */
  this.useCookieStorage = function () {
    return this.useStorage('$translateCookieStorage');
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useStorage
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use custom service as storage layer.
   */
  this.useStorage = function (storageFactory) {
    $storageFactory = storageFactory;
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#storagePrefix
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Sets prefix for storage key.
   *
   * @param {string} prefix Storage key prefix
   */
  this.storagePrefix = function (prefix) {
    if (!prefix) {
      return prefix;
    }
    $storagePrefix = prefix;
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useMissingTranslationHandlerLog
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to use built-in log handler when trying to translate
   * a translation Id which doesn't exist.
   *
   * This is actually a shortcut method for `useMissingTranslationHandler()`.
   *
   */
  this.useMissingTranslationHandlerLog = function () {
    return this.useMissingTranslationHandler('$translateMissingTranslationHandlerLog');
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useMissingTranslationHandler
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Expects a factory name which later gets instantiated with `$injector`.
   * This method can be used to tell angular-translate to use a custom
   * missingTranslationHandler. Just build a factory which returns a function
   * and expects a translation id as argument.
   *
   * Example:
   * <pre>
   *  app.config(function ($translateProvider) {
   *    $translateProvider.useMissingTranslationHandler('customHandler');
   *  });
   *
   *  app.factory('customHandler', function (dep1, dep2) {
   *    return function (translationId) {
   *      // something with translationId and dep1 and dep2
   *    };
   *  });
   * </pre>
   *
   * @param {string} factory Factory name
   */
  this.useMissingTranslationHandler = function (factory) {
    $missingTranslationHandlerFactory = factory;
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#usePostCompiling
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * If post compiling is enabled, all translated values will be processed
   * again with AngularJS' $compile.
   *
   * Example:
   * <pre>
   *  app.config(function ($translateProvider) {
   *    $translateProvider.usePostCompiling(true);
   *  });
   * </pre>
   *
   * @param {string} factory Factory name
   */
  this.usePostCompiling = function (value) {
    $postCompilingEnabled = !(!value);
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#forceAsyncReload
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * If force async reload is enabled, async loader will always be called
   * even if $translationTable already contains the language key, adding
   * possible new entries to the $translationTable.
   *
   * Example:
   * <pre>
   *  app.config(function ($translateProvider) {
   *    $translateProvider.forceAsyncReload(true);
   *  });
   * </pre>
   *
   * @param {boolean} value - valid values are true or false
   */
  this.forceAsyncReload = function (value) {
    $forceAsyncReloadEnabled = !(!value);
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#uniformLanguageTag
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate which language tag should be used as a result when determining
   * the current browser language.
   *
   * This setting must be set before invoking {@link pascalprecht.translate.$translateProvider#methods_determinePreferredLanguage determinePreferredLanguage()}.
   *
   * <pre>
   * $translateProvider
   *   .uniformLanguageTag('bcp47')
   *   .determinePreferredLanguage()
   * </pre>
   *
   * The resolver currently supports:
   * * default
   *     (traditionally: hyphens will be converted into underscores, i.e. en-US => en_US)
   *     en-US => en_US
   *     en_US => en_US
   *     en-us => en_us
   * * java
   *     like default, but the second part will be always in uppercase
   *     en-US => en_US
   *     en_US => en_US
   *     en-us => en_US
   * * BCP 47 (RFC 4646 & 4647)
   *     en-US => en-US
   *     en_US => en-US
   *     en-us => en-US
   *
   * See also:
   * * http://en.wikipedia.org/wiki/IETF_language_tag
   * * http://www.w3.org/International/core/langtags/
   * * http://tools.ietf.org/html/bcp47
   *
   * @param {string|object} options - options (or standard)
   * @param {string} options.standard - valid values are 'default', 'bcp47', 'java'
   */
  this.uniformLanguageTag = function (options) {

    if (!options) {
      options = {};
    } else if (angular.isString(options)) {
      options = {
        standard: options
      };
    }

    uniformLanguageTagResolver = options.standard;

    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#determinePreferredLanguage
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Tells angular-translate to try to determine on its own which language key
   * to set as preferred language. When `fn` is given, angular-translate uses it
   * to determine a language key, otherwise it uses the built-in `getLocale()`
   * method.
   *
   * The `getLocale()` returns a language key in the format `[lang]_[country]` or
   * `[lang]` depending on what the browser provides.
   *
   * Use this method at your own risk, since not all browsers return a valid
   * locale (see {@link pascalprecht.translate.$translateProvider#methods_uniformLanguageTag uniformLanguageTag()}).
   *
   * @param {Function=} fn Function to determine a browser's locale
   */
  this.determinePreferredLanguage = function (fn) {

    var locale = (fn && angular.isFunction(fn)) ? fn() : getLocale();

    if (!$availableLanguageKeys.length) {
      $preferredLanguage = locale;
    } else {
      $preferredLanguage = negotiateLocale(locale);
    }

    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#registerAvailableLanguageKeys
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Registers a set of language keys the app will work with. Use this method in
   * combination with
   * {@link pascalprecht.translate.$translateProvider#determinePreferredLanguage determinePreferredLanguage}.
   * When available languages keys are registered, angular-translate
   * tries to find the best fitting language key depending on the browsers locale,
   * considering your language key convention.
   *
   * @param {object} languageKeys Array of language keys the your app will use
   * @param {object=} aliases Alias map.
   */
  this.registerAvailableLanguageKeys = function (languageKeys, aliases) {
    if (languageKeys) {
      $availableLanguageKeys = languageKeys;
      if (aliases) {
        $languageKeyAliases = aliases;
      }
      return this;
    }
    return $availableLanguageKeys;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#useLoaderCache
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Registers a cache for internal $http based loaders.
   * {@link pascalprecht.translate.$translationCache $translationCache}.
   * When false the cache will be disabled (default). When true or undefined
   * the cache will be a default (see $cacheFactory). When an object it will
   * be treat as a cache object itself: the usage is $http({cache: cache})
   *
   * @param {object} cache boolean, string or cache-object
   */
  this.useLoaderCache = function (cache) {
    if (cache === false) {
      // disable cache
      loaderCache = undefined;
    } else if (cache === true) {
      // enable cache using AJS defaults
      loaderCache = true;
    } else if (typeof(cache) === 'undefined') {
      // enable cache using default
      loaderCache = '$translationCache';
    } else if (cache) {
      // enable cache using given one (see $cacheFactory)
      loaderCache = cache;
    }
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#directivePriority
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Sets the default priority of the translate directive. The standard value is `0`.
   * Calling this function without an argument will return the current value.
   *
   * @param {number} priority for the translate-directive
   */
  this.directivePriority = function (priority) {
    if (priority === undefined) {
      // getter
      return directivePriority;
    } else {
      // setter with chaining
      directivePriority = priority;
      return this;
    }
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateProvider#statefulFilter
   * @methodOf pascalprecht.translate.$translateProvider
   *
   * @description
   * Since AngularJS 1.3, filters which are not stateless (depending at the scope)
   * have to explicit define this behavior.
   * Sets whether the translate filter should be stateful or stateless. The standard value is `true`
   * meaning being stateful.
   * Calling this function without an argument will return the current value.
   *
   * @param {boolean} state - defines the state of the filter
   */
  this.statefulFilter = function (state) {
    if (state === undefined) {
      // getter
      return statefulFilter;
    } else {
      // setter with chaining
      statefulFilter = state;
      return this;
    }
  };

  /**
   * @ngdoc object
   * @name pascalprecht.translate.$translate
   * @requires $interpolate
   * @requires $log
   * @requires $rootScope
   * @requires $q
   *
   * @description
   * The `$translate` service is the actual core of angular-translate. It expects a translation id
   * and optional interpolate parameters to translate contents.
   *
   * <pre>
   *  $translate('HEADLINE_TEXT').then(function (translation) {
   *    $scope.translatedText = translation;
   *  });
   * </pre>
   *
   * @param {string|array} translationId A token which represents a translation id
   *                                     This can be optionally an array of translation ids which
   *                                     results that the function returns an object where each key
   *                                     is the translation id and the value the translation.
   * @param {object=} interpolateParams An object hash for dynamic values
   * @param {string} interpolationId The id of the interpolation to use
   * @returns {object} promise
   */
  this.$get = [
    '$log',
    '$injector',
    '$rootScope',
    '$q',
    function ($log, $injector, $rootScope, $q) {

      var Storage,
          defaultInterpolator = $injector.get($interpolationFactory || '$translateDefaultInterpolation'),
          pendingLoader = false,
          interpolatorHashMap = {},
          langPromises = {},
          fallbackIndex,
          startFallbackIteration;

      var $translate = function (translationId, interpolateParams, interpolationId, defaultTranslationText) {

        // Duck detection: If the first argument is an array, a bunch of translations was requested.
        // The result is an object.
        if (angular.isArray(translationId)) {
          // Inspired by Q.allSettled by Kris Kowal
          // https://github.com/kriskowal/q/blob/b0fa72980717dc202ffc3cbf03b936e10ebbb9d7/q.js#L1553-1563
          // This transforms all promises regardless resolved or rejected
          var translateAll = function (translationIds) {
            var results = {}; // storing the actual results
            var promises = []; // promises to wait for
            // Wraps the promise a) being always resolved and b) storing the link id->value
            var translate = function (translationId) {
              var deferred = $q.defer();
              var regardless = function (value) {
                results[translationId] = value;
                deferred.resolve([translationId, value]);
              };
              // we don't care whether the promise was resolved or rejected; just store the values
              $translate(translationId, interpolateParams, interpolationId, defaultTranslationText).then(regardless, regardless);
              return deferred.promise;
            };
            for (var i = 0, c = translationIds.length; i < c; i++) {
              promises.push(translate(translationIds[i]));
            }
            // wait for all (including storing to results)
            return $q.all(promises).then(function () {
              // return the results
              return results;
            });
          };
          return translateAll(translationId);
        }

        var deferred = $q.defer();

        // trim off any whitespace
        if (translationId) {
          translationId = trim.apply(translationId);
        }

        var promiseToWaitFor = (function () {
          var promise = $preferredLanguage ?
            langPromises[$preferredLanguage] :
            langPromises[$uses];

          fallbackIndex = 0;

          if ($storageFactory && !promise) {
            // looks like there's no pending promise for $preferredLanguage or
            // $uses. Maybe there's one pending for a language that comes from
            // storage.
            var langKey = Storage.get($storageKey);
            promise = langPromises[langKey];

            if ($fallbackLanguage && $fallbackLanguage.length) {
                var index = indexOf($fallbackLanguage, langKey);
                // maybe the language from storage is also defined as fallback language
                // we increase the fallback language index to not search in that language
                // as fallback, since it's probably the first used language
                // in that case the index starts after the first element
                fallbackIndex = (index === 0) ? 1 : 0;

                // but we can make sure to ALWAYS fallback to preferred language at least
                if (indexOf($fallbackLanguage, $preferredLanguage) < 0) {
                  $fallbackLanguage.push($preferredLanguage);
                }
            }
          }
          return promise;
        }());

        if (!promiseToWaitFor) {
          // no promise to wait for? okay. Then there's no loader registered
          // nor is a one pending for language that comes from storage.
          // We can just translate.
          determineTranslation(translationId, interpolateParams, interpolationId, defaultTranslationText).then(deferred.resolve, deferred.reject);
        } else {
          var promiseResolved = function () {
            determineTranslation(translationId, interpolateParams, interpolationId, defaultTranslationText).then(deferred.resolve, deferred.reject);
          };
          promiseResolved.displayName = 'promiseResolved';

          promiseToWaitFor['finally'](promiseResolved, deferred.reject);
        }
        return deferred.promise;
      };

      /**
       * @name applyNotFoundIndicators
       * @private
       *
       * @description
       * Applies not fount indicators to given translation id, if needed.
       * This function gets only executed, if a translation id doesn't exist,
       * which is why a translation id is expected as argument.
       *
       * @param {string} translationId Translation id.
       * @returns {string} Same as given translation id but applied with not found
       * indicators.
       */
      var applyNotFoundIndicators = function (translationId) {
        // applying notFoundIndicators
        if ($notFoundIndicatorLeft) {
          translationId = [$notFoundIndicatorLeft, translationId].join(' ');
        }
        if ($notFoundIndicatorRight) {
          translationId = [translationId, $notFoundIndicatorRight].join(' ');
        }
        return translationId;
      };

      /**
       * @name useLanguage
       * @private
       *
       * @description
       * Makes actual use of a language by setting a given language key as used
       * language and informs registered interpolators to also use the given
       * key as locale.
       *
       * @param {key} Locale key.
       */
      var useLanguage = function (key) {
        $uses = key;

        // make sure to store new language key before triggering success event
        if ($storageFactory) {
          Storage.put($translate.storageKey(), $uses);
        }

        $rootScope.$emit('$translateChangeSuccess', {language: key});

        // inform default interpolator
        defaultInterpolator.setLocale($uses);

        var eachInterpolator = function (interpolator, id) {
          interpolatorHashMap[id].setLocale($uses);
        };
        eachInterpolator.displayName = 'eachInterpolatorLocaleSetter';

        // inform all others too!
        angular.forEach(interpolatorHashMap, eachInterpolator);
        $rootScope.$emit('$translateChangeEnd', {language: key});
      };

      /**
       * @name loadAsync
       * @private
       *
       * @description
       * Kicks of registered async loader using `$injector` and applies existing
       * loader options. When resolved, it updates translation tables accordingly
       * or rejects with given language key.
       *
       * @param {string} key Language key.
       * @return {Promise} A promise.
       */
      var loadAsync = function (key) {
        if (!key) {
          throw 'No language key specified for loading.';
        }

        var deferred = $q.defer();

        $rootScope.$emit('$translateLoadingStart', {language: key});
        pendingLoader = true;

        var cache = loaderCache;
        if (typeof(cache) === 'string') {
          // getting on-demand instance of loader
          cache = $injector.get(cache);
        }

        var loaderOptions = angular.extend({}, $loaderOptions, {
          key: key,
          $http: angular.extend({}, {
            cache: cache
          }, $loaderOptions.$http)
        });

        var onLoaderSuccess = function (data) {
          var translationTable = {};
          $rootScope.$emit('$translateLoadingSuccess', {language: key});

          if (angular.isArray(data)) {
            angular.forEach(data, function (table) {
              angular.extend(translationTable, flatObject(table));
            });
          } else {
            angular.extend(translationTable, flatObject(data));
          }
          pendingLoader = false;
          deferred.resolve({
            key: key,
            table: translationTable
          });
          $rootScope.$emit('$translateLoadingEnd', {language: key});
        };
        onLoaderSuccess.displayName = 'onLoaderSuccess';

        var onLoaderError = function (key) {
          $rootScope.$emit('$translateLoadingError', {language: key});
          deferred.reject(key);
          $rootScope.$emit('$translateLoadingEnd', {language: key});
        };
        onLoaderError.displayName = 'onLoaderError';

        $injector.get($loaderFactory)(loaderOptions)
          .then(onLoaderSuccess, onLoaderError);

        return deferred.promise;
      };

      if ($storageFactory) {
        Storage = $injector.get($storageFactory);

        if (!Storage.get || !Storage.put) {
          throw new Error('Couldn\'t use storage \'' + $storageFactory + '\', missing get() or put() method!');
        }
      }

      // if we have additional interpolations that were added via
      // $translateProvider.addInterpolation(), we have to map'em
      if ($interpolatorFactories.length) {
        var eachInterpolationFactory = function (interpolatorFactory) {
          var interpolator = $injector.get(interpolatorFactory);
          // setting initial locale for each interpolation service
          interpolator.setLocale($preferredLanguage || $uses);
          // make'em recognizable through id
          interpolatorHashMap[interpolator.getInterpolationIdentifier()] = interpolator;
        };
        eachInterpolationFactory.displayName = 'interpolationFactoryAdder';

        angular.forEach($interpolatorFactories, eachInterpolationFactory);
      }

      /**
       * @name getTranslationTable
       * @private
       *
       * @description
       * Returns a promise that resolves to the translation table
       * or is rejected if an error occurred.
       *
       * @param langKey
       * @returns {Q.promise}
       */
      var getTranslationTable = function (langKey) {
        var deferred = $q.defer();
        if (Object.prototype.hasOwnProperty.call($translationTable, langKey)) {
          deferred.resolve($translationTable[langKey]);
        } else if (langPromises[langKey]) {
          var onResolve = function (data) {
            translations(data.key, data.table);
            deferred.resolve(data.table);
          };
          onResolve.displayName = 'translationTableResolver';
          langPromises[langKey].then(onResolve, deferred.reject);
        } else {
          deferred.reject();
        }
        return deferred.promise;
      };

      /**
       * @name getFallbackTranslation
       * @private
       *
       * @description
       * Returns a promise that will resolve to the translation
       * or be rejected if no translation was found for the language.
       * This function is currently only used for fallback language translation.
       *
       * @param langKey The language to translate to.
       * @param translationId
       * @param interpolateParams
       * @param Interpolator
       * @returns {Q.promise}
       */
      var getFallbackTranslation = function (langKey, translationId, interpolateParams, Interpolator) {
        var deferred = $q.defer();

        var onResolve = function (translationTable) {
          if (Object.prototype.hasOwnProperty.call(translationTable, translationId)) {
            Interpolator.setLocale(langKey);
            var translation = translationTable[translationId];
            if (translation.substr(0, 2) === '@:') {
              getFallbackTranslation(langKey, translation.substr(2), interpolateParams, Interpolator)
                .then(deferred.resolve, deferred.reject);
            } else {
              deferred.resolve(Interpolator.interpolate(translationTable[translationId], interpolateParams));
            }
            Interpolator.setLocale($uses);
          } else {
            deferred.reject();
          }
        };
        onResolve.displayName = 'fallbackTranslationResolver';

        getTranslationTable(langKey).then(onResolve, deferred.reject);

        return deferred.promise;
      };

      /**
       * @name getFallbackTranslationInstant
       * @private
       *
       * @description
       * Returns a translation
       * This function is currently only used for fallback language translation.
       *
       * @param langKey The language to translate to.
       * @param translationId
       * @param interpolateParams
       * @param Interpolator
       * @returns {string} translation
       */
      var getFallbackTranslationInstant = function (langKey, translationId, interpolateParams, Interpolator) {
        var result, translationTable = $translationTable[langKey];

        if (translationTable && Object.prototype.hasOwnProperty.call(translationTable, translationId)) {
          Interpolator.setLocale(langKey);
          result = Interpolator.interpolate(translationTable[translationId], interpolateParams);
          if (result.substr(0, 2) === '@:') {
            return getFallbackTranslationInstant(langKey, result.substr(2), interpolateParams, Interpolator);
          }
          Interpolator.setLocale($uses);
        }

        return result;
      };


      /**
       * @name translateByHandler
       * @private
       *
       * Translate by missing translation handler.
       *
       * @param translationId
       * @returns translation created by $missingTranslationHandler or translationId is $missingTranslationHandler is
       * absent
       */
      var translateByHandler = function (translationId, interpolateParams) {
        // If we have a handler factory - we might also call it here to determine if it provides
        // a default text for a translationid that can't be found anywhere in our tables
        if ($missingTranslationHandlerFactory) {
          var resultString = $injector.get($missingTranslationHandlerFactory)(translationId, $uses, interpolateParams);
          if (resultString !== undefined) {
            return resultString;
          } else {
            return translationId;
          }
        } else {
          return translationId;
        }
      };

      /**
       * @name resolveForFallbackLanguage
       * @private
       *
       * Recursive helper function for fallbackTranslation that will sequentially look
       * for a translation in the fallbackLanguages starting with fallbackLanguageIndex.
       *
       * @param fallbackLanguageIndex
       * @param translationId
       * @param interpolateParams
       * @param Interpolator
       * @returns {Q.promise} Promise that will resolve to the translation.
       */
      var resolveForFallbackLanguage = function (fallbackLanguageIndex, translationId, interpolateParams, Interpolator, defaultTranslationText) {
        var deferred = $q.defer();

        if (fallbackLanguageIndex < $fallbackLanguage.length) {
          var langKey = $fallbackLanguage[fallbackLanguageIndex];
          getFallbackTranslation(langKey, translationId, interpolateParams, Interpolator).then(
            deferred.resolve,
            function () {
              // Look in the next fallback language for a translation.
              // It delays the resolving by passing another promise to resolve.
              resolveForFallbackLanguage(fallbackLanguageIndex + 1, translationId, interpolateParams, Interpolator, defaultTranslationText).then(deferred.resolve);
            }
          );
        } else {
          // No translation found in any fallback language
          // if a default translation text is set in the directive, then return this as a result
          if (defaultTranslationText) {
            deferred.resolve(defaultTranslationText);
          } else {
            // if no default translation is set and an error handler is defined, send it to the handler
            // and then return the result
            deferred.resolve(translateByHandler(translationId, interpolateParams));
          }
        }
        return deferred.promise;
      };

      /**
       * @name resolveForFallbackLanguageInstant
       * @private
       *
       * Recursive helper function for fallbackTranslation that will sequentially look
       * for a translation in the fallbackLanguages starting with fallbackLanguageIndex.
       *
       * @param fallbackLanguageIndex
       * @param translationId
       * @param interpolateParams
       * @param Interpolator
       * @returns {string} translation
       */
      var resolveForFallbackLanguageInstant = function (fallbackLanguageIndex, translationId, interpolateParams, Interpolator) {
        var result;

        if (fallbackLanguageIndex < $fallbackLanguage.length) {
          var langKey = $fallbackLanguage[fallbackLanguageIndex];
          result = getFallbackTranslationInstant(langKey, translationId, interpolateParams, Interpolator);
          if (!result) {
            result = resolveForFallbackLanguageInstant(fallbackLanguageIndex + 1, translationId, interpolateParams, Interpolator);
          }
        }
        return result;
      };

      /**
       * Translates with the usage of the fallback languages.
       *
       * @param translationId
       * @param interpolateParams
       * @param Interpolator
       * @returns {Q.promise} Promise, that resolves to the translation.
       */
      var fallbackTranslation = function (translationId, interpolateParams, Interpolator, defaultTranslationText) {
        // Start with the fallbackLanguage with index 0
        return resolveForFallbackLanguage((startFallbackIteration>0 ? startFallbackIteration : fallbackIndex), translationId, interpolateParams, Interpolator, defaultTranslationText);
      };

      /**
       * Translates with the usage of the fallback languages.
       *
       * @param translationId
       * @param interpolateParams
       * @param Interpolator
       * @returns {String} translation
       */
      var fallbackTranslationInstant = function (translationId, interpolateParams, Interpolator) {
        // Start with the fallbackLanguage with index 0
        return resolveForFallbackLanguageInstant((startFallbackIteration>0 ? startFallbackIteration : fallbackIndex), translationId, interpolateParams, Interpolator);
      };

      var determineTranslation = function (translationId, interpolateParams, interpolationId, defaultTranslationText) {

        var deferred = $q.defer();

        var table = $uses ? $translationTable[$uses] : $translationTable,
            Interpolator = (interpolationId) ? interpolatorHashMap[interpolationId] : defaultInterpolator;

        // if the translation id exists, we can just interpolate it
        if (table && Object.prototype.hasOwnProperty.call(table, translationId)) {
          var translation = table[translationId];

          // If using link, rerun $translate with linked translationId and return it
          if (translation.substr(0, 2) === '@:') {

            $translate(translation.substr(2), interpolateParams, interpolationId, defaultTranslationText)
              .then(deferred.resolve, deferred.reject);
          } else {
            deferred.resolve(Interpolator.interpolate(translation, interpolateParams));
          }
        } else {
          var missingTranslationHandlerTranslation;
          // for logging purposes only (as in $translateMissingTranslationHandlerLog), value is not returned to promise
          if ($missingTranslationHandlerFactory && !pendingLoader) {
            missingTranslationHandlerTranslation = translateByHandler(translationId, interpolateParams);
          }

          // since we couldn't translate the inital requested translation id,
          // we try it now with one or more fallback languages, if fallback language(s) is
          // configured.
          if ($uses && $fallbackLanguage && $fallbackLanguage.length) {
            fallbackTranslation(translationId, interpolateParams, Interpolator, defaultTranslationText)
                .then(function (translation) {
                  deferred.resolve(translation);
                }, function (_translationId) {
                  deferred.reject(applyNotFoundIndicators(_translationId));
                });
          } else if ($missingTranslationHandlerFactory && !pendingLoader && missingTranslationHandlerTranslation) {
            // looks like the requested translation id doesn't exists.
            // Now, if there is a registered handler for missing translations and no
            // asyncLoader is pending, we execute the handler
            if (defaultTranslationText) {
              deferred.resolve(defaultTranslationText);
              } else {
                deferred.resolve(missingTranslationHandlerTranslation);
              }
          } else {
            if (defaultTranslationText) {
              deferred.resolve(defaultTranslationText);
            } else {
              deferred.reject(applyNotFoundIndicators(translationId));
            }
          }
        }
        return deferred.promise;
      };

      var determineTranslationInstant = function (translationId, interpolateParams, interpolationId) {

        var result, table = $uses ? $translationTable[$uses] : $translationTable,
            Interpolator = defaultInterpolator;

        // if the interpolation id exists use custom interpolator
        if (interpolatorHashMap && Object.prototype.hasOwnProperty.call(interpolatorHashMap, interpolationId)) {
          Interpolator = interpolatorHashMap[interpolationId];
        }

        // if the translation id exists, we can just interpolate it
        if (table && Object.prototype.hasOwnProperty.call(table, translationId)) {
          var translation = table[translationId];

          // If using link, rerun $translate with linked translationId and return it
          if (translation.substr(0, 2) === '@:') {
            result = determineTranslationInstant(translation.substr(2), interpolateParams, interpolationId);
          } else {
            result = Interpolator.interpolate(translation, interpolateParams);
          }
        } else {
          var missingTranslationHandlerTranslation;
          // for logging purposes only (as in $translateMissingTranslationHandlerLog), value is not returned to promise
          if ($missingTranslationHandlerFactory && !pendingLoader) {
            missingTranslationHandlerTranslation = translateByHandler(translationId, interpolateParams);
          }

          // since we couldn't translate the inital requested translation id,
          // we try it now with one or more fallback languages, if fallback language(s) is
          // configured.
          if ($uses && $fallbackLanguage && $fallbackLanguage.length) {
            fallbackIndex = 0;
            result = fallbackTranslationInstant(translationId, interpolateParams, Interpolator);
          } else if ($missingTranslationHandlerFactory && !pendingLoader && missingTranslationHandlerTranslation) {
            // looks like the requested translation id doesn't exists.
            // Now, if there is a registered handler for missing translations and no
            // asyncLoader is pending, we execute the handler
            result = missingTranslationHandlerTranslation;
          } else {
            result = applyNotFoundIndicators(translationId);
          }
        }

        return result;
      };

      var clearNextLangAndPromise = function(key) {
        if ($nextLang === key) {
          $nextLang = undefined;
        }
        langPromises[key] = undefined;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#preferredLanguage
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the language key for the preferred language.
       *
       * @param {string} langKey language String or Array to be used as preferredLanguage (changing at runtime)
       *
       * @return {string} preferred language key
       */
      $translate.preferredLanguage = function (langKey) {
        if(langKey) {
          setupPreferredLanguage(langKey);
        }
        return $preferredLanguage;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#cloakClassName
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the configured class name for `translate-cloak` directive.
       *
       * @return {string} cloakClassName
       */
      $translate.cloakClassName = function () {
        return $cloakClassName;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#nestedObjectDelimeter
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the configured delimiter for nested namespaces.
       *
       * @return {string} nestedObjectDelimeter
       */
      $translate.nestedObjectDelimeter = function () {
        return $nestedObjectDelimeter;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#fallbackLanguage
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the language key for the fallback languages or sets a new fallback stack.
       *
       * @param {string=} langKey language String or Array of fallback languages to be used (to change stack at runtime)
       *
       * @return {string||array} fallback language key
       */
      $translate.fallbackLanguage = function (langKey) {
        if (langKey !== undefined && langKey !== null) {
          fallbackStack(langKey);

          // as we might have an async loader initiated and a new translation language might have been defined
          // we need to add the promise to the stack also. So - iterate.
          if ($loaderFactory) {
            if ($fallbackLanguage && $fallbackLanguage.length) {
              for (var i = 0, len = $fallbackLanguage.length; i < len; i++) {
                if (!langPromises[$fallbackLanguage[i]]) {
                  langPromises[$fallbackLanguage[i]] = loadAsync($fallbackLanguage[i]);
                }
              }
            }
          }
          $translate.use($translate.use());
        }
        if ($fallbackWasString) {
          return $fallbackLanguage[0];
        } else {
          return $fallbackLanguage;
        }

      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#useFallbackLanguage
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Sets the first key of the fallback language stack to be used for translation.
       * Therefore all languages in the fallback array BEFORE this key will be skipped!
       *
       * @param {string=} langKey Contains the langKey the iteration shall start with. Set to false if you want to
       * get back to the whole stack
       */
      $translate.useFallbackLanguage = function (langKey) {
        if (langKey !== undefined && langKey !== null) {
          if (!langKey) {
            startFallbackIteration = 0;
          } else {
            var langKeyPosition = indexOf($fallbackLanguage, langKey);
            if (langKeyPosition > -1) {
              startFallbackIteration = langKeyPosition;
            }
          }

        }

      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#proposedLanguage
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the language key of language that is currently loaded asynchronously.
       *
       * @return {string} language key
       */
      $translate.proposedLanguage = function () {
        return $nextLang;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#storage
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns registered storage.
       *
       * @return {object} Storage
       */
      $translate.storage = function () {
        return Storage;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#use
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Tells angular-translate which language to use by given language key. This method is
       * used to change language at runtime. It also takes care of storing the language
       * key in a configured store to let your app remember the choosed language.
       *
       * When trying to 'use' a language which isn't available it tries to load it
       * asynchronously with registered loaders.
       *
       * Returns promise object with loaded language file data or string of the currently used language.
       *
       * If no or a falsy key is given it returns the currently used language key.
       * The returned string will be ```undefined``` if setting up $translate hasn't finished.
       * @example
       * $translate.use("en_US").then(function(data){
       *   $scope.text = $translate("HELLO");
       * });
       *
       * @param {string} [key] Language key
       * @return {object|string} Promise with loaded language data or the language key if a falsy param was given.
       */
      $translate.use = function (key) {
        if (!key) {
          return $uses;
        }

        var deferred = $q.defer();

        $rootScope.$emit('$translateChangeStart', {language: key});

        // Try to get the aliased language key
        var aliasedKey = negotiateLocale(key);
        if (aliasedKey) {
          key = aliasedKey;
        }

        // if there isn't a translation table for the language we've requested,
        // we load it asynchronously
        if (($forceAsyncReloadEnabled || !$translationTable[key]) && $loaderFactory && !langPromises[key]) {
          $nextLang = key;
          langPromises[key] = loadAsync(key).then(function (translation) {
            translations(translation.key, translation.table);
            deferred.resolve(translation.key);
            if ($nextLang === key) {
              useLanguage(translation.key);
            }
            return translation;
          }, function (key) {
            $rootScope.$emit('$translateChangeError', {language: key});
            deferred.reject(key);
            $rootScope.$emit('$translateChangeEnd', {language: key});
            return $q.reject(key);
          });
          langPromises[key]['finally'](function () {
            clearNextLangAndPromise(key);
          });
        } else if ($nextLang === key && langPromises[key]) {
          // we are already loading this asynchronously
          // resolve our new deferred when the old langPromise is resolved
          langPromises[key].then(function (translation) {
            deferred.resolve(translation.key);
            return translation;
          }, function (key) {
            deferred.reject(key);
            return $q.reject(key);
          });
        } else {
          deferred.resolve(key);
          useLanguage(key);
        }

        return deferred.promise;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#storageKey
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the key for the storage.
       *
       * @return {string} storage key
       */
      $translate.storageKey = function () {
        return storageKey();
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#isPostCompilingEnabled
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns whether post compiling is enabled or not
       *
       * @return {bool} storage key
       */
      $translate.isPostCompilingEnabled = function () {
        return $postCompilingEnabled;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#isForceAsyncReloadEnabled
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns whether force async reload is enabled or not
       *
       * @return {boolean} forceAsyncReload value
       */
      $translate.isForceAsyncReloadEnabled = function () {
        return $forceAsyncReloadEnabled;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#refresh
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Refreshes a translation table pointed by the given langKey. If langKey is not specified,
       * the module will drop all existent translation tables and load new version of those which
       * are currently in use.
       *
       * Refresh means that the module will drop target translation table and try to load it again.
       *
       * In case there are no loaders registered the refresh() method will throw an Error.
       *
       * If the module is able to refresh translation tables refresh() method will broadcast
       * $translateRefreshStart and $translateRefreshEnd events.
       *
       * @example
       * // this will drop all currently existent translation tables and reload those which are
       * // currently in use
       * $translate.refresh();
       * // this will refresh a translation table for the en_US language
       * $translate.refresh('en_US');
       *
       * @param {string} langKey A language key of the table, which has to be refreshed
       *
       * @return {promise} Promise, which will be resolved in case a translation tables refreshing
       * process is finished successfully, and reject if not.
       */
      $translate.refresh = function (langKey) {
        if (!$loaderFactory) {
          throw new Error('Couldn\'t refresh translation table, no loader registered!');
        }

        var deferred = $q.defer();

        function resolve() {
          deferred.resolve();
          $rootScope.$emit('$translateRefreshEnd', {language: langKey});
        }

        function reject() {
          deferred.reject();
          $rootScope.$emit('$translateRefreshEnd', {language: langKey});
        }

        $rootScope.$emit('$translateRefreshStart', {language: langKey});

        if (!langKey) {
          // if there's no language key specified we refresh ALL THE THINGS!
          var tables = [], loadingKeys = {};

          // reload registered fallback languages
          if ($fallbackLanguage && $fallbackLanguage.length) {
            for (var i = 0, len = $fallbackLanguage.length; i < len; i++) {
              tables.push(loadAsync($fallbackLanguage[i]));
              loadingKeys[$fallbackLanguage[i]] = true;
            }
          }

          // reload currently used language
          if ($uses && !loadingKeys[$uses]) {
            tables.push(loadAsync($uses));
          }

          var allTranslationsLoaded = function (tableData) {
            $translationTable = {};
            angular.forEach(tableData, function (data) {
              translations(data.key, data.table);
            });
            if ($uses) {
              useLanguage($uses);
            }
            resolve();
          };
          allTranslationsLoaded.displayName = 'refreshPostProcessor';

          $q.all(tables).then(allTranslationsLoaded, reject);

        } else if ($translationTable[langKey]) {

          var oneTranslationsLoaded = function (data) {
            translations(data.key, data.table);
            if (langKey === $uses) {
              useLanguage($uses);
            }
            resolve();
          };
          oneTranslationsLoaded.displayName = 'refreshPostProcessor';

          loadAsync(langKey).then(oneTranslationsLoaded, reject);

        } else {
          reject();
        }
        return deferred.promise;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#instant
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns a translation instantly from the internal state of loaded translation. All rules
       * regarding the current language, the preferred language of even fallback languages will be
       * used except any promise handling. If a language was not found, an asynchronous loading
       * will be invoked in the background.
       *
       * @param {string|array} translationId A token which represents a translation id
       *                                     This can be optionally an array of translation ids which
       *                                     results that the function's promise returns an object where
       *                                     each key is the translation id and the value the translation.
       * @param {object} interpolateParams Params
       * @param {string} interpolationId The id of the interpolation to use
       *
       * @return {string|object} translation
       */
      $translate.instant = function (translationId, interpolateParams, interpolationId) {

        // Detect undefined and null values to shorten the execution and prevent exceptions
        if (translationId === null || angular.isUndefined(translationId)) {
          return translationId;
        }

        // Duck detection: If the first argument is an array, a bunch of translations was requested.
        // The result is an object.
        if (angular.isArray(translationId)) {
          var results = {};
          for (var i = 0, c = translationId.length; i < c; i++) {
            results[translationId[i]] = $translate.instant(translationId[i], interpolateParams, interpolationId);
          }
          return results;
        }

        // We discarded unacceptable values. So we just need to verify if translationId is empty String
        if (angular.isString(translationId) && translationId.length < 1) {
          return translationId;
        }

        // trim off any whitespace
        if (translationId) {
          translationId = trim.apply(translationId);
        }

        var result, possibleLangKeys = [];
        if ($preferredLanguage) {
          possibleLangKeys.push($preferredLanguage);
        }
        if ($uses) {
          possibleLangKeys.push($uses);
        }
        if ($fallbackLanguage && $fallbackLanguage.length) {
          possibleLangKeys = possibleLangKeys.concat($fallbackLanguage);
        }
        for (var j = 0, d = possibleLangKeys.length; j < d; j++) {
          var possibleLangKey = possibleLangKeys[j];
          if ($translationTable[possibleLangKey]) {
            if (typeof $translationTable[possibleLangKey][translationId] !== 'undefined') {
              result = determineTranslationInstant(translationId, interpolateParams, interpolationId);
            } else if ($notFoundIndicatorLeft || $notFoundIndicatorRight) {
              result = applyNotFoundIndicators(translationId);
            }
          }
          if (typeof result !== 'undefined') {
            break;
          }
        }

        if (!result && result !== '') {
          // Return translation of default interpolator if not found anything.
          result = defaultInterpolator.interpolate(translationId, interpolateParams);
          if ($missingTranslationHandlerFactory && !pendingLoader) {
            result = translateByHandler(translationId, interpolateParams);
          }
        }

        return result;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#versionInfo
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the current version information for the angular-translate library
       *
       * @return {string} angular-translate version
       */
      $translate.versionInfo = function () {
        return version;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#loaderCache
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns the defined loaderCache.
       *
       * @return {boolean|string|object} current value of loaderCache
       */
      $translate.loaderCache = function () {
        return loaderCache;
      };

      // internal purpose only
      $translate.directivePriority = function () {
        return directivePriority;
      };

      // internal purpose only
      $translate.statefulFilter = function () {
        return statefulFilter;
      };

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#isReady
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns whether the service is "ready" to translate (i.e. loading 1st language).
       *
       * See also {@link pascalprecht.translate.$translate#methods_onReady onReady()}.
       *
       * @return {boolean} current value of ready
       */
      $translate.isReady = function () {
        return $isReady;
      };

      var $onReadyDeferred = $q.defer();
      $onReadyDeferred.promise.then(function () {
        $isReady = true;
      });

      /**
       * @ngdoc function
       * @name pascalprecht.translate.$translate#onReady
       * @methodOf pascalprecht.translate.$translate
       *
       * @description
       * Returns whether the service is "ready" to translate (i.e. loading 1st language).
       *
       * See also {@link pascalprecht.translate.$translate#methods_isReady isReady()}.
       *
       * @param {Function=} fn Function to invoke when service is ready
       * @return {object} Promise resolved when service is ready
       */
      $translate.onReady = function (fn) {
        var deferred = $q.defer();
        if (angular.isFunction(fn)) {
          deferred.promise.then(fn);
        }
        if ($isReady) {
          deferred.resolve();
        } else {
          $onReadyDeferred.promise.then(deferred.resolve);
        }
        return deferred.promise;
      };

      // Whenever $translateReady is being fired, this will ensure the state of $isReady
      var globalOnReadyListener = $rootScope.$on('$translateReady', function () {
        $onReadyDeferred.resolve();
        globalOnReadyListener(); // one time only
        globalOnReadyListener = null;
      });
      var globalOnChangeListener = $rootScope.$on('$translateChangeEnd', function () {
        $onReadyDeferred.resolve();
        globalOnChangeListener(); // one time only
        globalOnChangeListener = null;
      });

      if ($loaderFactory) {

        // If at least one async loader is defined and there are no
        // (default) translations available we should try to load them.
        if (angular.equals($translationTable, {})) {
          if ($translate.use()) {
            $translate.use($translate.use());
          }
        }

        // Also, if there are any fallback language registered, we start
        // loading them asynchronously as soon as we can.
        if ($fallbackLanguage && $fallbackLanguage.length) {
          var processAsyncResult = function (translation) {
            translations(translation.key, translation.table);
            $rootScope.$emit('$translateChangeEnd', { language: translation.key });
            return translation;
          };
          for (var i = 0, len = $fallbackLanguage.length; i < len; i++) {
            var fallbackLanguageId = $fallbackLanguage[i];
            if ($forceAsyncReloadEnabled || !$translationTable[fallbackLanguageId]) {
              langPromises[fallbackLanguageId] = loadAsync(fallbackLanguageId).then(processAsyncResult);
            }
          }
        }
      } else {
        $rootScope.$emit('$translateReady', { language: $translate.use() });
      }

      return $translate;
    }
  ];
}
$translate.$inject = ['$STORAGE_KEY', '$windowProvider', '$translateSanitizationProvider', 'pascalprechtTranslateOverrider'];

$translate.displayName = 'displayName';

/**
 * @ngdoc object
 * @name pascalprecht.translate.$translateDefaultInterpolation
 * @requires $interpolate
 *
 * @description
 * Uses angular's `$interpolate` services to interpolate strings against some values.
 *
 * Be aware to configure a proper sanitization strategy.
 *
 * See also:
 * * {@link pascalprecht.translate.$translateSanitization}
 *
 * @return {object} $translateDefaultInterpolation Interpolator service
 */
angular.module('pascalprecht.translate').factory('$translateDefaultInterpolation', $translateDefaultInterpolation);

function $translateDefaultInterpolation ($interpolate, $translateSanitization) {

  'use strict';

  var $translateInterpolator = {},
      $locale,
      $identifier = 'default';

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateDefaultInterpolation#setLocale
   * @methodOf pascalprecht.translate.$translateDefaultInterpolation
   *
   * @description
   * Sets current locale (this is currently not use in this interpolation).
   *
   * @param {string} locale Language key or locale.
   */
  $translateInterpolator.setLocale = function (locale) {
    $locale = locale;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateDefaultInterpolation#getInterpolationIdentifier
   * @methodOf pascalprecht.translate.$translateDefaultInterpolation
   *
   * @description
   * Returns an identifier for this interpolation service.
   *
   * @returns {string} $identifier
   */
  $translateInterpolator.getInterpolationIdentifier = function () {
    return $identifier;
  };

  /**
   * @deprecated will be removed in 3.0
   * @see {@link pascalprecht.translate.$translateSanitization}
   */
  $translateInterpolator.useSanitizeValueStrategy = function (value) {
    $translateSanitization.useStrategy(value);
    return this;
  };

  /**
   * @ngdoc function
   * @name pascalprecht.translate.$translateDefaultInterpolation#interpolate
   * @methodOf pascalprecht.translate.$translateDefaultInterpolation
   *
   * @description
   * Interpolates given string agains given interpolate params using angulars
   * `$interpolate` service.
   *
   * @returns {string} interpolated string.
   */
  $translateInterpolator.interpolate = function (string, interpolationParams) {
    interpolationParams = interpolationParams || {};
    interpolationParams = $translateSanitization.sanitize(interpolationParams, 'params');

    var interpolatedText = $interpolate(string)(interpolationParams);
    interpolatedText = $translateSanitization.sanitize(interpolatedText, 'text');

    return interpolatedText;
  };

  return $translateInterpolator;
}
$translateDefaultInterpolation.$inject = ['$interpolate', '$translateSanitization'];

$translateDefaultInterpolation.displayName = '$translateDefaultInterpolation';

angular.module('pascalprecht.translate').constant('$STORAGE_KEY', 'NG_TRANSLATE_LANG_KEY');

angular.module('pascalprecht.translate')
/**
 * @ngdoc directive
 * @name pascalprecht.translate.directive:translate
 * @requires $compile
 * @requires $filter
 * @requires $interpolate
 * @restrict A
 *
 * @description
 * Translates given translation id either through attribute or DOM content.
 * Internally it uses `translate` filter to translate translation id. It possible to
 * pass an optional `translate-values` object literal as string into translation id.
 *
 * @param {string=} translate Translation id which could be either string or interpolated string.
 * @param {string=} translate-values Values to pass into translation id. Can be passed as object literal string or interpolated object.
 * @param {string=} translate-attr-ATTR translate Translation id and put it into ATTR attribute.
 * @param {string=} translate-default will be used unless translation was successful
 * @param {boolean=} translate-compile (default true if present) defines locally activation of {@link pascalprecht.translate.$translateProvider#methods_usePostCompiling}
 *
 * @example
   <example module="ngView">
    <file name="index.html">
      <div ng-controller="TranslateCtrl">

        <pre translate="TRANSLATION_ID"></pre>
        <pre translate>TRANSLATION_ID</pre>
        <pre translate translate-attr-title="TRANSLATION_ID"></pre>
        <pre translate="{{translationId}}"></pre>
        <pre translate>{{translationId}}</pre>
        <pre translate="WITH_VALUES" translate-values="{value: 5}"></pre>
        <pre translate translate-values="{value: 5}">WITH_VALUES</pre>
        <pre translate="WITH_VALUES" translate-values="{{values}}"></pre>
        <pre translate translate-values="{{values}}">WITH_VALUES</pre>
        <pre translate translate-attr-title="WITH_VALUES" translate-values="{{values}}"></pre>

      </div>
    </file>
    <file name="script.js">
      angular.module('ngView', ['pascalprecht.translate'])

      .config(function ($translateProvider) {

        $translateProvider.translations('en',{
          'TRANSLATION_ID': 'Hello there!',
          'WITH_VALUES': 'The following value is dynamic: {{value}}'
        }).preferredLanguage('en');

      });

      angular.module('ngView').controller('TranslateCtrl', function ($scope) {
        $scope.translationId = 'TRANSLATION_ID';

        $scope.values = {
          value: 78
        };
      });
    </file>
    <file name="scenario.js">
      it('should translate', function () {
        inject(function ($rootScope, $compile) {
          $rootScope.translationId = 'TRANSLATION_ID';

          element = $compile('<p translate="TRANSLATION_ID"></p>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toBe('Hello there!');

          element = $compile('<p translate="{{translationId}}"></p>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toBe('Hello there!');

          element = $compile('<p translate>TRANSLATION_ID</p>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toBe('Hello there!');

          element = $compile('<p translate>{{translationId}}</p>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toBe('Hello there!');

          element = $compile('<p translate translate-attr-title="TRANSLATION_ID"></p>')($rootScope);
          $rootScope.$digest();
          expect(element.attr('title')).toBe('Hello there!');
        });
      });
    </file>
   </example>
 */
.directive('translate', translateDirective);
function translateDirective($translate, $q, $interpolate, $compile, $parse, $rootScope) {

  'use strict';

  /**
   * @name trim
   * @private
   *
   * @description
   * trim polyfill
   *
   * @returns {string} The string stripped of whitespace from both ends
   */
  var trim = function() {
    return this.toString().replace(/^\s+|\s+$/g, '');
  };

  return {
    restrict: 'AE',
    scope: true,
    priority: $translate.directivePriority(),
    compile: function (tElement, tAttr) {

      var translateValuesExist = (tAttr.translateValues) ?
        tAttr.translateValues : undefined;

      var translateInterpolation = (tAttr.translateInterpolation) ?
        tAttr.translateInterpolation : undefined;

      var translateValueExist = tElement[0].outerHTML.match(/translate-value-+/i);

      var interpolateRegExp = '^(.*)(' + $interpolate.startSymbol() + '.*' + $interpolate.endSymbol() + ')(.*)',
          watcherRegExp = '^(.*)' + $interpolate.startSymbol() + '(.*)' + $interpolate.endSymbol() + '(.*)';

      return function linkFn(scope, iElement, iAttr) {

        scope.interpolateParams = {};
        scope.preText = '';
        scope.postText = '';
        scope.translateNamespace = getTranslateNamespace(scope);
        var translationIds = {};

        var initInterpolationParams = function (interpolateParams, iAttr, tAttr) {
          // initial setup
          if (iAttr.translateValues) {
            angular.extend(interpolateParams, $parse(iAttr.translateValues)(scope.$parent));
          }
          // initially fetch all attributes if existing and fill the params
          if (translateValueExist) {
            for (var attr in tAttr) {
              if (Object.prototype.hasOwnProperty.call(iAttr, attr) && attr.substr(0, 14) === 'translateValue' && attr !== 'translateValues') {
                var attributeName = angular.lowercase(attr.substr(14, 1)) + attr.substr(15);
                interpolateParams[attributeName] = tAttr[attr];
              }
            }
          }
        };

        // Ensures any change of the attribute "translate" containing the id will
        // be re-stored to the scope's "translationId".
        // If the attribute has no content, the element's text value (white spaces trimmed off) will be used.
        var observeElementTranslation = function (translationId) {

          // Remove any old watcher
          if (angular.isFunction(observeElementTranslation._unwatchOld)) {
            observeElementTranslation._unwatchOld();
            observeElementTranslation._unwatchOld = undefined;
          }

          if (angular.equals(translationId , '') || !angular.isDefined(translationId)) {
            var iElementText = trim.apply(iElement.text());

            // Resolve translation id by inner html if required
            var interpolateMatches = iElementText.match(interpolateRegExp);
            // Interpolate translation id if required
            if (angular.isArray(interpolateMatches)) {
              scope.preText = interpolateMatches[1];
              scope.postText = interpolateMatches[3];
              translationIds.translate = $interpolate(interpolateMatches[2])(scope.$parent);
              var watcherMatches = iElementText.match(watcherRegExp);
              if (angular.isArray(watcherMatches) && watcherMatches[2] && watcherMatches[2].length) {
                observeElementTranslation._unwatchOld = scope.$watch(watcherMatches[2], function (newValue) {
                  translationIds.translate = newValue;
                  updateTranslations();
                });
              }
            } else {
              translationIds.translate = iElementText;
            }
          } else {
            translationIds.translate = translationId;
          }
          updateTranslations();
        };

        var observeAttributeTranslation = function (translateAttr) {
          iAttr.$observe(translateAttr, function (translationId) {
            translationIds[translateAttr] = translationId;
            updateTranslations();
          });
        };

        // initial setup with values
        initInterpolationParams(scope.interpolateParams, iAttr, tAttr);

        var firstAttributeChangedEvent = true;
        iAttr.$observe('translate', function (translationId) {
          if (typeof translationId === 'undefined') {
            // case of element "<translate>xyz</translate>"
            observeElementTranslation('');
          } else {
            // case of regular attribute
            if (translationId !== '' || !firstAttributeChangedEvent) {
              translationIds.translate = translationId;
              updateTranslations();
            }
          }
          firstAttributeChangedEvent = false;
        });

        for (var translateAttr in iAttr) {
          if (iAttr.hasOwnProperty(translateAttr) && translateAttr.substr(0, 13) === 'translateAttr') {
            observeAttributeTranslation(translateAttr);
          }
        }

        iAttr.$observe('translateDefault', function (value) {
          scope.defaultText = value;
        });

        if (translateValuesExist) {
          iAttr.$observe('translateValues', function (interpolateParams) {
            if (interpolateParams) {
              scope.$parent.$watch(function () {
                angular.extend(scope.interpolateParams, $parse(interpolateParams)(scope.$parent));
              });
            }
          });
        }

        if (translateValueExist) {
          var observeValueAttribute = function (attrName) {
            iAttr.$observe(attrName, function (value) {
              var attributeName = angular.lowercase(attrName.substr(14, 1)) + attrName.substr(15);
              scope.interpolateParams[attributeName] = value;
            });
          };
          for (var attr in iAttr) {
            if (Object.prototype.hasOwnProperty.call(iAttr, attr) && attr.substr(0, 14) === 'translateValue' && attr !== 'translateValues') {
              observeValueAttribute(attr);
            }
          }
        }

        // Master update function
        var updateTranslations = function () {
          for (var key in translationIds) {

            if (translationIds.hasOwnProperty(key) && translationIds[key] !== undefined) {
              updateTranslation(key, translationIds[key], scope, scope.interpolateParams, scope.defaultText, scope.translateNamespace);
            }
          }
        };

        // Put translation processing function outside loop
        var updateTranslation = function(translateAttr, translationId, scope, interpolateParams, defaultTranslationText, translateNamespace) {
          if (translationId) {
            // if translation id starts with '.' and translateNamespace given, prepend namespace
            if (translateNamespace && translationId.charAt(0) === '.') {
              translationId = translateNamespace + translationId;
            }

            $translate(translationId, interpolateParams, translateInterpolation, defaultTranslationText)
              .then(function (translation) {
                applyTranslation(translation, scope, true, translateAttr);
              }, function (translationId) {
                applyTranslation(translationId, scope, false, translateAttr);
              });
          } else {
            // as an empty string cannot be translated, we can solve this using successful=false
            applyTranslation(translationId, scope, false, translateAttr);
          }
        };

        var applyTranslation = function (value, scope, successful, translateAttr) {
          if (translateAttr === 'translate') {
            // default translate into innerHTML
            if (!successful && typeof scope.defaultText !== 'undefined') {
              value = scope.defaultText;
            }
            iElement.empty().append(scope.preText + value + scope.postText);
            var globallyEnabled = $translate.isPostCompilingEnabled();
            var locallyDefined = typeof tAttr.translateCompile !== 'undefined';
            var locallyEnabled = locallyDefined && tAttr.translateCompile !== 'false';
            if ((globallyEnabled && !locallyDefined) || locallyEnabled) {
              $compile(iElement.contents())(scope);
            }
          } else {
            // translate attribute
            if (!successful && typeof scope.defaultText !== 'undefined') {
              value = scope.defaultText;
            }
            var attributeName = iAttr.$attr[translateAttr];
            if (attributeName.substr(0, 5) === 'data-') {
              // ensure html5 data prefix is stripped
              attributeName = attributeName.substr(5);
            }
            attributeName = attributeName.substr(15);
            iElement.attr(attributeName, value);
          }
        };

        if (translateValuesExist || translateValueExist || iAttr.translateDefault) {
          scope.$watch('interpolateParams', updateTranslations, true);
        }

        // Ensures the text will be refreshed after the current language was changed
        // w/ $translate.use(...)
        var unbind = $rootScope.$on('$translateChangeSuccess', updateTranslations);

        // ensure translation will be looked up at least one
        if (iElement.text().length) {
          if (iAttr.translate) {
            observeElementTranslation(iAttr.translate);
          } else {
            observeElementTranslation('');
          }
        } else if (iAttr.translate) {
          // ensure attribute will be not skipped
          observeElementTranslation(iAttr.translate);
        }
        updateTranslations();
        scope.$on('$destroy', unbind);
      };
    }
  };
}
translateDirective.$inject = ['$translate', '$q', '$interpolate', '$compile', '$parse', '$rootScope'];

/**
 * Returns the scope's namespace.
 * @private
 * @param scope
 * @returns {string}
 */
function getTranslateNamespace(scope) {
  'use strict';
  if (scope.translateNamespace) {
    return scope.translateNamespace;
  }
  if (scope.$parent) {
    return getTranslateNamespace(scope.$parent);
  }
}

translateDirective.displayName = 'translateDirective';

angular.module('pascalprecht.translate')
/**
 * @ngdoc directive
 * @name pascalprecht.translate.directive:translateCloak
 * @requires $rootScope
 * @requires $translate
 * @restrict A
 *
 * $description
 * Adds a `translate-cloak` class name to the given element where this directive
 * is applied initially and removes it, once a loader has finished loading.
 *
 * This directive can be used to prevent initial flickering when loading translation
 * data asynchronously.
 *
 * The class name is defined in
 * {@link pascalprecht.translate.$translateProvider#cloakClassName $translate.cloakClassName()}.
 *
 * @param {string=} translate-cloak If a translationId is provided, it will be used for showing
 *                                  or hiding the cloak. Basically it relies on the translation
 *                                  resolve.
 */
.directive('translateCloak', translateCloakDirective);

function translateCloakDirective($translate) {

  'use strict';

  return {
    compile: function (tElement) {
      var applyCloak = function () {
        tElement.addClass($translate.cloakClassName());
      },
      removeCloak = function () {
        tElement.removeClass($translate.cloakClassName());
      };
      $translate.onReady(function () {
        removeCloak();
      });
      applyCloak();

      return function linkFn(scope, iElement, iAttr) {
        // Register a watcher for the defined translation allowing a fine tuned cloak
        if (iAttr.translateCloak && iAttr.translateCloak.length) {
          iAttr.$observe('translateCloak', function (translationId) {
            $translate(translationId).then(removeCloak, applyCloak);
          });
        }
      };
    }
  };
}
translateCloakDirective.$inject = ['$translate'];

translateCloakDirective.displayName = 'translateCloakDirective';

angular.module('pascalprecht.translate')
/**
 * @ngdoc directive
 * @name pascalprecht.translate.directive:translateNamespace
 * @restrict A
 *
 * @description
 * Translates given translation id either through attribute or DOM content.
 * Internally it uses `translate` filter to translate translation id. It possible to
 * pass an optional `translate-values` object literal as string into translation id.
 *
 * @param {string=} translate namespace name which could be either string or interpolated string.
 *
 * @example
   <example module="ngView">
    <file name="index.html">
      <div translate-namespace="CONTENT">

        <div>
            <h1 translate>.HEADERS.TITLE</h1>
            <h1 translate>.HEADERS.WELCOME</h1>
        </div>

        <div translate-namespace=".HEADERS">
            <h1 translate>.TITLE</h1>
            <h1 translate>.WELCOME</h1>
        </div>

      </div>
    </file>
    <file name="script.js">
      angular.module('ngView', ['pascalprecht.translate'])

      .config(function ($translateProvider) {

        $translateProvider.translations('en',{
          'TRANSLATION_ID': 'Hello there!',
          'CONTENT': {
            'HEADERS': {
                TITLE: 'Title'
            }
          },
          'CONTENT.HEADERS.WELCOME': 'Welcome'
        }).preferredLanguage('en');

      });

    </file>
   </example>
 */
.directive('translateNamespace', translateNamespaceDirective);

function translateNamespaceDirective() {

  'use strict';

  return {
    restrict: 'A',
    scope: true,
    compile: function () {
      return {
        pre: function (scope, iElement, iAttrs) {
          scope.translateNamespace = getTranslateNamespace(scope);

          if (scope.translateNamespace && iAttrs.translateNamespace.charAt(0) === '.') {
            scope.translateNamespace += iAttrs.translateNamespace;
          } else {
            scope.translateNamespace = iAttrs.translateNamespace;
          }
        }
      };
    }
  };
}

/**
 * Returns the scope's namespace.
 * @private
 * @param scope
 * @returns {string}
 */
function getTranslateNamespace(scope) {
  'use strict';
  if (scope.translateNamespace) {
    return scope.translateNamespace;
  }
  if (scope.$parent) {
    return getTranslateNamespace(scope.$parent);
  }
}

translateNamespaceDirective.displayName = 'translateNamespaceDirective';

angular.module('pascalprecht.translate')
/**
 * @ngdoc filter
 * @name pascalprecht.translate.filter:translate
 * @requires $parse
 * @requires pascalprecht.translate.$translate
 * @function
 *
 * @description
 * Uses `$translate` service to translate contents. Accepts interpolate parameters
 * to pass dynamized values though translation.
 *
 * @param {string} translationId A translation id to be translated.
 * @param {*=} interpolateParams Optional object literal (as hash or string) to pass values into translation.
 *
 * @returns {string} Translated text.
 *
 * @example
   <example module="ngView">
    <file name="index.html">
      <div ng-controller="TranslateCtrl">

        <pre>{{ 'TRANSLATION_ID' | translate }}</pre>
        <pre>{{ translationId | translate }}</pre>
        <pre>{{ 'WITH_VALUES' | translate:'{value: 5}' }}</pre>
        <pre>{{ 'WITH_VALUES' | translate:values }}</pre>

      </div>
    </file>
    <file name="script.js">
      angular.module('ngView', ['pascalprecht.translate'])

      .config(function ($translateProvider) {

        $translateProvider.translations('en', {
          'TRANSLATION_ID': 'Hello there!',
          'WITH_VALUES': 'The following value is dynamic: {{value}}'
        });
        $translateProvider.preferredLanguage('en');

      });

      angular.module('ngView').controller('TranslateCtrl', function ($scope) {
        $scope.translationId = 'TRANSLATION_ID';

        $scope.values = {
          value: 78
        };
      });
    </file>
   </example>
 */
.filter('translate', translateFilterFactory);

function translateFilterFactory($parse, $translate) {

  'use strict';

  var translateFilter = function (translationId, interpolateParams, interpolation) {

    if (!angular.isObject(interpolateParams)) {
      interpolateParams = $parse(interpolateParams)(this);
    }

    return $translate.instant(translationId, interpolateParams, interpolation);
  };

  if ($translate.statefulFilter()) {
    translateFilter.$stateful = true;
  }

  return translateFilter;
}
translateFilterFactory.$inject = ['$parse', '$translate'];

translateFilterFactory.displayName = 'translateFilterFactory';

angular.module('pascalprecht.translate')

/**
 * @ngdoc object
 * @name pascalprecht.translate.$translationCache
 * @requires $cacheFactory
 *
 * @description
 * The first time a translation table is used, it is loaded in the translation cache for quick retrieval. You
 * can load translation tables directly into the cache by consuming the
 * `$translationCache` service directly.
 *
 * @return {object} $cacheFactory object.
 */
  .factory('$translationCache', $translationCache);

function $translationCache($cacheFactory) {

  'use strict';

  return $cacheFactory('translations');
}
$translationCache.$inject = ['$cacheFactory'];

$translationCache.displayName = '$translationCache';
return 'pascalprecht.translate';

}));

/*!
 * angular-translate - v2.8.1 - 2015-10-01
 * 
 * Copyright (c) 2015 The angular-translate team, Pascal Precht; Licensed MIT
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function () {
      return (factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    factory();
  }
}(this, function () {

angular.module('pascalprecht.translate')
/**
 * @ngdoc object
 * @name pascalprecht.translate.$translateStaticFilesLoader
 * @requires $q
 * @requires $http
 *
 * @description
 * Creates a loading function for a typical static file url pattern:
 * "lang-en_US.json", "lang-de_DE.json", etc. Using this builder,
 * the response of these urls must be an object of key-value pairs.
 *
 * @param {object} options Options object, which gets prefix, suffix and key.
 */
.factory('$translateStaticFilesLoader', $translateStaticFilesLoader);

function $translateStaticFilesLoader($q, $http) {

  'use strict';

  return function (options) {

    if (!options || (!angular.isArray(options.files) && (!angular.isString(options.prefix) || !angular.isString(options.suffix)))) {
      throw new Error('Couldn\'t load static files, no files and prefix or suffix specified!');
    }

    if (!options.files) {
      options.files = [{
        prefix: options.prefix,
        suffix: options.suffix
      }];
    }

    var load = function (file) {
      if (!file || (!angular.isString(file.prefix) || !angular.isString(file.suffix))) {
        throw new Error('Couldn\'t load static file, no prefix or suffix specified!');
      }

      return $http(angular.extend({
        url: [
          file.prefix,
          options.key,
          file.suffix
        ].join(''),
        method: 'GET',
        params: ''
      }, options.$http))
        .then(function(result) {
          return result.data;
        }, function () {
          return $q.reject(options.key);
        });
    };

    var deferred = $q.defer(),
        promises = [],
        length = options.files.length;

    for (var i = 0; i < length; i++) {
      promises.push(load({
        prefix: options.files[i].prefix,
        key: options.key,
        suffix: options.files[i].suffix
      }));
    }

    $q.all(promises)
      .then(function (data) {
        var length = data.length,
            mergedData = {};

        for (var i = 0; i < length; i++) {
          for (var key in data[i]) {
            mergedData[key] = data[i][key];
          }
        }

        deferred.resolve(mergedData);
      }, function (data) {
        deferred.reject(data);
      });

    return deferred.promise;
  };
}
$translateStaticFilesLoader.$inject = ['$q', '$http'];

$translateStaticFilesLoader.displayName = '$translateStaticFilesLoader';
return 'pascalprecht.translate';

}));
