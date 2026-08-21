var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_generative_ai = require("@google/generative-ai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var NEWS_API_BASE = "https://newsapi.org/v2";
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const fetchNews = async (endpoint, params) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) throw new Error("NEWS_API_KEY is not configured");
    const searchParams = new URLSearchParams({ ...params, apiKey });
    const url = `${NEWS_API_BASE}${endpoint}?${searchParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "NewsAPI error" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  };
  app.get("/api/search", async (req, res) => {
    try {
      const { q, time, sortBy } = req.query;
      const getTimeRange = (time2) => {
        const now = /* @__PURE__ */ new Date();
        switch (time2) {
          case "24h":
            return new Date(now.getTime() - 24 * 60 * 60 * 1e3).toISOString();
          case "3d":
            return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1e3).toISOString();
          case "1w":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3).toISOString();
          default:
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString();
        }
      };
      const data = await fetchNews("/everything", {
        q: String(q),
        from: getTimeRange(String(time)),
        sortBy: String(sortBy || "publishedAt"),
        language: "zh",
        pageSize: "30"
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/trending", async (req, res) => {
    try {
      if (!process.env.NEWS_API_KEY) {
        return res.json({ needsConfig: true });
      }
      const data = await fetchNews("/top-headlines", {
        language: "zh",
        pageSize: "30",
        category: "technology"
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/summarize", async (req, res) => {
    try {
      const { title, content, provider: requestedProvider } = req.body;
      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const openaiBase = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
      const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
      const prompt = `\u4F60\u662F\u4E00\u4E2A\u4E3A\u5185\u5BB9\u521B\u4F5C\u8005\u670D\u52A1\u7684\u65B0\u95FB\u5206\u6790\u52A9\u624B\u3002\u6839\u636E\u63D0\u4F9B\u7684\u65B0\u95FB\u5185\u5BB9\u751F\u6210\u4E09\u90E8\u5206\u5185\u5BB9\uFF0C\u76F4\u63A5\u8F93\u51FA JSON \u683C\u5F0F\uFF08\u4E0D\u8981\u5305\u542B markdown \u4EE3\u7801\u5757\uFF09\uFF1A
{
  "summary": "300\u5B57\u4EE5\u5185\u6838\u5FC3\u4E8B\u5B9E\u6458\u8981",
  "hotAnalysis": "\u8206\u8BBA\u7206\u70B9\u5206\u6790",
  "postSuggestions": ["\u5207\u5165\u70B91", "\u5207\u5165\u70B92", "\u5207\u5165\u70B93"]
}

\u8981\u6C42\uFF1A
- summary\uFF1A\u7B80\u6D01\u6709\u529B\uFF0C\u6982\u62EC\u4E8B\u4EF6\u6838\u5FC3\u8981\u7D20\uFF085W1H\uFF09
- hotAnalysis\uFF1A\u5206\u6790\u65B0\u95FB\u4E2D\u7684\u51B2\u7A81\u70B9\u3001\u60C5\u7EEA\u70B9\u3001\u5229\u76CA\u76F8\u5173\u65B9\u3001\u793E\u4F1A\u5171\u9E23\u70B9
- postSuggestions\uFF1A\u7ED9\u51FA3\u4E2A\u9488\u5BF9\u5185\u5BB9\u521B\u4F5C\u8005\u7684\u72EC\u7279\u53D1\u5E16\u89C6\u89D2

