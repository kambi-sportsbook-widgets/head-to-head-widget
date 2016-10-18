import React from 'react';
import ReactDOM from 'react-dom';
import { coreLibrary } from 'widget-core-library';
import HeadToHeadWidget from './HeadToHeadWidget';

coreLibrary.init({
   eventId: null
})
.then(
   () => {
      ReactDOM.render(<HeadToHeadWidget args={coreLibrary.args} />, document.getElementById('root'));
   },
   error => console.error(error)
);
