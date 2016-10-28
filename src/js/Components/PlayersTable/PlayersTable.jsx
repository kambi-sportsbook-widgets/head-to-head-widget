import React from 'react';
import TableBody from './TableBody/TableBody';
import TableRow from './TableRow/TableRow';
import TableHeader from './TableHeader/TableHeader';

const Table = () => {
   return (
      <div>
         <TableHeader>
            <div className="element">League Table</div>
            <div className="element element--strong">PTS</div>
         </TableHeader>
         <TableBody>
            <TableRow index={1} shape="up" name="Novak Djokovic" points={10212} />
            <TableRow index={2} shape="down" name="Andy Murray" points={8184} />
            <TableRow index={3} shape="up" name="Rafael Nadal " points={7321} />
            <TableRow index={4} shape="up" name="Garry Kasparov" points={6212} />
            <TableRow index={5} shape="down" name="Mike Tyson" points={5454} />
            <TableRow index={6} shape="down" name="Mike Oldfield" points={5432} />
            <TableRow index={7} shape="down" name="Henry Lee" points={3123} />
            <TableRow index={8} shape="down" name="Ronnie O'Salivan" points={2312} />
            <TableRow index={9} shape="down" name="Pierce Brosnan" points={3212} />
            <TableRow index={10} shape="down" name="David Duchovny" points={1231} />
         </TableBody>
      </div>)
};

Table.propTypes = {
   players: React.PropTypes.array
};

export default Table;
