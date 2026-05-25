const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = Number(process.env.PORT) || 5057;
const ROOT = __dirname;
const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".ico": "image/x-icon",
    ".json": "application/json"
};

http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const safe = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fp = path.join(ROOT, safe);
    if (!fp.startsWith(ROOT)) {
        res.writeHead(403);
        res.end();
        return;
    }
    fs.readFile(fp, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found: " + safe);
            return;
        }
        const ext = path.extname(fp).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
    });
}).listen(PORT, () => {
    console.log("Bena dev server → http://localhost:" + PORT);
});
