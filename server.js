const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

loadDotEnv();

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8765);
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen2.5:3b";
const QWEN_BASE_URL = (process.env.QWEN_BASE_URL || "http://127.0.0.1:11434/v1").replace(/\/$/, "");
const QWEN_API_KEY = process.env.QWEN_API_KEY || "";
const MAX_BODY_BYTES = 16 * 1024;
const rateBuckets = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
};

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function jsonResponse(res, status, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function getClientKey(req) {
  return req.socket.remoteAddress || "local";
}

function withinRateLimit(req) {
  const now = Date.now();
  const key = getClientKey(req);
  const bucket = rateBuckets.get(key) || { startedAt: now, count: 0 };
  if (now - bucket.startedAt > 15 * 60 * 1000) { bucket.startedAt = now; bucket.count = 0; }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count <= 20;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) { reject(new Error("request_too_large")); req.destroy(); return; }
      body += chunk;
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch { reject(new Error("invalid_json")); }
    });
    req.on("error", reject);
  });
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") throw new Error("invalid_payload");
  if (typeof payload.question !== "string" || payload.question.trim().length < 1 || payload.question.length > 120) throw new Error("invalid_question");
  if (typeof payload.category !== "string" || payload.category.length > 30) throw new Error("invalid_category");
  if (!payload.primaryHex || typeof payload.primaryHex.name !== "string" || typeof payload.primaryHex.meaning !== "string") throw new Error("invalid_hexagram");
  if (!Array.isArray(payload.movingLines) || payload.movingLines.length > 6) throw new Error("invalid_lines");
  if (payload.changedHex !== null && payload.changedHex !== undefined && typeof payload.changedHex.name !== "string") throw new Error("invalid_changed_hexagram");
}

function buildPrompt(payload) {
  const data = {
    问题: payload.question.trim(),
    问题类型: payload.category,
    本卦: payload.primaryHex,
    动爻: payload.movingLines,
    变卦: payload.changedHex || "无动爻，不取变卦",
  };
  return `请基于下面这份已经由规则引擎计算好的周易资料，做一段克制、具体、可执行的中文辅助解读。\n\n${JSON.stringify(data, null, 2)}\n\n要求：\n1. 只把输入资料当作卦象事实，不要自行改算卦象或编造不存在的爻辞。\n2. 结合“问题类型”和“问题”给出观察角度。\n3. 用“局势 / 关键提醒 / 接下来可以做什么”三个小段落回答，每段 2-4 句。\n4. 不声称能确定预测未来，不替用户做医疗、法律或投资决定。\n5. 只返回纯文本，不要返回 HTML、脚本或 JSON。`;
}

async function askQwen(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const headers = { "Content-Type": "application/json" };
  if (QWEN_API_KEY) headers.Authorization = `Bearer ${QWEN_API_KEY}`;
  try {
    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: QWEN_MODEL,
        temperature: 0.6,
        max_tokens: 600,
        messages: [
          { role: "system", content: "你是一个谨慎的周易辅助解读器。你输出的是自我观察材料，不是确定性预言。" },
          { role: "user", content: buildPrompt(payload) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`qwen_${response.status}`);
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("qwen_empty");
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function handleQwen(req, res) {
  if (!withinRateLimit(req)) return jsonResponse(res, 429, { error: "请求过于频繁，请稍后再试。" });
  let payload;
  try { payload = await readJsonBody(req); validatePayload(payload); }
  catch (error) { return jsonResponse(res, 400, { error: error.message === "request_too_large" ? "请求内容过大。" : "请求参数无效。" }); }
  try {
    const text = await askQwen(payload);
    return jsonResponse(res, 200, { text, model: QWEN_MODEL });
  } catch (error) {
    console.error("Local Qwen request failed:", error.message);
    return jsonResponse(res, 502, { error: "本地 Qwen 暂时不可用，请检查模型服务和模型名称。" });
  }
}

function serveStatic(req, res) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname); } catch { return jsonResponse(res, 400, { error: "无效路径。" }); }
  const relativePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(ROOT, `.${relativePath}`);
  if (!(filePath === ROOT || filePath.startsWith(`${ROOT}${path.sep}`))) return jsonResponse(res, 403, { error: "禁止访问。" });
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) return jsonResponse(res, 404, { error: "未找到文件。" });
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": type, "Cache-Control": "no-cache" });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && new URL(req.url, "http://127.0.0.1").pathname === "/api/qwen") return void handleQwen(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") return jsonResponse(res, 405, { error: "不支持的请求方法。" });
  return serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`观象运行在 http://127.0.0.1:${PORT}`);
  console.log(`Qwen: ${QWEN_BASE_URL} · ${QWEN_MODEL}`);
});
