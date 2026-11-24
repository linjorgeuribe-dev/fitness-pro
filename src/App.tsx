import { lazy, Suspense, useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ChartNoAxesColumn, Dumbbell, House, Search, UserRound } from 'lucide-react'
import { ProfileCtx, useActive, useProfileLive } from './lib/store'
import { cx } from './components/ui'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import { startAutoSync } from './lib/sync'

const Explore = lazy(() => import('./pages/Explore'))
const ExerciseDetail = lazy(() => import('./pages/ExerciseDetail'))
const Train = lazy(() => import('./pages/Train'))
const RoutineView = lazy(() => import('./pages/RoutineView'))
const Workout = lazy(() => import('./pages/Workout'))
const Summary = lazy(() => import('./pages/Summary'))
const Progress = lazy(() => import('./pages/Progress'))
const ProfilePage = lazy(() => import('./pages/Profile'))

const TABS = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/explore', label: 'Explorar', icon: Search },
  { to: '/train', label: 'Entrenar', icon: Dumbbell },
  { to: '/progress', label: 'Progreso', icon: ChartNoAxesColumn },
  { to: '/profile', label: 'Perfil', icon: UserRound },
]

export default function App() {
  const profile = useProfileLive()
  const active = useActive()
  const loc = useLocation()
  useEffect(() => { document.documentElement.dataset.theme = profile?.theme ?? 'dark' }, [profile?.theme])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => startAutoSync(), [])

  if (profile === undefined) return <div className="grid min-h-dvh place-items-center text-mute" role="status">Cargando…</div>
  if (profile === null) return <Onboarding />
  const inWorkout = loc.pathname === '/workout'

  return (
    <ProfileCtx.Provider value={profile}>
    <div className="md:pl-56">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-ember focus:px-4 focus:py-2 focus:text-ember-ink">Saltar al contenido</a>
      {!inWorkout && (
        <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-safe md:inset-y-0 md:right-auto md:w-56 md:border-r md:border-t-0 md:p-4">
          <div className="mb-8 hidden items-center gap-2 px-2 pt-2 text-lg font-extrabold md:flex"><img src="/icon.svg" alt="" className="size-8" />Fitness Pro</div>
          <ul className="mx-auto flex max-w-xl justify-around md:block md:space-y-1">
            {TABS.map((t) => (
              <li key={t.to} className="flex-1 md:flex-none">
                <NavLink to={t.to} end={t.to === '/'} className={({ isActive }) => cx(
                  'relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold md:min-h-12 md:flex-row md:justify-start md:gap-3 md:rounded-2xl md:px-3 md:text-sm',
                  isActive ? 'text-ember md:bg-raised' : 'text-mute')}>
                  <t.icon size={22} aria-hidden />{t.label}
                  {t.to === '/train' && active && <span className="absolute right-[28%] top-2 size-2.5 rounded-full bg-ember md:right-3 md:top-1/2 md:-translate-y-1/2" aria-label="Entrenamiento en curso" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <main id="main">
        <Suspense fallback={<div className="p-8 text-center text-mute" role="status">Cargando…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:id" element={<ExerciseDetail />} />
            <Route path="/train" element={<Train />} />
            <Route path="/routine/:id" element={<RoutineView />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/session/:id" element={<Summary />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
    </ProfileCtx.Provider>
  )
}
