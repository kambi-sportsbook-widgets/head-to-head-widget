import React from 'react';
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
            <TableRow index={1} shape="up" name="Novak Djokovic" points={10212} />
            <TableRow index={2} shape="down" name="Andy Murray" points={8184} />
            <TableRow index={3} shape="up" name="Rafael Nadal " points={7321} />
            <TableRow index={4} shape="up" name="Garry Kasparov" points={6212} />
            <TableRow index={5} shape="down" name="Mike Tyson" points={5454} />
         </TableBody>
      </div>)
};

Table.propTypes = {
   players: React.PropTypes.array
};

export default Table;
