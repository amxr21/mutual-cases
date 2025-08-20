import Image from 'next/image'
import { mark } from '../constants/imags'

function Mark() {
  return (
      <div className='absolute -top-6 -right-6 z-50'>
          <Image src={mark} />
      </div>
    )
}

export default Mark