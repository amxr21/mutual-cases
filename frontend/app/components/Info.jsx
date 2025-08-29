import Image from 'next/image'

function Info({ icon, header, description }) {
  return (
    <div className='flex flex-col items-center gap-3'>
        <div className="icon w-20 h-20  rounded-2xl">
            <Image alt={`${header} icon`} src={icon} />
        </div>
        <div className="text flex flex-col gap-1 text-off-white text-center">
            <h2 className="header text-off-white font-semibold text-2xl">{header}</h2>
            <p className="description font-light text-sm">{description}</p>
        </div>
    </div>
  )
}

export default Info