import React from 'react';
import { coreLibrary, widgetModule, translationModule, statisticsModule } from 'widget-core-library';
import ScoreBar from './ScoreBar';

/**
 * Height of header element
 */
const HEADER_HEIGHT = 56 + 30 + 12 + 1; // header + subheader + margin-bottom  + border

/**
 * Height of table item
 */
const TABLE_ITEM_HEIGHT = 32;

/**
 * Builds statistics information object for usage in template.
 * @param {object} statistics Statistics entity
 * @returns {object[]}
 */
const parseDataInfo = function(statistics) {
   var dataInfo = [];
   var lastEvents = [];
   var allScores = [];
   var homeTeam = statistics.homeParticipant.participantName;
   var awayTeam = statistics.awayParticipant.participantName;

   statistics.lastEvents.forEach(function (lastEvent) {
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

      for (var j = 0; j < lastEvent.scores.length; j++) {
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

class HeadToHeadWidget extends React.Component {

   /**
    * Constructor
    * @param {object} props Widget attributes
    */
   constructor(props) {
      super(props);

      widgetModule.enableWidgetTransition(true);

      this.state = {
         events: [],
         stats: []
      };
   }

   /**
    * Called before mounting the widget.
    */
   componentWillMount() {
      this.refresh(this.props.args.eventId);
   }

   /**
    * Called on attributes change.
    * @param {object} nextProps New attributes
    */
   componentWillReceiveProps(nextProps) {
      this.refresh(nextProps.args.eventId);
   }

   /**
    * Fetches external data and updates widget.
    * @param {number} eventId Event identifier
    */
   refresh(eventId) {
      if (!eventId) {
         console.warn('eventId set from pageParam');
         eventId = coreLibrary.pageInfo.pageParam;
      } else {
         console.warn('eventId set from args.eventId');
      }

      statisticsModule.getHeadToHeadStatistics(eventId)
         .then((statistics) => {
            this.setState({
               events: parseDataInfo(statistics),
               stats: statistics.lastEvents
            });

            document.getElementsByTagName('body')[0].style.display = 'block';

            widgetModule.setWidgetHeight(
               this.state.stats.reduce(contentHeight => contentHeight + TABLE_ITEM_HEIGHT, HEADER_HEIGHT)
            );
         })
         .catch((error) => {
            console.warn(`Cannot load statistics data: ${error.message}`);
            widgetModule.removeWidget();
         });
   }

   /**
    * Creates widget template.
    * @returns {XML}
    */
   render() {
      const t = translationModule.getTranslation.bind(translationModule);

      return (
         <div className="KambiWidget-card-background-color KambiWidget-card-text-color KambiWidget-card-border-color l-flexbox l-vertical l-expander">
            <header className="KambiWidget-font kw-header l-flexbox l-align-center l-pt-16 l-pb-16 l-pl-16">{t('Head to head')}</header>
            {this.state.events.map((event) => {
               return (
                  <main key={event.eventId} className="KambiWidget-font l-flexbox l-vertical l-mb-12">
                     <div className="kw-teams l-flexbox l-flex-1 l-pl-16 l-pr-16 l-mb-6">
                        <div data-item-attr="home" className="l-flexbox l-flex-1 l-pack-start l-align-center l-pr-6">
                           <div className="text-truncate">{t(event.homeTeam)}</div>
                        </div>
                        <div data-item-attr="away" className="l-flexbox l-flex-1 l-pack-end l-align-center">
                           <div className="text-truncate">{t(event.awayTeam)}</div>
                        </div>
                     </div>
                     {event.lastEvents.map((score) => {
                        return (
                           <div
                              className="kw-table-item KambiWidget-card-background-color--hoverable l-flexbox l-flex-1 l-pl-16 l-pr-16"
                              key={score.start}
                           >
                              <ScoreBar side="home" ourScore={score.scoreOnLeft} theirScore={score.scoreOnRight} maxScore={event.maxScore} />
                              <ScoreBar side="away" ourScore={score.scoreOnRight} theirScore={score.scoreOnLeft} maxScore={event.maxScore} />
                           </div>
                        );
                     })}
                  </main>
               );
            })}
         </div>
      );
   }

}

HeadToHeadWidget.propTypes = {
   /**
    * Widget arguments
    */
   args: React.PropTypes.object.isRequired
};

export default HeadToHeadWidget;
