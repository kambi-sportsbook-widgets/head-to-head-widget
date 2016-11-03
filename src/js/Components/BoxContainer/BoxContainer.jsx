import React from 'react';
import styles from './BoxContainer.scss';

const BoxContainer = ({ children }) => {
   return (<div className={styles.general}>{ children }</div>)
};

BoxContainer.propTypes = {
   children: React.PropTypes.node
};

export default BoxContainer;
