import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LOGO_SRC = '/logo_softshape.ai-removebg-preview.png'

export default function SplashScreen({ children }) {
  const [phase, setPhase] = useState('splash') // 'splash' | 'transition' | 'done'
  const navigate = useNavigate()

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transition'), 4000)
    const t2 = setTimeout(() => setPhase('done'), 6000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const isSplash = phase === 'splash'
  const isTransition = phase === 'transition'
  const isDone = phase === 'done'

  return (
    <>
      {/* Persistent small logo (top-left) — visible once transition starts */}
      <button
        onClick={() => navigate('/')}
        className={`fixed top-3 left-3 z-[60] transition-all duration-[2000ms] ease-out cursor-pointer
          ${isSplash ? 'opacity-0 scale-50 -translate-x-10' : 'opacity-100 scale-100 translate-x-0'}
        `}
        aria-label="Home"
      >
        <img
          src={LOGO_SRC}
          alt="Softshape"
          className={`object-contain transition-all duration-[2000ms] ease-out drop-shadow-md
            w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14
            ${isDone ? 'hover:scale-110' : ''}
          `}
        />
      </button>

      {/* Full-screen splash overlay */}
      <div
        className={`fixed inset-0 z-[55] flex flex-col items-center justify-center transition-all duration-[2000ms] ease-in-out
          ${isSplash ? 'opacity-100 pointer-events-auto' : ''}
          ${isTransition ? 'opacity-0 pointer-events-none' : ''}
          ${isDone ? 'opacity-0 pointer-events-none hidden' : ''}
        `}
        style={{
          background: 'linear-gradient(135deg, #FFF5F5 0%, #FFEBEE 25%, #FCE4EC 50%, #F3E5F5 75%, #E8EAF6 100%)',
        }}
      >
        {/* Animated rings */}
        <div className="relative flex items-center justify-center">
          <div className={`absolute rounded-full border-2 border-brand/20 transition-all duration-[4000ms] ease-out
            ${isSplash ? 'w-56 h-56 sm:w-80 sm:h-80 lg:w-96 lg:h-96 opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-0'}`}
          />
          <div className={`absolute rounded-full border-2 border-brand/10 transition-all duration-[4000ms] ease-out delay-300
            ${isSplash ? 'w-72 h-72 sm:w-96 sm:h-96 lg:w-[28rem] lg:h-[28rem] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-0'}`}
          />
          <div className={`absolute rounded-full border border-brand/5 transition-all duration-[4000ms] ease-out delay-500
            ${isSplash ? 'w-96 h-96 sm:w-[28rem] sm:h-[28rem] lg:w-[36rem] lg:h-[36rem] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-0'}`}
          />

          {/* Logo with glow and pulse */}
          <div className={`relative transition-all duration-[2000ms] ease-out
            ${isSplash ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          `}>
            <div className={`absolute inset-0 rounded-3xl bg-brand/10 blur-3xl transition-opacity duration-1000
              ${isSplash ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
            />
            <img
              src={LOGO_SRC}
              alt="Softshape"
              className="relative object-contain drop-shadow-2xl
                w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96
                animate-float"
            />
          </div>
        </div>

        {/* Brand name */}
        <div className={`mt-6 text-center transition-all duration-[2000ms] ease-out
          ${isSplash ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            softshape<span className="text-brand">.ai</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 tracking-widest uppercase">Restaurant Intelligence</p>
        </div>

        {/* Loading dots */}
        <div className={`mt-8 flex gap-2 transition-opacity duration-1000 ${isSplash ? 'opacity-100' : 'opacity-0'}`}>
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Main app content */}
      <div className={`transition-opacity duration-1000 ${isDone ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    </>
  )
}
