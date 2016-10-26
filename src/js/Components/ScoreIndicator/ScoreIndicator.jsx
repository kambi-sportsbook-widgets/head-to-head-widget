import React from 'react';
import styles from './ScoreIndicator.scss';

const ScoreIndicator = ({ name, score, reverse }) => {

   const getContainerClass = () => {
      let name = styles.container;
      if (reverse) {
         name = styles.containerReversed;
      }
      return name;
   };

   return (
      <div className={getContainerClass()}>
         <div className={styles.name}>{ name }</div>
         <div className={styles.scoreBox}>
            <span className={styles.scoreValue}>{ score }</span>
         </div>
      </div>)
};

ScoreIndicator.propTypes = {
   score: React.PropTypes.number.isRequired,
   name: React.PropTypes.string.isRequired,
   reverse: React.PropTypes.Boolean
};

export default ScoreIndicator;
