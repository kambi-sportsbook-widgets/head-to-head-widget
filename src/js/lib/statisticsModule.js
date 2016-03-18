CoreLibrary.statisticsModule = (function () {
   'use strict';

   return {
      getStatistics: function ( type, filter ) {
         // Remove url parameters from filter
         filter = filter.match(/[^?]*/)[0];
         // Remove trailing slash
         filter = filter.slice(0, -1);
         var baseApiUrl = 'https://api.kambi.com/statistics/api/';
         console.debug(baseApiUrl + CoreLibrary.config.offering + '/' + type + '/' + filter + '.json');
         return CoreLibrary.getData(baseApiUrl + CoreLibrary.config.offering + '/' + type + '/' + filter + '.json');
      }
   };
})();