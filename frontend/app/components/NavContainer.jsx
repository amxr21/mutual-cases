import React from 'react'

function NavContainer({children, type, classes}) {
  return (
    <div className={`${classes} bg-off-transparent flex items-center justify-between ${type == 'icon' ? 'w-fit gap-5' : 'xl:gap-14'} px-3 xl:px-5 py-3 rounded-lg`}>
        {children}
    </div>
  )
}

export default NavContainer