const createFaceClient = require("@azure-rest/ai-vision-face").default;
const prisma = require("../prisma/client");

// Traemos las llaves que guardaste en el .env
const endpoint = process.env.AZURE_FACE_ENDPOINT;
const key = process.env.AZURE_FACE_KEY;

// Creamos el cliente de IA de Microsoft
const client = createFaceClient(endpoint, { key });

const recognizeFace = async (uploadedImageUrl) => {
    try {
        console.log("--- INICIANDO RECONOCIMIENTO FACIAL ---");
        console.log("URL de la foto de la cámara:", uploadedImageUrl);

        // 1. Detectar el rostro en la foto que se acaba de tomar en la cámara
        const detectUploaded = await client.path("/detect").post({
            queryParameters: { returnFaceId: true },
            body: { url: uploadedImageUrl }
        });

        // ESCUDO PROTECTOR 1: Revisar si Azure nos devolvió un error en la foto nueva
        if (detectUploaded.body && detectUploaded.body.error) {
            console.error("Face API rechazó la URL subida:", detectUploaded.body.error);
            throw new Error(`Error de la IA al leer la cámara: ${detectUploaded.body.error.message}`);
        }

        // Si la foto está borrosa o no hay nadie, abortamos
        if (!detectUploaded.body || !Array.isArray(detectUploaded.body) || detectUploaded.body.length === 0) {
            console.log("La IA no detectó ningún rostro humano en la foto enviada.");
            return null;
        }
        
        // Obtenemos el ID temporal del rostro que detectó Azure
        const uploadedFaceId = detectUploaded.body[0].faceId;
        console.log("Rostro detectado correctamente. FaceID temporal:", uploadedFaceId);

        // 2. Traer a todos los usuarios de PostgreSQL que tengan una foto de perfil registrada
        const users = await prisma.user.findMany({
            where: {
                imageUrl: { not: null }
            }
        });

        console.log(`Comparando el rostro con ${users.length} alumnos registrados en la base de datos...`);

        // 3. Comparar el rostro nuevo con el de los usuarios registrados
        for (const user of users) {
            console.log(`Evaluando contra el usuario: ${user.name}`);
            
            // Detectamos el rostro en la foto de perfil que el usuario ya tenía guardada
            const detectSaved = await client.path("/detect").post({
                queryParameters: { returnFaceId: true },
                body: { url: user.imageUrl }
            });

            // ESCUDO PROTECTOR 2: Revisar si Azure falla al leer la foto de la base de datos
            if (detectSaved.body && detectSaved.body.error) {
                console.error(`Face API falló al leer la foto guardada de ${user.name}:`, detectSaved.body.error);
                continue; // Hubo error con esta foto vieja, saltamos a revisar al siguiente alumno
            }

            if (detectSaved.body && Array.isArray(detectSaved.body) && detectSaved.body.length > 0) {
                const savedFaceId = detectSaved.body[0].faceId;

                // Le pedimos a Azure que verifique si ambas caras pertenecen a la misma persona
                const verifyResponse = await client.path("/verify").post({
                    body: {
                        faceId1: uploadedFaceId,
                        faceId2: savedFaceId
                    }
                });

                if (verifyResponse.body && verifyResponse.body.error) {
                    console.error("Error al intentar comparar ambos rostros:", verifyResponse.body.error);
                    continue;
                }

                // Si Azure determina que es la misma persona con un índice de confianza mayor al 60%
                if (verifyResponse.body.isIdentical && verifyResponse.body.confidence > 0.6) {
                    console.log(`¡EXITO! Coincidencia encontrada con ${user.name} (Confianza: ${verifyResponse.body.confidence * 100}%)`);
                    return user; 
                }
            }
        }

        // Si terminó de revisar a todos los alumnos y ninguno coincidió
        console.log("Análisis terminado. El rostro no coincide con ningún alumno registrado.");
        return null; 

    } catch (error) {
        console.error("Error crítico en el servicio de reconocimiento:", error);
        throw new Error("Hubo un fallo al intentar procesar la identidad del rostro.");
    }
};

module.exports = {
    recognizeFace,
};