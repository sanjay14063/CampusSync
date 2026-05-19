import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import type { Event } from '../types/event'
import { canRegisterForEvent, registerForEvent } from '../utils/events'

const RegisterEvent = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return setLoading(false)
      try {
        const d = await getDoc(doc(db, 'events', id))
        if (d.exists()) setEvent({ id: d.id, ...(d.data() as Omit<Event, 'id'>) })
      } catch (err) {
        console.error('Failed to load event', err)
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="p-6">Loading…</div>
  if (!event) return <div className="p-6">Event not found</div>
  if (role !== 'student') return <div className="p-6">Only students can register for events.</div>

  const handleRegister = async () => {
    if (!user) return navigate('/')
    if (!canRegisterForEvent(event)) {
      setError('Registration is not open for this event.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await registerForEvent(db, event, user)

      setSuccess('Registration successful')
      setError(null)
    } catch (err) {
      console.error('Registration failed', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Register for {event.title}</h1>
        <p className="text-sm text-slate-700 mb-4">{event.description}</p>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800 mb-3">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded border border-green-200 bg-green-50 p-3 text-green-800 mb-3">{success}</div>
        ) : null}

        <div className="flex gap-3">
          <button onClick={handleRegister} disabled={submitting} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
            {submitting ? 'Registering…' : 'Confirm Registration'}
          </button>
          <button onClick={() => navigate(-1)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>
        </div>
      </div>
    </div>
  )
}

export default RegisterEvent
