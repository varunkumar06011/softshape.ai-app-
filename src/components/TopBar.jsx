import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TopBar = ({ restaurantName }) => {
  const { user, logout } = useAuth()

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
      </div>
      <button
        onClick={logout}
        className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </button>
    </div>
  )
}

export default TopBar
