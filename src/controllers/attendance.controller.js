const attendanceService = require("../services/attendance.service");
const prisma = require("../prisma/client");
const faceService = require("../services/face.service");

const registerAttendance = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const attendance = await attendanceService.createAttendance(userId);
        res.status(201).json({ message: "Asistencia registrada", attendance });
    } catch (error) {
        next(error);
    }
};

const getAttendanceHistory = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const history = await attendanceService.getAttendanceByUser(userId);
        res.json(history);
    } catch (error) {
        next(error);
    }
};

const recognizeAttendance = async (req, res, next) => {
    try {
        // Validamos que la cámara realmente haya enviado una imagen
        if (!req.file) {
            return res.status(400).json({
                message: "No se ha proporcionado ninguna imagen para verificar la asistencia",
            });
        }

        // Mandamos el link de Azure a nuestro motor de AWS Rekognition
        const recognizedUser = await faceService.recognizeFace(req.file.path);

        if (!recognizedUser) {
            return res.status(404).json({
                message: "Rostro no reconocido. No coincide con ningún alumno.",
            });
        }

        const attendance = await attendanceService.createAttendance(recognizedUser.id);

        res.status(201).json({
            message: "Asistencia registrada exitosamente",
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