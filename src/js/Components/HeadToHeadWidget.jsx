import React from 'react';
import { coreLibrary, widgetModule, translationModule, statisticsModule } from 'widget-core-library';
import Event from './Event';
import ScoreBar from './ScoreBar';
import Scores from './Scores';
import Team from './Team';
import Teams from './Teams';

/**
 * Height of header element
 */
const HEADER_HEIGHT = 56 + 30 + 12 + 1; // header + subheader + margin-bottom  + border

/**
 * Height of table item
 */
const TABLE_ITEM_HEIGHT = 32;

class HeadToHeadWidget extends React.Component {

   /**
    * Constructor
    * @param {object} props Widget attributes
    */
   constructor(props) {
      super(props);
      widgetModule.enableWidgetTransition(true);
   }

   /**
    * Called before mounting the widget.
    */
   componentWillMount() {
      this.adjustHeight();
   }

   /**
    * Called after updating component's DOM.
    */
   componentDidUpdate() {
      this.adjustHeight();
   }

   /**
    * Calculates and updates widget height based on actual content.
    */
   adjustHeight() {
      const contentHeight = this.props.events.reduce((contentHeight, event) => {
         return contentHeight + event.lastEvents.length * TABLE_ITEM_HEIGHT;
      }, HEADER_HEIGHT);

      widgetModule.setWidgetHeight(contentHeight);
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
            {this.props.events.map((event) => {
               return (
                  <Event key={event.eventId}>
                     <Teams>
                        <Team name={event.homeTeam} side="home" />
                        <Team name={event.awayTeam} side="away" />
                     </Teams>
                     {event.lastEvents.map((score) => {
                        return (
                           <Scores key={score.start}>
                              <ScoreBar side="home" ourScore={score.scoreOnLeft} theirScore={score.scoreOnRight} maxScore={event.maxScore} />
                              <ScoreBar side="away" ourScore={score.scoreOnRight} theirScore={score.scoreOnLeft} maxScore={event.maxScore} />
                           </Scores>
                        );
                     })}
                  </Event>
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
   events: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
};

export default HeadToHeadWidget;
