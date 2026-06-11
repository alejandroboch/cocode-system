import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { resetBodyScrollLock } from '../../lib/modalScrollLock'

const navItems = [
  { to: '/', label: 'Inicio', end: true, icon: HomeIcon },
  { to: '/casas', label: 'Casas', icon: HouseIcon },
  { to: '/servicios', label: 'Servicios', icon: ServiceIcon },
  { to: '/tarifas-especiales', label: 'Tarifas especiales', icon: TagIcon },
  { to: '/deudas', label: 'Deudas', icon: DeudaIcon },
  { to: '/pagos', label: 'Pagos', icon: PagoIcon },
  { to: '/recibos', label: 'Recibos', icon: ReciboIcon },
  { to: '/reportes', label: 'Reportes', icon: ReporteIcon },
  { to: '/mi-cuenta', label: 'Mi cuenta', icon: AccountIcon },
]

const adminNavItems = [
  { to: '/usuarios', label: 'Usuarios', icon: UsersIcon },
  { to: '/bitacora', label: 'Bitácora', icon: BitacoraIcon },
]

export default function AppLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    resetBodyScrollLock()
  }, [location.pathname])

  const esAdmin = usuario?.rol === 'ADMINISTRADOR'
  const menuItems = esAdmin ? [...navItems, ...adminNavItems] : navItems

  function handleLogout() {
    logout().finally(() => {
      navigate('/login', { replace: true })
    })
  }

  return (
    <div className="min-h-svh bg-cocode-cream">
      <div className="mx-auto flex min-h-svh max-w-[1600px]">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col self-start bg-linear-to-b from-cocode-sidebar to-cocode-sidebar-light lg:flex">
          <div className="shrink-0 border-b border-white/10 px-4 py-5">
            <SidebarBrand />
            <p className="mt-3 text-center text-[10px] font-semibold tracking-[0.18em] text-emerald-300/60 uppercase">
              Villas del Quetzal
            </p>
          </div>
          <nav className="sidebar-nav-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
            {menuItems.map((item) => (
              <NavItem key={item.to} {...item} onNavigate={() => {}} />
            ))}
          </nav>
          <UserFooter usuario={usuario} onLogout={handleLogout} />
        </aside>

        <div className="app-main-bg flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-cocode-mint/60 bg-white/85 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg p-2 text-cocode-text transition hover:bg-cocode-mint/50 lg:hidden"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Abrir menú"
                >
                  <MenuIcon />
                </button>
                <img
                  src="/logo-cocode.png"
                  alt="COCODE"
                  className="h-9 w-auto object-contain lg:hidden"
                />
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-cocode-heading">
                    {usuario?.nombre}
                  </p>
                  <p className="text-xs text-cocode-text/70">{usuario?.rol}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-cocode-mint px-3 py-2 text-sm font-medium text-cocode-text transition hover:border-cocode-mint-deep/30 hover:bg-white lg:hidden"
              >
                Salir
              </button>
            </div>

            <nav className="hidden gap-1 overflow-x-auto border-t border-cocode-mint/40 bg-white/50 px-4 py-2 md:flex lg:hidden">
              {menuItems.map((item) => (
                <NavItem key={item.to} {...item} compact onNavigate={() => {}} />
              ))}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
            <div className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="animate-slide-in-left absolute left-0 top-0 flex h-full w-72 flex-col bg-linear-to-b from-cocode-sidebar to-cocode-sidebar-light shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <nav className="sidebar-nav-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
              {menuItems.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
            </nav>
            <UserFooter usuario={usuario} onLogout={handleLogout} />
          </aside>
        </div>
      )}
    </div>
  )
}

function SidebarBrand() {
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-lg ring-1 ring-black/5">
      <img
        src="/logo-cocode.png"
        alt="COCODE Villas del Quetzal"
        className="mx-auto h-11 w-auto object-contain"
      />
    </div>
  )
}

function NavItem({ to, label, end, icon: Icon, compact, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          compact ? 'shrink-0 whitespace-nowrap' : ''
        } ${
          compact
            ? isActive
              ? 'bg-cocode-mint-deep text-white shadow-md shadow-emerald-900/20'
              : 'text-cocode-heading hover:bg-cocode-mint/60'
            : isActive
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !compact && (
            <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cocode-gold-bright" />
          )}
          <Icon
            className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
              isActive && !compact ? 'text-emerald-300' : isActive && compact ? 'text-cocode-mint-deep' : ''
            }`}
          />
          {label}
        </>
      )}
    </NavLink>
  )
}

function UserFooter({ usuario, onLogout }) {
  return (
    <div className="shrink-0 border-t border-white/10 p-4">
      <div className="rounded-lg bg-white/5 px-3 py-3">
        <p className="truncate text-sm font-medium text-white">
          {usuario?.nombre}
        </p>
        <p className="text-xs text-slate-500">{usuario?.rol}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 w-full rounded-lg border border-white/10 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
      >
        Cerrar sesión
      </button>
    </div>
  )
}

function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  )
}

function HouseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V21H3z" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

function ServiceIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}

function TagIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.41a2 2 0 0 1 0 2.83z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BitacoraIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function AccountIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  )
}

function DeudaIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h6M7 16h4" />
    </svg>
  )
}

function PagoIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  )
}

function ReciboIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

function ReporteIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      <path d="M4 19h16M4 5h16v12H4z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}
