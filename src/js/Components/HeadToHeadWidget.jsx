import React from 'react';
import { coreLibrary, widgetModule, translationModule, statisticsModule } from 'kambi-widget-core-library';
import Header from './Header/Header';
import WinLooseIndicator from './WinLooseIndicator/WinLooseIndicator';
import ScoreContainer from './ScoreContainer/ScoreContainer';
import EventInfo from './EventInfo/EventInfo';
import BoxContainer from './BoxContainer/BoxContainer';
import PlayersTable from './PlayersTable/PlayersTable';

class HeadToHeadWidget extends React.Component {

   constructor(props) {
      super(props);
      widgetModule.enableWidgetTransition(true);
   }

   render() {
      const t = translationModule.getTranslation.bind(translationModule);

      return (
         <div>
            <BoxContainer>
               <Header title={t('Form')} />
               <ScoreContainer>
                  <WinLooseIndicator score="win" />
                  <WinLooseIndicator score="win" />
                  <WinLooseIndicator score="draw" />
                  <WinLooseIndicator score="draw" />
                  <WinLooseIndicator score="lost" />
                  <WinLooseIndicator score="lost" />
               </ScoreContainer>
            </BoxContainer>
            <BoxContainer>
               <Header title={t('Head to head')} />
               { this.props.events.map((event)=>{
                  return event.lastEvents.map(lastEvent =>
                     (<EventInfo
                        homeName={lastEvent.homeParticipant}
                        homeScore={lastEvent.homeScore}
                        awayName={lastEvent.awayParticipant}
                        awayScore={lastEvent.awayScore}
                        eventName={new Date(lastEvent.start).getFullYear()} />))
               })}
            </BoxContainer>
            <PlayersTable
               players={[{
                  name: 'Novak Djokovic',
                  points: 10240
               }]} />
         </div>
      );
   }
}

HeadToHeadWidget.propTypes = {
   events: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
};

export default HeadToHeadWidget;
