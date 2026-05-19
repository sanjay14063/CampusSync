import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import type { Event } from '../types/event'
import { unregisterFromEvent } from '../utils/events'

const UnregisterEvent = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, role } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return setLoading(false)
      try {
        const d = await getDoc(doc(db, 'events', id))
        if (d.exists()) setEvent({ id: d.id, ...(d.data() as Omit<Event, 'id'>) })
      } catch (err) {
        console.error('Failed to load event', err)
        setActionError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (role !== 'student') return <div className="p-6">Only students can unregister from events.</div>

  const handleUnregister = async () => {
    if (!user) return navigate('/')
    if (!id) {
      setActionError('Missing event id')
      return
    }

    setSubmitting(true)
    setActionError(null)
    try {
      if (!event) throw new Error('Event not found')
      await unregisterFromEvent(db, event, user)

      setSuccessMessage('Successfully unregistered from event.')
      setActionError(null)
    } catch (err) {
      console.error('Failed to unregister', err)
      setActionError(err instanceof Error ? err.message : 'Failed to unregister')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (!event) return <div className="p-6">Event not found</div>

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Unregister from {event.title}</h1>
        <p className="text-sm text-slate-700 mb-4">{event.description}</p>

        {actionError ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800 mb-3">{actionError}</div>
        ) : null}
        {successMessage ? (
          <div className="rounded border border-green-200 bg-green-50 p-3 text-green-800 mb-3">{successMessage}</div>
        ) : null}

        <div className="flex gap-3">
          <button onClick={handleUnregister} disabled={submitting} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
            {submitting ? 'Unregistering…' : 'Confirm Unregistration'}
          </button>
          <button onClick={() => navigate(-1)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>
        </div>
      </div>
    </div>
  )
}

export default UnregisterEvent
