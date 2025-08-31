"use client"

function Button({buttonContent = '', type = 'text', handleClick, classes}) {
  return (
    <button onClick={handleClick} className={`${classes} cursor-pointer text-off-black font-light min-w-4 bg-off-transparent rounded-md`}>
        {buttonContent}
    </button>
  )
}

export default Button