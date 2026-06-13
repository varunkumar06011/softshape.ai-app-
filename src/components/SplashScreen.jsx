import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LOGO_SRC = '/logo_softshape.ai-removebg-preview.png'

export default function SplashScreen({ children }) {
  const [phase, setPhase] = useState('splash') // 'splash' | 'transition' | 'done'
  const navigate = useNavigate()

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transition'), 3500)
    const t2 = setTimeout(() => setPhase('done'), 5200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const isSplash = phase === 'splash'
  const isTransition = phase === 'transition'
  const isDone = phase === 'done'

  return (
    <>
      {/* Persistent small logo (top-right) — visible once transition starts */}
      <button
        onClick={() => navigate('/')}
        className={`fixed top-3 right-3 z-[60] transition-all duration-[1500ms] ease-in-out cursor-pointer
          ${isSplash ? 'opacity-0 scale-50 translate-y-10' : 'opacity-100 scale-100 translate-y-0'}
        `}
        aria-label="Home"
      >
        <img
          src={LOGO_SRC}
          alt="Softshape"
          className={`object-contain transition-all duration-[1500ms] ease-in-out drop-shadow-sm
            w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12
            ${isDone ? 'hover:scale-110' : ''}
          `}
        />
      </button>

      {/* Full-screen splash overlay */}
      <div
        className={`fixed inset-0 z-[55] flex items-center justify-center bg-white transition-all duration-[1500ms] ease-in-out
          ${isSplash ? 'opacity-100 pointer-events-auto' : ''}
          ${isTransition ? 'opacity-0 pointer-events-none' : ''}
          ${isDone ? 'opacity-0 pointer-events-none hidden' : ''}
        `}
      >
        <img
          src={LOGO_SRC}
          alt="Softshape"
          className={`object-contain transition-all duration-[1500ms] ease-in-out drop-shadow-lg
            w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64
            ${isSplash ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
          `}
        />
      </div>

      {/* Main app content */}
      <div className={`transition-opacity duration-700 ${isDone ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    </>
  )
}
