import type { Timestamp } from 'firebase/firestore'

export interface TeamSize {
  min: number
  max: number
}

export interface Event {
  id: string
  title: string
  participationType: string
  date: string
  dateTimestamp?: Timestamp
  venue: string
  maxCapacity: number
  currentParticipants?: number
  status?: 'Draft' | 'Active' | 'Full' | 'Completed'
  description: string
  prize?: string
  entryFee?: number
  rules?: string
  registrationDeadline?: string
  registrationCriteria?: string
  contactEmail?: string
  schedule?: string
  teamSize?: TeamSize
}

export type EventStatus = 'Draft' | 'Active' | 'Full' | 'Completed'

export interface Registration {
  id?: string
  eventId: string
  uid: string
  displayName: string | null
  email: string | null
  createdAt?: Timestamp
}
 
