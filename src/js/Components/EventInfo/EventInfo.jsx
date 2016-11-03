import React from 'react';
import EventInfoContainer from './EventInfoContainer/EventInfoContainer';
import ScoreIndicator from './ScoreIndicator/ScoreIndicator';
import styles from './EventInfo.scss';

const EventInfo = ({ homeName, homeScore, awayName, awayScore, eventName }) => {
   return (
      <div>
         <EventInfoContainer>
            <div className={styles.homeName}>{homeName}</div>
            <ScoreIndicator score={homeScore} />
            <ScoreIndicator score={awayScore} />
            <div className={styles.awayName}>{awayName}</div>
         </EventInfoContainer>
         { <div className={styles.eventName}>{eventName}</div> }
      </div>)
};

EventInfo.propTypes = {
   homeName: React.PropTypes.string.isRequired,
   homeScore: React.PropTypes.number.isRequired,
   awayName: React.PropTypes.string.isRequired,
   awayScore: React.PropTypes.number.isRequired,
   eventName: React.PropTypes.string
};

export default EventInfo;
