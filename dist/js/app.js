'use strict';

window.CoreLibrary = function () {
   'use strict';

   /** Rivets formatters **/

   rivets.formatters['==='] = function (v1, v2) {
      return v1 === v2;
   };
   rivets.formatters['=='] = function (v1, v2) {
      return v1 == v2; // jshint ignore:line
   };
   rivets.formatters['>='] = function (v1, v2) {
      return v1 >= v2;
   };
   rivets.formatters['>'] = function (v1, v2) {
      return v1 > v2;
   };
   rivets.formatters['<='] = function (v1, v2) {
      return v1 <= v2;
   };
   rivets.formatters['<'] = function (v1, v2) {
      return v1 < v2;
   };
   rivets.formatters['!='] = function (v1, v2) {
      return v1 != v2; // jshint ignore:line
   };
   rivets.formatters['!=='] = function (v1, v2) {
      return v1 !== v2;
   };
   rivets.formatters['and'] = function (v1, v2) {
      return v1 && v2;
   };
   rivets.formatters['or'] = function (v1, v2) {
      return v1 || v2;
   };
   rivets.formatters['not'] = function (v1) {
      return !v1;
   };
   rivets.formatters['-'] = function (v1, v2) {
      return v1 - v2;
   };
   rivets.formatters['+'] = function (v1, v2) {
      return v1 + v2;
   };
   rivets.formatters['*'] = function (v1, v2) {
      return v1 * v2;
   };
   rivets.formatters['/'] = function (v1, v2) {
      return v1 / v2;
   };

   /**
    * Returns specified object at specified key for specified array index
    * @param arr The source array
    * @param index The desired index from given array
    * @param key The desired key of the object to be returned
    * @returns {*}
    */
   rivets.formatters.array_at = function (arr, index, key) {
      return arr == null ? [] : arr[index][key];
   };

   /**
    * Returns an array of objects where each objects contains key and value properties based on the passed array
    * @param {Object} obj The source object
    * @returns {Array}
    */
   rivets.formatters.property_list = function (obj) {
      return function () {
         var properties = [];
         for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
               properties.push({ key: key, value: obj[key] });
            }
         }
         return properties;
      }();
   };

   rivets.binders['style-*'] = function (el, value) {
      el.style.setProperty(this.args[0], value);
   };

   /**
    * Cloaking waits for element to bind and then sets it visible
    * @type {{priority: number, bind: rivets.binders.cloak.bind}}
    */
   rivets.binders.cloak = {
      priority: -1000,
      bind: function bind(el) {
         el.style.opacity = 1;
      }
   };

   /**
    * Binder that adds animation class
    *
    * Used in DOM as <div rv-anim-stagger="index"></div>
    *
    * @param el DOM element to apply classes
    * @param index List item index
    */
   rivets.binders['anim-stagger'] = function (el, index) {
      var speed = 70;
      el.classList.remove('anim-stagger');
      el.classList.add('anim-stagger');
      setTimeout(function () {
         el.classList.add('anim-enter-active');
      }, speed * index);
   };

   /**
    * Checks the HTTP status of a response
    */
   function checkStatus(response) {
      if (response.status >= 200 && response.status < 300) {
         return response;
      } else {
         var error = new Error(response.statusText);
         error.response = response;
         throw error;
      }
   }

   /**
    * Parses the response as json
    */
   function parseJSON(response) {
      return response.json();
   }

   sightglass.adapters = rivets.adapters;
   sightglass.root = '.';

   return {
      expectedApiVersion: '{{expectedApiVersion}}', // this value is replaced with the API version number during the compilation step
      widgetModule: null,
      offeringModule: null,
      statisticsModule: null,
      apiReady: false, // this value is set to true once the kambi API has finished loaded
      config: {
         oddsFormat: 'decimal',
         apiVersion: 'v2',
         streamingAllowedForPlayer: false
      },
      height: 450,
      pageInfo: {},
      init: function init(setDefaultHeight) {
         return new Promise(function (resolve, reject) {
            if (window.KambiWidget) {
               // For development purposes we might want to load a widget on it's own so we check if we are in an iframe, if not then load some fake data
               if (window.self === window.top) {
                  void 0;
                  // Load the mock config data
                  fetch('mockSetupData.json').then(checkStatus).then(parseJSON).then(function (mockSetupData) {
                     // Output some debug info that could be helpful
                     void 0;
                     void 0;
                     // Apply the mock config data to the core
                     this.applySetupData(mockSetupData, setDefaultHeight);
                     if (this.translationModule != null) {
                        this.translationModule.fetchTranslations(mockSetupData.clientConfig.locale).then(function () {
                           resolve(mockSetupData['arguments']);
                        }.bind(this));
                     } else {
                        resolve(mockSetupData['arguments']);
                     }
                  }.bind(this)).catch(function (error) {
                     void 0;
                     void 0;
                     reject();
                  });
               } else {
                  window.KambiWidget.apiReady = function (api) {
                     this.widgetModule.api = api;
                     if (api.VERSION !== this.expectedApiVersion) {
                        void 0;
                     }

                     // Request the setup info from the widget api
                     this.requestSetup(function (setupData) {
                        // Apply the config data to the core
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
                  // Setup the response handler for the widget api
                  window.KambiWidget.receiveResponse = function (dataObject) {
                     this.widgetModule.handleResponse(dataObject);
                  }.bind(this);
               }
            } else {
               void 0;
               reject();
            }
         }.bind(this));
      },

      applySetupData: function applySetupData(setupData, setDefaultHeight) {
         // Set the odds format
         if (setupData.clientConfig.oddsFormat != null) {
            this.setOddsFormat(setupData.clientConfig.oddsFormat);
         }

         // Set the configuration in the offering module
         this.offeringModule.setConfig(setupData.clientConfig);

         // Set the configuration in the widget api module
         this.widgetModule.setConfig(setupData.clientConfig);

         // Set the configuration in the widget api module
         this.statisticsModule.setConfig(setupData.clientConfig);

         // Set page info
         this.setPageInfo(setupData.pageInfo);

         if (setDefaultHeight === true) {
            this.setHeight(setupData.height);
         }
         this.apiReady = true;
         this.config = setupData;
      },

      requestSetup: function requestSetup(callback) {
         this.widgetModule.requestSetup(callback);
      },

      receiveRespone: function receiveRespone(response) {
         void 0;
      },

      setOddsFormat: function setOddsFormat(oddsFormat) {
         this.config.oddsFormat = oddsFormat;
      },

      setHeight: function setHeight(height) {
         this.height = height;
         this.widgetModule.setHeight(height);
      },

      setPageInfo: function setPageInfo(pageInfo) {
         // Check if the last character in the pageParam property is a slash, if not add it so we can use this property in filter requests
         if (pageInfo.pageType === 'filter' && pageInfo.pageParam.substr(-1) !== '/') {
            pageInfo.pageParam += '/';
         }
         this.pageInfo = pageInfo;
      },

      getData: function getData(url) {
         return fetch(url).then(checkStatus).then(parseJSON).catch(function (error) {
            void 0;
            void 0;
            throw error;
         });
      },

      getFile: function getFile(url) {
         return fetch(url).then(checkStatus).catch(function (error) {
            void 0;
            void 0;
            throw error;
         });
      }
   };
}();
//# sourceMappingURL=coreLibrary.js.map

'use strict';

CoreLibrary.offeringModule = function () {
   'use strict';

   return {
      config: {
         apiBaseUrl: null,
         apiUrl: null,
         channelId: null,
         currency: null,
         locale: null,
         market: null,
         offering: null,
         customer: null,
         clientId: 2,
         version: null,
         routeRoot: '',
         auth: false,
         device: null
      },
      setConfig: function setConfig(config) {
         // Iterate over the passed object properties, if the exist in the predefined config object then we set them
         for (var i in config) {
            if (config.hasOwnProperty(i) && this.config.hasOwnProperty(i)) {
               this.config[i] = config[i];
               switch (i) {
                  case 'locale':
                     // TODO: deal with locale setting
                     break;
               }
            }
         }
      },
      getGroupEvents: function getGroupEvents(groupId) {
         var requesPath = '/event/group/' + groupId + '.json';
         return this.doRequest(requesPath);
      },
      getEventsByFilter: function getEventsByFilter(filter, params) {
         // Todo: Update this method once documentation is available
         var requestPath = '/listView/' + filter;
         return this.doRequest(requestPath, params, 'v3');
      },
      getLiveEvents: function getLiveEvents() {
         var requestPath = '/event/live/open.json';
         return this.doRequest(requestPath);
      },
      doRequest: function doRequest(requestPath, params, version) {
         if (this.config.offering == null) {
            void 0;
         } else {
            var apiUrl = this.config.apiBaseUrl.replace('{apiVersion}', version != null ? version : this.config.version);
            var requestUrl = apiUrl + this.config.offering + requestPath;
            var overrideParams = params || {};
            var requestParams = {
               lang: overrideParams.locale || this.config.locale,
               market: overrideParams.market || this.config.market,
               client_id: overrideParams.clientId || this.config.clientId,
               include: overrideParams.include || '',
               betOffers: overrideParams.betOffers || 'COMBINED',
               categoryGroup: overrideParams.categoryGroup || 'COMBINED',
               displayDefault: overrideParams.displayDefault || true
            };
            requestUrl += '?' + Object.keys(requestParams).map(function (k) {
               return encodeURIComponent(k) + '=' + encodeURIComponent(requestParams[k]);
            }).join('&');

            return CoreLibrary.getData(requestUrl);
         }
      }
   };
}();
//# sourceMappingURL=offeringModule.js.map

'use strict';

CoreLibrary.statisticsModule = function () {
   'use strict';

   return {
      config: {
         baseApiUrl: 'https://api.kambi.com/statistics/api/',
         offering: null
      },
      setConfig: function setConfig(config) {
         this.config.offering = config.offering;
      },
      getStatistics: function getStatistics(type, filter) {
         // Remove url parameters from filter
         filter = filter.match(/[^?]*/)[0];

         // Remove trailing slash if present
         if (filter[filter.length - 1] === '/') {
            filter = filter.slice(0, -1);
         }

         void 0;
         return CoreLibrary.getData(this.config.baseApiUrl + this.config.offering + '/' + type + '/' + filter + '.json');
      }
   };
}();
//# sourceMappingURL=statisticsModule.js.map

'use strict';

window.CoreLibrary.translationModule = function () {
   'use strict';

   var translationModule = {
      i18nStrings: {},

      fetchTranslations: function fetchTranslations(locale) {
         if (locale == null) {
            locale = 'en_GB';
         }
         var self = this;
         return new Promise(function (resolve, reject) {
            window.CoreLibrary.getData('i18n/' + locale + '.json').then(function (response) {
               translationModule.i18nStrings = response;
               resolve();
            }).catch(function (error) {
               if (locale !== 'en_GB') {
                  void 0;
                  self.fetchTranslations('en_GB').then(resolve);
               } else {
                  void 0;
                  void 0;
                  resolve();
               }
            });
         });
      }
   };

   rivets.formatters.translate = function (value) {
      if (translationModule.i18nStrings[value] != null) {
         return translationModule.i18nStrings[value];
      }
      return value;
   };

   return translationModule;
}();
//# sourceMappingURL=translationModule.js.map

'use strict';

CoreLibrary.widgetModule = function () {
   'use strict';

   var Module = Stapes.subclass();

   return {
      api: { // placeholders for when not running inside iframe
         requestSetup: function requestSetup() {},
         request: function request() {},
         set: function set() {},
         remove: function remove() {},
         createUrl: function createUrl() {}
      },
      events: new Module(),
      config: {
         routeRoot: '',
         auth: false,
         device: null
      },
      setConfig: function setConfig(config) {
         for (var i in config) {
            if (config.hasOwnProperty(i) && this.config.hasOwnProperty(i)) {
               this.config[i] = config[i];
            }
         }
         // Make sure that the routeRoot is not null or undefined
         if (this.config.routeRoot == null) {
            this.config.routeRoot = '';
         } else if (this.config.routeRoot.length > 0 && this.config.routeRoot.slice(-1) !== '/') {
            // If the routeRoot is not empty we need to make sure it has a trailing slash
            this.config.routeRoot += '/';
         }
      },
      handleResponse: function handleResponse(response) {
         switch (response.type) {
            case this.api.WIDGET_HEIGHT:
               // We've received a height response
               this.events.emit('WIDGET:HEIGHT', response.data);
               break;
            case this.api.BETSLIP_OUTCOMES:
               // We've received a response with the outcomes currently in the betslip
               this.events.emit('OUTCOMES:UPDATE', response.data);
               break;
            case this.api.WIDGET_ARGS:
               // We've received a response with the arguments set in the
               this.events.emit('WIDGET:ARGS', response.data);
               break;
            case this.api.PAGE_INFO:
               // Received page info response
               this.events.emit('PAGE:INFO', response.data);
               break;
            case this.api.CLIENT_ODDS_FORMAT:
               // Received odds format response
               this.events.emit('ODDS:FORMAT', response.data);
               break;
            case this.api.CLIENT_CONFIG:
               this.events.emit('CLIENT:CONFIG', response.data);
               break;
            case this.api.USER_LOGGED_IN:
               void 0;
               this.events.emit('USER:LOGGED_IN', response.data);
               break;
            case 'Setup':
               this.events.emit('Setup response', response.data);
               break;
            default:
               // Unhandled response
               void 0;
               void 0;
               break;
         }
      },

      createUrl: function createUrl(path, optionalRoot) {
         return this.api.createUrl(path, optionalRoot);
      },

      getPageType: function getPageType() {
         if (!CoreLibrary.config.pageInfo.pageType) {
            return '';
         }
         var pageType = CoreLibrary.config.pageInfo.pageType;
         switch (pageType) {
            case 'event':
               return '';
            case 'event-live':
               return 'live/';
            default:
               void 0;
               break;
         }
      },

      requestSetup: function requestSetup(callback) {
         this.api.requestSetup(callback);
      },

      requestWidgetHeight: function requestWidgetHeight() {
         this.api.request(this.api.WIDGET_HEIGHT);
      },

      setWidgetHeight: function setWidgetHeight(height) {
         this.api.set(this.api.WIDGET_HEIGHT, height);
      },

      enableWidgetTransition: function enableWidgetTransition(enableTransition) {
         if (enableTransition) {
            this.api.set(this.api.WIDGET_ENABLE_TRANSITION);
         } else {
            this.api.set(this.api.WIDGET_DISABLE_TRANSITION);
         }
      },

      removeWidget: function removeWidget() {
         this.api.remove();
      },

      navigateToLiveEvent: function navigateToLiveEvent(eventId) {
         this.navigateClient('event/live/' + eventId);
      },

      navigateToEvent: function navigateToEvent(eventId) {
         this.navigateClient('event/' + eventId);
      },

      navigateToFilter: function navigateToFilter(filterParams) {
         this.navigateClient(filterParams);
      },

      navigateToLiveEvents: function navigateToLiveEvents() {
         this.navigateClient(['in-play']);
      },

      addOutcomeToBetslip: function addOutcomeToBetslip(outcomes, stakes, updateMode, source) {
         var arrOutcomes = [];
         // Check if the outcomes parameter is an array and add it, otherwise add the the single value as an array
         if (Array.isArray(outcomes)) {
            arrOutcomes = outcomes;
         } else {
            arrOutcomes.push(outcomes);
         }

         // Setup the data object to be sent to the widget API
         var data = {
            outcomes: arrOutcomes
         };

         // Check if we got any stakes passed to use, add them to the data object if so
         if (stakes != null) {
            if (stakes.isArray()) {
               data.stakes = stakes;
            } else {
               data.stakes = [stakes];
            }
         }

         // Set the coupon type, defaults to TYPE_SINGLE
         data.couponType = arrOutcomes.length === 1 ? this.api.BETSLIP_OUTCOMES_ARGS.TYPE_SINGLE : this.api.BETSLIP_OUTCOMES_ARGS.TYPE_COMBINATION;

         // Set the update mode, defaults to UPDATE_APPEND
         data.updateMode = updateMode !== 'replace' ? this.api.BETSLIP_OUTCOMES_ARGS.UPDATE_APPEND : this.api.BETSLIP_OUTCOMES_ARGS.UPDATE_REPLACE;
         if (source != null) {
            data.source = source;
         }

         // Send the data to the widget this.api
         this.api.set(this.api.BETSLIP_OUTCOMES, data);
      },

      removeOutcomeFromBetslip: function removeOutcomeFromBetslip(outcomes) {
         var arrOutcomes = [];
         if (outcomes.isArray()) {
            arrOutcomes = outcomes;
         } else {
            arrOutcomes.push(outcomes);
         }
         this.api.set(this.api.BETSLIP_OUTCOMES_REMOVE, { outcomes: arrOutcomes });
      },

      requestBetslipOutcomes: function requestBetslipOutcomes() {
         this.api.request(this.api.BETSLIP_OUTCOMES);
      },

      requestPageInfo: function requestPageInfo() {
         this.api.request(this.api.PAGE_INFO);
      },

      requestWidgetArgs: function requestWidgetArgs() {
         this.api.request(this.api.WIDGET_ARGS);
      },

      requestClientConfig: function requestClientConfig() {
         this.api.request(this.api.CLIENT_CONFIG);
      },

      requestOddsFormat: function requestOddsFormat() {
         this.api.request(this.api.CLIENT_ODDS_FORMAT);
      },

      requestOddsAsAmerican: function requestOddsAsAmerican(odds) {
         return new Promise(function (resolve, reject) {
            this.api.requestOddsAsAmerican(odds, function (americanOdds) {
               resolve(americanOdds);
            });
         }.bind(this));
      },

      requestOddsAsFractional: function requestOddsAsFractional(odds) {
         return new Promise(function (resolve, reject) {
            this.api.requestOddsAsFractional(odds, function (fractionalOdds) {
               resolve(fractionalOdds);
            });
         });
      },

      navigateClient: function navigateClient(destination) {
         if (typeof destination === 'string') {
            this.api.navigateClient('#' + this.config.routeRoot + destination);
         } else if (destination.isArray()) {
            var filter = this.api.createFilterUrl(destination, this.config.routeRoot);
            this.api.navigateClient(filter);
         }
      }
   };
}();
//# sourceMappingURL=widgetModule.js.map

'use strict';

(function () {
   CoreLibrary.Component = Stapes.subclass({
      /** object with default values from args if they are not present in
       * the Kambi API provided ones
       */
      defaultArgs: {},

      /**
       * If string this value is appended to rootElement with the innerHTML DOM call
       * essentially parsing the the text as HTML
       */
      htmlTemplate: null,

      /**
       * Same as htmlTemplate, but uses this value as a path to fetch an HTML file
       * Do not use at the same time as htmlTemplate
       */
      htmlTemplateFile: null,

      constructor: function constructor(options) {
         /** object to be used in the HTML templates for data binding */
         this.scope = {};

         /**
          * Rivets view object, binds this.scope to this.rootElement
          */
         this.view = null;

         /**
          * HTML element to in which rivets.bind will be called,
          * if string uses document.querySelector to get the element
          */
         this.rootElement = null;

         if (options == null) {
            options = {};
         }
         // setting options that can be received in the constructor
         var optionsKeys = ['defaultArgs', 'rootElement'];
         optionsKeys.forEach(function (key) {
            if (typeof options[key] !== 'undefined') {
               this[key] = options[key];
            }
         }.bind(this));

         if (typeof this.htmlTemplate === 'string' && typeof this.htmlTemplateFile === 'string') {
            throw new Error('Widget can not have htmlTemplate and htmlTemplateFile set at the same time');
         }
         if (this.rootElement == null) {
            throw new Error('options.rootElement not set, please pass a HTMLElement or a CSS selector');
         }

         this.scope.args = this.defaultArgs;

         var fetchHtmlPromise;
         if (typeof this.htmlTemplateFile === 'string') {
            fetchHtmlPromise = CoreLibrary.getFile(this.htmlTemplateFile).then(function (response) {
               return response.text();
            }).then(function (html) {
               this.htmlTemplate = html;
               return this.htmlTemplate;
            }.bind(this));
         } else {
            // just resolve the promise
            fetchHtmlPromise = new Promise(function (resolve) {
               resolve();
            });
         }

         var coreLibraryPromise;
         if (CoreLibrary.apiReady === true) {
            coreLibraryPromise = new Promise(function (resolve, reject) {
               resolve();
            });
         } else {
            coreLibraryPromise = new Promise(function (resolve, reject) {
               CoreLibrary.init().then(function (widgetArgs) {
                  Object.keys(widgetArgs).forEach(function (key) {
                     this.scope.args[key] = widgetArgs[key];
                  }.bind(this));

                  var apiVersion = CoreLibrary.widgetModule.api.VERSION;
                  if (apiVersion == null) {
                     var apiVersion = '1.0.0.10';
                  }
                  this.scope.widgetCss = '//c3-static.kambi.com/sb-mobileclient/widget-api/' + apiVersion + '/resources/css/' + CoreLibrary.config.clientConfig.customer + '/' + CoreLibrary.config.clientConfig.offering + '/widgets.css';
                  resolve();
               }.bind(this));
            }.bind(this));
         }

         // fetches the component HTML in parallel with the Kambi API setup request
         // decreasing load time
         Promise.all([coreLibraryPromise, fetchHtmlPromise]).then(function () {
            if (typeof this.rootElement === 'string') {
               this.rootElement = document.querySelector(this.rootElement);
            }

            for (var i = 0; i < this.rootElement.attributes.length; ++i) {
               var at = this.rootElement.attributes[i];
               if (at.name.indexOf('data-') === 0) {
                  var name = at.name.slice(5); // removes the 'data-' from the string
                  this.scope[name] = at.value;
               }
            }

            if (typeof this.htmlTemplate === 'string') {
               this.rootElement.innerHTML = this.htmlTemplate;
            }

            this.view = rivets.bind(this.rootElement, this.scope);

            this.init(CoreLibrary.config.arguments);
         }.bind(this)).catch(function (error) {
            void 0;
            void 0;
         });
      }
   });
})();
//# sourceMappingURL=Component.js.map

'use strict';

(function () {
   'use strict';

   CoreLibrary.PaginationComponent = CoreLibrary.Component.subclass({
      htmlTemplate: '<div class="kw-pagination l-flexbox l-pack-center l-align-center">' + '<span rv-on-click="previousPage" rv-class-disabled="firstPage"' + 'class="kw-page-link kw-pagination-arrow">' + '<i class="icon-angle-left"></i>' + '</span>' + '<span rv-each-page="pages" rv-on-click="page.clickEvent" rv-class-kw-active-page="page.selected"' + 'class="kw-page-link l-pack-center l-align-center" >' + '{page.text}' + '</span>' + '<span rv-on-click="nextPage" rv-class-disabled="lastPage"' + 'class="kw-page-link kw-pagination-arrow">' + '<i class="icon-angle-right"></i>' + '</span>' + '</div>',

      constructor: function constructor(htmlElement, mainComponentScope, scopeKey, pageSize, maxVisiblePages) {
         CoreLibrary.Component.apply(this, [{
            rootElement: htmlElement
         }]);
         this.scopeKey = scopeKey;
         this.pageSize = pageSize ? pageSize : 3;
         this.maxVisiblePages = maxVisiblePages ? maxVisiblePages : 5;
         this.scope.currentPage = 0;
         this.scope.firstPage = true;
         this.scope.lastPage = false;

         /*
         creates a new array with name _scopeKey
         the component should use this array when it wants only the data
         of the currentPage
         */
         mainComponentScope['_' + scopeKey] = [];
         this.originalArray = mainComponentScope[scopeKey];
         this.currentPageArray = mainComponentScope['_' + scopeKey];

         // watching for changes in the original array
         sightglass(mainComponentScope, scopeKey, function () {
            this.originalArray = mainComponentScope[scopeKey];
            this.setCurrentPage(0);
            this.currentPageArray.length = 0; // empties the array
            this.adaptArray();
         }.bind(this));

         this.scope.nextPage = this.nextPage.bind(this);
         this.scope.previousPage = this.previousPage.bind(this);

         this.adaptArray();
      },

      getCurrentPage: function getCurrentPage() {
         return this.scope.currentPage;
      },

      setCurrentPage: function setCurrentPage(pageNumber) {
         if (pageNumber === this.getCurrentPage()) {
            return;
         }
         if (pageNumber < 0 || pageNumber >= this.getNumberOfPages()) {
            throw new Error('Invalid page number');
         }
         this.scope.currentPage = pageNumber;
         this.adaptArray();
      },

      getNumberOfPages: function getNumberOfPages() {
         return Math.ceil(this.originalArray.length / this.pageSize);
      },

      nextPage: function nextPage() {
         if (this.getCurrentPage() < this.getNumberOfPages() - 1) {
            this.setCurrentPage(this.getCurrentPage() + 1);
         }
         return this.getCurrentPage();
      },

      previousPage: function previousPage() {
         if (this.getCurrentPage() > 0) {
            this.setCurrentPage(this.getCurrentPage() - 1);
         }
         return this.getCurrentPage();
      },

      /**
       * Changes the _scopeKey array to match the current page elements
       */
      adaptArray: function adaptArray() {
         this.currentPageArray.length = 0; // empties the array
         var startItem = this.getCurrentPage() * this.pageSize;
         var endItem = startItem + this.pageSize;
         if (endItem >= this.originalArray.length) {
            endItem = this.originalArray.length;
         }
         for (var i = startItem; i < endItem; ++i) {
            this.currentPageArray.push(this.originalArray[i]);
         }

         this.scope.firstPage = this.getCurrentPage() === 0;
         this.scope.lastPage = this.getCurrentPage() === this.getNumberOfPages() - 1;

         this.render();
      },

      init: function init() {
         this.render();
      },

      /**
       * Updates the scope.pages value which is used to render the page numbers and arrows
       */
      render: function render(page) {
         this.scope.pages = [];
         var startPage = this.getCurrentPage() - 2;
         if (this.getCurrentPage() + 2 >= this.getNumberOfPages()) {
            var startPage = this.getNumberOfPages() - 5;
         }
         if (startPage < 0) {
            startPage = 0;
         }
         var i = startPage;
         var numberOfPagesVisible = 0;
         while (i < this.getNumberOfPages() && numberOfPagesVisible < 5) {
            this.scope.pages.push({
               text: i + 1 + '',
               number: i,
               selected: i === this.getCurrentPage(),
               clickEvent: this.setCurrentPage.bind(this, i) // calls setCurrentPage with i as a parameter
            });
            ++i;
            ++numberOfPagesVisible;
         }
      }
   });
})();
//# sourceMappingURL=PaginationComponent.js.map

'use strict';

(function () {
   'use strict';

   var HeadToHead = CoreLibrary.Component.subclass({
      defaultArgs: {
         title: 'Head to Head'
      },

      constructor: function constructor() {
         CoreLibrary.Component.apply(this, arguments);
      },
      init: function init() {
         CoreLibrary.widgetModule.enableWidgetTransition(true);

         // Setting the pageParam as a fallback
         var eventId;
         if (this.scope.args.eventId != null) {
            eventId = this.scope.args.eventId;
            void 0;
         } else {
            eventId = CoreLibrary.pageInfo.pageParam;
            void 0;
         }

         this.view.binders['width'] = function (el, value) {
            el.style.setProperty('width', value * 100 + '%');
         };

         CoreLibrary.statisticsModule.getStatistics('h2h', 'event/' + eventId + '/').then(function (data) {
            this.scope.data = this.parseDataInfo(data);
            this.scope.stats = data.lastEvents;
            this.adjustHeight();
            this.scope.onLoad = 'block';
         }.bind(this)).catch(function (error) {
            void 0;
            CoreLibrary.widgetModule.removeWidget();
         }.bind(this));
      },
      adjustHeight: function adjustHeight() {
         var headerHeight = 56 + 30 + 12 + 1; // header + subheader + margin-bottom  + border
         var tableItemHeight = 32;
         var contentHeight = headerHeight;

         this.scope.stats.forEach(function () {
            contentHeight += tableItemHeight;
         });

         CoreLibrary.widgetModule.setWidgetHeight(contentHeight);
      },
      parseDataInfo: function parseDataInfo(data) {
         var dataInfo = [];
         var lastEvents = [];
         var allScores = [];
         var homeTeam = data.homeParticipant.participantName;
         var awayTeam = data.awayParticipant.participantName;

         data.lastEvents.forEach(function (lastEvent) {

            // Creating the item with the relevant data for each event
            var item = {
               start: lastEvent.start,
               homeParticipant: lastEvent.homeParticipant.participantName,
               awayParticipant: lastEvent.awayParticipant.participantName,
               homeScore: lastEvent.scores[0].homeScore,
               awayScore: lastEvent.scores[0].awayScore,
               type: lastEvent.scores[0].type
            };

            // Matching the scores of previous events with the current home team
            if (homeTeam === item.homeParticipant) {
               item.scoreOnLeft = item.homeScore;
               item.scoreOnRight = item.awayScore;
            } else {
               item.scoreOnLeft = item.awayScore;
               item.scoreOnRight = item.homeScore;
            }

            lastEvents.push(item);
         });

         // Iterating through the scores and pushing them to the allScores array
         for (var i = 0; i < data.lastEvents.length; i++) {
            for (var j = 0; j < data.lastEvents[i].scores.length; j++) {
               allScores.push(data.lastEvents[i].scores[j].homeScore);
               allScores.push(data.lastEvents[i].scores[j].awayScore);
            }
         }

         // Getting the highest value among the scores
         var getScoresMax = function getScoresMax(array) {
            return Math.max.apply(null, array);
         };

         dataInfo.push({
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            lastEvents: lastEvents,
            maxScore: getScoresMax(allScores)
         });
         return dataInfo;
      }
   });

   var headToHead = new HeadToHead({
      rootElement: 'html'
   });
})();
//# sourceMappingURL=app.js.map
