import React from 'react'
import { FooterSection, FollowUs } from './index'
import PaymentMethods from './PaymentMethods'

function Contact() {
  return (
    <FooterSection classes={'flex-col gap-6'} header={'Contact'}>
        <div className='flex flex-col gap-2'>
            <h4 className='text-xl'>Contact Us</h4>
            <p className='para-small'>Got a question or a custom request? We’re here to help.</p>
        </div>
        <FollowUs />

        <PaymentMethods />

    </FooterSection>
  )
}

export default Contact