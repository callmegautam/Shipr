import express from "express";
import cors from "cors";
import { generateSlug } from "random-word-slugs";
import Redis from "ioredis";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { Server } from "socket.io";
import type { Request, Response } from "express";
import { url } from "inspector";

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

const config = {
    CLUSTER: process.env.CLUSTER_ARN as string,
    TASK: process.env.TASK_ARN as string,
};

//@ts-ignore

app.post("/project", async (req, res) => {
    const { gitURL, slug } = req.body;

    if (!gitURL) {
        return res.status(400).json({ status: "error", data: "Git URL is required" });
    }

    const projectSlug = slug ? slug : generateSlug();

    try {
        const command = new RunTaskCommand({
            cluster: config.CLUSTER,
            taskDefinition: config.TASK,
            launchType: "FARGATE",
            count: 1,
            networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: "ENABLED",
                    subnets: ["subnet-08e1b40d627017d2b", "subnet-027fd6f6f67d16c3c", "subnet-0cd5651e3a5e4622c"],
                    securityGroups: ["sg-0cc4b334fa63d0abf"],
                },
            },
            overrides: {
                containerOverrides: [
                    {
                        name: "Build-Server",
                        environment: [
                            {
                                name: "GIT_REPOSITORY_URL",
                                value: gitURL,
                            },
                            {
                                name: "PROJECT_ID",
                                value: projectSlug,
                            },
                        ],
                    },
                ],
            },
        });

        await ecsClient.send(command);

        return res
            .status(200)
            .json({ status: "queued", data: { projectSlug, url: `http://${projectSlug}.localhost:9000` } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", data: "Something went wrong" });
    }
});

async function initRedisSubscribe() {
    console.log("Subscribed to logs....");
    subscriber.psubscribe("logs:*");
    subscriber.on("pmessage", (pattern, channel, message) => {
        io.to(channel).emit("message", message);
    });
}

initRedisSubscribe();

app.listen(PORT, () => console.log(`API Server Running..${PORT}`));
