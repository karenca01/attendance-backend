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

module.exports = router;