import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'student'
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Check role-based access
  if (requiredRole === 'admin' && role !== 'admin') {
    return <Navigate to="/events" replace />
  }

  if (requiredRole === 'student' && role !== 'student') {
    return <Navigate to="/admin" replace />
  }

  // Allow access
  return <>{children}</>
}

export default ProtectedRoute
