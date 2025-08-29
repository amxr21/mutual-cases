import React from 'react'

function MainSection({children, classes, Id}) {
  return (
    <section id={Id} className={`${classes} flex flex-col gap-10 `}>
        {children}
    </section>
  )
}

export default MainSection