\u6807\u9898\uFF1A${title}
\u6B63\u6587\uFF1A${content.slice(0, 5e3)}`;
      if (geminiKey && (!requestedProvider || requestedProvider === "gemini")) {
        const genAI = new import_generative_ai.GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return res.json(JSON.parse(text.replace(/```json|```/g, "")));
      }
      if (openaiKey) {
        const response = await fetch(`${openaiBase}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.choices[0].message.content;
          return res.json(JSON.parse(text.replace(/```json|```/g, "")));
        }
      }
      throw new Error("\u6CA1\u6709\u914D\u7F6E\u6709\u6548\u7684 AI \u5BC6\u94A5\u6216\u8BF7\u6C42\u7684\u670D\u52A1\u4E0D\u53EF\u7528");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/semantic-search", async (req, res) => {
    try {
      const { q } = req.query;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
      const genAI = new import_generative_ai.GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `\u5206\u6790\u7528\u6237\u7684\u81EA\u7136\u8BED\u8A00\u67E5\u8BE2\uFF0C\u63D0\u53D6\u51FA\u9002\u5408\u65B0\u95FB\u641C\u7D22\u7684\u5173\u952E\u8BCD\u3001\u65F6\u95F4\u8303\u56F4\u548C\u6392\u5E8F\u65B9\u5F0F\u3002
\u76F4\u63A5\u8F93\u51FA JSON \u683C\u5F0F\uFF08\u4E0D\u8981\u5305\u542B markdown \u4EE3\u7801\u5757\uFF09\uFF1A
{
  "keywords": ["\u5173\u952E\u8BCD1", "\u5173\u952E\u8BCD2"],
  "timeFilter": "24h | 3d | 1w | all",
  "sortBy": "relevancy | popularity | publishedAt"
}

\u89C4\u5219\uFF1A
- keywords: \u63D0\u53D61-3\u4E2A\u6838\u5FC3\u641C\u7D22\u8BCD\uFF0C\u4E2D\u6587
- timeFilter: \u63D0\u5230"\u6700\u65B0"\u6216"\u4ECA\u5929"\u752824h\uFF0C"\u6700\u8FD1"\u6216"\u8FD1\u51E0\u5929"\u75283d\uFF0C"\u8FD1\u4E00\u5468"\u75281w\uFF0C\u5426\u5219\u9ED8\u8BA41w
- sortBy: \u5173\u6CE8\u70ED\u5EA6\u7528popularity\uFF0C\u5173\u6CE8\u6700\u65B0\u7528publishedAt\uFF0C\u9ED8\u8BA4relevancy

\u67E5\u8BE2\uFF1A${q}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text.replace(/```json|```/g, ""));
      const data = await fetchNews("/everything", {
        q: parsed.keywords.join(" "),
        from: ((time) => {
          const now = /* @__PURE__ */ new Date();
          switch (time) {
            case "24h":
              return new Date(now.getTime() - 24 * 60 * 60 * 1e3).toISOString();
            case "3d":
              return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1e3).toISOString();
            case "1w":
              return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3).toISOString();
            default:
              return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString();
          }
        })(parsed.timeFilter),
        sortBy: parsed.sortBy,
        language: "zh",
        pageSize: "30"
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/translate", async (req, res) => {
    try {
      const { title, description } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
      const genAI = new import_generative_ai.GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `\u4F60\u662F\u4E00\u4E2A\u7FFB\u8BD1\u52A9\u624B\u3002\u5C06\u82F1\u6587\u65B0\u95FB\u6807\u9898\u548C\u6458\u8981\u7FFB\u8BD1\u6210\u6D41\u7545\u7684\u4E2D\u6587\u3002
\u76F4\u63A5\u8F93\u51FA JSON \u683C\u5F0F\uFF08\u4E0D\u8981\u5305\u542B markdown \u4EE3\u7801\u5757\uFF09\uFF1A
{
  "title": "\u7FFB\u8BD1\u540E\u7684\u6807\u9898",
  "description": "\u7FFB\u8BD1\u540E\u7684\u6458\u8981"
}

\u8981\u6C42\uFF1A
- \u7FFB\u8BD1\u51C6\u786E\u3001\u81EA\u7136\u3001\u7B26\u5408\u4E2D\u6587\u9605\u8BFB\u4E60\u60EF
- \u4E13\u6709\u540D\u8BCD\u4FDD\u7559\u82F1\u6587\uFF0C\u62EC\u53F7\u5185\u52A0\u4E2D\u6587\u8BD1\u540D
- \u6807\u9898\u7FFB\u8BD1\u7B80\u6D01\u6709\u529B\uFF0C\u6458\u8981\u7FFB\u8BD1\u5B8C\u6574\u4F20\u8FBE\u539F\u610F

\u6807\u9898\uFF1A${title}
\u6458\u8981\uFF1A${description || "(\u65E0\u6458\u8981)"}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      res.json(JSON.parse(text.replace(/```json|```/g, "")));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/hotlist", async (req, res) => {
    try {
      const { type } = req.query;
      const response = await fetch(`https://api.vvhan.com/api/hotlist?type=${type || "weibo"}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/extract", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) throw new Error("Missing url");
      const response = await fetch(`https://r.jina.ai/${encodeURI(String(url))}`, {
        headers: { "Accept": "text/plain" }
      });
      if (!response.ok) throw new Error("Extraction failed");
      const text = await response.text();
      res.json({ status: "completed", text: text.slice(0, 5e3) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
