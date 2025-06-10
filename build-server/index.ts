import { PutObjectAclCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import Redis from "ioredis";
import path from "path";
import fs from "fs";
import mime from "mime-types";

const publisher = new Redis(process.env.REDIS_URL as string);

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
    },
});

const PROJECT_ID = process.env.PROJECT_ID as string;

const publishLog = (log: any) => {
    publisher.publish(`logs: ${PROJECT_ID}`, JSON.stringify({ log }));
};

const init = async () => {
    console.log("Starting server...");
    publishLog("Build Started...");

    const outDirPath = path.join(__dirname, "output");

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    if (p.stdout) {
        p.stdout.on("data", (data) => {
            console.log(`stdout: ${data}`);
            publishLog(data.toString());
        });
    }

    p.on("error", (data) => {
        console.error(`Error: ${data}`);
        publishLog(`Error : ${data.toString()}`);
    });

    p.on("close", async (code) => {
        console.log("Build Complete");
        publishLog("Build Complete");

        const distDirPath = path.join(outDirPath, "dist");
        const distFiles = fs.readdirSync(distDirPath, { recursive: true });

        publishLog("Uploading files...");
        for (const file of distFiles) {
            if (typeof file !== "string") continue;

            const filePath = path.join(distDirPath, file);

            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log(`Uploading ${file}`);
            publishLog(`Uploading ${file}`);

            const command = new PutObjectCommand({
                Bucket: "shipr-build-server",
                Key: `__output/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(file) || "application/octet-stream",
            });

            await s3Client.send(command);

            console.log(`Uploaded ${file}`);
            publishLog(`Uploaded ${file}`);
        }
        console.log(`Done`);
        publishLog(`Done`);
    });
};

init();
