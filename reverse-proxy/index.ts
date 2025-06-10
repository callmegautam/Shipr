import express from "express";
import cors from "cors";
import httpProxy from "http-proxy";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 8000;
const BASE_PATH = process.env.BASE_PATH as string;
const proxy = httpProxy.createProxy();

app.use((req, res) => {
    const hostname = req.hostname;
    const subDomain = hostname.split(".")[0];
    const resolveTo = `${BASE_PATH}/${subDomain}`;
    proxy.web(req, res, { target: resolveTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
    const url = req.url;
    if (url === "/") {
        proxyReq.path = "/index.html";
    }
});

app.listen(PORT, () => {
    console.log(`Reverse Proxy listening on port ${PORT}`);
});
