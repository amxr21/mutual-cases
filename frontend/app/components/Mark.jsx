import Image from 'next/image'
import { mark } from '../constants/imags'

function Mark({classes = 'w-36 xl:w-fit top-6 xl:-top-6 xl:-right-6 '}) {
  return (
      <div className={`absolute z-50 ${classes}`}>
          <Image alt='circle with stars' src={mark} />
      </div>
    )
}

export default Mark