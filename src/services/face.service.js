const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
const userService = require("./user.service");

const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Convierte la URL de Azure en datos binarios (Bytes) para que AWS los pueda procesar
const fetchImageBytes = async (imageUrl) => {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`No se pudo descargar la imagen: ${imageUrl}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

const recognizeFace = async (uploadedImageUrl) => {
    try {
        console.log("--- INICIANDO RECONOCIMIENTO CON AWS REKOGNITION ---");
        
        console.log("Preparando foto nueva...");
        const sourceImageBytes = await fetchImageBytes(uploadedImageUrl);

        // Buscamos únicamente a los alumnos que ya tengan una foto vinculada
        const users = (await userService.getUsers()).filter((user) => user.imageUrl);

        console.log(`Comparando rostro con ${users.length} alumnos registrados...`);

        // Recorremos la lista de alumnos uno por uno para comparar sus rostros
        for (const user of users) {
            console.log(`Evaluando contra: ${user.name}`);
            
            try {
                const targetImageBytes = await fetchImageBytes(user.imageUrl);

                const command = new CompareFacesCommand({
                    SourceImage: { Bytes: sourceImageBytes },
                    TargetImage: { Bytes: targetImageBytes },
                    SimilarityThreshold: 80, // Candado de seguridad: exige un 80% de parecido biométrico
                });

                const response = await rekognition.send(command);

                if (response.FaceMatches && response.FaceMatches.length > 0) {
                    const match = response.FaceMatches[0];
                    console.log(`¡ÉXITO! Es ${user.name} (Similitud: ${match.Similarity.toFixed(2)}%)`);
                    return user; 
                }
            } catch (err) {
                console.error(`Aviso al comparar con ${user.name}:`, err.message);
                continue; 
            }
        }

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