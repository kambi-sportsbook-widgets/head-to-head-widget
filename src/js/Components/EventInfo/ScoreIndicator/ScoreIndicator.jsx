import React from 'react';
import styles from './ScoreIndicator.scss';

const ScoreIndicator = ({ score }) => {
   return (
      <div className={styles.container}>
         <div className={'KambiWidget-box--neutral ' + styles.scoreBox}>
            { score }
         </div>
      </div>)
};

ScoreIndicator.propTypes = {
   score: React.PropTypes.number.isRequired,
};

export default ScoreIndicator;
