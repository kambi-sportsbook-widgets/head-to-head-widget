import React from 'react';
import { translationModule } from 'kambi-widget-core-library';

const Team = ({ name, side }) => {
   const t = translationModule.getTranslation.bind(translationModule);

   return (
      <div data-item-attr={side} className="l-flexbox l-flex-1 l-align-center">
         <div className="text-truncate">{t(name)}</div>
      </div>
   );
};

Team.propTypes = {
   /**
    * Team name
    */
   name: React.PropTypes.string.isRequired,

   /**
    * Team side (home or away)
    */
   side: React.PropTypes.oneOf(['home', 'away']).isRequired
};

export default Team;
