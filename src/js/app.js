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

         // Formaters and binders for comparison, operation and style
         rivets.formatters['='] = function (value, args) {
            return value === args;
         };
         rivets.formatters['>'] = function (value, arg) {
            return value > arg;
         };
         rivets.formatters['<'] = function (value, arg) {
            return value < arg;
         };
         rivets.formatters['-'] = function (value, arg) {
            return value - arg;
         };
         rivets.binders['style-*'] = function (el, value) {
            el.style.setProperty(this.args[0], value);
         };

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
         var allScores = [];
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
         });

         // Iterating through the scores and pushing them to the allScores array
         for (var i = 0; i < data.lastEvents.length; i++) {
            for (var j = 0; j < data.lastEvents[i].scores.length; j++) {
               allScores.push(data.lastEvents[i].scores[j].homeScore);
               allScores.push(data.lastEvents[i].scores[j].awayScore);
            }
         }

         // Getting the highest value among the scores
         var getScoresMax = function ( array ) {
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

   var HeadToHead = new HeadToHead();

})();
