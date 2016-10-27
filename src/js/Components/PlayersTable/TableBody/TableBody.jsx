import React from 'react';
import styles from './TableBody.scss';

const TableBody = ({ children }) => {
   return (<div className={styles.general}>{ children }</div>)
};

TableBody.propTypes = {
   children: React.PropTypes.object
};

export default TableBody;
