const express = require("express");
const router = express.Router();
const upload = require("../config/multer");

const userController = require("../controllers/user.controller");

router.post("/", userController.createUser);
router.get("/", userController.getUsers);

router.post(
    "/:id/upload-face",
    upload.single("image"),
    userController.uploadFace
);

module.exports = router;