import React from 'react'
import PropTypes from 'prop-types'
import styles from './Header.scss'

const Header = ({ title }) => {
  return (
    <div className={styles.general + ' KambiWidget-card-support-text-color'}>
      {title}
    </div>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
}

export default Header
