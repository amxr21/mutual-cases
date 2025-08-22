import React from 'react'
import { Mark } from './index'

function Header({headerText = "", subheader = true, subheaderText = "", textAlignment = "left", mark = false, markClasses = '', textColor="black"}) {
  return (
    <div className={`relative flex flex-col gap-1 ${textAlignment == 'left' ? 'text-left' : 'text-center'}`}>
        {mark && <Mark classes={markClasses} />}
        <h2 className={`header uppercase text-${textColor}`}>{headerText}</h2>
        {subheader && <p className={`para text-${textColor} ${textAlignment == 'left' ? 'text-left' : 'text-center'}`}>{subheaderText}</p>}
    </div>
  )
}

export default Header