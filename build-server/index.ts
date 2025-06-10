import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import Redis from "ioredis";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publisher = new Redis(process.env.REDIS_URL as string);

const s3Client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
    },
});

const PROJECT_ID = process.env.PROJECT_ID as string;

const publishLog = (log: any) => {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
};

const init = async () => {
    console.log("➡️ Starting Node.js Build Orchestration...");
    publishLog("Node.js Build Orchestration Started...");

    if (!PROJECT_ID) {
        const errorMsg = "PROJECT_ID environment variable is not set. Exiting.";
        console.error(`🔴 ${errorMsg}`);
        publishLog(`ERROR: ${errorMsg}`);
        process.exit(1);
    }

    const clonedRepoPath = path.join(__dirname, "..", "output");
    console.log(`➡️ Target for build: ${clonedRepoPath}`);
    publishLog(`Attempting build in: ${clonedRepoPath}`);

    if (!fs.existsSync(clonedRepoPath) || !fs.readdirSync(clonedRepoPath).length) {
        const errorMsg = `🔴 Error: Cloned repository directory not found or is empty at ${clonedRepoPath}.`;
        console.error(errorMsg);
        publishLog(`ERROR: ${errorMsg}`);
        process.exit(1);
    }

    console.log(`➡️ Running 'npm install' and 'npm run build' inside ${clonedRepoPath}...`);
    publishLog("Running npm install and npm run build...");

    try {
        await new Promise<void>((resolve, reject) => {
            const buildProcess = exec(`npm install && npm run build`, { cwd: clonedRepoPath });

            if (buildProcess.stdout) {
                buildProcess.stdout.on("data", (data) => {
                    console.log(`BUILD_STDOUT: ${data.toString()}`);
                    publishLog(`BUILD_LOG: ${data.toString()}`);
                });
            }

            if (buildProcess.stderr) {
                buildProcess.stderr.on("data", (data) => {
                    console.error(`BUILD_STDERR: ${data.toString()}`);
                    publishLog(`BUILD_ERROR: ${data.toString()}`);
                });
            }

            buildProcess.on("close", (code) => {
                if (code !== 0) {
                    const errorMsg = `Build process failed with exit code ${code}.`;
                    console.error(`🔴 ${errorMsg}`);
                    publishLog(`ERROR: ${errorMsg}`);
                    reject(new Error(errorMsg));
                } else {
                    console.log("✅ Build process completed successfully.");
                    publishLog("Build process completed successfully.");
                    resolve();
                }
            });

            buildProcess.on("error", (err) => {
                const errorMsg = `Failed to spawn build process: ${(err as Error).message}`;
                console.error(`🔴 ${errorMsg}`);
                publishLog(`ERROR: ${errorMsg}`);
                reject(err);
            });
        });
    } catch (error) {
        console.error(`🔴 Overall build orchestration failed: ${(error as Error).message}`);
        publishLog(`ERROR: Overall build orchestration failed: ${(error as Error).message}`);
        process.exit(1);
    }

    const distDirPath = path.join(clonedRepoPath, "dist");

    console.log(`➡️ Checking for build output in: ${distDirPath}`);
    publishLog(`Checking for build output in: ${distDirPath}`);

    if (!fs.existsSync(distDirPath)) {
        const errorMsg = `🔴 Error: Expected build output directory 'dist' not found at ${distDirPath}.`;
        console.error(errorMsg);
        publishLog(`ERROR: ${errorMsg}`);
        process.exit(1);
    }

    try {
        const distFiles = fs.readdirSync(distDirPath, { recursive: true });

        console.log("➡️ Uploading files to S3...");
        publishLog("Uploading files to S3...");

        if (distFiles.length === 0) {
            console.warn("No files found in dist directory to upload.");
            publishLog("WARNING: No files found in dist directory to upload.");
            return;
        }

        for (const file of distFiles) {
            if (typeof file !== "string") continue;

            const filePath = path.join(distDirPath, file);

            if (fs.lstatSync(filePath).isDirectory()) continue;

            const s3Key = `__outputs/${PROJECT_ID}/${file}`;

            console.log(`Uploading ${filePath} to S3 Key: ${s3Key}`);
            publishLog(`Uploading ${file}`);

            const command = new PutObjectCommand({
                Bucket: "shipr-outputs",
                Key: s3Key,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(file) || "application/octet-stream",
            });

            await s3Client.send(command);

            console.log(`✅ Uploaded ${s3Key}`);
            publishLog(`Uploaded ${file}`);
        }
        console.log(`✅ All files uploaded. Node.js Build Orchestration Complete!`);
        publishLog(`All files uploaded. Build Orchestration Complete!`);
    } catch (uploadError) {
        const errorMsg = `Failed to upload files to S3: ${(uploadError as Error).message}`;
        console.error(`🔴 ${errorMsg}`);
        publishLog(`ERROR: ${errorMsg}`);
        process.exit(1);
    }
};

init();
