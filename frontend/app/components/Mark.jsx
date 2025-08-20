import Image from 'next/image'
import { mark } from '../constants/imags'

function Mark({classes = '-top-6 -right-6 '}) {
  return (
      <div className={`absolute z-50 ${classes}`}>
          <Image alt='circle with stars' src={mark} />
      </div>
    )
}

export default Mark