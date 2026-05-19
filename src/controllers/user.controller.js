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
            message: "Error creating user",
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
            message: "Error fetching users",
        });
    }
};

module.exports = {
    createUser,
    getUsers,
};