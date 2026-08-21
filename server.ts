import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const NEWS_API_BASE = 'https://newsapi.org/v2';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for NewsAPI
  const fetchNews = async (endpoint: string, params: Record<string, string>) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) throw new Error("NEWS_API_KEY is not configured");
    
    const searchParams = new URLSearchParams({ ...params, apiKey });
    const url = `${NEWS_API_BASE}${endpoint}?${searchParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'NewsAPI error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  };

  // API Routes
  app.get("/api/search", async (req, res) => {
    try {
      const { q, time, sortBy } = req.query;
      
      const getTimeRange = (time: string) => {
        const now = new Date();
        switch (time) {
          case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          case '3d': return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
          case '1w': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      };

      const data = await fetchNews('/everything', {
        q: String(q),
        from: getTimeRange(String(time)),
        sortBy: String(sortBy || 'publishedAt'),
        language: 'zh',
        pageSize: '30'
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trending", async (req, res) => {
    try {
      if (!process.env.NEWS_API_KEY) {
        return res.json({ needsConfig: true });
      }
      const data = await fetchNews('/top-headlines', {
        language: 'zh',
        pageSize: '30',
        category: 'technology'
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/summarize", async (req, res) => {
    try {
      const { title, content, provider: requestedProvider } = req.body;
      
      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const openaiBase = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const openaiModel = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

      const prompt = `你是一个为内容创作者服务的新闻分析助手。根据提供的新闻内容生成三部分内容，直接输出 JSON 格式（不要包含 markdown 代码块）：
{
  "summary": "300字以内核心事实摘要",
  "hotAnalysis": "舆论爆点分析",
  "postSuggestions": ["切入点1", "切入点2", "切入点3"]
}

要求：
- summary：简洁有力，概括事件核心要素（5W1H）
- hotAnalysis：分析新闻中的冲突点、情绪点、利益相关方、社会共鸣点
- postSuggestions：给出3个针对内容创作者的独特发帖视角

标题：${title}
正文：${content.slice(0, 5000)}`;

      // 1. Try Gemini if configured and requested (or as default)
      if (geminiKey && (!requestedProvider || requestedProvider === 'gemini')) {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return res.json(JSON.parse(text.replace(/```json|```/g, '')));
      }

      // 2. Try OpenAI-compatible API if configured
      if (openaiKey) {
        const response = await fetch(`${openaiBase}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices[0].message.content;
          return res.json(JSON.parse(text.replace(/```json|```/g, '')));
        }
      }

      throw new Error("没有配置有效的 AI 密钥或请求的服务不可用");
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/semantic-search", async (req, res) => {
    try {
      const { q } = req.query;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `分析用户的自然语言查询，提取出适合新闻搜索的关键词、时间范围和排序方式。
直接输出 JSON 格式（不要包含 markdown 代码块）：
{
  "keywords": ["关键词1", "关键词2"],
  "timeFilter": "24h | 3d | 1w | all",
  "sortBy": "relevancy | popularity | publishedAt"
}

规则：
- keywords: 提取1-3个核心搜索词，中文
- timeFilter: 提到"最新"或"今天"用24h，"最近"或"近几天"用3d，"近一周"用1w，否则默认1w
- sortBy: 关注热度用popularity，关注最新用publishedAt，默认relevancy

查询：${q}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text.replace(/```json|```/g, ''));
      
      const data = await fetchNews('/everything', {
        q: parsed.keywords.join(' '),
        from: (time => {
          const now = new Date();
          switch (time) {
            case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            case '3d': return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
            case '1w': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          }
        })(parsed.timeFilter),
        sortBy: parsed.sortBy,
        language: 'zh',
        pageSize: '30'
      });
      
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { title, description } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `你是一个翻译助手。将英文新闻标题和摘要翻译成流畅的中文。
直接输出 JSON 格式（不要包含 markdown 代码块）：
{
  "title": "翻译后的标题",
  "description": "翻译后的摘要"
}

要求：
- 翻译准确、自然、符合中文阅读习惯
- 专有名词保留英文，括号内加中文译名
- 标题翻译简洁有力，摘要翻译完整传达原意

标题：${title}
摘要：${description || '(无摘要)'}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      res.json(JSON.parse(text.replace(/```json|```/g, '')));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/hotlist", async (req, res) => {
    try {
      const { type } = req.query;
      const response = await fetch(`https://api.vvhan.com/api/hotlist?type=${type || 'weibo'}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/extract", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) throw new Error("Missing url");

      const response = await fetch(`https://r.jina.ai/${encodeURI(String(url))}`, {
        headers: { 'Accept': 'text/plain' }
      });
      if (!response.ok) throw new Error("Extraction failed");
      const text = await response.text();
      res.json({ status: 'completed', text: text.slice(0, 5000) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
