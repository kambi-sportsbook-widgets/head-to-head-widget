import React from 'react';
import styles from './TableRow.scss';

const TableRow = ({ index, shape, name, points }) => {
   return (
      <div className={styles.general}>
         <span className={styles.index}>{index}</span>
         {<span className={styles.arrow}>
            { shape === 'up' && <span className={styles.triangleUp} /> }
            { shape === 'down' && <span className={styles.triangleDown} /> }
         </span>}
         <span className={styles.name}>
            {name}
         </span>
         <span className={styles.points}>{points}</span>
      </div>)
};

TableRow.propTypes = {
   index: React.PropTypes.number,
   name: React.PropTypes.string.isRequired,
   shape: React.PropTypes.number,
   points: React.PropTypes.number.isRequired,
};

export default TableRow;
