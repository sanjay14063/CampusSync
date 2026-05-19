import { useState, type ChangeEvent, type FormEvent } from 'react'

export interface EventFormValues {
  title: string
  date: string
  venue: string
  description: string
  maxCapacity: string
  status: 'Draft' | 'Active'
  participationType: string
  teamSize: string
  prize: string
  entryFee: string
  rules: string
  registrationDeadline: string
  registrationCriteria: string
}

const defaultValues: EventFormValues = {
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
  registrationDeadline: '',
  registrationCriteria: '',
}

interface EventFormProps {
  initialValues?: EventFormValues
  onSubmit: (values: EventFormValues) => void | Promise<void>
  submitLabel: string
  loading?: boolean
  error?: string | null
  onCancel?: () => void
}

const EventForm = ({
  initialValues = defaultValues,
  onSubmit,
  submitLabel,
  loading = false,
  error,
  onCancel
}: EventFormProps) => {
  const [form, setForm] = useState<EventFormValues>(initialValues)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setForm((current) => {
      if (id === 'participationType' && value === 'Individual') {
        return { ...current, participationType: value, teamSize: '' }
      }
      return { ...current, [id]: value }
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errors: string[] = []
    const capacity = Number(form.maxCapacity)

    if (!form.title.trim()) errors.push('Event title is required.')
    if (!form.date) errors.push('Event date and time are required.')
    if (!form.registrationDeadline) errors.push('Registration deadline is required.')
    if (!form.venue.trim()) errors.push('Venue is required.')
    if (!form.description.trim()) errors.push('Description is required.')
    if (!Number.isFinite(capacity) || capacity < 1) errors.push('Maximum capacity must be at least 1.')
    if (!form.status) errors.push('Event status is required.')
    if (!form.participationType) errors.push('Participation type is required.')
    if (form.registrationDeadline && form.date) {
      const registrationDeadline = new Date(form.registrationDeadline)
      const eventDate = new Date(form.date)
      if (Number.isNaN(registrationDeadline.valueOf()) || Number.isNaN(eventDate.valueOf())) {
        errors.push('Invalid event or registration deadline date.')
      } else if (registrationDeadline >= eventDate) {
        errors.push('Registration deadline must be before the event date and time.')
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])
    onSubmit(form)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="title">
          Event Title
        </label>
        <input
          id="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter event title"
          required
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="date">
          Date & Time
        </label>
        <input
          id="date"
          value={form.date}
          onChange={handleChange}
          type="datetime-local"
          required
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="registrationDeadline">
          Registration Deadline
        </label>
        <input
          id="registrationDeadline"
          value={form.registrationDeadline}
          onChange={handleChange}
          type="datetime-local"
          required
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <p className="mt-2 text-xs text-slate-500">Deadline must be on or before the event date and time.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="venue">
          Venue
        </label>
        <input
          id="venue"
          value={form.venue}
          onChange={handleChange}
          placeholder="Enter event venue"
          required
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Enter event description"
          required
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="maxCapacity">
          Maximum Capacity
        </label>
        <input
          id="maxCapacity"
          value={form.maxCapacity}
          onChange={handleChange}
          type="number"
          min="1"
          required
          placeholder="Enter maximum capacity"
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="status">
          Event Status
        </label>
        <select
          id="status"
          value={form.status}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
        </select>
        <p className="mt-2 text-xs text-slate-500">
          Full and Completed are applied automatically from capacity and event date.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="participationType">
          Participation Type
        </label>
        <select
          id="participationType"
          value={form.participationType}
          onChange={handleChange}
          required
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <option value="">Select type</option>
          <option value="Individual">Individual</option>
          <option value="team">Team</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="teamSize">
          Team Size (if applicable)
        </label>
        <input
          id="teamSize"
          value={form.teamSize}
          onChange={handleChange}
          type="text"
          placeholder={form.participationType === 'Individual' ? 'Not allowed for Individual events' : 'e.g. 2-4'}
          disabled={form.participationType === 'Individual'}
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {form.participationType === 'Individual' ? (
          <p className="mt-2 text-xs text-slate-500">Team size is not required for individual participation.</p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="prize">
          Prize (optional)
        </label>
        <input
          id="prize"
          value={form.prize}
          onChange={handleChange}
          placeholder="Enter prize details"
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="entryFee">
          Entry Fee (optional)
        </label>
        <input
          id="entryFee"
          value={form.entryFee}
          onChange={handleChange}
          type="number"
          placeholder="Enter entry fee"
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="rules">
          Rules (optional)
        </label>
        <textarea
          id="rules"
          value={form.rules}
          onChange={handleChange}
          placeholder="Enter event rules"
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="registrationCriteria">
          Registration Criteria (optional)
        </label>
        <textarea
          id="registrationCriteria"
          value={form.registrationCriteria}
          onChange={handleChange}
          placeholder="Enter registration criteria"
          className="w-full rounded border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          rows={4}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition disabled:opacity-50"
        >
          {loading ? `${submitLabel}…` : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default EventForm
