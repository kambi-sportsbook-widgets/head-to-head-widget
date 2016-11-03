import React from 'react';
import styles from './ScoreIndicator.scss';

const ScoreIndicator = ({ score }) => {
   return (
      <div className={styles.container}>
         <div className={styles.scoreBox}>
            <span className={styles.scoreValue}>{ score }</span>
         </div>
      </div>)
};

ScoreIndicator.propTypes = {
   score: React.PropTypes.number.isRequired,
};

export default ScoreIndicator;
