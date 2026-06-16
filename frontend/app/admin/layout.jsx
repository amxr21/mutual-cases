import { Inter } from 'next/font/google'
import AdminGuard from './AdminGuard'

// Self-hosted Inter, exposed as a CSS variable so the admin font stack can
// reference it. SF Pro is preferred first (via -apple-system) on Apple devices;
// Inter is the cross-platform default everywhere else.
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
})

export const metadata = {
    title: 'Mutual - Admin Dashboard',
}

export default function AdminLayout({ children }) {
    return (
        <div className={inter.variable}>
            <AdminGuard>{children}</AdminGuard>
        </div>
    )
}
