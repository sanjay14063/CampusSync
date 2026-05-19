import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import EventForm from '../components/EventForm'
import type { EventFormValues } from '../components/EventForm'
import type { Event, EventStatus } from '../types/event'
import { useAuth } from '../context/AuthContext'

const EditEvent = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialValues, setInitialValues] = useState<EventFormValues | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    const fetchEvent = async () => {
      setFetching(true)
      try {
        const d = await getDoc(doc(db, 'events', id))
        if (!d.exists()) {
          setError('Event not found')
          return
        }
        const data = d.data() as Event

        const dateFromTs = data.dateTimestamp?.toDate?.()
        const dateStr = dateFromTs ? dateFromTs.toISOString().slice(0, 16) : (data.date ?? '')

        const teamSize = data.teamSize ? `${data.teamSize.min}-${data.teamSize.max}` : ''

        setInitialValues({
          title: data.title || '',
          date: dateStr,
          venue: data.venue || '',
          description: data.description || '',
          maxCapacity: String(data.maxCapacity || 0),
          status: data.status === 'Draft' ? 'Draft' : 'Active',
          participationType: data.participationType || '',
          teamSize,
          prize: data.prize || '',
          entryFee: data.entryFee ? String(data.entryFee) : '',
          rules: data.rules || '',
          registrationCriteria: data.registrationCriteria || '',
          registrationDeadline: data.registrationDeadline || '',
        })
      } catch (err) {
        console.error('Failed to load event', err)
        setError((err as Error).message || 'Failed to load event')
      } finally {
        setFetching(false)
      }
    }

    fetchEvent()
  }, [id])

  const handleSubmit = async (form: EventFormValues) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const payload: Partial<Omit<Event, 'id'>> = {
        title: form.title,
        date: form.date,
        dateTimestamp: form.date ? Timestamp.fromDate(new Date(form.date)) : undefined,
        venue: form.venue,
        description: form.description,
        maxCapacity: Number(form.maxCapacity) || 0,
        status: form.status,
        participationType: form.participationType,
        prize: form.prize || undefined,
        entryFee: form.entryFee ? Number(form.entryFee) : undefined,
        rules: form.rules || undefined,
        registrationDeadline: form.registrationDeadline || undefined,
        registrationCriteria: form.registrationCriteria || undefined
      }

      if (form.participationType === 'team' && form.teamSize) {
        const parts = form.teamSize.split('-').map((p) => Number(p.trim()))
        if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
          payload.teamSize = { min: parts[0], max: parts[1] }
        }
      }

      const now = new Date()
      let nextStatus: EventStatus = form.status
      if (payload.status !== 'Draft' && payload.maxCapacity === 0) nextStatus = 'Full'
      if (payload.status !== 'Draft' && payload.date && new Date(payload.date) < now) nextStatus = 'Completed'
      payload.status = nextStatus

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      ) as Partial<Omit<Event, 'id'>>

      await updateDoc(doc(db, 'events', id), cleanedPayload)
      navigate('/events')
    } catch (err) {
      console.error('Failed to update event', err)
      setError((err as Error).message || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  if (role !== 'admin') {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
          <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
          <p className="mt-3 text-sm">Only admins can edit events.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button onClick={() => navigate('/admin')} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        Back to Dashboard
      </button>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Edit Event</h1>
        {fetching ? (
          <p>Loading event…</p>
        ) : initialValues ? (
          <EventForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel="Update Event"
            loading={loading}
            error={error}
            onCancel={() => navigate('/events')}
          />
        ) : (
          <p className="text-sm text-red-600">{error || 'Event not found'}</p>
        )}
      </div>
    </div>
  )
}

export default EditEvent
