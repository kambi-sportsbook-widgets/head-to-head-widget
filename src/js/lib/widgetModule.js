CoreLibrary.widgetModule = (function () {
   'use strict';

   return {
      api: { // placeholders for when not running inside iframe
         requestSetup: function () {},
         request: function () {},
         set: function () {},
         remove: function () {}
      },
      config: {
         routeRoot: '',
         auth: false,
         device: null
      },
      setConfig: function ( config ) {
         for ( var i in config ) {
            if ( config.hasOwnProperty(i) && this.config.hasOwnProperty(i) ) {
               this.config[i] = config[i];
            }
         }
         // Make sure that the routeRoot is not null or undefined
         if ( this.config.routeRoot == null ) {
            this.config.routeRoot = '';
         } else if ( this.config.routeRoot.length > 0 && this.config.routeRoot.slice(-1) !== '/' ) {
            // If the routeRoot is not empty we need to make sure it has a trailing slash
            this.config.routeRoot += '/';
         }
      },
      handleResponse: function ( response ) {
         switch ( response.type ) {
            case this.api.WIDGET_HEIGHT:
               // We've received a height response
               console.debug('WIDGET:HEIGHT', response.data);
               break;
            case this.api.BETSLIP_OUTCOMES:
               // We've received a response with the outcomes currently in the betslip
               console.debug('OUTCOMES:UPDATE', response.data);
               break;
            case this.api.WIDGET_ARGS:
               // We've received a response with the arguments set in the
               console.debug('WIDGET:ARGS', response.data);
               break;
            case this.api.PAGE_INFO:
               // Received page info response
               console.debug('PAGE:INFO', response.data);
               break;
            case this.api.CLIENT_ODDS_FORMAT:
               // Received odds format response
               console.debug('ODDS:FORMAT', response.data);
               break;
            case this.api.CLIENT_CONFIG:
               console.debug('CLIENT:CONFIG', response.data);
               break;
            case this.api.USER_LOGGED_IN:
               console.debug('User logged in', response.data);
               console.debug('USER:LOGGED_IN', response.data);
               break;
            case 'Setup':
               console.debug('Setup response', response.data);
               break;
            default:
               // Unhandled response
               console.info('Unhandled response type: ' + response.type);
               console.info(response);
               break;
         }
      },
      requestSetup: function ( callback ) {
         this.api.requestSetup(callback);
      },

      requestWidgetHeight: function () {
         this.api.request(this.api.WIDGET_HEIGHT);
      },

      setWidgetHeight: function ( height ) {
         this.api.set(this.api.WIDGET_HEIGHT, height);
      },

      enableWidgetTransition: function ( enableTransition ) {
         if ( enableTransition ) {
            this.api.set(this.api.WIDGET_ENABLE_TRANSITION);
         } else {
            this.api.set(this.api.WIDGET_DISABLE_TRANSITION);
         }
      },

      removeWidget: function () {
         this.api.remove();
      },

      navigateToLiveEvent: function ( eventId ) {
         this.navigateClient('event/live/' + eventId);
      },

      navigateToEvent: function ( eventId ) {
         this.navigateClient('event/' + eventId);
      },

      navigateToFilter: function ( filterParams ) {
         this.navigateClient(filterParams);
      },

      navigateToLiveEvents: function () {
         this.navigateClient(['in-play']);
      },

      addOutcomeToBetslip: function ( outcomes, stakes, updateMode, source ) {
         var arrOutcomes = [];
         // Check if the outcomes parameter is an array and add it, otherwise add the the single value as an array
         if ( outcomes.isArray() ) {
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
            if ( stakes.isArray() ) {
               data.stakes = stakes;
            } else {
               data.stakes = [stakes];
            }
         }

         // Set the coupon type, defaults to TYPE_SINGLE
         data.couponType = arrOutcomes.length === 1 ? this.api.BETSLIP_OUTCOMES_ARGS.TYPE_SINGLE : this.api.BETSLIP_OUTCOMES_ARGS.TYPE_COMBINATION;

         // Set the update mode, defaults to UPDATE_APPEND
         data.updateMode = updateMode !== 'replace' ? this.api.BETSLIP_OUTCOMES_ARGS.UPDATE_APPEND : this.api.BETSLIP_OUTCOMES_ARGS.UPDATE_REPLACE;
         if ( source != null ) {
            data.source = source;
         }

         // Send the data to the widget this.api
         this.api.set(this.api.BETSLIP_OUTCOMES, data);
      },

      removeOutcomeFromBetslip: function ( outcomes ) {
         var arrOutcomes = [];
         if ( outcomes.isArray() ) {
            arrOutcomes = outcomes;
         } else {
            arrOutcomes.push(outcomes);
         }
         this.api.set(this.api.BETSLIP_OUTCOMES_REMOVE, { outcomes: arrOutcomes });
      },

      requestBetslipOutcomes: function () {
         this.api.request(this.api.BETSLIP_OUTCOMES);
      },

      requestPageInfo: function () {
         this.api.request(this.api.PAGE_INFO);
      },

      requestWidgetArgs: function () {
         this.api.request(this.api.WIDGET_ARGS);
      },

      requestClientConfig: function () {
         this.api.request(this.api.CLIENT_CONFIG);
      },

      requestOddsFormat: function () {
         this.api.request(this.api.CLIENT_ODDS_FORMAT);
      },

      requestOddsAsAmerican: function ( odds ) {
         return new Promise(function ( resolve, reject ) {
            this.api.requestOddsAsAmerican(odds, function ( americanOdds ) {
               resolve(americanOdds);
            });
         }.bind(this));
      },

      requestOddsAsFractional: function ( odds ) {
         return new Promise(function ( resolve, reject ) {
            this.api.requestOddsAsFractional(odds, function ( fractionalOdds ) {
               resolve(fractionalOdds);
            });
         });
      },

      navigateClient: function ( destination ) {
         if ( typeof destination === 'string' ) {
            this.api.navigateClient('#' + this.config.routeRoot + destination);
         } else if ( destination.isArray() ) {
            var filter = this.api.createFilterUrl(destination, this.config.routeRoot);
            this.api.navigateClient(filter);
         }
      }
   };
})();
