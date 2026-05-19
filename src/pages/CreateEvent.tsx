import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import EventForm from '../components/EventForm'
import type { EventFormValues } from '../components/EventForm'
import type { Event, EventStatus } from '../types/event'

const validateEventForm = (form: EventFormValues) => {
  const capacity = Number(form.maxCapacity)
  if (!form.title.trim()) return 'Event title is required.'
  if (!form.date) return 'Event date and time are required.'
  if (!form.registrationDeadline) return 'Registration deadline is required.'
  if (!form.venue.trim()) return 'Venue is required.'
  if (!form.description.trim()) return 'Description is required.'
  if (!Number.isFinite(capacity) || capacity < 1) return 'Maximum capacity must be at least 1.'
  if (!form.status) return 'Event status is required.'
  if (!form.participationType) return 'Participation type is required.'
  if (form.registrationDeadline && form.date) {
    const registrationDeadline = new Date(form.registrationDeadline)
    const eventDate = new Date(form.date)
    if (Number.isNaN(registrationDeadline.valueOf()) || Number.isNaN(eventDate.valueOf())) {
      return 'Invalid event or registration deadline date.'
    }
    if (registrationDeadline >= eventDate) {
      return 'Registration deadline must be before the event date and time.'
    }
  }
  return null
}

const CreateEvent = () => {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const defaultFormValues: EventFormValues = {
    title: '',
    date: '',
    venue: '',
    description: '',
    maxCapacity: '0',
    status: 'Active',
    participationType: '',
    teamSize: '',
    prize: '',
    entryFee: '',
    rules: '',
    registrationCriteria: '',
    registrationDeadline: '',
  }

  const handleSubmit = async (form: EventFormValues) => {
    const validationError = validateEventForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload: Partial<Omit<Event, 'id'>> = {
        title: form.title.trim(),
        date: form.date,
        dateTimestamp: form.date ? Timestamp.fromDate(new Date(form.date)) : undefined,
        venue: form.venue.trim(),
        description: form.description.trim(),
        maxCapacity: Number(form.maxCapacity),
        currentParticipants: 0,
        participationType: form.participationType,
        prize: form.prize.trim() || undefined,
        entryFee: form.entryFee ? Number(form.entryFee) : undefined,
        rules: form.rules.trim() || undefined,
        registrationDeadline: form.registrationDeadline || undefined,
        registrationCriteria: form.registrationCriteria.trim() || undefined
      }

      if (form.participationType === 'team' && form.teamSize) {
        const parts = form.teamSize.split('-').map((p) => Number(p.trim()))
        if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
          payload.teamSize = { min: parts[0], max: parts[1] }
        }
      }

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      ) as Partial<Omit<Event, 'id'>>

      // Determine status: if event date passed -> Completed, if capacity full -> Full, else Active
      const now = new Date()
      let status: EventStatus = form.status
      if (status !== 'Draft' && cleanedPayload.maxCapacity === 0) status = 'Full'
      if (status !== 'Draft' && cleanedPayload.date && new Date(cleanedPayload.date) < now) status = 'Completed'

      cleanedPayload.status = status

      await addDoc(collection(db, 'events'), { ...cleanedPayload, createdAt: serverTimestamp() })

      const confirmation = 'Your event has been created successfully.'
      setSuccessMessage(confirmation)
      navigate('/admin')
    } catch (err) {
      console.error('Failed to create event', err)
      setError((err as Error).message || 'Failed to create event. See console for details.')
    } finally {
      setLoading(false)
    }
  }

  if (role !== 'admin') {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
          <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
          <p className="mt-3 text-sm">Only admins can create events.</p>
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
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Create Event</h1>
        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <p className="text-sm">{successMessage}</p>
          </div>
        ) : null}
        <EventForm
          initialValues={defaultFormValues}
          onSubmit={handleSubmit}
          submitLabel="Create Event"
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}

export default CreateEvent
