const express = require("express");
const router = express.Router();
const { upload, uploadToAzure } = require("../config/multer");

const attendanceController = require("../controllers/attendance.controller");
const validateFields = require("../middlewares/validation.middleware");
const validateImageUpload = require("../middlewares/upload.middleware"); // Importamos el middleware de tu amiga
const { registerAttendanceValidation, attendanceHistoryValidation } = require("../validations/attendance.validation");

router.post(
    "/",
    registerAttendanceValidation,
    validateFields,
    attendanceController.registerAttendance
);

router.get(
    "/:userId",
    attendanceHistoryValidation,
    validateFields,
    attendanceController.getAttendanceHistory
);

router.post(
    "/recognize",
    upload.single("image"),      // 1. Extrae la foto de la cámara
    validateImageUpload,         // 2. El middleware verifica que sí haya llegado un archivo
    uploadToAzure,               // 3. Se sube a Azure Storage
    attendanceController.recognizeAttendance // 4. Se manda la URL a la Inteligencia Artificial
);

module.exports = router;