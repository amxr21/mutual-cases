import Image from "next/image"

import { iPadDrawing, iPhoneDrawing } from "../constants/imags"

function ImageCaption({caseType}) {
  return (
    <div className={`iphone w-fit text-center flex gap-5 ${caseType == 'iphone' ? 'flex-col' : 'flex-col-reverse'}`}>
        <Image src={caseType == 'iphone' ? iPhoneDrawing : iPadDrawing} alt={`${caseType == 'iphone' ? 'iPhone' : 'iPad'}`} />
        <p className='font-light italic text-xl'>iPhone cases</p>
    </div>
  )
}

export default ImageCaption