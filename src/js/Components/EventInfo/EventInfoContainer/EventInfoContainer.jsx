import React from 'react'
import PropTypes from 'prop-types'
import styles from './EventInfoContainer.scss'

const EventInfoContainer = ({ children }) => {
  return <div className={styles.general}>{children}</div>
}

EventInfoContainer.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

export default EventInfoContainer
