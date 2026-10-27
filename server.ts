import "dotenv/config";

import app from "./src/app.js";

const startServer = async () => {
    try {
        await app.listen({
            port: Number(process.env.PORT) || 3000,
            host: "0.0.0.0",
        });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

startServer();