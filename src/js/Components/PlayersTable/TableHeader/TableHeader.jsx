import React from 'react';
import styles from './TableHeader.scss';

const TableHeader = ({ children }) => {
   return (<div className={styles.header}>{ children }</div>)
};

TableHeader.propTypes = {
   children: React.PropTypes.object
};

export default TableHeader;
