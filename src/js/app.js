(function () {

   'use strict';

   var HeadToHead = Stapes.subclass({
      constructor: function ( name ) {
         this.scope = {};

         CoreLibrary.init()
            .then(function ( widgetArgs ) {
               this.scope.args = {
                  title: 'Head to Head',
                  dataUrl: 'head-to-head.json',
                  historyLimit: 6
               };

               Object.keys(widgetArgs).forEach(function ( key ) {
                  this.scope.args[key] = widgetArgs[key];
               }.bind(this));

               CoreLibrary.getData(this.scope.args.dataUrl).then(function ( data ) {
                  this.scope.data = this.parseDataInfo(data);
                  this.scope.stats = data.lastEvents;
                  this.adjustHeight();
               }.bind(this));

            }.bind(this))
         .catch(function ( error ) {
            console.debug('init error');
            console.trace(error);
         });

         this.view = rivets.bind(document.getElementById('main'), this.scope);
      },

      adjustHeight: function () {
         var headerHeight = 37;
         var tableItemHeight = 42;
         var contentHeight = headerHeight;

         this.scope.stats.forEach(function () {
            contentHeight += tableItemHeight;
         });

         CoreLibrary.widgetModule.setWidgetHeight(contentHeight);
      },

      parseDataInfo: function ( data ) {
         var dataInfo = [];
         var lastEvents = [];
         var homeTeam = data.homeParticipant.participantName;
         var awayTeam = data.awayParticipant.participantName;

         data.lastEvents.forEach(function ( lastEvent ) {

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
            if ( homeTeam === item.homeParticipant) {
               item.scoreOnLeft = item.homeScore;
               item.scoreOnRight = item.awayScore;
            } else {
               item.scoreOnLeft = item.awayScore;
               item.scoreOnRight = item.homeScore;
            }

            lastEvents.push(item);
            return lastEvents;
         });

         dataInfo.push({
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            lastEvents: lastEvents
         });
         return dataInfo;
      }

   });

   var HeadToHead = new HeadToHead();

})();
