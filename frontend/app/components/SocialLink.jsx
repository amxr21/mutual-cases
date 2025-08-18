import Link from "next/link"

function SocialLink({text, link, type = 'text'}) {
  return (
    <Link href={link} className="nav-link">{text}</Link>
  )
}

export default SocialLink;