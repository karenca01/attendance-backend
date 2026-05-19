const express = require("express");

const router = express.Router();

const attendanceController = require(
    "../controllers/attendance.controller"
);

router.post(
    "/",
    attendanceController.registerAttendance
);

router.get(
    "/:userId",
    attendanceController.getAttendanceHistory
);

router.post(
    "/recognize",
    attendanceController.recognizeAttendance
);

module.exports = router;