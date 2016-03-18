window.CoreLibrary = (function () {

   'use strict';

   function checkStatus ( response ) {
      if ( response.status >= 200 && response.status < 300 ) {
         return response;
      } else {
         var error = new Error(response.statusText);
         error.response = response;
         throw error;
      }
   }

   function parseJSON ( response ) {
      return response.json();
   }

   sightglass.adapters = rivets.adapters;
   sightglass.root = '.';

   return {
      widgetModule: null,
      offeringModule: null,
      statisticsModule: null,
      config: {
         oddsFormat: 'decimal',
         apiVersion: 'v2',
         streamingAllowedForPlayer: false
      },
      height: 450,
      pageInfo: {},
      init: function ( setDefaultHeight ) {
         return new Promise(function ( resolve, reject ) {
            if ( window.KambiWidget ) {
               // For development purposes we might want to load a widget on it's own so we check if we are in an iframe, if not then load some fake data
               if ( window.self === window.top ) {
                  console.warn(window.location.host + window.location.pathname + ' is being loaded as stand-alone');
                  fetch('mockSetupData.json')
                     .then(checkStatus)
                     .then(parseJSON)
                     .then(function ( mockSetupData ) {
                        console.debug('Loaded mock setup data');
                        console.debug(mockSetupData);
                        this.applySetupData(mockSetupData, setDefaultHeight);
                        if (this.translationModule != null) {
                           this.translationModule.fetchTranslations(mockSetupData.clientConfig.locale).then(function () {
                              resolve(mockSetupData['arguments']);
                           }.bind(this));
                        } else {
                           resolve(mockSetupData['arguments']);
                        }
                     }.bind(this))
                     .catch(function ( error ) {
                        console.debug('Request failed');
                        console.trace(error);
                        reject();
                     });
               } else {
                  window.KambiWidget.apiReady = function ( api ) {
                     this.widgetModule.api = api;
                     console.debug(api);
                     console.debug('API Ready');
                     this.requestSetup(function ( setupData ) {
                        this.applySetupData(setupData, setDefaultHeight);

                        // TODO: Move this to widgets so we don't request them when not needed
                        // Request the outcomes from the betslip so we can update our widget, this will also sets up a subscription for future betslip updates
                        this.widgetModule.requestBetslipOutcomes();
                        // Request the odds format that is set in the sportsbook, this also sets up a subscription for future odds format changes
                        this.widgetModule.requestOddsFormat();

                        if (this.translationModule != null) {
                           this.translationModule.fetchTranslations(setupData.clientConfig.locale).then(function () {
                              resolve(setupData['arguments']);
                           }.bind(this));
                        } else {
                           resolve(setupData['arguments']);
                        }
                     }.bind(this));
                  }.bind(this);
                  window.KambiWidget.receiveResponse = function ( dataObject ) {
                     this.widgetModule.handleResponse(dataObject);
                  }.bind(this);
               }
            } else {
               console.warn('Kambi widget API not loaded');
               reject();
            }
         }.bind(this));
      },

      applySetupData: function ( setupData, setDefaultHeight ) {
         if ( setupData.clientConfig.oddsFormat != null ) {
            this.setOddsFormat(setupData.clientConfig.oddsFormat);
         }

         // Set the configuration in the offering module
         this.offeringModule.setConfig(setupData.clientConfig);

         // Set the configuration in the widget api module
         this.widgetModule.setConfig(setupData.clientConfig);

         // Set page info
         this.setPageInfo(setupData.pageInfo);

         // Set the offering in the API service
         if ( setupData['arguments'] != null && setupData['arguments'].hasOwnProperty('offering') ) {
            this.offeringModule.setOffering(setupData['arguments'].offering);
         } else {
            console.warn('No offering has been set, API requests will not work. Make sure the offering is set in the widget args in your configuration');
         }

         if ( setDefaultHeight === true ) {
            this.setHeight(setupData.height);
         }

         this.config = setupData;
      },

      requestSetup: function ( callback ) {
         this.widgetModule.requestSetup(callback);
      },

      receiveRespone: function ( response ) {
         console.debug(response);
      },

      setOddsFormat: function ( oddsFormat ) {
         this.config.oddsFormat = oddsFormat;
      },

      setHeight: function ( height ) {
         this.height = height;
         this.widgetModule.setHeight(height);
      },

      setPageInfo: function ( pageInfo ) {
         // Check if the last character in the pageParam property is a slash, if not add it so we can use this property in filter requests
         if ( pageInfo.pageType === 'filter' && pageInfo.pageParam.substr(-1) !== '/' ) {
            pageInfo.pageParam += '/';
         }
         this.pageInfo = pageInfo;
      },

      getData: function ( url ) {
         return fetch(url)
            .then(checkStatus)
            .then(parseJSON)
            .catch(function ( error ) {
               console.debug('Error fetching data');
               console.trace(error);
            });
      }
   };

})();
