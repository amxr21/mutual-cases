import Image from 'next/image'
import { stars } from '../constants/imags'

function Stars() {
  return (
    <div className='absolute bottom-0 left-20 z-50'>
        <Image src={stars} alt='3 one-line starts' />
    </div>
  )
}

export default Stars