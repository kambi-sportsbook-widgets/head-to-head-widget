import React from 'react';
import ReactDOM from 'react-dom';
import { coreLibrary, widgetModule } from 'kambi-widget-core-library';
import './app.scss';
import HeadToHeadWidget from './Components/HeadToHeadWidget';
import store from './Store/store';

coreLibrary.init({
   eventId: 1003328180
})
.then(() => store.getEventStatistics(coreLibrary.args.eventId))
.then((events) => {
   document.getElementsByTagName('body')[0].style.display = 'block';
   ReactDOM.render(
      <HeadToHeadWidget events={events} />,
      document.getElementById('root')
   );
})
.catch((error) => {
   console.error(error);
   widgetModule.removeWidget();
});
