const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const validateFields = require("../middlewares/validation.middleware");
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
    attendanceController.recognizeAttendance
);

module.exports = router;