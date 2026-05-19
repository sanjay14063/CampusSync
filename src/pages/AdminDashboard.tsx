import Navbar from '../components/Navbar'
import EventsGrid from '../components/EventsGrid'

const AdminDashboard = () => {
  return (
    <>
      <Navbar />
      <main>
        <section className="mx-auto max-w-6xl px-6 pt-8 text-left">
          <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Event Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Create, update, audit, and publish campus events from one place.
          </p>
        </section>
        <EventsGrid />
      </main>
    </>
  )
}

export default AdminDashboard
