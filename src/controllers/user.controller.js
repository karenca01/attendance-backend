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
                message: "Sin imagen",
            });
        }

        res.json({
            message: "Imagen guardada exitosamente",
            userId: id,
            file: req.file.filename,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al guardar la imagen",
        });
    }
};

module.exports = {
    createUser,
    getUsers,
    uploadFace,
};