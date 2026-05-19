const prisma = require("../prisma/client");

const createAttendance = async (userId) => {
    return await prisma.attendance.create({
        data: {
            userId,
            status: "PRESENTE",
        },
    });
};

const getAttendanceByUser = async (userId) => {
    return await prisma.attendance.findMany({
        where: {
            userId,
        },

        orderBy: {
            timestamp: "desc",
        },
    });
};

module.exports = {
    createAttendance,
    getAttendanceByUser,
};