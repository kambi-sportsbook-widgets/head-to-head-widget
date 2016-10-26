import React from 'react';
import styles from './ScoreContainer.scss';

const ScoreContainer = ({ children }) => {
   return (<div className={styles.general}>{ children }</div>)
};

ScoreContainer.propTypes = {
   children: React.PropTypes.object
};

export default ScoreContainer;
