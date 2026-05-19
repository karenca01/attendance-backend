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

module.exports = {
    createUser,
    getUsers,
};