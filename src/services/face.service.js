const prisma = require("../prisma/client");

const recognizeFace = async () => {
    //   mock temporal

    const user = await prisma.user.findFirst();

    if (!user) {
        return null;
    }

    return user;
};

module.exports = {
    recognizeFace,
};