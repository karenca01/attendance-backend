const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
const prisma = require("../prisma/client");

// 1. Configuramos el cliente de AWS con las llaves de tu .env
const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Función auxiliar: Como AWS no lee URLs de Azure directamente, 
// descargamos la foto a la memoria (Buffer) para enviársela.
const fetchImageBytes = async (imageUrl) => {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`No se pudo descargar la imagen: ${imageUrl}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

const recognizeFace = async (uploadedImageUrl) => {
    try {
        console.log("--- INICIANDO RECONOCIMIENTO CON AWS REKOGNITION ---");
        
        // Convertimos la foto que se acaba de tomar en la cámara a Bytes
        console.log("Preparando foto nueva...");
        const sourceImageBytes = await fetchImageBytes(uploadedImageUrl);

        // Traemos a todos los usuarios de la base de datos que tengan foto
        const users = await prisma.user.findMany({
            where: {
                imageUrl: { not: null }
            }
        });

        console.log(`Comparando rostro con ${users.length} alumnos registrados...`);

        // Comparamos la foto nueva con la de cada usuario
        for (const user of users) {
            console.log(`Evaluando contra: ${user.name}`);
            
            try {
                // Convertimos la foto guardada del alumno a Bytes
                const targetImageBytes = await fetchImageBytes(user.imageUrl);

                // Le pedimos a AWS que compare ambas fotos
                const command = new CompareFacesCommand({
                    SourceImage: { Bytes: sourceImageBytes },
                    TargetImage: { Bytes: targetImageBytes },
                    SimilarityThreshold: 80, // Solo aprueba si hay más del 80% de similitud
                });

                const response = await rekognition.send(command);

                // Si AWS encuentra coincidencias y superan nuestro nivel de exigencia (80%)
                if (response.FaceMatches && response.FaceMatches.length > 0) {
                    const match = response.FaceMatches[0];
                    console.log(`¡ÉXITO! Es ${user.name} (Similitud: ${match.Similarity.toFixed(2)}%)`);
                    return user; 
                }
            } catch (err) {
                // Si falla una comparación (ej. la foto no tiene una cara visible), 
                // imprimimos el error pero continuamos con el siguiente alumno.
                console.error(`Aviso al comparar con ${user.name}:`, err.message);
                continue; 
            }
        }

        // Si el ciclo termina y nadie coincidió
        console.log("Análisis terminado. El rostro no coincide con ningún alumno.");
        return null; 

    } catch (error) {
        console.error("Error crítico en AWS Rekognition:", error);
        throw new Error("Hubo un fallo al intentar procesar la identidad con AWS.");
    }
};

module.exports = {
    recognizeFace,
};