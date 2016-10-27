import React from 'react';
import styles from './PlayersTable.scss';
import TableBody from './TableBody/TableBody';
import TableRow from './TableRow/TableRow';
import TableHeader from './TableHeader/TableHeader';

const Table = () => {
   return (
      <div>
         <TableHeader>
            <div>Leage Table</div>
            <div className="strong">PTS</div>
         </TableHeader>
         <TableBody>
            <TableRow index={1} name="Novak Djokovic" points={10212} />
            <TableRow index={2} name="Andy Murray" points={8184} />
            <TableRow index={3} name="Rafael Nadal " points={7321} />
            <TableRow index={4} name="Garry Kasparov" points={6212} />
            <TableRow index={5} name="Mike Tyson" points={5454} />
         </TableBody>
      </div>)
};

Table.propTypes = {
   players: React.PropTypes.array
};

export default Table;
