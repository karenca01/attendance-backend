const validateImageUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Imagen requerida",
        });
    }

    next();
};

module.exports = validateImageUpload;