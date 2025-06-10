import express from "express";
import cors from "cors";
import { generateSlug } from "random-word-slugs";
import Redis from "ioredis";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 9000;
const SOCKET_PORT = 9001;

const subscriber = new Redis(process.env.REDIS_URL as string);

const io = new Server({ cors: { origin: "*" } });

io.on("connection", (socket) => {
    socket.on("subscribe", (channel) => {
        socket.join(channel);
        socket.emit("message", `Joined ${channel}`);
    });
});

io.listen(SOCKET_PORT);
console.log(`Socket server listening on port ${SOCKET_PORT}`);

const ecsClient = new ECSClient({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ECS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_ECS_SECRET_ACCESS_KEY as string,
    },
});
