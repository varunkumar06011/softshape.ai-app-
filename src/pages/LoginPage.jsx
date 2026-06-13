import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { users } from '../data/mockData'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = (e) => {
    e.preventDefault()
    const user = users.find(u => u.email === email && u.password === password)
    if (user) {
      login({
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantName: 'VGrand Restaurant'
      })
      toast.success('Login successful!')
      
      // Redirect based on role
      switch (user.role) {
        case 'admin':
          navigate('/admin')
          break
        case 'cashier1':
          navigate('/cashier1')
          break
        case 'cashier2':
          navigate('/cashier2')
          break
        case 'captain':
          navigate('/captain')
          break
        default:
          navigate('/admin')
      }
    } else {
      toast.error('Invalid email or password')
    }
  }

  const inputClass =
    'w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-[#E53935] focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start sm:justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-400">Sign in to your restaurant dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@restaurant.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#E53935] text-white rounded-xl font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all mt-1"
            >
              Sign in
            </button>
          </form>

          <div className="mt-5 p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 mb-2">Demo logins</p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>admin@vgrand.com / admin123</p>
              <p>cashier1@vgrand.com / 1234</p>
              <p>captain@vgrand.com / 1234</p>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          New here?{' '}
          <button onClick={() => navigate('/register')} className="text-[#E53935] font-semibold hover:underline">
            Register your restaurant
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
