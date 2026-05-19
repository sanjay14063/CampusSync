import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore'
import type { AuthUser } from '../context/AuthContext'
import type { Event, EventStatus } from '../types/event'

export const getEventDate = (event: Pick<Event, 'date' | 'dateTimestamp'>) => {
  if (event.dateTimestamp && 'toDate' in event.dateTimestamp) {
    return event.dateTimestamp.toDate()
  }

  return event.date ? new Date(event.date) : null
}

export const getEventStatus = (event: Event): EventStatus => {
  if (event.status === 'Draft') return 'Draft'

  const eventDate = getEventDate(event)
  if (eventDate && eventDate < new Date()) return 'Completed'

  if ((event.currentParticipants || 0) >= (event.maxCapacity || Infinity)) return 'Full'

  return 'Active'
}

export const isRegistrationClosed = (event: Event) => {
  return Boolean(event.registrationDeadline && new Date(event.registrationDeadline) < new Date())
}

export const canRegisterForEvent = (event: Event) => {
  return getEventStatus(event) === 'Active' && !isRegistrationClosed(event)
}

export const registerForEvent = async (db: Firestore, event: Event, user: NonNullable<AuthUser>) => {
  const regId = `${event.id}_${user.uid}`
  const regRef = doc(db, 'registrations', regId)
  const eventRef = doc(db, 'events', event.id)

  await runTransaction(db, async (tx) => {
    const [eventSnap, regSnap] = await Promise.all([tx.get(eventRef), tx.get(regRef)])

    if (!eventSnap.exists()) throw new Error('Event does not exist')
    if (regSnap.exists()) throw new Error('You have already registered for this event.')

    const data = { id: eventSnap.id, ...(eventSnap.data() as Omit<Event, 'id'>) } as Event
    if (!canRegisterForEvent(data)) throw new Error('Registration is not open for this event.')

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
