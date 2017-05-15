import React from 'react';
import { translationModule } from 'kambi-widget-core-library';
import EventInfoContainer from './EventInfoContainer/EventInfoContainer';
import ScoreIndicator from './ScoreIndicator/ScoreIndicator';
import styles from './EventInfo.scss';

const t = translationModule.getTranslation.bind(translationModule);

const EventInfo = ({ homeName, homeScore, awayName, awayScore, start }) => {
   const date = new Date(start);
   const formatedDate = date.getDate() + ' ' + t('month' + [date.getMonth()]) + ' ' + date.getFullYear();
   return (
      <div>
         <EventInfoContainer>
            <div className={styles.homeName + ' KambiWidget-card-support-text-color'}>{homeName}</div>
            <ScoreIndicator score={homeScore} />
            <ScoreIndicator score={awayScore} />
            <div className={styles.awayName + ' KambiWidget-card-support-text-color'}>{awayName}</div>
         </EventInfoContainer>
         { <div className={styles.eventName + ' KambiWidget-card-support-text-color'}>{formatedDate}</div> }
      </div>)
};

EventInfo.propTypes = {
   homeName: React.PropTypes.string.isRequired,
   homeScore: React.PropTypes.number.isRequired,
   awayName: React.PropTypes.string.isRequired,
   awayScore: React.PropTypes.number.isRequired,
   start: React.PropTypes.number.isRequired
};

export default EventInfo;
