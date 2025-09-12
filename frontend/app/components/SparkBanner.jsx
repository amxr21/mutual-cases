'use client'
import Image from 'next/image'
import { Spark } from '../constants/imags'
import { LargeButton } from '.'


function SparkBanner() {
  return (
      <div className="relative flex flex-col items-center">
        <Image src={Spark} alt='spark' className='' />
        <div className="absolute top-[35%] inset-0 flex flex-col gap-5 h-fit items-center justify-center">
            <div className="text text-center">
                <h2 className='text-3xl xl:text-4xl font-semibold'>Got a Design in Mind?</h2>
                <p className='text-xl xl:text-3xl font-light'>Reach us out with your sentance & design</p>
            </div>
            <LargeButton handleClick={()=>{}} classes='w-fit px-5 xl:px-8' color='blue' text='Enlighten Us' />
        </div>
      </div>
  )
}

export default SparkBanner