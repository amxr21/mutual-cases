'use client'

import { useEffect, useState } from "react"

function Checkbox({text, checked, onToggle}) {

    // const [ checked, setChecked ] = useState(false);

    // const [ checkedList, setCheckedList ] = useState([])


    // const handleCheck = (e) => {      
      
    //   let a = String(e.target.parentElement.lastElementChild.textContent).toLowerCase()
      
    //   // console.log(a);
      
    //   const nextChecked = !checked;
    //   setChecked(nextChecked)

    //   setCheckedList(prev => {
    //     if(nextChecked){
    //       if(!prev.includes(a)){
    //         return [...prev, a]
    //       }
    //       return prev;
    //     }

    //     else{
    //       return prev.filter(item => item !== a)
    //     }


    //   })
      
    // }

    // useEffect(() => {
    //   console.log("Updated checkedList:", checkedList);

    // }, [checkedList])
    

  return (
    <div className='flex items-center gap-2'>
        <div onClick={onToggle} className={`relative overflow-hidden checkbox flex items-center justify-center border border-gray-200 min-w-4 w-4 min-h-4 h-4 bg-white rounded-md`}>
          {
            checked && <div className="absolute checked inset-0 mx-auto my-auto object-contain bg-blue w-7/12 h-7/12 rounded-sm"></div>
          }
        </div>
        <p className="text-base">{text}</p>
    </div>
  )
}

export default Checkbox