import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Utensils, Users, Table, FileText, Megaphone, Printer, LogOut, Menu, X, Search } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/menu', icon: Utensils, label: 'Menu' },
    { path: '/admin/staff', icon: Users, label: 'Staff' },
    { path: '/admin/tables', icon: Table, label: 'Tables' },
    { path: '/admin/reports', icon: FileText, label: 'Reports' },
    { path: '/admin/bill-finder', icon: Search, label: 'Bill Finder' },
    { path: '/admin/marketing', icon: Megaphone, label: 'Marketing AI' },
    { path: '/admin/printers', icon: Printer, label: 'Printers' },
  ]

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-brand text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - desktop always visible, mobile slide-out */}
      <div
        className={`w-64 bg-brand text-white min-h-screen fixed left-0 top-0 z-[56] transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
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
                onClick={closeSidebar}
                className={`flex items-center px-6 py-3 transition-colors ${
                  isActive ? 'bg-brand-dark' : 'hover:bg-brand-dark'
                }`}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                {item.label}
              </Link>
            )
          })}
          <Link
            to="/login"
            onClick={closeSidebar}
            className="flex items-center px-6 py-3 mt-4 hover:bg-brand-dark transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            Logout
          </Link>
        </nav>
      </div>
    </>
  )
}

export default Sidebar
