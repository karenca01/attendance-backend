const express = require("express");
const router = express.Router();
// 1. CAMBIO: Ahora importamos de forma destructurada tanto el receptor (upload) como el subidor (uploadToAzure)
const { upload, uploadToAzure } = require("../config/multer");
const validateFields = require("../middlewares/validation.middleware");
const { createUserValidation, uploadFaceValidation } = require("../validations/user.validation");
const validateImageUpload = require("../middlewares/upload.middleware");
const userController = require("../controllers/user.controller");

router.post(
    "/",
    createUserValidation,
    validateFields,
    userController.createUser
);

router.get("/", userController.getUsers);

router.post(
    "/:id/upload-face",
    upload.single("image"),      //Multer recibe la foto y la guarda un milisegundo en la RAM
    validateImageUpload,         //Valida que el archivo exista y esté bien
    uploadToAzure,               //Toma la foto de la RAM y la sube a Azure Storage
    uploadFaceValidation,        //Validaciones extra del proyecto
    validateFields,              //Revisa que no haya errores de campos
    userController.uploadFace    //El controlador final guarda los datos en PostgreSQL
);

module.exports = router;