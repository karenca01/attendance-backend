const userService = require("../services/user.service");

const createUser = async (req, res) => {
    try {
        const { name, email } = req.body;

        const user = await userService.createUser({
            name,
            email,
        });

        res.status(201).json(user);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al crear el usuario",
        });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await userService.getUsers();

        res.json(users);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al obtener los usuarios",
        });
    }
};

const uploadFace = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                message: "No se ha subido ninguna imagen",
            });
        }

        const updatedUser = await userService.updateUserImage(
            id,
            req.file.filename
        );

        res.json({
            message: "Imagen subida exitosamente",
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al subir la imagen",
        });
    }
};

module.exports = {
    createUser,
    getUsers,
    uploadFace,
};