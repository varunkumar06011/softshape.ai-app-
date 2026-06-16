import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TopBar = ({ restaurantName, isOnline = true, pendingSync = 0 }) => {
  const { user, logout } = useAuth()

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
      </div>
      <div className="flex items-center gap-3">
        {!isOnline && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Offline
          </span>
        )}
        {isOnline && pendingSync > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="animate-spin">&#8635;</span>
            Syncing {pendingSync}
          </span>
        )}
        <button
          onClick={logout}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default TopBar
