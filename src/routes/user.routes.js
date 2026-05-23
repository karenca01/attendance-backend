const express = require("express");
const router = express.Router();
const { upload, uploadToAzure } = require("../config/multer");
const validateFields = require("../middlewares/validation.middleware");
const { createUserValidation, uploadFaceValidation } = require("../validations/user.validation");
const validateImageUpload = require("../middlewares/upload.middleware");
const userController = require("../controllers/user.controller");

router.post("/", createUserValidation, validateFields, userController.createUser);
router.get("/", userController.getUsers);

// Flujo de Registro: Recibe foto -> Valida el archivo -> Sube a Azure -> Valida campos del formulario -> Guarda en Postgres
router.post(
    "/:id/upload-face",
    upload.single("image"),
    validateImageUpload,
    uploadToAzure,
    uploadFaceValidation,
    validateFields,
    userController.uploadFace
);

module.exports = router;