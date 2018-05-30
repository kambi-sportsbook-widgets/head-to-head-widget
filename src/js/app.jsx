import React from 'react'
import ReactDOM from 'react-dom'
import { coreLibrary, widgetModule } from 'kambi-widget-core-library'
import HeadToHeadWidget from './Components/HeadToHeadWidget'
import store from './Store/store'

coreLibrary
  .init({
    eventId: 1004710940,
  })
  .then(
    () =>
      (coreLibrary.config.apiStatisticsBaseUrl =
        'https://e1-api.kambi.com/statistics/api/')
  )
  .then(() => store.getEventStatistics(coreLibrary.args.eventId))
  .then(events => {
    if (
      events[0].lastEvents === undefined ||
      events[0].lastEvents.length === 0
    ) {
      throw new Error('H2H was unable to get last events. Removing itself')
    }
    document.getElementsByTagName('body')[0].style.display = 'block'
    ReactDOM.render(
      <HeadToHeadWidget events={events} />,
      document.getElementById('root')
    )
  })
  .catch(error => {
    console.error(error)
    widgetModule.removeWidget()
  })
