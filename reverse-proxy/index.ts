import express from "express";
import cors from "cors";
import httpProxy from "http-proxy";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BASE_PATH = process.env.BASE_PATH as string;
const proxy = httpProxy.createProxy();

app.use((req, res, next) => {
    const hostname = req.hostname;
    const subdomain = hostname.split(".")[0];
    const originalUrl = req.url;

    if (originalUrl === "/" || originalUrl === "/index.html") {
        req.url = `/__outputs/${subdomain}/index.html`;
    } else {
        req.url = `/__outputs/${subdomain}${originalUrl}`;
    }

    console.log(`[REWRITE] ${hostname} ${originalUrl} → ${req.url}`);
    next();
});

app.use((req, res) => {
    proxy.web(req, res, {
        target: BASE_PATH,
        changeOrigin: true,
    });
});

app.listen(PORT, () => {
    console.log(`✅ Proxy running at http://localhost:${PORT}`);
});
