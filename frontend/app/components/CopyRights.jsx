import Link from 'next/link'

import { Line } from './index'

function CopyRights() {
  return (
    <div className='w-full flex flex-col items-center '>
        <Line classes="border-t border-t-gray-400 pt-3 min-w-20 w-2/12" />

        <div className='text-center flex gap-5 justify-center text-sm font-light'>
            <Link href={'mailto:support@mutualcovers'}>support@mutualcovers</Link>
            <p className=''>Established in 2024 - AD, UAE</p>
        </div>
    </div>
  )
}

export default CopyRights