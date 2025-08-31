import React from 'react'

function LargeButton({ handleClick, text='', classes ='', color='blue' }) {
  return (
    <button onClick={handleClick} className={`cursor-pointer px-3 py-2 capitalize rounded-xl text-2xl font-semibold ${color == 'blue'? 'bg-blue text-off-white' : 'bg-transparent border border-blue text-blue'} ${classes}`}>
        {text}
    </button>
  )
}

export default LargeButton