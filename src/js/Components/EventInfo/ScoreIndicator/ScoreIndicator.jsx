import React from 'react'
import PropTypes from 'prop-types'
import styles from './ScoreIndicator.scss'

const ScoreIndicator = ({ score }) => {
  return (
    <div className={styles.container}>
      <div className={'KambiWidget-neutralPrimaryColor ' + styles.scoreBox}>
        <span
          className={'KambiWidget-neutralSecondaryColor ' + styles.scoreBoxText}
        >
          {score}
        </span>
      </div>
    </div>
  )
}

ScoreIndicator.propTypes = {
  score: PropTypes.number.isRequired,
}

export default ScoreIndicator
