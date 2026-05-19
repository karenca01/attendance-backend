const prisma = require("../prisma/client");

const createUser = async (data) => {
    return await prisma.user.create({
        data,
    });
};

const getUsers = async () => {
    return await prisma.user.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
};

const updateUserImage = async (userId, imageUrl) => {
    return await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            imageUrl,
        },
    });
};

module.exports = {
    createUser,
    getUsers,
    updateUserImage,
};