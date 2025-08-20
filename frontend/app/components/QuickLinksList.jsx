import Link from 'next/link'
import React from 'react'

function QuickLinksList({header, links}) {
  return (
    <div>
        <h2 className='text-xl mb-2'>{header}</h2>
            <ul className='font-light' key={header}> 
                {
                    links.map(link => {
                        return (
                            <li key={link.text}><Link href={link.link}>{link.text}</Link> </li>
                        ) 
                    })
                }
            </ul>
    </div>
  )
}

export default QuickLinksList