const express = require("express");
const router = express.Router();
const { upload, uploadToAzure } = require("../config/multer");
const attendanceController = require("../controllers/attendance.controller");
const validateFields = require("../middlewares/validation.middleware");
const validateImageUpload = require("../middlewares/upload.middleware");
const { registerAttendanceValidation, attendanceHistoryValidation } = require("../validations/attendance.validation");

router.post("/", registerAttendanceValidation, validateFields, attendanceController.registerAttendance);
router.get("/:userId", attendanceHistoryValidation, validateFields, attendanceController.getAttendanceHistory);

// Flujo en cadena: Recibe archivo -> Valida que exista -> Lo sube a Azure -> Procesa la asistencia con IA
router.post(
    "/recognize",
    upload.single("image"),      
    validateImageUpload,         
    uploadToAzure,               
    attendanceController.recognizeAttendance 
);

module.exports = router;