const attendanceService = require("../services/attendance.service");
const prisma = require("../prisma/client");

const registerAttendance = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado",
            });
        }

        const attendance =
            await attendanceService.createAttendance(userId);

        res.status(201).json({
            message: "Asistencia registrada",
            attendance,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al registrar la asistencia",
        });
    }
};

const getAttendanceHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const history =
            await attendanceService.getAttendanceByUser(userId);

        res.json(history);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al obtener el historial de asistencia",
        });
    }
};

module.exports = {
    registerAttendance,
    getAttendanceHistory,
};