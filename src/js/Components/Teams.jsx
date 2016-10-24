import React from 'react';

const Teams = ({ children }) => {
   return (
      <div className="kw-teams l-flexbox l-flex-1 l-pl-16 l-pr-16 l-mb-6">
         {children}
      </div>
   );
};

Teams.propTypes = {
   /**
    * Array of Team components
    */
   children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired
};

export default Teams;
