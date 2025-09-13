function Feature({ header, index, details}) {
    
  return (
    <li className=" text-center flex xl:flex-col gap-8 xl:gap-5 justify-center h-full">
        <div className="header min-w-32 xl:min-w-fit text-white font-semibold flex flex-col gap-2">
            <h2 className='leading-10 h-fit capitalize text-left xl:text-center text-3xl xl:text-5xl'>{index}.</h2>
            <h2 className='leading-10 h-fit capitalize text-left xl:text-center text-3xl xl:text-5xl'>{header}</h2>
        </div>
        <ul className="font-extralight text-base text-left xl:text-center xl:text-x xl:grow">
            {
                details.map((d, indx) => {
                    return (
                        <li key={indx}>• {d}</li>
                    )
                })
            }
        </ul>
    </li>
  )
}

export default Feature