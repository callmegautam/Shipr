// import { PutObjectAclCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { exec } from "child_process";
// import Redis from "ioredis";
// import path from "path";
// import fs from "fs";
// import mime from "mime-types";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const publisher = new Redis(process.env.REDIS_URL as string);

// const s3Client = new S3Client({
//     region: "ap-southeast-1",
//     credentials: {
//         accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
//         secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
//     },
// });

// const PROJECT_ID = process.env.PROJECT_ID as string;

// const publishLog = (log: any) => {
//     publisher.publish(`logs: ${PROJECT_ID}`, JSON.stringify({ log }));
// };

// const init = async () => {
//     console.log("➡️Starting server...");
//     publishLog("Build Started...");

//     const outDirPath = path.join(__dirname, "output");
//     console.log(`➡️ Output Directory: ${outDirPath}`);

//     const p = exec(`cd ${outDirPath} && npm install && npm run build`);

//     if (p.stdout) {
//         p.stdout.on("data", (data) => {
//             console.log(`stdout: ${data}`);
//             publishLog(data.toString());
//         });
//     }

//     p.on("error", (data) => {
//         console.error(`Error: ${data}`);
//         publishLog(`Error : ${data.toString()}`);
//     });

//     p.on("close", async (code) => {
//         console.log("Build Complete");
//         publishLog("Build Complete");

//         const distDirPath = path.join(outDirPath, "dist");
//         const distFiles = fs.readdirSync(distDirPath, { recursive: true });

//         publishLog("Uploading files...");
//         for (const file of distFiles) {
//             if (typeof file !== "string") continue;

//             const filePath = path.join(distDirPath, file);

//             if (fs.lstatSync(filePath).isDirectory()) continue;

//             console.log(`Uploading ${file}`);
//             publishLog(`Uploading ${file}`);

//             const command = new PutObjectCommand({
//                 Bucket: "shipr-outputs",
//                 Key: `__outputs/${PROJECT_ID}/${file}`,
//                 Body: fs.createReadStream(filePath),
//                 ContentType: mime.lookup(file) || "application/octet-stream",
//             });

//             await s3Client.send(command);

//             console.log(`Uploaded ${file}`);
//             publishLog(`Uploaded ${file}`);
//         }
//         console.log(`Done`);
//         publishLog(`Done`);
//     });
// };

// init();

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { exec } from "child_process"; // Keep exec here
import Redis from "ioredis";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { fileURLToPath } from "url";

// For ES Modules
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
// Assuming GIT_REPOSITORY_URL is correctly passed to main.sh and then not needed here for the build
// but the 'output' directory would contain the cloned repo

const publishLog = (log: any) => {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log })); // Correct channel name `logs:${PROJECT_ID}`
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

    // This path calculation is correct for the cloned repository:
    // `__dirname` is /home/app/dist
    // `path.join(__dirname, "..", "output")` correctly resolves to /home/app/output
    const clonedRepoPath = path.join(__dirname, "..", "output");
    console.log(`➡️ Target for build: ${clonedRepoPath}`);
    publishLog(`Attempting build in: ${clonedRepoPath}`);

    // Critical Check: Ensure the cloned repo directory actually exists and is not empty
    if (!fs.existsSync(clonedRepoPath) || !fs.readdirSync(clonedRepoPath).length) {
        const errorMsg = `🔴 Error: Cloned repository directory not found or is empty at ${clonedRepoPath}. Was git clone successful in main.sh?`;
        console.error(errorMsg);
        publishLog(`ERROR: ${errorMsg}`);
        process.exit(1); // Fail fast if clone failed
    }

    // Step 1: Install dependencies and Build the cloned project
    console.log(`➡️ Running 'npm install' and 'npm run build' inside ${clonedRepoPath}...`);
    publishLog("Running npm install and npm run build...");

    try {
        // Use a Promise wrapper for exec to await its completion and handle errors
        await new Promise<void>((resolve, reject) => {
            // Change directory AND execute commands for the cloned project
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
                    const errorMsg = `Build process failed with exit code ${code}. Check BUILD_ERROR logs.`;
                    console.error(`🔴 ${errorMsg}`);
                    publishLog(`ERROR: ${errorMsg}`);
                    reject(new Error(errorMsg)); // Reject the promise to trigger catch block
                } else {
                    console.log("✅ Build process completed successfully.");
                    publishLog("Build process completed successfully.");
                    resolve();
                }
            });

            buildProcess.on("error", (err) => {
                // Catches errors like command not found
                const errorMsg = `Failed to spawn build process: ${(err as Error).message}`;
                console.error(`🔴 ${errorMsg}`);
                publishLog(`ERROR: ${errorMsg}`);
                reject(err);
            });
        });
    } catch (error) {
        // This catch block handles rejection from the Promise above
        console.error(`🔴 Overall build orchestration failed: ${(error as Error).message}`);
        publishLog(`ERROR: Overall build orchestration failed: ${(error as Error).message}`);
        process.exit(1); // Exit the container if build failed
    }

    // Step 2: Upload files to S3
    const distDirPath = path.join(clonedRepoPath, "dist"); // Correctly targets the dist folder within the cloned repo

    console.log(`➡️ Checking for build output in: ${distDirPath}`);
    publishLog(`Checking for build output in: ${distDirPath}`);

    // Final check for dist directory before proceeding with upload
    if (!fs.existsSync(distDirPath)) {
        const errorMsg = `🔴 Error: Expected build output directory 'dist' not found at ${distDirPath}. The build process likely failed or 'outDir' is set differently in the cloned project's tsconfig.json.`;
        console.error(errorMsg);
        publishLog(`ERROR: ${errorMsg}`);
        process.exit(1); // Critical failure, no files to upload
    }

    try {
        const distFiles = fs.readdirSync(distDirPath, { recursive: true });

        console.log("➡️ Uploading files to S3...");
        publishLog("Uploading files to S3...");

        if (distFiles.length === 0) {
            console.warn("No files found in dist directory to upload.");
            publishLog("WARNING: No files found in dist directory to upload.");
            return; // Exit successfully if nothing to upload
        }

        for (const file of distFiles) {
            if (typeof file !== "string") continue; // Type guard for recursive readdirSync output

            const filePath = path.join(distDirPath, file);

            if (fs.lstatSync(filePath).isDirectory()) continue; // Skip directories

            const s3Key = `__outputs/${PROJECT_ID}/${file}`; // `file` includes relative path (e.g., 'subfolder/asset.js')

            console.log(`Uploading ${filePath} to S3 Key: ${s3Key}`);
            publishLog(`Uploading ${file}`);

            const command = new PutObjectCommand({
                Bucket: "shipr-outputs", // Ensure this bucket exists and is correct
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
        process.exit(1); // Critical failure during upload
    }
};

init();
