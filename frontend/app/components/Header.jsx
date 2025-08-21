import React from 'react'
import { Mark } from './index'

function Header({headerText = "", subheader = true, subheaderText = "", textAlignment = "left", mark = false, markClasses = ''}) {
  return (
    <div className={`relative flex flex-col gap-5 ${textAlignment == 'left' ? 'text-left' : 'text-center'}`}>
        {mark && <Mark classes={markClasses} />}
        <h2 className='header uppercase'>{headerText}</h2>
        {subheader && <p className={`para ${textAlignment == 'left' ? 'text-left' : 'text-center'}`}>{subheaderText}</p>}
    </div>
  )
}

export default Header