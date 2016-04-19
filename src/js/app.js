(function () {

   'use strict';

   var HeadToHead = Stapes.subclass({
      constructor: function () {
         this.scope = {};
         var appEl = document.getElementById('app'),
            baseWidgetCSS = '//c3-static.kambi.com/sb-mobileclient/widget-api/1.0.0.10/resources/css/';

         CoreLibrary.init()
            .then(function ( widgetArgs ) {

               this.scope.args = {
                  title: 'Head to Head'
               };
               this.scope.widgetCss = baseWidgetCSS + CoreLibrary.config.clientConfig.customer + '/' + CoreLibrary.config.clientConfig.offering + '/widgets.css';

               Object.keys(widgetArgs).forEach(function ( key ) {
                  this.scope.args[key] = widgetArgs[key];
               }.bind(this));

               CoreLibrary.widgetModule.enableWidgetTransition(true);

               // Setting the args.eventId as a fallback
               var eventId = CoreLibrary.pageInfo.pageParam;
               if ( !CoreLibrary.pageInfo.pageParam ) {
                  eventId = this.scope.args.eventId;
                  console.warn('Missing pageParam, eventId set from args');
               }

               CoreLibrary.statisticsModule.getStatistics('h2h', 'event/' + eventId + '/')
                  .then(function ( data ) {
                     this.scope.data = this.parseDataInfo(data);
                     this.scope.stats = data.lastEvents;
                     this.adjustHeight();
                  }.bind(this)).catch(function ( error ) {
                  console.warn('Cannot load statistics data');
                  CoreLibrary.widgetModule.removeWidget();
               }.bind(this));

            }.bind(this))
            .catch(function ( error ) {
               console.debug('init error');
               console.trace(error);
            });

         this.view = rivets.bind(appEl, this.scope);
      },

      adjustHeight: function () {
         var headerHeight = 32 * 2 + 6;
         var tableItemHeight = 37;
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
            if ( homeTeam === item.homeParticipant ) {
               item.scoreOnLeft = item.homeScore;
               item.scoreOnRight = item.awayScore;
            } else {
               item.scoreOnLeft = item.awayScore;
               item.scoreOnRight = item.homeScore;
            }

            lastEvents.push(item);
         });

         // Iterating through the scores and pushing them to the allScores array
         for ( var i = 0; i < data.lastEvents.length; i++ ) {
            for ( var j = 0; j < data.lastEvents[i].scores.length; j++ ) {
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

   rivets.binders['width'] = function (el, value) {
      el.style.setProperty('width', (value * 100) + '%');
   };

   var headToHead = new HeadToHead();

})();
