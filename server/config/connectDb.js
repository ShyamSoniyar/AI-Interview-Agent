import mongoose from "mongoose";
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const  connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Database connected");
    } catch (error) {
        // Exit rather than serving 500s on every DB-backed route
        console.error(`Database Error: ${error}`)
        process.exit(1)
    }
}

export default connectDb