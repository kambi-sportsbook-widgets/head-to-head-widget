CoreLibrary.offeringModule = (function () {
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
         clientId: null,
         version: null,
         routeRoot: '',
         auth: false,
         device: null
      },
      setConfig: function ( config ) {
         // Iterate over the passed object properties, if the exist in the predefined config object then we set them
         for ( var i in config ) {
            if ( config.hasOwnProperty(i) && this.config.hasOwnProperty(i) ) {
               this.config[i] = config[i];
               switch ( i ) {
                  case 'locale':
                     // TODO: deal with locale setting
                     break;
               }
            }
         }
      },
      setOffering: function ( offering ) {
         this.config.offering = offering;
      },
      getGroupEvents: function ( groupId ) {
         var requesPath = '/event/group/' + groupId + '.json';
         return this.doRequest(requesPath);
      },
      getEventsByFilter: function ( filter, params ) {
         // Todo: Update this method once documentation is available
         var requestPath = '/listView/' + filter;
         return this.doRequest(requestPath, params, 'v3');
      },
      getLiveEvents: function () {
         var requestPath = '/event/live/open.json';
         return this.doRequest(requestPath);
      },
      doRequest: function ( requestPath, params, version ) {
         if ( this.config.offering == null ) {
            console.warn('The offering has not been set, please provide it in the widget arguments');
         } else {
            var apiUrl = this.config.apiBaseUrl.replace('{apiVersion}', (version != null ? version : this.config.version));
            var requestUrl = apiUrl + this.config.offering + requestPath;
            var overrideParams = params || {};
            var requestParams = {
               lang: overrideParams.locale || this.config.locale,
               market: overrideParams.market || this.config.market,
               client_id: overrideParams.clientId || this.config.clientId,
               include: overrideParams.include || null
            };
            requestUrl += '?' + Object.keys(requestParams).map(function ( k ) {
                  return encodeURIComponent(k) + '=' + encodeURIComponent(requestParams[k]);
               }).join('&');

            return CoreLibrary.getData(requestUrl);
         }
      }
   };
})();