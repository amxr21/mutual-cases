'use client'
import { useEffect, useState } from 'react'
import { getJSON } from '../../lib/safeFetch'

export default function AdminCustomers() {
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let active = true
        ;(async () => {
            const r = await getJSON('/admin/customers')
            if (!active) return
            if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
            else setStatus('error')
        })()
        return () => { active = false }
    }, [])

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Customers</h1>
            {status === 'loading' ? <p className="font-light">Loading…</p> : null}
            {status === 'error' ? <p className="text-blue">Couldn&apos;t load customers.</p> : null}
            {status === 'ready' ? (
                <div className="bg-off-white rounded-xl shadow-sm border border-black/5 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-blue/5 text-left">
                            <tr>
                                <th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Email</th>
                                <th className="p-3">Role</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((u) => (
                                <tr key={u.id} className="border-t border-black/5 hover:bg-blue/[0.02]">
                                    <td className="p-3">{u.id}</td>
                                    <td className="p-3">{u.name}</td>
                                    <td className="p-3">{u.email}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-blue text-off-white' : 'bg-gray-200'}`}>{u.role}</span>
                                    </td>
                                    <td className="p-3">{u.order_count}</td>
                                    <td className="p-3 font-semibold">{Number(u.spent).toLocaleString()} AED</td>
                                    <td className="p-3 font-light">{new Date(u.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}
