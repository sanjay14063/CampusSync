import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Event } from '../types/event'
import { db } from '../firebase/config'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { canRegisterForEvent, getEventStatus } from '../utils/events'

const formatEventDate = (event: Event) => {
  if (event.dateTimestamp && 'toDate' in event.dateTimestamp) {
    return event.dateTimestamp.toDate().toLocaleString()
  }
  return event.date
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [registrationCount, setRegistrationCount] = useState<number | null>(null)
  const { role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return
      try {
        const d = await getDoc(doc(db, 'events', id))
        if (d.exists()) setEvent({ id: d.id, ...(d.data() as Omit<Event, 'id'>) })
      } catch (err) {
        console.error('Failed to load event', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  useEffect(() => {
    const fetchRegistrationCount = async () => {
      if (!id) return
      try {
        const registrationsQuery = query(collection(db, 'registrations'), where('eventId', '==', id))
        const snapshot = await getDocs(registrationsQuery)
        setRegistrationCount(snapshot.size)
      } catch (err) {
        console.error('Failed to load registration count', err)
        setRegistrationCount(0)
      }
    }

    fetchRegistrationCount()
  }, [id])

  if (!loading && !event) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
          <h1 className="text-2xl font-semibold text-slate-900">Event not found</h1>
          <p className="mt-3 text-sm">Please go back to the events page and choose another event.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/events"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="p-6">Loading event…</div>
  }

  if (!event) return null

  const registeredCount = registrationCount ?? event.currentParticipants ?? 0
  const seatsLeft = (event?.maxCapacity || 0) - registeredCount
  const eligibility = event?.registrationCriteria || 'No eligibility details available.'
  const requirements = event?.rules || 'No requirements provided.'
  const teamInfo = event?.participationType || 'Unknown'
  const titleCaseType = teamInfo.charAt(0).toUpperCase() + teamInfo.slice(1)
  const displayDate = formatEventDate(event)
  const eventStatus = getEventStatus(event)

  return (
    <div className="mx-auto max-w-4xl p-6 text-left">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{event.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{displayDate} · {event.venue}</p>
          </div>
          <Link
            to="/events"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Back to Events
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,280px]">
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Description</h2>
              <p className="mt-3 text-slate-700">{event.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">Eligibility</h2>
              <p className="mt-3 text-slate-700">{eligibility}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">Requirements</h2>
              <p className="mt-3 text-slate-700">{requirements}</p>
            </div>
            {role === 'student' ? (
              <button
                onClick={() => navigate(`/registerevent/${event.id}`)}
                disabled={!canRegisterForEvent(event)}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300">
                {canRegisterForEvent(event) ? 'Register' : 'Registration closed'}
              </button>
            ) : null}
          </section>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Type</h3>
                <p className="mt-2 text-lg font-medium text-slate-900">{titleCaseType}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Seats left</h3>
                <p className="mt-2 text-lg font-medium text-slate-900">{seatsLeft}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Status</h3>
                <p className="mt-2 text-lg font-medium text-slate-900">{eventStatus}</p>
              </div>
              {event.teamSize ? (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Team size</h3>
                  <p className="mt-2 text-lg font-medium text-slate-900">{event.teamSize.min}–{event.teamSize.max}</p>
                </div>
              ) : null}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Capacity</h3>
                <p className="mt-2 text-lg font-medium text-slate-900">{event.maxCapacity}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Registered</h3>
                <p className="mt-2 text-lg font-medium text-slate-900">
                  {registrationCount === null ? 'Loading…' : registeredCount}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default EventDetails
