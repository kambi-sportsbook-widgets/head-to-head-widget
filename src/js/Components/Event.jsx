import React from 'react';

const Event = ({ children }) => {
   return (
      <main key={event.eventId} className="KambiWidget-font l-flexbox l-vertical l-mb-12">
         {children}
      </main>
   );
};

Event.propTypes = {
   children: React.PropTypes.arrayOf(React.PropTypes.node).isRequired
};

export default Event;
