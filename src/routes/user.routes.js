const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
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
    upload.single("image"),
    validateImageUpload,
    uploadFaceValidation,
    validateFields,
    userController.uploadFace
);

module.exports = router;