import React from 'react';
import styles from './ScoreIndicator.scss';

const ScoreIndicator = ({ score }) => {
   return (
      <div className={styles.general}>
         <span className={styles.score}>{ score }</span>
      </div>)
};

ScoreIndicator.propTypes = {
   score: React.PropTypes.number.isRequired
};

export default ScoreIndicator;
