import { useNavigate } from 'react-router-dom'
import { Zap, Smartphone, Printer, ShoppingCart, Megaphone, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  { icon: Zap, title: 'Smart POS billing', desc: 'Fast checkout with intuitive interface' },
  { icon: Smartphone, title: 'Captain ordering', desc: 'Staff takes orders from mobile' },
  { icon: Printer, title: 'Auto KOT printing', desc: 'Seamless kitchen communication' },
  { icon: ShoppingCart, title: 'Swiggy & Zomato', desc: 'All online orders in one place' },
  { icon: Megaphone, title: 'Marketing AI', desc: 'Auto-post & grow your business' },
]

const stats = [
  { val: '500+', label: 'Restaurants' },
  { val: '10 min', label: 'Setup time' },
  { val: '24/7', label: 'Support' },
]

const howItWorks = [
  { n: '01', title: 'Register your restaurant', desc: 'Fill in basic details — takes 2 minutes.' },
  { n: '02', title: 'Configure your setup', desc: 'Add sections, staff, cashier stations & printers.' },
  { n: '03', title: 'Upload your menu', desc: 'Upload a CSV or add items one by one.' },
  { n: '04', title: 'Go live!', desc: 'Start taking orders on the same day.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <span className="text-lg font-bold text-[#E53935]">Softshape.ai</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-[#E53935] text-white rounded-lg font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="px-4 sm:px-8 pt-16 sm:pt-24 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full text-xs font-medium text-[#E53935] mb-6">
          <CheckCircle className="w-3.5 h-3.5" /> Trusted by 500+ Indian restaurants
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5 max-w-3xl mx-auto">
          The complete restaurant OS for <span className="text-[#E53935]">modern India</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
          POS, Captain app, KOT printing, Swiggy/Zomato, and Marketing AI — all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto sm:max-w-none">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#E53935] text-white rounded-xl font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            Register your restaurant <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-7 py-3.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:border-slate-300 hover:text-slate-900 transition-all"
          >
            Login
          </button>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="px-4 sm:px-8 pb-12">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center py-5 rounded-2xl bg-slate-50">
              <p className="text-2xl sm:text-3xl font-bold text-[#E53935]">{s.val}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 sm:px-8 py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Everything your restaurant needs</h2>
            <p className="text-slate-500 text-sm sm:text-base">One platform to run your entire restaurant.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#E53935]" />
                  </div>
                  <p className="font-bold text-sm text-slate-900 mb-1">{f.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-4 sm:px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-slate-500 text-sm sm:text-base">From registration to your first order in four simple steps.</p>
          </div>
          <div className="space-y-4">
            {howItWorks.map((h) => (
              <div key={h.n} className="flex gap-4 items-start p-5 bg-slate-50 rounded-2xl">
                <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-[#E53935] shadow-sm shrink-0">{h.n}</span>
                <div>
                  <p className="font-bold text-sm text-slate-900 mb-1">{h.title}</p>
                  <p className="text-sm text-slate-400">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 sm:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center bg-slate-900 rounded-3xl p-10 sm:p-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">Ready to transform your restaurant?</h2>
          <p className="text-sm text-slate-400 mb-8">Setup takes 10 minutes. No technical knowledge needed.</p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 bg-[#E53935] text-white rounded-xl font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all"
          >
            Register your restaurant →
          </button>
        </div>
      </section>

      <footer className="px-4 sm:px-8 py-6 text-center text-slate-400 text-xs border-t border-slate-100">
        © 2025 Softshape.ai by Vtechnologies
      </footer>
    </div>
  )
}
