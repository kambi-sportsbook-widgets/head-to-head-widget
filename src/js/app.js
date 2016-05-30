(function () {
   'use strict';

   var HeadToHead = CoreLibrary.Component.subclass({
      defaultArgs: {
         title: 'Head to Head'
      },

      constructor () {
         CoreLibrary.Component.apply(this, arguments);
      },

      init () {
         CoreLibrary.widgetModule.enableWidgetTransition(true);

         // Setting the pageParam as a fallback
         var eventId;
         if ( this.scope.args.eventId != null ) {
            eventId = this.scope.args.eventId;
            console.warn('eventId set from args.eventId');
         } else {
            eventId = CoreLibrary.pageInfo.pageParam;
            console.warn('eventId set from pageParam');
         }

         this.view.binders['width'] = function ( el, value ) {
            el.style.setProperty('width', (value * 100) + '%');
         };

         CoreLibrary.statisticsModule.getStatistics('h2h', 'event/' + eventId + '/')
            .then(function ( data ) {
               this.scope.data = this.parseDataInfo(data);
               this.scope.stats = data.lastEvents;
               this.adjustHeight();
               this.scope.onLoad = 'block';
            }.bind(this))
            .catch(function ( error ) {
               console.warn('Cannot load statistics data');
               CoreLibrary.widgetModule.removeWidget();
            }.bind(this));
      },

      adjustHeight () {
         var headerHeight = 56 + 30 + 12 + 1; // header + subheader + margin-bottom  + border
         var tableItemHeight = 32;
         var contentHeight = headerHeight;

         this.scope.stats.forEach(function () {
            contentHeight += tableItemHeight;
         });

         CoreLibrary.widgetModule.setWidgetHeight(contentHeight);
      },

      parseDataInfo ( data ) {
         var dataInfo = [];
         var lastEvents = [];
         var allScores = [];
         var homeTeam = data.homeParticipant.participantName;
         var awayTeam = data.awayParticipant.participantName;

         data.lastEvents.forEach(function ( lastEvent, i ) {

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
            if ( homeTeam === item.homeParticipant ) {
               item.scoreOnLeft = item.homeScore;
               item.scoreOnRight = item.awayScore;
            } else {
               item.scoreOnLeft = item.awayScore;
               item.scoreOnRight = item.homeScore;
            }

            for ( var j = 0; j < lastEvent.scores.length; j++ ) {
               if ( lastEvent.scores[j].hasOwnProperty('homeScore') && lastEvent.scores[j].hasOwnProperty('awayScore') ) {
                  allScores.push(lastEvent.scores[j].homeScore);
                  allScores.push(lastEvent.scores[j].awayScore);
               }
            }

            if ( lastEvent.scores.length && lastEvent.scores[0].hasOwnProperty('homeScore') && lastEvent.scores[0].hasOwnProperty('awayScore') ) {
               lastEvents.push(item);
            }
         });

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

   var headToHead = new HeadToHead({
      rootElement: 'html'
   });

})();
