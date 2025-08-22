import React from 'react'
import { BoldText, Header, Mark } from '../components'


function AboutText() {
  return (
    <div className="about-text flex flex-col gap-5">
      <Header headerText='About Mutual' subheader={false} textAlignment='left' mark={true} markClasses='-top-6 left-25 w-42'/>

      <div>
        <p className='para'>
            A cover brand for the next generation of thinkers, <BoldText>creators</BoldText>, and <BoldText>doers.</BoldText> Whether you're hustling between classes, sketching at a café, or grinding out ideas at midnight — our covers are designed to move with you.
        </p>

        <br />

        <p className="para">
          Born as the <BoldText>first Emirati brand</BoldText> specializing in iPad covers, we craft premium designs featuring unique phrases and exclusive features — from Apple Pencil charging support to built-in stands for your workflow.
        </p>

        <br />

        <p className='para'>Our mission is simple: Protect what matters. <BoldText>Do it with style.</BoldText></p>
      </div>

      
    </div>
  )
}

export default AboutText