import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  crearUsuario,
  editarUsuario,
  listarRoles,
  listarUsuarios,
} from '../services/usuarioService'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Alert from '../components/ui/Alert'
import FormField, { inputClassName, selectClassName } from '../components/ui/FormField'

const ROLE_LABELS = {
  ADMINISTRADOR: 'Administrador',
  SECRETARIA: 'Secretaría',
}

const usuarioVacio = {
  nombre: '',
  usuario: '',
  email: '',
  password: '',
  confirmPassword: '',
  rolId: '',
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-GT', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function UsuariosPage() {
  const { token, usuario: sesion } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(usuarioVacio)
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usuariosData, rolesData] = await Promise.all([
        listarUsuarios(token),
        listarRoles(token),
      ])
      setUsuarios(usuariosData)
      setRoles(rolesData)
    } catch (err) {
      setError(err.message ?? 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function abrirCrear() {
    setEditando(null)
    setForm({
      ...usuarioVacio,
      rolId: roles.find((r) => r.nombre === 'SECRETARIA')?.id ?? roles[0]?.id ?? '',
    })
    setModalOpen(true)
  }

  function abrirEditar(usuario) {
    setEditando(usuario)
    setForm({
      nombre: usuario.nombre ?? '',
      usuario: usuario.usuario ?? '',
      email: usuario.email ?? '',
      password: '',
      confirmPassword: '',
      rolId: usuario.rolId ?? usuario.rol?.id ?? '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMensaje('')

    if (!editando && form.password.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!editando && form.password !== form.confirmPassword) {
      setMensaje('Las contraseñas no coinciden')
      return
    }

    if (!form.email.trim()) {
      setMensaje('El correo electrónico es obligatorio')
      return
    }

    setGuardando(true)

    try {
      if (editando) {
        await editarUsuario(token, editando.id, {
          nombre: form.nombre.trim(),
          usuario: form.usuario.trim(),
          email: form.email.trim(),
          rolId: Number(form.rolId),
        })
        setMensaje('Usuario actualizado correctamente')
      } else {
        await crearUsuario(token, {
          nombre: form.nombre.trim(),
          usuario: form.usuario.trim(),
          email: form.email.trim(),
          password: form.password,
          rolId: Number(form.rolId),
        })
        setMensaje('Usuario creado correctamente')
      }
      setModalOpen(false)
      cargarDatos()
    } catch (err) {
      setMensaje(err.message ?? 'No se pudo guardar el usuario')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas de acceso al sistema"
        action={<Button onClick={abrirCrear}>+ Nuevo usuario</Button>}
      />

      {mensaje && !modalOpen && (
        <Alert type="success" className="mb-6" onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      )}
      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="surface-table">
        {loading ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            Cargando usuarios…
          </p>
        ) : usuarios.length === 0 ? (
          <p className="p-8 text-center text-sm text-cocode-text/70">
            No hay usuarios registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Correo</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Último acceso</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => {
                  const esYo = usuario.id === sesion?.id
                  return (
                    <tr
                      key={usuario.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-cocode-heading">
                        {usuario.nombre}
                        {esYo && (
                          <span className="ml-2 text-xs font-normal text-cocode-text/60">
                            (tú)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-cocode-text">{usuario.usuario}</td>
                      <td className="px-4 py-3 text-cocode-text">{usuario.email}</td>
                      <td className="px-4 py-3">
                        <RolBadge nombre={usuario.rol?.nombre} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            usuario.activo
                              ? 'bg-cocode-mint/40 text-cocode-heading'
                              : 'bg-cocode-coral/30 text-cocode-text/70'
                          }`}
                        >
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-cocode-text/80">
                        {formatFecha(usuario.ultimoLogin)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => abrirEditar(usuario)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}
        onClose={() => {
          setModalOpen(false)
          setMensaje('')
        }}
      >
        {mensaje && modalOpen && (
          <Alert type="error" className="mb-4" onClose={() => setMensaje('')}>
            {mensaje}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nombre completo" id="nombre">
            <input
              id="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClassName}
              placeholder="Ej. María López"
            />
          </FormField>

          <FormField label="Usuario de acceso" id="usuario">
            <input
              id="usuario"
              type="text"
              required
              autoComplete="off"
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              className={inputClassName}
              placeholder="Ej. maria.lopez"
            />
          </FormField>

          <FormField label="Correo electrónico" id="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClassName}
              placeholder="Ej. maria@correo.com"
            />
          </FormField>

          <FormField label="Rol" id="rolId">
            <select
              id="rolId"
              required
              value={form.rolId}
              onChange={(e) => setForm({ ...form, rolId: e.target.value })}
              className={selectClassName}
            >
              <option value="">Seleccionar rol…</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {ROLE_LABELS[rol.nombre] ?? rol.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Contraseña inicial"
            id="password"
            hint="Mínimo 6 caracteres. Para cambiarla después, el usuario usará su correo."
          >
            <input
              id="password"
              type="password"
              required={!editando}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClassName}
              disabled={editando}
            />
          </FormField>

          {!editando && (
            <FormField label="Confirmar contraseña" id="confirmPassword">
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className={inputClassName}
              />
            </FormField>
          )}

          {editando && (
            <p className="rounded-xl border border-cocode-mint/40 bg-cocode-mint/10 px-4 py-3 text-sm text-cocode-text/80">
              La contraseña se cambia desde{' '}
              <strong>Mi cuenta</strong> o el enlace enviado al correo del
              usuario.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={guardando} className="flex-1">
              {guardando
                ? 'Guardando…'
                : editando
                  ? 'Guardar cambios'
                  : 'Crear usuario'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function RolBadge({ nombre }) {
  const styles = {
    ADMINISTRADOR: 'bg-cocode-gold/45 text-cocode-heading',
    SECRETARIA: 'bg-cocode-sky/45 text-cocode-heading',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[nombre] ?? 'bg-cocode-mint/30 text-cocode-heading'}`}
    >
      {ROLE_LABELS[nombre] ?? nombre}
    </span>
  )
}
