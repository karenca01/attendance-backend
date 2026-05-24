import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {createUser, getAttendanceHistory, getHealth, getUsers, recognizeAttendance, registerAttendance, uploadUserFace,} from './api'

const initialUserForm = {
  name: '',
  email: '',
}

const initialFileState = {
  userId: '',
  image: null,
}

const initialRecognitionFallbackState = {
  image: null,
}

const initialHistoryUserId = ''

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const statusLabel = (health) => {
  if (!health) {
    return 'Verificando API'
  }

  return health.ok ? 'API conectada' : 'API con fallas'
}

function StatCard({ title, value, hint }) {
  return (
    <article className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

function Panel({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel-head">
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        <span>{description}</span>
      </div>
      {children}
    </section>
  )
}

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [users, setUsers] = useState([])
  const [history, setHistory] = useState([])
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const [submitting, setSubmitting] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userForm, setUserForm] = useState(initialUserForm)
  const [uploadForm, setUploadForm] = useState(initialFileState)
  const [attendanceUserId, setAttendanceUserId] = useState('')
  const [historyUserId, setHistoryUserId] = useState(initialHistoryUserId)
  const [recognitionFallback, setRecognitionFallback] = useState(initialRecognitionFallbackState)
  const [feedback, setFeedback] = useState(null)

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  )

  const stats = useMemo(() => {
    const usersWithImage = users.filter((user) => user.imageUrl).length
    const usersWithFace = users.filter((user) => user.faceId).length

    return [
      {
        title: 'Usuarios registrados',
        value: users.length,
        hint: 'Listado completo sincronizado con PostgreSQL',
      },
      {
        title: 'Perfiles con foto',
        value: usersWithImage,
        hint: 'Imagen subida a Azure Storage',
      },
      {
        title: 'Rostros vinculados',
        value: usersWithFace,
        hint: 'Disponibles para reconocimiento con IA',
      },
      {
        title: 'Registros cargados',
        value: history.length,
        hint: 'Historial del usuario seleccionado',
      },
    ]
  }, [history.length, users])

  const selectUser = (userId) => {
    setSelectedUserId(userId)
    setUploadForm((current) => ({ ...current, userId }))
    setAttendanceUserId(userId)
    setHistoryUserId(userId)
  }

  const loadHealth = async () => {
    setHealthLoading(true)

    try {
      const data = await getHealth()
      setHealth({ ok: true, message: data.message })
    } catch (error) {
      setHealth({ ok: false, message: error.message })
    } finally {
      setHealthLoading(false)
    }
  }

  const loadUsers = async (preferredUserId = '') => {
    setUsersLoading(true)

    try {
      const data = await getUsers()
      setUsers(data)

      const nextSelectedUserId =
        preferredUserId ||
        selectedUserId ||
        data[0]?.id ||
        ''

      if (nextSelectedUserId) {
        selectUser(nextSelectedUserId)
      }

      if (data.length === 0) {
        setSelectedUserId('')
        setUploadForm(initialFileState)
        setAttendanceUserId('')
        setHistoryUserId('')
        setHistory([])
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'No se pudieron cargar los usuarios',
        message: error.message,
      })
    } finally {
      setUsersLoading(false)
    }
  }

  const loadHistory = async (userId) => {
    if (!userId) {
      setHistory([])
      return
    }

    setHistoryLoading(true)

    try {
      const data = await getAttendanceHistory(userId)
      setHistory(data)
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'No se pudo cargar el historial',
        message: error.message,
      })
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const [healthData, usersData] = await Promise.all([
          getHealth(),
          getUsers(),
        ])

        if (cancelled) {
          return
        }

        setHealth({ ok: true, message: healthData.message })
        setHealthLoading(false)
        setUsers(usersData)

        const nextSelectedUserId = usersData[0]?.id || ''

        if (nextSelectedUserId) {
          selectUser(nextSelectedUserId)
        } else {
          setSelectedUserId('')
          setUploadForm(initialFileState)
          setAttendanceUserId('')
          setHistoryUserId('')
          setHistory([])
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        setHealth({ ok: false, message: error.message })
        setUsersLoading(false)
      } finally {
        if (!cancelled) {
          setHealthLoading(false)
          setUsersLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const videoElement = videoRef.current

    const stopStream = (stream) => {
      stream?.getTracks().forEach((track) => track.stop())
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
          },
          audio: false,
        })

        if (cancelled) {
          stopStream(stream)
          return
        }

        streamRef.current = stream

        if (videoElement) {
          videoElement.srcObject = stream
          await videoElement.play().catch(() => {})
        }

        setCameraError('')
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            error?.message || 'No se pudo iniciar la cámara. Usa el plan B con foto.',
          )
        }
      } finally {
        if (!cancelled) {
          setCameraLoading(false)
        }
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      stopStream(streamRef.current)
      streamRef.current = null

      if (videoElement) {
        videoElement.srcObject = null
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const syncHistory = async () => {
      if (!historyUserId) {
        setHistory([])
        return
      }

      setHistoryLoading(true)

      try {
        const data = await getAttendanceHistory(historyUserId)
        if (!cancelled) {
          setHistory(data)
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback({
            type: 'error',
            title: 'No se pudo cargar el historial',
            message: error.message,
          })
          setHistory([])
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }

    void syncHistory()

    return () => {
      cancelled = true
    }
  }, [historyUserId])

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setSubmitting('create-user')

    try {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim() || undefined,
      }

      const createdUser = await createUser(payload)

      setUserForm(initialUserForm)
      setFeedback({
        type: 'success',
        title: 'Usuario creado',
        message: `${createdUser.name} ya quedó disponible para registrar asistencia y subir foto.`,
        data: createdUser,
      })

      await loadUsers(createdUser.id)
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'No se pudo crear el usuario',
        message: error.message,
      })
    } finally {
      setSubmitting('')
    }
  }

  const handleUploadFace = async (event) => {
    event.preventDefault()

    if (!uploadForm.userId || !uploadForm.image) {
      setFeedback({
        type: 'error',
        title: 'Falta información para la carga',
        message: 'Selecciona un usuario e incluye una imagen JPG o PNG.',
      })
      return
    }

    setSubmitting('upload-face')

    try {
      const result = await uploadUserFace(uploadForm.userId, uploadForm.image)
      setFeedback({
        type: 'success',
        title: 'Foto subida correctamente',
        message: result.message,
        data: result.user,
      })
      setUploadForm((current) => ({ ...current, image: null }))
      await loadUsers(uploadForm.userId)
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'No se pudo subir la foto',
        message: error.message,
      })
    } finally {
      setSubmitting('')
    }
  }

  const handleRegisterAttendance = async (event) => {
    event.preventDefault()

    if (!attendanceUserId) {
      setFeedback({
        type: 'error',
        title: 'Falta el usuario',
        message: 'Escribe un ID válido antes de registrar la asistencia.',
      })
      return
    }

    setSubmitting('register-attendance')

    try {
      const result = await registerAttendance(attendanceUserId)
      setFeedback({
        type: 'success',
        title: 'Asistencia registrada',
        message: result.message,
        data: result.attendance,
      })
      await loadHistory(attendanceUserId)
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'No se pudo registrar la asistencia',
        message: error.message,
      })
    } finally {
      setSubmitting('')
    }
  }

  const handleRecognizeAttendance = async (event) => {
    event.preventDefault()

    if (!recognitionFallback.image) {
      setFeedback({
        type: 'error',
        title: 'Falta la imagen de respaldo',
        message: 'Selecciona una foto para usar el plan B sin cámara.',
      })
      return
    }

    setSubmitting('recognize-attendance')

    try {
      const result = await recognizeAttendance(recognitionFallback.image)
      setFeedback({
        type: 'success',
        title: 'Reconocimiento exitoso',
        message: result.message,
        data: result,
      })
      if (result.user?.id) {
        selectUser(result.user.id)
        await loadHistory(result.user.id)
      }
      setRecognitionFallback(initialRecognitionFallbackState)
      event.target.reset()
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'No se pudo reconocer el rostro',
        message: error.message,
      })
    } finally {
      setSubmitting('')
    }
  }

  const captureWebcamFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) {
      throw new Error('La cámara todavía no está lista.')
    }

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('La cámara sigue cargando. Intenta de nuevo en unos segundos.')
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('No se pudo preparar la captura de la cámara.')
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result)
            return
          }

          reject(new Error('No se pudo convertir la captura en imagen.'))
        },
        'image/jpeg',
        0.92,
      )
    })

    return new File([blob], `asistencia-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    })
  }

  const handleWebcamAttendance = async () => {
    setSubmitting('recognize-attendance')

    try {
      const snapshot = await captureWebcamFrame()
      const result = await recognizeAttendance(snapshot)

      setFeedback({
        type: 'success',
        title: 'Asistencia registrada con cámara',
        message: result.message,
        data: result,
      })

      if (result.user?.id) {
        selectUser(result.user.id)
        await loadHistory(result.user.id)
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'No se pudo registrar la asistencia',
        message: error.message,
      })
    } finally {
      setSubmitting('')
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Attendance backend</p>
          <h1>Panel operativo para usuarios, rostros y asistencia</h1>

          <div className="hero-actions">
            <span className={`status-pill ${health?.ok ? 'is-ok' : 'is-warn'}`}>
              {healthLoading ? 'Verificando API' : statusLabel(health)}
            </span>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void loadHealth()
                void loadUsers(selectedUserId)
              }}
            >
              Refrescar datos
            </button>
          </div>
        </div>

        <div className="hero-aside">
          <div className="glass-card">
            <span>Backend</span>
            <strong>{healthLoading ? '...' : health?.message || 'Sin respuesta'}</strong>
            <p>{usersLoading ? 'Cargando usuarios desde PostgreSQL' : `${users.length} usuarios disponibles`}</p>
          </div>
          <div className="glass-card accent">
            <span>Usuario activo</span>
            <strong>{selectedUser?.name || 'Ninguno seleccionado'}</strong>
            <p>{selectedUser?.email || 'Selecciona una tarjeta para trabajar con ese perfil'}</p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <div className="content-grid">
        <div className="content-column">
          <Panel
            eyebrow="01 / Usuarios"
            title="Crear y explorar perfiles"
            description="Registra usuarios nuevos y revisa la lista sincronizada con el backend."
          >
            <form className="form-stack user-form" onSubmit={handleCreateUser}>
              <label>
                <span>Nombre</span>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ej. Valeria Gómez"
                  required
                />
              </label>

              <label>
                <span>Correo electrónico</span>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="opcional@correo.com"
                />
              </label>

              <button type="submit" className="primary-button full-width-button" disabled={submitting === 'create-user'}>
                {submitting === 'create-user' ? 'Guardando usuario...' : 'Crear usuario'}
              </button>
            </form>

            <div className="user-list">
              {usersLoading ? (
                <p className="empty-state">Cargando usuarios...</p>
              ) : users.length === 0 ? (
                <p className="empty-state">Aún no hay usuarios. Crea el primero desde el formulario.</p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={`user-card ${selectedUserId === user.id ? 'is-selected' : ''}`}
                    onClick={() => selectUser(user.id)}
                  >
                    <div className="avatar">
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt={`Foto de ${user.name}`} />
                      ) : (
                        <span>{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <strong>{user.name}</strong>
                      <p>{user.email || 'Sin correo registrado'}</p>
                      <small>{formatDate(user.createdAt)}</small>
                    </div>
                    <span className="user-chip">{user.faceId ? 'Con rostro' : 'Pendiente'}</span>
                  </button>
                ))
              )}
            </div>
          </Panel>

          <Panel
            eyebrow="02 / Fotos"
            title="Subir imagen de rostro"
            description="Asocia una foto al usuario para habilitar el reconocimiento automático."
          >
            <form className="form-stack" onSubmit={handleUploadFace}>
              <div className="field-grid two-up">
                <label>
                  <span>Usuario</span>
                  <select
                    value={uploadForm.userId}
                    onChange={(event) =>
                      setUploadForm((current) => ({
                        ...current,
                        userId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona un usuario</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Imagen JPG o PNG</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(event) =>
                      setUploadForm((current) => ({
                        ...current,
                        image: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </label>
              </div>

              <button type="submit" className="primary-button" disabled={submitting === 'upload-face'}>
                {submitting === 'upload-face' ? 'Subiendo imagen...' : 'Subir foto del rostro'}
              </button>
            </form>
          </Panel>
        </div>

        <div className="content-column">
          <Panel
            eyebrow="03 / Asistencia"
            title="Cámara en vivo"
            description="La cámara es el flujo principal; si falla, puedes usar una foto guardada."
          >
            <div className="camera-box">
              <div className="camera-frame">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
                <div className="camera-overlay">
                  <span className="camera-corner top-left" />
                  <span className="camera-corner top-right" />
                  <span className="camera-corner bottom-left" />
                  <span className="camera-corner bottom-right" />
                </div>
                <div className="camera-hud">
                  <span>{cameraLoading ? 'Iniciando cámara...' : cameraError ? 'Plan B activo' : 'Cámara lista'}</span>
                  <strong>{selectedUser?.name || 'Alumno por identificar'}</strong>
                </div>
              </div>

              <canvas ref={canvasRef} className="sr-canvas" aria-hidden="true" />

              {cameraError ? (
                <p className="camera-note error">{cameraError}</p>
              ) : (
                <p className="camera-note">
                  Pon el rostro dentro del marco y presiona registrar.
                </p>
              )}

              <button
                type="button"
                className="primary-button camera-action"
                onClick={() => void handleWebcamAttendance()}
                disabled={submitting === 'recognize-attendance' || cameraLoading || Boolean(cameraError)}
              >
                {submitting === 'recognize-attendance'
                  ? 'Analizando rostro...'
                  : 'Registrar Asistencia'}
              </button>

              <section className={`feedback feedback-inline ${feedback?.type || ''}`} aria-live="polite">
                {feedback ? (
                  <>
                    <div>
                      <p>{feedback.title}</p>
                      <span>{feedback.message}</span>
                    </div>
                  </>
                ) : (
                  <p className="empty-state">Aquí aparecerán los resultados de cada acción.</p>
                )}
              </section>
            </div>

            <div className="fallback-box">
              <form className="form-stack spaced" onSubmit={handleRecognizeAttendance}>
                <label>
                  <span>Si la cámara no funciona, usa el formulario de abajo para subir una foto guardada.</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(event) =>
                      setRecognitionFallback({
                        image: event.target.files?.[0] ?? null,
                      })
                    }
                  />
                </label>

                <button
                  type="submit"
                  className="secondary-button"
                  disabled={submitting === 'recognize-attendance'}
                >
                  {submitting === 'recognize-attendance'
                    ? 'Analizando foto...'
                    : 'Usar foto de respaldo'}
                </button>
              </form>

              <form className="form-stack spaced" onSubmit={handleRegisterAttendance}>
                <label>
                  <span>ID del usuario</span>
                  <input
                    type="text"
                    value={attendanceUserId}
                    onChange={(event) => setAttendanceUserId(event.target.value)}
                    placeholder="UUID del estudiante"
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="secondary-button"
                  disabled={submitting === 'register-attendance'}
                >
                  {submitting === 'register-attendance'
                    ? 'Registrando asistencia...'
                    : 'Registrar asistencia manual'}
                </button>
              </form>
            </div>
          </Panel>

          <Panel
            eyebrow="04 / Historial"
            title="Seguimiento por usuario"
            description="Consulta el historial de asistencias del perfil seleccionado."
          >
            <div className="form-stack compact">
              <label>
                <span>Usuario del historial</span>
                <select
                  value={historyUserId}
                  onChange={(event) => setHistoryUserId(event.target.value)}
                >
                  <option value="">Selecciona un usuario</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="history-list">
              {historyLoading ? (
                <p className="empty-state">Cargando historial...</p>
              ) : history.length === 0 ? (
                <p className="empty-state">Sin registros para el usuario seleccionado.</p>
              ) : (
                history.map((entry) => (
                  <article key={entry.id} className="history-item">
                    <strong>{entry.status}</strong>
                    <span>{formatDate(entry.timestamp)}</span>
                  </article>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>

    </main>
  )
}

export default App
