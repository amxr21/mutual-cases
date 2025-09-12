import React from 'react'

function LargeButton({ handleClick, text='', classes ='', color='blue' }) {
  return (
    <button onClick={handleClick} className={`cursor-pointer px-2 xl:px-3 py-1 xl:py-2 capitalize rounded-xl text-lg xl:text-2xl font-semibold ${color == 'blue'? 'bg-blue text-off-white' : 'bg-transparent border border-blue text-blue'} ${classes}`}>
        {text}
    </button>
  )
}

export default LargeButton