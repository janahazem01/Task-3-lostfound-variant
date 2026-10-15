import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    setForm(defaults)
    setError('')
    setLoadFailed(false)
    setLoading(Boolean(id))
    if (!id) return

    api.get(`/items/${id}`)
      .then(({ data }) => {
        if (!active) return
        const item = data.item
        setForm({
          title: item.title ?? '',
          status: item.status ?? defaults.status,
          category: item.category ?? defaults.category,
          location: item.location ?? '',
          description: item.description ?? ''
        })
      })
      .catch(err => {
        if (!active) return
        setError(err?.response?.data?.message || 'Failed to load item')
        setLoadFailed(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // Ignore a response if the user has moved to another item or left the page.
    return () => { active = false }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(previous => ({ ...previous, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading || loadFailed || saving) return
    setError('')
    setSaving(true)

    const { title, status, category, location, description } = form
    const payload = { title, status, category, location, description }

    try {
      if (id) await api.patch(`/items/${id}`, payload)
      else await api.post('/items', payload)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {loading && <p role="status" className="text-sm text-zinc-600">Loading item…</p>}
        <fieldset className="space-y-3" disabled={loading || loadFailed || saving}>
          <input aria-label="Title" className="input" name="title" placeholder="Title" value={form.title} onChange={onChange} required />

          <select aria-label="Status" className="input" name="status" value={form.status} onChange={onChange}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="claimed">Claimed</option>
          </select>

          <select aria-label="Category" className="input" name="category" value={form.category} onChange={onChange}>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>

          <input aria-label="Location (optional)" className="input" name="location" placeholder="Location (optional)" value={form.location} onChange={onChange} />

          <textarea aria-label="Description (optional)" className="input" name="description" placeholder="Description (optional)" rows={3} value={form.description} onChange={onChange} />
        </fieldset>
        {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={loading || loadFailed || saving}>{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  )
}
