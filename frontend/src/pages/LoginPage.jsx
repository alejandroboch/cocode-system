import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest } from '../services/authService'

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/'

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await loginRequest(usuario.trim(), password)
      login(data)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message ?? 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-mesh relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10">
      {/* Orbes animados */}
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-blob-delay pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-amber-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-blob-delay-2 pointer-events-none absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo flotante con anillo pulsante */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="login-logo-ring login-logo-float logo-glow">
            <div className="relative overflow-hidden rounded-2xl bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,52,40,0.35)] ring-1 ring-white/90 backdrop-blur-sm">
              <img
                src="/logo-cocode.png"
                alt="COCODE Villas del Quetzal"
                className="h-28 w-auto max-w-[300px] object-contain sm:h-32"
                draggable={false}
              />
            </div>
          </div>
          <p className="animate-fade-up stagger-1 mt-6 text-sm font-semibold tracking-[0.15em] text-emerald-200/90 uppercase">
            Villas del Quetzal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            ¡Bienvenido de nuevo!
          </h1>
          <p className="mt-2 max-w-xs text-sm text-emerald-100/75">
            Ingresa para gestionar casas, cobros y recibos de la comunidad
          </p>
        </div>

        {/* Tarjeta de acceso */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="login-glass animate-scale-in stagger-1 rounded-2xl p-8 sm:p-9"
        >
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 animate-fade-up"
            >
              <span className="text-red-500" aria-hidden>
                ✕
              </span>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div
              className={`animate-fade-up stagger-2 transition-transform duration-200 ${focusedField === 'usuario' ? 'scale-[1.01]' : ''}`}
            >
              <label
                htmlFor="usuario"
                className="mb-2 block text-left text-xs font-bold tracking-wide text-cocode-heading/70 uppercase"
              >
                Usuario
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-cocode-mint-deep"
                  aria-hidden
                >
                  <UserIcon />
                </span>
                <input
                  id="usuario"
                  type="text"
                  name="cocode-usuario"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  readOnly
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  onFocus={(e) => {
                    e.target.readOnly = false
                    setFocusedField('usuario')
                  }}
                  onBlur={() => setFocusedField(null)}
                  className="w-full rounded-xl border border-cocode-mint bg-white py-3.5 pr-4 pl-10 text-cocode-heading shadow-sm transition outline-none placeholder:text-cocode-text/50 focus:border-cocode-mint-deep focus:ring-4 focus:ring-cocode-mint-deep/15"
                  placeholder="Tu usuario"
                />
              </div>
            </div>

            <div
              className={`animate-fade-up stagger-3 transition-transform duration-200 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}
            >
              <label
                htmlFor="password"
                className="mb-2 block text-left text-xs font-bold tracking-wide text-cocode-heading/70 uppercase"
              >
                Contraseña
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-cocode-mint-deep"
                  aria-hidden
                >
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type="password"
                  name="cocode-clave"
                  autoComplete="new-password"
                  required
                  readOnly
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => {
                    e.target.readOnly = false
                    setFocusedField('password')
                  }}
                  onBlur={() => setFocusedField(null)}
                  className="w-full rounded-xl border border-cocode-mint bg-white py-3.5 pr-4 pl-10 text-cocode-heading shadow-sm transition outline-none placeholder:text-cocode-text/50 focus:border-cocode-mint-deep focus:ring-4 focus:ring-cocode-mint-deep/15"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <p className="animate-fade-up stagger-4 mt-4 text-center text-sm">
            <Link
              to="/olvide-contrasena"
              className="font-medium text-cocode-mint-deep hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="group animate-fade-up stagger-4 relative mt-7 w-full overflow-hidden rounded-xl bg-linear-to-r from-cocode-mint-deep via-cocode-accent to-[#3cb882] px-4 py-4 text-sm font-bold tracking-wide text-white uppercase shadow-[0_8px_28px_rgba(26,122,82,0.45)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_36px_rgba(26,122,82,0.55)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <span
              className="btn-shimmer absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
              aria-hidden
            />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Spinner />
                  Ingresando…
                </>
              ) : (
                'Entrar al sistema'
              )}
            </span>
          </button>
        </form>

        <p className="animate-fade-up stagger-4 mt-6 text-center text-xs text-emerald-100/50">
          © {new Date().getFullYear()} COCODE Villas del Quetzal
        </p>
      </div>
    </div>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
