import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Utensils, Users, Table, FileText, Megaphone, LogOut } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/menu', icon: Utensils, label: 'Menu' },
    { path: '/admin/staff', icon: Users, label: 'Staff' },
    { path: '/admin/tables', icon: Table, label: 'Tables' },
    { path: '/admin/reports', icon: FileText, label: 'Reports' },
    { path: '/admin/marketing', icon: Megaphone, label: 'Marketing AI' },
  ]

  return (
    <div className="w-64 bg-brand text-white min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Softshape.ai</h1>
        <p className="text-sm text-red-200 mt-1">Restaurant OS</p>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 transition-colors ${
                isActive ? 'bg-brand-dark' : 'hover:bg-brand-dark'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          )
        })}
        <Link
          to="/login"
          className="flex items-center px-6 py-3 mt-4 hover:bg-brand-dark transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Link>
      </nav>
    </div>
  )
}

export default Sidebar
