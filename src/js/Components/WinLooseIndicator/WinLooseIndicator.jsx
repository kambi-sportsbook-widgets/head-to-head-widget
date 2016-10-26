import React from 'react';
import styles from './WinLooseIndicator.scss';

const WinLooseIndicator = ({ score }) => {
   return (<div className={styles.general}>
      { (score === 'win') && <span className={styles.win}>W</span> }
      { (score === 'draw') && <span className={styles.draw}>D</span> }
      { (score === 'lost') && <span className={styles.lost}>L</span> }
   </div>)
};

WinLooseIndicator.propTypes = {
   score: React.PropTypes.oneOf(['win', 'draw', 'lost']),
};

export default WinLooseIndicator;
