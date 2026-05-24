const prisma = require('../prisma/client')
const localStore = require('./local-store')

const useLocalStore = (error) => {
    const message = error?.message || ''

    return (
        message.includes('Can\'t reach database server') ||
        message.includes('connect ECONNREFUSED') ||
        message.includes('Invalid `prisma.user.create()` invocation')
    )
}

const createUser = async (data) => {
    try {
        return await prisma.user.create({ data })
    } catch (error) {
        if (useLocalStore(error)) {
            return await localStore.createUser(data)
        }

        throw error
    }
}

const getUsers = async () => {
    try {
        return await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        })
    } catch (error) {
        if (useLocalStore(error)) {
            return await localStore.getUsers()
        }

        throw error
    }
}

const getUserById = async (userId) => {
    try {
        return await prisma.user.findUnique({
            where: {
                id: userId,
            },
        })
    } catch (error) {
        if (useLocalStore(error)) {
            return await localStore.getUserById(userId)
        }

        throw error
    }
}

const updateUserImage = async (userId, imageUrl) => {
    try {
        return await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                imageUrl,
            },
        })
    } catch (error) {
        if (useLocalStore(error)) {
            return await localStore.updateUserImage(userId, imageUrl)
        }

        throw error
    }
}

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUserImage,
}