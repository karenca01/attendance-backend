const { body, param } = require("express-validator");

const registerAttendanceValidation = [
    body("userId")
        .notEmpty()
        .withMessage("Id del usuario requerido")

        .isUUID()
        .withMessage("Id de usuario inválido"),
];

const attendanceHistoryValidation = [
    param("userId")
        .notEmpty()
        .withMessage("Id del usuario requerido")
        .isUUID()
        .withMessage("Id de usuario inválido"),
];

module.exports = {
    registerAttendanceValidation,
    attendanceHistoryValidation,
};