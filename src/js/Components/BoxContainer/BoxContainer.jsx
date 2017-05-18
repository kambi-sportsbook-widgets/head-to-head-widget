import React from 'react';
import PropTypes from 'prop-types';
import styles from './BoxContainer.scss';

const BoxContainer = ({ children }) => {
   return (<div className={'KambiWidget-card-inner-border ' + styles.general}>{ children }</div>)
};

BoxContainer.propTypes = {
   children: PropTypes.node
};

export default BoxContainer;
