(function () {

   'use strict';

   var HeadToHead = Stapes.subclass({
      constructor: function () {
         this.scope = {};
         var appEl = document.getElementById('app');

         CoreLibrary.init()
            .then(function ( widgetArgs ) {

               this.scope.args = {
                  title: 'Head to Head',
                  eventId: '1003143574'
               };

               this.scope.teamColors = {};

               Object.keys(widgetArgs).forEach(function ( key ) {
                  this.scope.args[key] = widgetArgs[key];
               }.bind(this));

               CoreLibrary.widgetModule.enableWidgetTransition(true);

               // Setting the args.eventId as a fallback
               var eventId = CoreLibrary.pageInfo.pageParam;
               if ( !CoreLibrary.pageInfo.pageParam ) {
                  eventId = this.scope.args.eventId;
                  void 0;
               }

               CoreLibrary.statisticsModule.getStatistics('h2h', 'event/' + eventId + '/')
                  .then(function ( data ) {
                     this.scope.data = this.parseDataInfo(data);
                     this.scope.stats = data.lastEvents;
                     this.adjustHeight();

                     CoreLibrary.offeringModule.doRequest('/betoffer/live/event/' + eventId + '.json?lang=en_GB&market=GB', false, 'v2')
                        .then(function ( data ) {
                           if ( data && data.events && data.events.length ) {
                              var i = 0, arrLength = data.events.length;
                              for ( ; i < arrLength; ++i ) {
                                 var item = data.events[i];
                                 // offering api returns invalid teamColors hex value, gonna check for length, else we display mock colors
                                 if ( item.teamColors && (item.teamColors.home.shirtColor1.length === 7 || item.teamColors.home.shirtColor1.length === 4) ) {
                                    this.scope.teamColors = item.teamColors;
                                 } else {
                                    this.scope.teamColors = {
                                       home: {
                                          shirtColor1: '#00FFFF',
                                          shirtColor2: '#FFFFFF'
                                       },
                                       away: {
                                          shirtColor1: '#CC0000',
                                          shirtColor2: '#000'
                                       }
                                    };
                                 }
                                 rivets.bind(appEl, this.scope);
                              }
                           }
                        }.bind(this));

                  }.bind(this))
                  .catch(function ( error ) {
                     // Error loading statistics data, remove the widget
                     CoreLibrary.widgetModule.removeWidget();
                  });

            }.bind(this))
            .catch(function ( error ) {
               void 0;
               void 0;
            });

         rivets.bind(appEl, this.scope);
      },

      adjustHeight: function () {
         var headerHeight = 37 * 2;
         var tableItemHeight = 35;
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

   var headToHead = new HeadToHead();

})();
