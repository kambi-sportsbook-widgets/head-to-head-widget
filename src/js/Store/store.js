import { coreLibrary, widgetModule, translationModule, offeringModule, statisticsModule } from 'kambi-widget-core-library';

/**
 * Builds statistics information object for usage in template.
 * @param {object} statistics Statistics entity
 * @returns {object[]}
 */
const parseDataInfo = function (statistics) {
   var dataInfo = [];
   var lastEvents = [];
   var allScores = [];
   var homeTeam = statistics.homeParticipant.participantName;
   var awayTeam = statistics.awayParticipant.participantName;

   statistics.lastEvents.forEach(function (lastEvent) {
      // Creating the item with the relevant data for each event
      const item = {
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

      for (let j = 0; j < lastEvent.scores.length; j++) {
         if (lastEvent.scores[j].hasOwnProperty('homeScore') && lastEvent.scores[j].hasOwnProperty('awayScore')) {
            allScores.push(lastEvent.scores[j].homeScore, lastEvent.scores[j].awayScore);
         }
      }

      if (lastEvent.scores.length && lastEvent.scores[0].hasOwnProperty('homeScore') && lastEvent.scores[0].hasOwnProperty('awayScore')) {
         lastEvents.push(item);
      }
   });

   dataInfo.push({
      eventId: statistics.eventId,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      lastEvents: lastEvents,
      maxScore: Math.max.apply(null, allScores)
   });

   return dataInfo;
};

const getEventStatistics = function (eventId) {
   if (!eventId) {
      console.warn('eventId set from pageParam');
      eventId = coreLibrary.pageInfo.pageParam;
   } else {
      console.warn('eventId set from args.eventId');
   }

   return statisticsModule.getHeadToHeadStatistics(eventId)
   .then(parseDataInfo);
};

export default { getEventStatistics };
