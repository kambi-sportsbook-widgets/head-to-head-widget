import React from 'react';
import PropTypes from 'prop-types';
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
   homeName: PropTypes.string.isRequired,
   homeScore: PropTypes.number.isRequired,
   awayName: PropTypes.string.isRequired,
   awayScore: PropTypes.number.isRequired,
   start: PropTypes.number.isRequired
};

export default EventInfo;
