const fs = require('fs/promises')
const path = require('path')
const { randomUUID } = require('crypto')

const storePath = path.join(__dirname, '..', 'data', 'local-store.json')

const initialState = {
    users: [],
    attendances: [],
}

const ensureStore = async () => {
    await fs.mkdir(path.dirname(storePath), { recursive: true })

    try {
    await fs.access(storePath)
    } catch {
    await fs.writeFile(storePath, JSON.stringify(initialState, null, 2))
    }
}

const readState = async () => {
    await ensureStore()

    const raw = await fs.readFile(storePath, 'utf8')

    try {
        const parsed = JSON.parse(raw)
        return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        attendances: Array.isArray(parsed.attendances) ? parsed.attendances : [],
        }
    } catch {
        return { ...initialState }
    }
}

const writeState = async (state) => {
    await ensureStore()
    await fs.writeFile(storePath, JSON.stringify(state, null, 2))
}

const createUser = async ({ name, email }) => {
    const state = await readState()

    if (email && state.users.some((user) => user.email === email)) {
        const error = new Error('Ya existe un usuario con ese correo')
        error.status = 400
        throw error
    }

    const user = {
        id: randomUUID(),
        name,
        email: email || null,
        faceId: null,
        imageUrl: null,
        createdAt: new Date().toISOString(),
    }

    state.users.unshift(user)
    await writeState(state)

    return user
}

const getUsers = async () => {
    const state = await readState()
    return [...state.users].sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    )
}

const getUserById = async (userId) => {
    const state = await readState()
    return state.users.find((user) => user.id === userId) || null
}

const updateUserImage = async (userId, imageUrl) => {
    const state = await readState()
    const userIndex = state.users.findIndex((user) => user.id === userId)

    if (userIndex === -1) {
        const error = new Error('Usuario no encontrado')
        error.status = 404
        throw error
    }

    state.users[userIndex] = {
        ...state.users[userIndex],
        imageUrl,
    }

    await writeState(state)
    return state.users[userIndex]
}

const createAttendance = async (userId) => {
    const state = await readState()

    const attendance = {
        id: randomUUID(),
        userId,
        timestamp: new Date().toISOString(),
        status: 'PRESENTE',
    }

    state.attendances.unshift(attendance)
    await writeState(state)

    return attendance
}

const getAttendanceByUser = async (userId) => {
    const state = await readState()

    return state.attendances
        .filter((attendance) => attendance.userId === userId)
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
}

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUserImage,
    createAttendance,
    getAttendanceByUser,
}