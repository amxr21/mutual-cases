'use client'
import { useEffect, useState } from 'react'
import { getJSON, postJSON, patchJSON, deleteJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'

const EMPTY = {
    trend: 0, price: '', model: '', edition: '', category: 'iphone',
    type: 'normal', quantity: 0, image_url_1: '', image_url_2: '', image_url_3: '',
}

const CATEGORIES = ['iphone', 'ipad', 'special items']
const TYPES = ['normal', '3d design', 'simple', 'light', 'magnet']

export default function AdminProducts() {
    const toast = useToast()
    const [products, setProducts] = useState([])
    const [status, setStatus] = useState('loading')
    const [form, setForm] = useState(EMPTY)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/products')
        if (r.ok && Array.isArray(r.data)) { setProducts(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

    const resetForm = () => { setForm(EMPTY); setEditingId(null); setShowForm(false) }

    const startEdit = (p) => {
        setEditingId(p.id)
        setForm({
            trend: p.trend ? 1 : 0, price: p.price, model: p.model, edition: p.edition,
            category: p.category, type: p.type, quantity: p.quantity ?? 0,
            image_url_1: p.image_url_1 || '', image_url_2: p.image_url_2 || '', image_url_3: p.image_url_3 || '',
        })
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const submit = async (e) => {
        e.preventDefault()
        if (saving) return
        if (!form.model || !form.edition || form.price === '') {
            toast.error('Model, edition, and price are required'); return
        }
        setSaving(true)
        const payload = { ...form, trend: Number(form.trend) ? 1 : 0, price: Number(form.price), quantity: Number(form.quantity) }
        const r = editingId
            ? await patchJSON(`/products/${editingId}`, payload)
            : await postJSON('/products', payload)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        toast.success(editingId ? 'Product updated' : 'Product created')
        resetForm()
        load()
    }

    const remove = async (id) => {
        const r = await deleteJSON(`/products/${id}`)
        if (!r.ok) { toast.error(r.error?.message || 'Delete failed'); return }
        toast.success('Product deleted')
        setProducts((prev) => prev.filter((p) => p.id !== id))
    }

    const field = 'w-full bg-off-white border border-gray-300 rounded-md py-2 px-3 outline-none focus:border-blue transition-colors'

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Products</h1>
                <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="bg-blue text-off-white font-semibold px-4 py-2 rounded-lg hover:brightness-110 transition">
                    {showForm ? 'Close' : '+ New product'}
                </button>
            </div>

            {/* Create / edit form */}
            {showForm ? (
                <form onSubmit={submit} className="bg-off-white rounded-xl shadow-sm border border-black/5 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <h2 className="md:col-span-3 text-lg font-semibold">{editingId ? `Edit product #${editingId}` : 'New product'}</h2>
                    <label className="flex flex-col gap-1 text-sm"><span>Category</span>
                        <select value={form.category} onChange={set('category')} className={field}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm"><span>Type</span>
                        <select value={form.type} onChange={set('type')} className={field}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm"><span>Model</span><input value={form.model} onChange={set('model')} className={field} placeholder="e.g. 15 pro" /></label>
                    <label className="flex flex-col gap-1 text-sm"><span>Edition</span><input value={form.edition} onChange={set('edition')} className={field} placeholder="e.g. dubai edition" /></label>
                    <label className="flex flex-col gap-1 text-sm"><span>Price (AED)</span><input type="number" value={form.price} onChange={set('price')} className={field} /></label>
                    <label className="flex flex-col gap-1 text-sm"><span>Quantity</span><input type="number" value={form.quantity} onChange={set('quantity')} className={field} /></label>
                    <label className="flex flex-col gap-1 text-sm"><span>Image URL 1</span><input value={form.image_url_1} onChange={set('image_url_1')} className={field} /></label>
                    <label className="flex flex-col gap-1 text-sm"><span>Image URL 2</span><input value={form.image_url_2} onChange={set('image_url_2')} className={field} /></label>
                    <label className="flex flex-col gap-1 text-sm"><span>Image URL 3</span><input value={form.image_url_3} onChange={set('image_url_3')} className={field} /></label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!Number(form.trend)} onChange={(e) => setForm((f) => ({ ...f, trend: e.target.checked ? 1 : 0 }))} /> Trending</label>
                    <div className="md:col-span-3 flex gap-3">
                        <button type="submit" disabled={saving} className="bg-blue text-off-white font-semibold px-6 py-2.5 rounded-lg hover:brightness-110 transition disabled:opacity-60">
                            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
                        </button>
                        <button type="button" onClick={resetForm} className="border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-black/5 transition">Cancel</button>
                    </div>
                </form>
            ) : null}

            {/* Product list */}
            {status === 'loading' ? <p className="font-light">Loading…</p> : null}
            {status === 'error' ? <p className="text-blue">Couldn&apos;t load products.</p> : null}
            {status === 'ready' ? (
                <div className="bg-off-white rounded-xl shadow-sm border border-black/5 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-blue/5 text-left">
                            <tr>
                                <th className="p-3">ID</th><th className="p-3">Category</th><th className="p-3">Model</th>
                                <th className="p-3">Edition</th><th className="p-3">Type</th><th className="p-3">Price</th>
                                <th className="p-3">Qty</th><th className="p-3">Trend</th><th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id} className="border-t border-black/5 hover:bg-blue/[0.02]">
                                    <td className="p-3">{p.id}</td>
                                    <td className="p-3 capitalize">{p.category}</td>
                                    <td className="p-3">{p.model}</td>
                                    <td className="p-3 capitalize">{p.edition}</td>
                                    <td className="p-3">{p.type}</td>
                                    <td className="p-3 font-semibold">{p.price}</td>
                                    <td className="p-3">{p.quantity}</td>
                                    <td className="p-3">{p.trend ? '⭐' : '—'}</td>
                                    <td className="p-3 whitespace-nowrap">
                                        <button onClick={() => startEdit(p)} className="text-blue underline mr-3">Edit</button>
                                        <button onClick={() => remove(p.id)} className="text-red-600 underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}
