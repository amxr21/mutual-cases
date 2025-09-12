import React from 'react'

function MainSection({children, classes, Id}) {
  return (
    <section id={Id} className={`flex flex-col xl:gap-10 ${classes}`}>
        {children}
    </section>
  )
}

export default MainSection