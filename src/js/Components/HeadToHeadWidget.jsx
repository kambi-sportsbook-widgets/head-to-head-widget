import React from 'react';
import { coreLibrary, widgetModule, translationModule, statisticsModule } from 'kambi-widget-core-library';
import Header from './Header/Header';
import EventInfo from './EventInfo/EventInfo';
import BoxContainer from './BoxContainer/BoxContainer';

class HeadToHeadWidget extends React.Component {

   constructor(props) {
      super(props);
      widgetModule.enableWidgetTransition(true);
   }

   render() {
      const t = translationModule.getTranslation.bind(translationModule);
      return (
         <div>
            <Header title={t('Head to head')} />
            { this.props.events.map((event)=> {
               return event.lastEvents.map(lastEvent =>
                  (<BoxContainer><EventInfo
                     homeName={lastEvent.homeParticipant}
                     homeScore={lastEvent.homeScore}
                     awayName={lastEvent.awayParticipant}
                     awayScore={lastEvent.awayScore}
                     eventName={lastEvent.start} />
                  </BoxContainer>))
            })}
         </div>
      );
   }
}

HeadToHeadWidget.propTypes = {
   events: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
};

export default HeadToHeadWidget;
