const attendanceService = require("../services/attendance.service");
const prisma = require("../prisma/client");
const faceService = require("../services/face.service");

const registerAttendance = async (req, res, next) => {
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
        next(error);
    }
};

const getAttendanceHistory = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const history =
            await attendanceService.getAttendanceByUser(userId);

        res.json(history);
    } catch (error) {
        next(error);
    }
};

const recognizeAttendance = async (req, res, next) => {
    try {
        // llega la imagen y se manda a rekognition

        const recognizedUser =
            await faceService.recognizeFace();

        if (!recognizedUser) {
            return res.status(404).json({
                message: "Rostro no reconocido",
            });
        }

        const attendance =
            await attendanceService.createAttendance(
                recognizedUser.id
            );

        res.status(201).json({
            message: "Asistencia registrada",
            user: recognizedUser,
            attendance,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerAttendance,
    getAttendanceHistory,
    recognizeAttendance,
};