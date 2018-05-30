import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { widgetModule, translationModule } from 'kambi-widget-core-library'
import Header from './Header/Header'
import EventInfo from './EventInfo/EventInfo'
import BoxContainer from './BoxContainer/BoxContainer'

class HeadToHeadWidget extends Component {
  /**
   * Called after component mounts
   */
  componentDidMount() {
    widgetModule.adaptWidgetHeight()
  }
  /**
   * Called after updating component's DOM.
   */
  componentDidUpdate() {
    widgetModule.adaptWidgetHeight()
  }

  render() {
    const t = translationModule.getTranslation.bind(translationModule)
    return (
      <div>
        <Header title={t('Head to head')} />
        {this.props.events.map(event => {
          return event.lastEvents.map((lastEvent, i) => (
            <BoxContainer key={i}>
              <EventInfo
                homeName={lastEvent.homeParticipant}
                homeScore={lastEvent.homeScore}
                awayName={lastEvent.awayParticipant}
                awayScore={lastEvent.awayScore}
                start={lastEvent.start}
              />
            </BoxContainer>
          ))
        })}
      </div>
    )
  }
}

HeadToHeadWidget.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default HeadToHeadWidget
