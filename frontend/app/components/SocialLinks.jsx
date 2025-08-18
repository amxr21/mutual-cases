import { SocialLink } from "./index"

function SocialLinks() {
    const text = {
        'en': [
            { text: 'WhatsApp',  link: '#' },
            { text: 'Instagram', link: '#' },
            { text: 'TikTok',    link: '#' },
            { text: 'X',         link: '#' },
        ]
    }


  return (
    <ul className="flex justify-between">
        {
            text['en'].map(link => {
                return (
                    <SocialLink key={link.text} link={link.link} text={link.text} type="text" />
                )
            })
        }
    </ul>
  )
}

export default SocialLinks