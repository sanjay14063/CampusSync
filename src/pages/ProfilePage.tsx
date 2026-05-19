import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const ProfilePage = () => {
  const { user, role } = useAuth()

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl p-6 text-left">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100">
              {user?.photoURL ? (
                <img className="h-full w-full object-cover" src={user.photoURL} alt="" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-500">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">Profile</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">{user?.displayName || 'CampusSync user'}</h1>
              <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
            </div>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm font-medium text-slate-500">Role</dt>
              <dd className="mt-1 text-lg font-semibold capitalize text-slate-950">{role}</dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm font-medium text-slate-500">User ID</dt>
              <dd className="mt-1 break-all text-sm font-medium text-slate-950">{user?.uid}</dd>
            </div>
          </dl>
        </section>
      </main>
    </>
  )
}

export default ProfilePage
