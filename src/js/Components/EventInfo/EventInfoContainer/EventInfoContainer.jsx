import React from 'react';
import styles from './EventInfoContainer.scss';

const EventInfoContainer = ({ children }) => {
   return (<div className={styles.general}>{ children }</div>)
};

EventInfoContainer.propTypes = {
   children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired
};

export default EventInfoContainer;
