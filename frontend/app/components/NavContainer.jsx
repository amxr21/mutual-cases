import React from 'react'

function NavContainer({children, type}) {
  return (
    <div className={`bg-off-transparent flex items-center justify-between ${type == 'icon' ? 'w-fit gap-5' : 'gap-14'} px-5 py-3 rounded-lg`}>
        {children}
    </div>
  )
}

export default NavContainer