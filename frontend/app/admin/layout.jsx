import AdminGuard from './AdminGuard'

export const metadata = {
    title: 'Mutual - Admin Dashboard',
}

export default function AdminLayout({ children }) {
    return <AdminGuard>{children}</AdminGuard>
}
