import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import http from "http";

const server = http.createServer(app);

async function main() {
    try {
        await mongoose.connect(config.database_url as string);
        console.log("Connected to MongoDB!");

        server.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
        });
    } catch (error) {
        console.log("Error connecting to the database:", error);
    }
}

// Start the server
main().catch((err) => console.log(err));

export default server;
