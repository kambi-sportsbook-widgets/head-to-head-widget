import React from 'react';
import styles from './ScoreIndicator.scss';

const ScoreIndicator = ({ name, score, reverse }) => {

   const getContainerClasses = () => {
      let name = styles.container;
      if (reverse) {
         name = styles.containerReversed;
      }
      return name;
   };

   const getNameClass = () => {
      let name = styles.name;
      if (reverse) {
         name = styles.nameReversed;
      }
      return name;
   };


   return (
      <div className={getContainerClasses()}>
         <div className={getNameClass()}>{ name }</div>
         <div className={styles.scoreBox}>
            <span className={styles.scoreValue}>{ score }</span>
         </div>
      </div>)
};

ScoreIndicator.propTypes = {
   score: React.PropTypes.number.isRequired,
   name: React.PropTypes.string.isRequired,
   reverse: React.PropTypes.bool
};

export default ScoreIndicator;
