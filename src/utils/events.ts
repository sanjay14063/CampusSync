import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore'
import type { AuthUser } from '../context/AuthContext'
import type { Event, EventStatus } from '../types/event'

const now = () => new Date()

export const normalizeEventStatus = (status: Event['status'] | string | null | undefined): EventStatus | null => {
  if (!status) return null

  const normalized = status.toString().trim().toLowerCase()
  if (normalized === 'draft') return 'Draft'
  if (normalized === 'active') return 'Active'
  if (normalized === 'full') return 'Full'
  if (normalized === 'completed') return 'Completed'

  return null
}

const toDate = (value: string | Date | undefined | null) => {
  if (!value) return null
  if (value instanceof Date) return value
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date
}

export const getEventDate = (event: Pick<Event, 'date' | 'dateTimestamp'>) => {
  if (event.dateTimestamp && 'toDate' in event.dateTimestamp) {
    return event.dateTimestamp.toDate()
  }
  return toDate(event.date)
}

export const getRegistrationDeadline = (event: Pick<Event, 'registrationDeadline'>) => {
  return toDate(event.registrationDeadline)
}

export const getEventStatus = (event: Event): EventStatus => {
  const storedStatus = normalizeEventStatus(event.status)
  if (storedStatus === 'Draft') return 'Draft'

  const eventDate = getEventDate(event)
  if (eventDate && eventDate < now()) return 'Completed'

  if ((event.currentParticipants || 0) >= (event.maxCapacity || Infinity)) return 'Full'

  return storedStatus ?? 'Active'
}

export const isVisibleToStudents = (event: Event) => {
  const storedStatus = normalizeEventStatus(event.status)
  if (storedStatus === 'Draft') return false
  return getEventStatus(event) === 'Active'
}

export const isRegistrationClosed = (event: Event) => {
  const deadline = getRegistrationDeadline(event)
  return Boolean(deadline && deadline < now())
}

export const canRegisterForEvent = (event: Event) => {
  return getEventStatus(event) === 'Active' && !isRegistrationClosed(event)
}

export const registerForEvent = async (db: Firestore, event: Event, user: NonNullable<AuthUser>) => {
  const regId = `${event.id}_${user.uid}`
  const regRef = doc(db, 'registrations', regId)
  const eventRef = doc(db, 'events', event.id)

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef)
    if (!eventSnap.exists()) throw new Error('Event does not exist')
    const data = { id: eventSnap.id, ...(eventSnap.data() as Omit<Event, 'id'>) } as Event
    const status = getEventStatus(data)
    const deadline = getRegistrationDeadline(data)
    const eventDate = getEventDate(data)

    if (normalizeEventStatus(data.status) === 'Draft') {
      throw new Error('Cannot register for a draft event.')
    }
    if (deadline && deadline < now()) {
      throw new Error('Registration is closed for this event.')
    }
    if (eventDate && eventDate < now()) {
      throw new Error('This event has already completed.')
    }
    if (status !== 'Active') {
      throw new Error('Registration is not open for this event.')
    }

    const current = data.currentParticipants || 0
    const max = data.maxCapacity || 0
    if (current >= max) throw new Error('Event is full.')

    const nextCount = current + 1
    tx.update(eventRef, {
      currentParticipants: nextCount,
      status: nextCount >= max ? 'Full' : 'Active',
    })
    tx.set(regRef, {
      eventId: event.id,
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
      createdAt: serverTimestamp(),
    })
  })
}

export const unregisterFromEvent = async (db: Firestore, event: Event, user: NonNullable<AuthUser>) => {
  if (isRegistrationClosed(event)) {
    throw new Error('Registration is closed; you cannot unregister after the registration deadline.')
  }

  const regId = `${event.id}_${user.uid}`
  const regRef = doc(db, 'registrations', regId)
  const eventRef = doc(db, 'events', event.id)

  await runTransaction(db, async (tx) => {
    const [eventSnap, regSnap] = await Promise.all([tx.get(eventRef), tx.get(regRef)])

    if (!eventSnap.exists()) throw new Error('Event does not exist')
    if (!regSnap.exists()) throw new Error('You are not registered for this event.')

    const data = eventSnap.data() as Event
    const newCount = Math.max(0, (data.currentParticipants || 0) - 1)
    const nextStatus = getEventStatus({ ...data, id: event.id, currentParticipants: newCount })

    tx.update(eventRef, {
      currentParticipants: newCount,
      status: nextStatus === 'Full' ? 'Active' : nextStatus,
    })
    tx.delete(regRef)
  })
}
