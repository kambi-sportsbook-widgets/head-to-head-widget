window.CoreLibrary.translationModule = (function () {
   'use strict';

   var translationModule = {
      i18nStrings: {},

      fetchTranslations: function ( locale ) {
         if ( locale == null ) {
            locale = 'en_GB';
         }
         var self = this;
         return new Promise(function ( resolve, reject ) {
            self.getData('i18n/' + locale + '.json')
               .then(function ( response ) {
                  translationModule.i18nStrings = response;
                  resolve();
               })
               .catch(function ( error ) {
                  if ( locale !== 'en_GB' ) {
                     console.debug('Could not load translations for ' + locale + ' falling back to en_GB');
                     self.fetchTranslations('en_GB').then(resolve);
                  } else {
                     console.debug('Could not load translations for en_GB');
                     console.trace(error);
                     resolve();
                  }
               });
         });
      }
   };

   rivets.formatters.translate = function ( value ) {
      if ( translationModule.i18nStrings[value] != null ) {
         return translationModule.i18nStrings[value];
      }
      return value;
   };

   return translationModule;
})();
