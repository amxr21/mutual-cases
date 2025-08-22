function Feature({ header, index, details}) {
    
  return (
    <li className=" text-center flex flex-col gap-5">
        <div className="header text-white font-semibold flex flex-col gap-2">
            <h2 className='leading-10 h-fit capitalize text-5xl'>{index}.</h2>
            <h2 className='leading-10 h-fit capitalize text-5xl'>{header}</h2>
        </div>
        <ul className="font-extralight text-xl">
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