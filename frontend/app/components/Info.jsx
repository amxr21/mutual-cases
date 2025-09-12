import Image from 'next/image'

function Info({ icon, header, description }) {
  return (
    <div className='flex xl:flex-col xl:items-center gap-5 xl:gap-3'>
        <div className="icon min-w-12 xl:min-w-20 min-h-12 xl:min-h-20  rounded-2xl">
            <Image alt={`${header} icon`} src={icon} />
        </div>
        <div className="text flex flex-col gap-1 text-off-white text-left xl:text-center">
            <h2 className="header text-off-white font-semibold text-lg xl:text-2xl">{header}</h2>
            <p className="description font-light text-sm">{description}</p>
        </div>
    </div>
  )
}

export default Info