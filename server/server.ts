import "dotenv/config";

import app from "./src/app.js";
import DatabaseConnection from "./src/utility/db.connection.js";

const startServer = async () => {
    try {
        await DatabaseConnection();

        await app.listen({
            port: Number(process.env.PORT) || 3000,
            host: "0.0.0.0",
        });

        app.log.info("Server started successfully");
    } catch (error) {
        app.log.error(error);
        await app.close();
        process.exit(1);
    }
};

startServer();