const userService = require("../services/user.service");

const createUser = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const user = await userService.createUser({ name, email });
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

const uploadFace = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "No se ha subido ninguna imagen" });
        }

        // Guardamos el enlace de internet completo directo en la base de datos
        const updatedUser = await userService.updateUserImage(id, req.file.path);

        res.json({
            message: "Imagen subida exitosamente desde Azure Storage",
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUser,
    getUsers,
    uploadFace,
};