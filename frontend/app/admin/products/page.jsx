'use client'
import { useEffect, useState } from 'react'
import { getJSON, postJSON, patchJSON, deleteJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge, FormField } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import ConfirmDialog from '../ui/ConfirmDialog'
import Select from '../ui/Select'
import { buildTemplate } from './templates'

const EMPTY = { trend: 0, price: '', model: '', edition: '', category: 'iphone', type: 'normal', quantity: 0, image_url_1: '', image_url_2: '', image_url_3: '', description: '', material: '', approach: '', features: '' }
const CATEGORIES = ['iphone', 'ipad', 'special items']
const TYPES = ['normal', '3d design', 'simple', 'light', 'magnet']

export default function AdminProducts() {
    const toast = useToast()
    const [products, setProducts] = useState([])
    const [status, setStatus] = useState('loading')
    const [form, setForm] = useState(EMPTY)
    const [editingId, setEditingId] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [confirm, setConfirm] = useState(null) // product pending delete

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/products')
        if (r.ok && Array.isArray(r.data)) { setProducts(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

    const openNew = () => { setForm(EMPTY); setEditingId(null); setDrawerOpen(true) }
    const openEdit = (p) => {
        setEditingId(p.id)
        setForm({ trend: p.trend ? 1 : 0, price: p.price, model: p.model, edition: p.edition, category: p.category, type: p.type, quantity: p.quantity ?? 0, image_url_1: p.image_url_1 || '', image_url_2: p.image_url_2 || '', image_url_3: p.image_url_3 || '', description: p.description || '', material: p.material || '', approach: p.approach || '', features: p.features || '' })
        setDrawerOpen(true)
    }

    // Fill the 4 detail fields from the type/category template (admin can then edit).
    const applyTemplate = () => {
        const t = buildTemplate(form)
        setForm((f) => ({ ...f, ...t }))
        toast.success('Template applied — edit as needed')
    }

    const submit = async () => {
        if (!form.model || !form.edition || form.price === '') { toast.error('Model, edition, and price are required'); return }
        setSaving(true)
        const payload = { ...form, trend: Number(form.trend) ? 1 : 0, price: Number(form.price), quantity: Number(form.quantity) }
        const r = editingId ? await patchJSON(`/products/${editingId}`, payload) : await postJSON('/products', payload)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        toast.success(editingId ? 'Product updated' : 'Product created')
        setDrawerOpen(false)
        load()
    }

    const doDelete = async () => {
        if (!confirm) return
        setSaving(true)
        const r = await deleteJSON(`/products/${confirm.id}`)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Delete failed'); return }
        toast.success('Product deleted')
        setProducts((prev) => prev.filter((p) => p.id !== confirm.id))
        setConfirm(null)
    }

    const columns = [
        { key: 'id', header: 'ID', sortable: true },
        { key: 'category', header: 'Category', sortable: true, render: (p) => <span className="capitalize">{p.category}</span> },
        { key: 'model', header: 'Model', sortable: true },
        { key: 'edition', header: 'Edition', sortable: true, render: (p) => <span className="capitalize">{p.edition}</span> },
        { key: 'type', header: 'Type', sortable: true },
        { key: 'price', header: 'Price', sortable: true, align: 'right', render: (p) => `${p.price} AED` },
        { key: 'quantity', header: 'Qty', sortable: true, align: 'center' },
        { key: 'trend', header: 'Trend', align: 'center', render: (p) => (p.trend ? <Badge tone="gold">Trending</Badge> : <span className="ui-muted">—</span>) },
    ]

    if (status === 'loading') return <Loader rows={6} />
    if (status === 'error') return <AdminMessage variant="error" title="Couldn't load products" message="Please refresh to try again." />

    const field = 'ui-input'

    return (
        <div>
            <PageHeader
                title="Products"
                subtitle={`${products.length} total`}
                actions={<button className="ui-btn ui-btn-primary" onClick={openNew}>+ New product</button>}
            />

            <DataTable
                columns={columns}
                rows={products}
                searchKeys={['model', 'edition', 'category', 'type']}
                searchPlaceholder="Search products…"
                rowActions={(p) => (
                    <div className="flex gap-2 justify-end">
                        <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => openEdit(p)}>Edit</button>
                        <button className="ui-btn ui-btn-danger !py-1 !px-3" onClick={() => setConfirm(p)}>Delete</button>
                    </div>
                )}
            />

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editingId ? `Edit product #${editingId}` : 'New product'}
                footer={
                    <>
                        <button className="ui-btn ui-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
                        <button className="ui-btn ui-btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Category"><Select value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={CATEGORIES} /></FormField>
                        <FormField label="Type"><Select value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={TYPES} /></FormField>
                    </div>
                    <FormField label="Model"><input value={form.model} onChange={set('model')} className={field} placeholder="e.g. 15 pro" /></FormField>
                    <FormField label="Edition"><input value={form.edition} onChange={set('edition')} className={field} placeholder="e.g. dubai edition" /></FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Price (AED)"><input type="number" value={form.price} onChange={set('price')} className={field} /></FormField>
                        <FormField label="Quantity"><input type="number" value={form.quantity} onChange={set('quantity')} className={field} /></FormField>
                    </div>
                    <FormField label="Image URL 1"><input value={form.image_url_1} onChange={set('image_url_1')} className={field} /></FormField>
                    <FormField label="Image URL 2"><input value={form.image_url_2} onChange={set('image_url_2')} className={field} /></FormField>
                    <FormField label="Image URL 3"><input value={form.image_url_3} onChange={set('image_url_3')} className={field} /></FormField>

                    {/* Product detail fields — used on the storefront product page. */}
                    <div className="flex items-center justify-between border-t ui-border pt-3">
                        <span className="ui-muted text-xs font-semibold uppercase">Details</span>
                        <button type="button" className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={applyTemplate} title="Auto-fill from type + category">
                            ✨ Use template
                        </button>
                    </div>
                    <FormField label="Description"><textarea value={form.description} onChange={set('description')} className="ui-textarea" rows={3} placeholder="Shown on the product page…" /></FormField>
                    <FormField label="Material"><input value={form.material} onChange={set('material')} className={field} placeholder="e.g. Soft-touch polycarbonate" /></FormField>
                    <FormField label="Design / approach"><textarea value={form.approach} onChange={set('approach')} className="ui-textarea" rows={2} placeholder="How it's designed / made…" /></FormField>
                    <FormField label="Features" hint="Separate with  |  (pipe)"><textarea value={form.features} onChange={set('features')} className="ui-textarea" rows={2} placeholder="Feature one | Feature two | …" /></FormField>

                    <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ui-text)' }}>
                        <input type="checkbox" checked={!!Number(form.trend)} onChange={(e) => setForm((f) => ({ ...f, trend: e.target.checked ? 1 : 0 }))} /> Mark as trending
                    </label>
                </div>
            </Drawer>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={doDelete}
                busy={saving}
                title="Delete product?"
                message={confirm ? `This permanently removes "${confirm.category} ${confirm.model}". This can't be undone.` : ''}
                confirmLabel="Delete"
            />
        </div>
    )
}
