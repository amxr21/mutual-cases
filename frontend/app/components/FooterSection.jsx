import React from 'react'

function FooterSection({ children, classes }) {
  return (
    <div className={`xl:w-1/3 flex ${classes}`}>
      {children}
    </div>
  )
}

export default FooterSection