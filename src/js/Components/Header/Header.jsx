import React from 'react';
import styles from './Header.scss';

const Header = ({ title }) => {
   return (<div className={styles.general + ' KambiWidget-card-support-text-color'}>{ title }</div>)
};

Header.propTypes = {
   title: React.PropTypes.string.isRequired
};

export default Header;
