const prisma = require('../prisma/client')
const localStore = require('./local-store')

const useLocalStore = (error) => {
    const message = error?.message || ''

    return (
        message.includes('Can\'t reach database server') ||
        message.includes('connect ECONNREFUSED') ||
        message.includes('Invalid `prisma.attendance.create()` invocation')
    )
}

const createAttendance = async (userId) => {
    try {
        return await prisma.attendance.create({
            data: {
                userId,
                status: 'PRESENTE',
            },
        })
    } catch (error) {
        if (useLocalStore(error)) {
            return await localStore.createAttendance(userId)
        }

        throw error
    }
}

const getAttendanceByUser = async (userId) => {
    try {
        return await prisma.attendance.findMany({
            where: {
                userId,
            },

            orderBy: {
                timestamp: 'desc',
            },
        })
    } catch (error) {
        if (useLocalStore(error)) {
            return await localStore.getAttendanceByUser(userId)
        }

        throw error
    }
}

module.exports = {
    createAttendance,
    getAttendanceByUser,
}