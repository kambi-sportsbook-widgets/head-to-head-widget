import React from 'react';
import styles from './Header.scss';

const Header = ({ title }) => {
   return (<div className={styles.general}>{ title }</div>)
};

Header.propTypes = {
   title: React.PropTypes.string.isRequired
};

export default Header;
