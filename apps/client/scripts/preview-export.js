/**
 * `pnpm start` — preview the static export (out/) the way cPanel serves it.
 *
 * Production is plain files behind Apache, so `next start` no longer applies.
 * This serves out/ with the same rules Apache takes from public/.htaccess:
 * files and folders that exist, then each RewriteRule in order (the dynamic
 * pages), then the ErrorDocument 404 page. It reads the rules from the
 * exported .htaccess itself, so a rule that is wrong here is wrong on cPanel.
 *
 * Headers are not reproduced — only Apache sends those.
 *
 * Usage: pnpm build && pnpm start   (port 5791, or PORT=...)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "out");
const port = Number(process.env.PORT || 5791);

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("No export found in out/. Run `pnpm build` first.");
  process.exit(1);
}

const htaccess = fs.readFileSync(path.join(root, ".htaccess"), "utf8");
const rules = [...htaccess.matchAll(/^\s*RewriteRule\s+(\S+)\s+(\S+)\s+\[L\]/gm)]
  .filter((m) => m[1] !== "^")
  .map((m) => ({ re: new RegExp(m[1]), to: m[2] }));
const notFound = (htaccess.match(/^ErrorDocument 404 (\S+)/m) || [])[1];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".xml": "application/xml",
};

/** The file a URL path names on disk: the file itself or a folder's index.html. */
const fileFor = (urlPath) => {
  let p;
  try {
    p = path.join(root, decodeURIComponent(urlPath));
  } catch {
    return null;
  }
  if (!p.startsWith(root)) return null;
  if (!fs.existsSync(p)) return null;
  if (fs.statSync(p).isFile()) return p;
  const index = path.join(p, "index.html");
  return fs.existsSync(index) ? index : null;
};

http
  .createServer((req, res) => {
    const urlPath = req.url.split("?")[0];
    let file = fileFor(urlPath);
    if (!file) {
      const rel = urlPath.replace(/^\//, "");
      const rule = rules.find((r) => r.re.test(rel));
      if (rule) file = fileFor(rel.replace(rule.re, rule.to));
    }
    let status = 200;
    if (!file && notFound) {
      file = fileFor(notFound);
      status = 404;
    }
    if (!file) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(status, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => {
    console.log(`Static export at http://localhost:${port} (${rules.length} dynamic-page rewrites from .htaccess)`);
  });
