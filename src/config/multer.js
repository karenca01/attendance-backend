const multer = require("multer");
const path = require("path");
const { BlobServiceClient } = require("@azure/storage-blob");

// Dejamos la foto en la RAM un momento en lugar de guardarla en el disco duro local
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Solo se permiten archivos de tipo imagen"));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
});

// Middleware personalizado para subir el archivo directo a nuestro contenedor de Azure
const uploadToAzure = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

        if (!connectionString || !containerName) {
            throw new Error("Faltan las credenciales de Azure Storage en el archivo .env");
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Creamos un nombre único con la fecha actual para evitar archivos duplicados
        const uniqueName = Date.now() + path.extname(req.file.originalname);
        const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);

        // Subimos los datos binarios desde el buffer de la memoria RAM
        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: { blobContentType: req.file.mimetype }
        });

        // Guardamos el link público que nos da Azure en el objeto req para usarlo después
        req.file.azureUrl = blockBlobClient.url;
        req.file.filename = uniqueName;
        req.file.path = blockBlobClient.url; 

        next(); 
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: "No se pudo subir la imagen a la nube de Azure",
            error: error.message
        });
    }
};

module.exports = {
    upload,
    uploadToAzure
};