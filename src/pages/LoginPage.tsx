import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const { user, role, loading, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") {
        navigate('/admin')
      } else if (role === "student") {
        navigate('/events')
      }
    }
  }, [loading, user, role, navigate])

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle()
    } catch (error) {
      console.error('Error during Google Sign-In:', error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase text-slate-500">CampusSync</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Campus events, organized.</h1>
        <p className="mt-3 text-sm text-slate-600">
          Sign in to view active events, register, or manage event operations.
        </p>
      {loading || user ? (
        <p className="mt-6 text-sm text-slate-600">Redirecting...</p>
      ) : (
        <button
          onClick={handleGoogleSignIn}
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Sign in with Google
        </button>
      )}
      </section>
    </div>
  )
}

export default LoginPage
