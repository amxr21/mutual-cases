'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartBtn, LikedBtn } from '.';

/**
 * Text nav links show an animated underline when their route is active. Active =
 * exact match for "/", or a path-prefix match for everything else (so e.g.
 * /products/123 keeps "Cases & More" highlighted). Icon links delegate to their
 * own components.
 */
function NavLink({ text = '', link, type = 'text' }) {
  const pathname = usePathname()

  if (type !== 'text') {
    return text === 'liked' ? <LikedBtn /> : <CartBtn />
  }

  const active = link === '/' ? pathname === '/' : pathname.startsWith(link)

  return (
    <Link href={link} className="nav-link relative group">
      <span className={active ? 'text-blue' : ''}>{text}</span>
      <span
        className={`absolute -bottom-1 left-0 h-0.5 bg-blue rounded-full transition-all duration-300 ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      />
    </Link>
  )
}

export default NavLink;
