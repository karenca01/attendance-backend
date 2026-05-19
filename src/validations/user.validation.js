const { body, param } = require("express-validator");

const createUserValidation = [
    body("name")
        .notEmpty()
        .withMessage("El nombre es requerido"),

    body("email")
        .optional()
        .isEmail()
        .withMessage("El correo es invalido"),
];

const uploadFaceValidation = [
    param("id")
        .notEmpty()
        .withMessage("El id es requerido")
        .isUUID()
        .withMessage("El id es inválido"),
];

module.exports = {
    createUserValidation,
    uploadFaceValidation
};