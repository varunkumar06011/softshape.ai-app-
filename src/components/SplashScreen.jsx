import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const LOGO_SRC = '/logo_softshape.ai-removebg-preview.png'

// Generate deterministic floating particles
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 7.3) % 100}%`,
  size: 2 + (i % 4),
  delay: (i * 0.4),
  duration: 5 + (i % 5),
}))

const SPLASH_KEY = 'softshape_splash_shown'

function hasSplashBeenShown() {
  try { return localStorage.getItem(SPLASH_KEY) === '1' } catch { return false }
}

function markSplashShown() {
  try { localStorage.setItem(SPLASH_KEY, '1') } catch {}
}

export default function SplashScreen({ children }) {
  const [phase, setPhase] = useState(() => hasSplashBeenShown() ? 'done' : 'intro')
  const [typedText, setTypedText] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isLanding = location.pathname === '/'

  const fullText = 'softshape.ai'

  useEffect(() => {
    if (hasSplashBeenShown()) return
    // Mark shown immediately so refresh never replays, even mid-animation
    markSplashShown()
    const t0 = setTimeout(() => setPhase('splash'), 500)    // logo pops in
    const t1 = setTimeout(() => setPhase('transition'), 4500) // iris wipe + travel
    const t2 = setTimeout(() => setPhase('done'), 7000)    // fully done
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Typewriter effect during splash
  useEffect(() => {
    if (phase !== 'splash' && phase !== 'intro') return
    let i = 0
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1))
      i++
      if (i >= fullText.length) clearInterval(interval)
    }, 120)
    return () => clearInterval(interval)
  }, [phase])

  const isIntro = phase === 'intro'
  const isSplash = phase === 'splash'
  const isTransition = phase === 'transition'
  const isDone = phase === 'done'

  const showOverlay = !isDone
  const showCenterLogo = isIntro || isSplash || isTransition

  return (
    <>
      {/* === TRAVELING LOGO ===
          Starts centered & huge, then moves to top-left while shrinking.
          Hidden on landing page (already has full header). */}
      <button
        onClick={() => navigate('/')}
        className={`fixed z-[60] cursor-pointer transition-all duration-[2500ms] ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isLanding && isDone ? 'opacity-0 pointer-events-none hidden' : ''}
          ${showCenterLogo
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'top-3 left-3 translate-x-0 translate-y-0'}
        `}
        aria-label="Home"
      >
        {/* White pill bg + glow halo */}
        <div className={`absolute -inset-1 rounded-full bg-white/90 shadow-lg transition-all duration-[2500ms]
          ${showCenterLogo ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}
        `} />
        <div className={`absolute inset-0 rounded-full transition-all duration-[2500ms]
          ${showCenterLogo ? 'bg-brand/20 blur-3xl scale-150' : 'bg-transparent blur-0 scale-100'}
        `} />
        <img
          src={LOGO_SRC}
          alt="Softshape"
          className={`relative object-contain transition-all duration-[2500ms] ease-[cubic-bezier(0.22,1,0.36,1)]
            ${showCenterLogo
              ? 'w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 drop-shadow-2xl'
              : 'w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 drop-shadow-md'}
            ${isIntro ? 'scale-0' : 'scale-100'}
            ${isSplash ? 'animate-float' : ''}
          `}
        />
      </button>

      {/* === FULL SCREEN OVERLAY === */}
      {showOverlay && (
        <div
          className={`fixed inset-0 z-[55] flex flex-col items-center justify-center overflow-hidden
            transition-all duration-[2500ms] ease-in-out
            ${isIntro || isSplash ? 'opacity-100 pointer-events-auto' : ''}
            ${isTransition ? 'opacity-0 pointer-events-none' : ''}
          `}
        >
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 animate-mesh"
            style={{
              background: 'radial-gradient(at 20% 30%, #FFCDD2 0, transparent 50%), radial-gradient(at 80% 20%, #F8BBD0 0, transparent 50%), radial-gradient(at 50% 80%, #E1BEE7 0, transparent 50%), radial-gradient(at 70% 60%, #D1C4E9 0, transparent 50%), radial-gradient(at 10% 70%, #C5CAE9 0, transparent 50%), #FFF5F5',
            }}
          />

          {/* Subtle dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />

          {/* Floating particles */}
          {PARTICLES.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full bg-brand/40 animate-particle"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}

          {/* Rotating geometric shapes behind logo */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000
            ${isSplash || isIntro ? 'opacity-40' : 'opacity-0'}`}
          >
            {/* Hexagon ring */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full text-brand/20">
                <polygon points="50,3 95,28 95,72 50,97 5,72 5,28" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
            {/* Inner star */}
            <div className="absolute inset-0 flex items-center justify-center animate-spin-reverse">
              <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] text-brand/10">
                <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
          </div>

          {/* Shimmer scan line over the center */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] animate-shimmer transition-opacity duration-1000
            ${isSplash ? 'opacity-30' : 'opacity-0'}`}
          />

          {/* Center content area (below the traveling logo) */}
          <div className="relative z-10 mt-52 sm:mt-72 lg:mt-96 flex flex-col items-center">
            {/* Typewriter brand name */}
            <div className="h-10 sm:h-12 lg:h-14 flex items-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                {typedText}
                <span className={`inline-block w-[2px] h-6 sm:h-8 bg-brand ml-0.5 animate-cursor align-middle
                  ${typedText.length >= fullText.length ? 'opacity-0' : 'opacity-100'}`}
                />
              </h1>
            </div>

            {/* Tagline fades in after typing */}
            <p className={`text-[10px] sm:text-xs text-gray-500 tracking-[0.3em] uppercase mt-2 transition-all duration-1000
              ${typedText.length >= fullText.length ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              Restaurant Intelligence
            </p>

            {/* Sound wave bars */}
            <div className={`flex items-end gap-[3px] h-6 mt-6 transition-opacity duration-700
              ${isSplash ? 'opacity-100' : 'opacity-0'}`}
            >
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i}
                  className="w-[3px] bg-brand/60 rounded-full origin-bottom animate-sound"
                  style={{
                    height: '20px',
                    animationDelay: `${i * 100}ms`,
                    animationDuration: `${0.8 + i * 0.15}s`,
                  }}
                />
              ))}
            </div>

            {/* Progress ring */}
            <div className={`mt-4 transition-opacity duration-700 ${isSplash ? 'opacity-100' : 'opacity-0'}`}>
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#FFCDD2" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E53935" strokeWidth="3"
                  strokeDasharray="88"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="animate-[spin_4s_linear_infinite]"
                  style={{ transformOrigin: 'center' }}
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* === MAIN APP CONTENT ===
          Scales in from slightly zoomed/blurred state */}
      <div className={`transition-all duration-[2000ms] ease-out
        ${isDone ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[0.96] blur-[2px]'}`}
      >
        {children}
      </div>
    </>
  )
}
