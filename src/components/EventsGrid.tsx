import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Event, Registration } from '../types/event'
import { useAuth } from '../context/AuthContext'
import { canRegisterForEvent, getEventStatus, registerForEvent } from '../utils/events'

const EventsGrid = () => {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [registeringId, setRegisteringId] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        const snapshot = await getDocs(collection(db, 'events'))
        const loadedEvents: Event[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<Event, 'id'>
          return { id: docSnap.id, ...data }
        })
        setEvents(loadedEvents)
      } catch (err) {
        console.error('Failed to load events', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = [event.title, event.description, event.venue]
        .join(' ')
        .toLowerCase()
        .includes(searchValue.toLowerCase())
      const status = getEventStatus(event)
      const matchesStatus = statusFilter ? status === statusFilter : true
      const matchesType = selectedType ? event.participationType === selectedType : true

      if (role === 'student' && (status === 'Draft' || status === 'Completed')) return false
      return matchesSearch && matchesStatus && matchesType
    })
  }, [events, role, searchValue, selectedType, statusFilter])

  const handleDelete = async (id: string) => {
    setActionError(null)
    try {
      await deleteDoc(doc(db, 'events', id))
      setEvents((current) => current.filter((event) => event.id !== id))
    } catch (err) {
      console.error('Failed to delete event', err)
      setActionError('Failed to delete event')
    }
  }

  const csvCell = (value: unknown) => {
    const text = value == null ? '' : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }

  const exportToCSV = async (event: Event) => {
    try {
      const registrationsQuery = query(collection(db, 'registrations'), where('eventId', '==', event.id))
      const snapshot = await getDocs(registrationsQuery)
      const registrations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Registration),
      }))
      const rows = [
        ['Event Title', 'User Email', 'User Name', 'User ID', 'Registration Timestamp'],
        ...registrations.map((reg) => [
          event.title,
          reg.email,
          reg.displayName,
          reg.uid,
          reg.createdAt?.toDate().toISOString() || '',
        ]),
      ]
      const csvContent = rows.map((row) => row.map(csvCell).join(',')).join('\n')
      const href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      const safeTitle = event.title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase()

      link.setAttribute('href', href)
      link.setAttribute('download', `${safeTitle || 'event'}-registrations.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    } catch (err) {
      console.error('Failed to export CSV', err)
      setActionError('Failed to export CSV')
    }
  }

  const handleRegister = async (event: Event) => {
    if (!user) return navigate('/')

    setActionError(null)
    setRegisteringId(event.id)
    try {
      await registerForEvent(db, event, user)
      setEvents((current) =>
        current.map((item) =>
          item.id === event.id
            ? { ...item, currentParticipants: (item.currentParticipants || 0) + 1 }
            : item
        )
      )
    } catch (err) {
      console.error('Registration failed', err)
      setActionError((err as Error).message || 'Registration failed')
    } finally {
      setRegisteringId(null)
    }
  }

  const formatEventDate = (event: Event) => {
    if (event.dateTimestamp && 'toDate' in event.dateTimestamp) {
      return event.dateTimestamp.toDate().toLocaleString()
    }
    return event.date
  }

  return (
    <div className="mx-auto max-w-6xl p-6 text-left">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="searchValue">
            Search
          </label>
          <input
            id="searchValue"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search events"
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="statusFilter">
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Full">Full</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="selectedType">
            Type
          </label>
          <select
            id="selectedType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">All</option>
            <option value="Individual">Individual</option>
            <option value="team">Team</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearchValue('')
              setStatusFilter('')
              setSelectedType('')
              setActionError(null)
            }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Reset filters
          </button>
        </div>
      </div>

      {actionError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{actionError}</div>
      ) : null}
      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      ) : null}
      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-slate-700">Loading events...</div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {filteredEvents.length === 0 && !loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-slate-700">
            No events match your search and filter criteria.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const status = getEventStatus(event)
            const seatsLeft = Math.max(0, (event.maxCapacity || 0) - (event.currentParticipants || 0))
            return (
              <div key={event.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{event.title || 'Untitled event'}</h2>
                    <p className="mt-2 text-sm text-slate-600">{event.description || 'No description provided.'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                    {status}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                  <div><strong>Date:</strong> {formatEventDate(event)}</div>
                  <div><strong>Venue:</strong> {event.venue}</div>
                  <div><strong>Type:</strong> {event.participationType}</div>
                  <div><strong>Seats left:</strong> {seatsLeft}</div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/event/${event.id}`}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    View Details
                  </Link>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-500">Capacity: {event.maxCapacity}</span>
                    {role === 'student' ? (
                      <>
                        <button
                          onClick={() => handleRegister(event)}
                          disabled={!canRegisterForEvent(event) || registeringId === event.id}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {registeringId === event.id ? 'Registering...' : 'Register'}
                        </button>
                        <button
                          onClick={() => navigate(`/unregisterevent/${event.id}`)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Unregister
                        </button>
                      </>
                    ) : null}
                    {role === 'admin' ? (
                      <>
                        <button
                          onClick={() => navigate(`/event/${event.id}/edit`)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => exportToCSV(event)}
                          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          Export CSV
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default EventsGrid
