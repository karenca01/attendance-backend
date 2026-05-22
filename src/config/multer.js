const multer = require("multer");
const path = require("path");
const { BlobServiceClient } = require("@azure/storage-blob");

// La foto se queda en la RAM temporalmente
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Solo se permiten archivos de tipo imagen"));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
});

// Middleware para subir la foto directo a Azure Storage
const uploadToAzure = async (req, res, next) => {
    // Si no viene ninguna foto en la petición, pasamos al siguiente paso
    if (!req.file) {
        return next();
    }

    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

        if (!connectionString || !containerName) {
            throw new Error("Faltan las credenciales de Azure Storage en el archivo .env");
        }

        // Nos conectamos con la cuenta de Azure
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Generamos el nombre único
        const uniqueName = Date.now() + path.extname(req.file.originalname);
        const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);

        // Subimos el archivo a la nube usando el buffer de la RAM
        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: { blobContentType: req.file.mimetype } // Esto hace que la imagen se pueda ver en el navegador y no se descargue sola
        });

        // Modificamos el objeto req.file para que el resto del proyecto 
        // crea que todo sigue igual, pero ahora lleva la URL de internet.
        req.file.azureUrl = blockBlobClient.url;
        req.file.filename = uniqueName;
        req.file.path = blockBlobClient.url; // ahora guardará el link de Azure

        next(); 
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: "No se pudo subir la imagen a la nube de Azure",
            error: error.message
        });
    }
};

// exportamos tanto el validador 'upload' como nuestro 'uploadToAzure'
module.exports = {
    upload,
    uploadToAzure
};