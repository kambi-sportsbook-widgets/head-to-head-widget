import React from 'react';

const Scores = ({ children }) => {
   return (
      <div className="kw-table-item KambiWidget-card-background-color--hoverable l-flexbox l-flex-1 l-pl-16 l-pr-16">
         {children}
      </div>
   );
};

Scores.propTypes = {
   /**
    * Array of ScoreBars components
    */
   children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired
};

export default Scores;
