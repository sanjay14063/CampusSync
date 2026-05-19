import './App.css'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import EventsPage from './pages/EventsPage'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import EventDetails from './pages/EventDetails'
import CreateEvent from './pages/CreateEvent'
import RegisterEvent from './pages/RegisterEvent'
import EditEvent from './pages/EditEvent'
import UnregisterEvent from './pages/UnregisterEvent'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/' element={<LoginPage />} />
        <Route
          path='/events'
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin'
          element={
            <ProtectedRoute requiredRole='admin'>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/event/:id'
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path='/event/:id/edit'
          element={
            <ProtectedRoute requiredRole='admin'>
              <EditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path='/unregisterevent/:id'
          element={
            <ProtectedRoute requiredRole='student'>
              <UnregisterEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path='/registerevent/:id'
          element={
            <ProtectedRoute requiredRole='student'>
              <RegisterEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path='/create-event'
          element={
            <ProtectedRoute requiredRole='admin'>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path='/userprofile'
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </>
    )
  )

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
