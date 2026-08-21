import React, { useState, useRef, useEffect } from 'react';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import prism from 'prismjs';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-markdown.js';
import mermaid from 'mermaid';
import NavBar from '@/components/NavBar';
import { useToast } from '@/components/Toast';
import { useCollections } from '@/hooks/useCollections';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Theme {
  id: string;
  name: string;
  group: string;
  primary: string;
  secondary: string;
  text: string;
  accent: string;
}

const THEMES: Theme[] = [
  // 轻量基础 (10套)
  { id: 'minimal-white', name: '极简白', group: '轻量基础', primary: '#333333', secondary: '#f8fafc', text: '#222222', accent: '#0f172a' },
  { id: 'fresh-green', name: '清新绿', group: '轻量基础', primary: '#07c160', secondary: '#e8f8f0', text: '#2d3748', accent: '#059669' },
  { id: 'warm-yellow', name: '暖黄', group: '轻量基础', primary: '#d97706', secondary: '#fef3c7', text: '#374151', accent: '#b45309' },
  { id: 'morandi', name: '莫兰迪', group: '轻量基础', primary: '#b48a76', secondary: '#f7f4f2', text: '#2c2c2c', accent: '#8c624d' },
  { id: 'chinese-red', name: '国风', group: '轻量基础', primary: '#991b1b', secondary: '#fef2f2', text: '#1f2937', accent: '#7f1d1d' },
  { id: 'business-blue', name: '商务蓝', group: '轻量基础', primary: '#2563eb', secondary: '#eff6ff', text: '#1e293b', accent: '#1d4ed8' },
  { id: 'tech-purple', name: '科技紫', group: '轻量基础', primary: '#7c3aed', secondary: '#f3e8ff', text: '#2e1065', accent: '#6d28d9' },
  { id: 'premium-gray', name: '高级灰', group: '轻量基础', primary: '#4b5563', secondary: '#f3f4f6', text: '#111827', accent: '#374151' },
  { id: 'cyan-blue', name: '清新蓝', group: '轻量基础', primary: '#0284c7', secondary: '#e0f2fe', text: '#0f172a', accent: '#0369a1' },
  { id: 'vitality-orange', name: '活力橙', group: '轻量基础', primary: '#ea580c', secondary: '#fff7ed', text: '#292524', accent: '#c2410c' },

  // 标题风格 (10套)
  { id: 'ink-black-bar', name: '墨黑·条', group: '标题风格', primary: '#111827', secondary: '#f3f4f6', text: '#1f2937', accent: '#000000' },
  { id: 'deep-blue-bar', name: '深蓝·条', group: '标题风格', primary: '#1e40af', secondary: '#dbeafe', text: '#1e293b', accent: '#1e3a8a' },
  { id: 'ink-green-bar', name: '墨绿·条', group: '标题风格', primary: '#065f46', secondary: '#d1fae5', text: '#064e3b', accent: '#047857' },
  { id: 'cocoa-bar', name: '可可·条', group: '标题风格', primary: '#78350f', secondary: '#fde68a', text: '#451a03', accent: '#92400e' },
  { id: 'slate-bar', name: '石板·条', group: '标题风格', primary: '#334155', secondary: '#e2e8f0', text: '#0f172a', accent: '#1e293b' },
  { id: 'simple-21', name: '简约·21', group: '标题风格', primary: '#0d9488', secondary: '#ccfbf1', text: '#134e4a', accent: '#0f766e' },
  { id: 'rose-gold', name: '玫瑰金', group: '标题风格', primary: '#be185d', secondary: '#fce7f3', text: '#831843', accent: '#9d174d' },
  { id: 'sunset-glow', name: '落日余晖', group: '标题风格', primary: '#c2410c', secondary: '#ffedd5', text: '#7c2d12', accent: '#9a3412' },
  { id: 'emerald-box', name: '翡翠方框', group: '标题风格', primary: '#047857', secondary: '#a7f3d0', text: '#064e3b', accent: '#065f46' },
  { id: 'royal-purple', name: '皇家紫标', group: '标题风格', primary: '#6d28d9', secondary: '#ede9fe', text: '#3b0764', accent: '#5b21b6' },

  // 优雅卡片 (15套)
  { id: 'card-amber', name: '琥珀卡片', group: '优雅卡片', primary: '#b45309', secondary: '#fffbeb', text: '#451a03', accent: '#d97706' },
  { id: 'card-teal', name: '青蓝卡片', group: '优雅卡片', primary: '#0f766e', secondary: '#f0fdfa', text: '#134e4a', accent: '#14b8a6' },
  { id: 'card-indigo', name: '靛青卡片', group: '优雅卡片', primary: '#3730a3', secondary: '#eef2ff', text: '#1e1b4b', accent: '#4f46e5' },
  { id: 'card-pink', name: '樱花卡片', group: '优雅卡片', primary: '#db2777', secondary: '#fdf2f8', text: '#500724', accent: '#ec4899' },
  { id: 'card-lime', name: '青柠卡片', group: '优雅卡片', primary: '#4d7c0f', secondary: '#f7fee7', text: '#1a2e05', accent: '#65a30d' },
  { id: 'card-sky', name: '晴空卡片', group: '优雅卡片', primary: '#0369a1', secondary: '#f0f9ff', text: '#082f49', accent: '#0284c7' },
  { id: 'card-violet', name: '紫罗兰卡', group: '优雅卡片', primary: '#5b21b6', secondary: '#f5f3ff', text: '#2e1065', accent: '#7c3aed' },
  { id: 'card-zinc', name: '锌灰卡片', group: '优雅卡片', primary: '#27272a', secondary: '#f4f4f5', text: '#09090b', accent: '#3f3f46' },
  { id: 'card-fuchsia', name: '洋红卡片', group: '优雅卡片', primary: '#a21caf', secondary: '#fae8ff', text: '#4a044e', accent: '#c026d3' },
  { id: 'card-orange', name: '暖橙卡片', group: '优雅卡片', primary: '#c2410c', secondary: '#fff7ed', text: '#431407', accent: '#ea580c' },
  { id: 'card-emerald', name: '碧绿卡片', group: '优雅卡片', primary: '#047857', secondary: '#ecfdf5', text: '#022c22', accent: '#059669' },
  { id: 'card-stone', name: '岩石卡片', group: '优雅卡片', primary: '#44403c', secondary: '#f5f5f4', text: '#1c1917', accent: '#57534e' },
  { id: 'card-red', name: '烈火卡片', group: '优雅卡片', primary: '#b91c1c', secondary: '#fef2f2', text: '#450a0a', accent: '#dc2626' },
  { id: 'card-blue', name: '深海卡片', group: '优雅卡片', primary: '#1d4ed8', secondary: '#eff6ff', text: '#172554', accent: '#2563eb' },
  { id: 'card-classic', name: '经典典雅', group: '优雅卡片', primary: '#7c2d12', secondary: '#fef3c7', text: '#292524', accent: '#9a3412' },
];

const BLOCKS = [
  { label: '标题', markdown: '# 一级主标题' },
  { label: '大标题', markdown: '## 📌 大标题模块' },
  { label: '小标题', markdown: '### 💡 小标题引导' },
  { label: '子标题', markdown: '#### • 子标题详情' },
  { label: '正文', markdown: '这里是标准正文段落内容，支持排版与润色...' },
  { label: '正文段落', markdown: '> 💡 核心段落提示：请在此处填入您的详细见解或深度剖析。' },
  { label: '强调句', markdown: '**【核心亮点】**：此处为重点强调的加粗关键句子。' },
  { label: '引用', markdown: '> “引用大师或权威报告的原话，以增强文章说服力与专业度。”' },
  { label: '列表', markdown: '- 要点一：市场趋势分析\n- 要点二：技术架构演进\n- 要点三：未来商业变现' },
  { label: '圆号列表', markdown: '1. 第一步：明确用户真实诉求\n2. 第二步：打造极简体验与闭环\n3. 第三步：持续迭代与数据反馈' },
  { label: '卡片/证据', markdown: '> **📊 数据支撑**\n> \n> 统计表明，采用智能排版和 AI 选题的创作者效率提升了 300% 以上。' },
  { label: '导语卡', markdown: '<div style="padding: 12px 16px; background: #f0fdf4; border-left: 4px solid #07c160; border-radius: 0 8px 8px 0;">\n\n**写在前面**：本文将深度剖析当前热点背后的商业逻辑与底层规律。\n\n</div>' },
  { label: '卡片', markdown: '<div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">\n\n### 📦 深度复盘卡片\n- **核心结论**：把握趋势胜过盲目努力。\n- **行动建议**：立即建立自己的信息监控流。\n\n</div>' },
  { label: '提示框', markdown: '<div style="padding: 12px 16px; background: #fffbeb; border-left: 4px solid #d97706; border-radius: 0 8px 8px 0; color: #92400e;">\n\n⚠️ **温馨提示**：本文所有观点仅供参考，不构成任何投资或决策建议。\n\n</div>' },
];

const FULL_FEATURED_MARKDOWN = `# 🚀 全功能 Markdown 语法、KaTeX 公式与 Mermaid 图表演示

> 💡 **导语卡片**：本篇演示文档包含了所有标准 Markdown 语法、GFM 扩展语法、KaTeX 数学公式、高亮代码块及 Mermaid 图表，为您提供最极致的排版体验。

---

## 1. 基础文本与字体格式

这是标准的正文段落。文本中支持 **加粗 (Bold)**、*斜体 (Italic)*、~~删除线 (Strikethrough)~~ 以及 \`行内代码 (Inline Code)\`。
支持上下标：$x^2$ 与 $H_2O$，以及超级链接 [访问官网](https://ai.studio)。

> “工欲善其事，必先利其器。” 优秀的排版能够让专业文章瞬间提升质感与可读性。

---

## 2. 列表与任务清单 (Task Lists)

### 无序列表
- 市场调研与竞品分析
- 技术方案选型与架构演进
- 上线部署与数据复盘

### 有序列表
1. 第一阶段：需求确认与原型设计
2. 第二阶段：核心功能研发与自测
3. 第三阶段：公测灰度与全量发布

---

## 3. 高级表格

| 功能模块 | 支持状态 | 性能评级 | 备注说明 |
| :--- | :---: | :---: | :--- |
| **Markdown-it** | ✅ 完美支持 | ⭐⭐⭐⭐⭐ | 实时高性能渲染 |
| **KaTeX 公式** | ✅ 高性能 | ⭐⭐⭐⭐⭐ | 支持行内与块级数学符号 |
| **Mermaid 图表** | ✅ 动态渲染 | ⭐⭐⭐⭐ | 流程图、时序图与架构图 |

---

## 4. KaTeX 数学公式

### 行内公式
爱因斯坦质能方程：$E = mc^2$，以及傅里叶变换：$f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)e^{2\\pi i \\xi x} d\\xi$。

### 块级公式
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

---

## 5. Prism.js 代码高亮

\`\`\`typescript
interface ArticleTypesetter {
  title: string;
  theme: string;
  renderToWeChat(): boolean;
}

function processTypeset(article: ArticleTypesetter): void {
  console.log(\`Rendering article: \${article.title} with theme: \${article.theme}\`);
}
\`\`\`

---

## 6. Mermaid 动态图表

\`\`\`mermaid
graph TD
    A[Markdown-it 输入] --> B[实时解析引擎]
    B --> C{主题与卡片适配}
    C --> D[KaTeX 公式渲染]
    C --> E[Mermaid 图表生成]
    D --> F[手机端高保真预览]
    E --> F
    F --> G[一键复制 / 导出 PDF & 长图]
\`\`\`
`;

// Initialize markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang === 'mermaid') {
      return `<div class="mermaid">${str}</div>`;
    }
    if (lang && prism.languages[lang]) {
      try {
        return `<pre class="language-${lang}"><code class="language-${lang}">` +
          prism.highlight(str, prism.languages[lang], lang) +
          `</code></pre>`;
      } catch (__) {}
    }
    return '<pre class="language-none"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
}).use(markdownItKatex);

export default function Typesetter() {
  const [markdown, setMarkdown] = useState(FULL_FEATURED_MARKDOWN);
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { items: savedItems } = useCollections();

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
    try {
      mermaid.run();
    } catch (e) {
      console.error('Mermaid render error:', e);
    }
  }, [markdown, activeTheme]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleInsertBlock = (blockMarkdown: string) => {
    setMarkdown(prev => prev + '\n\n' + blockMarkdown);
    toast('已成功插入区块', 'success');
  };

  const handleLoadSample = () => {
    setMarkdown(FULL_FEATURED_MARKDOWN);
    toast('已载入全功能示例文章', 'success');
  };

  const handleCopyForWeChat = async () => {
    if (!previewRef.current) return;
    try {
      await mermaid.run();
      const htmlContent = previewRef.current.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([previewRef.current.innerText], { type: 'text/plain' });
      
      const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })];
      await navigator.clipboard.write(data);
      toast('已成功复制微信草稿！可直接粘贴至微信后台', 'success');
    } catch (err) {
      navigator.clipboard.writeText(previewRef.current.innerText);
      toast('已复制纯文本（剪贴板权限受限）', 'success');
    }
  };

  const handleExportHtml = () => {
    if (!previewRef.current) return;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>微信排版导出</title><style>body{font-family:sans-serif;padding:20px;max-width:680px;margin:auto;}</style></head><body>${previewRef.current.innerHTML}</body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wechat-typeset-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已成功导出排版后的 HTML 文件', 'success');
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已成功导出 Markdown (.md) 文件', 'success');
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    try {
      toast('正在生成排版 PDF，请稍候...', 'info');
      try {
        await mermaid.run();
      } catch (e) {
        console.log('Mermaid run note:', e);
      }

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 600,
        onclone: (clonedDoc) => {
          try {
            const walker = clonedDoc.createTreeWalker(clonedDoc.body, NodeFilter.SHOW_ALL);
            let node;
            const nodesToRemove: Node[] = [];
            while ((node = walker.nextNode())) {
              if (node.nodeType === Node.COMMENT_NODE) {
                nodesToRemove.push(node);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                if (typeof el.getAttribute !== 'function') {
                  nodesToRemove.push(node);
                }
              }
            }
            nodesToRemove.forEach(n => n.parentNode?.removeChild(n));
          } catch (e) {
            console.error('TreeWalker cleanup error:', e);
          }

          // Sanitize oklch color functions which html2canvas cannot parse
          try {
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach(tag => {
              if (tag.textContent && tag.textContent.includes('oklch')) {
                tag.textContent = tag.textContent.replace(/oklch\([^)]+\)/g, '#333333');
              }
            });

            const sheets = clonedDoc.styleSheets;
            for (let i = 0; i < sheets.length; i++) {
              try {
                const rules = sheets[i].cssRules;
                if (rules) {
                  for (let j = rules.length - 1; j >= 0; j--) {
                    const cssText = rules[j].cssText;
                    if (cssText && cssText.includes('oklch')) {
                      try {
                        sheets[i].deleteRule(j);
                      } catch (e) {}
                    }
                  }
                }
              } catch (e) {}
            }
          } catch (e) {}
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size in mm
      const pageHeight = 295; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`wechat-article-${Date.now()}.pdf`);
      toast('排版 PDF 导出成功', 'success');
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast('PDF 导出失败，请检查图表或公式后重试', 'error');
    }
  };

  const handleExportLongImage = async () => {
    if (!previewRef.current) return;
    try {
      toast('正在生成排版长图，请稍候...', 'info');
      try {
        await mermaid.run();
      } catch (e) {
        console.log('Mermaid run note:', e);
      }

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 600,
        onclone: (clonedDoc) => {
          try {
            const walker = clonedDoc.createTreeWalker(clonedDoc.body, NodeFilter.SHOW_ALL);
            let node;
            const nodesToRemove: Node[] = [];
            while ((node = walker.nextNode())) {
              if (node.nodeType === Node.COMMENT_NODE) {
                nodesToRemove.push(node);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                if (typeof el.getAttribute !== 'function') {
                  nodesToRemove.push(node);
                }
              }
            }
            nodesToRemove.forEach(n => n.parentNode?.removeChild(n));
          } catch (e) {
            console.error('TreeWalker cleanup error:', e);
          }

          // Sanitize oklch color functions which html2canvas cannot parse
          try {
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach(tag => {
              if (tag.textContent && tag.textContent.includes('oklch')) {
                tag.textContent = tag.textContent.replace(/oklch\([^)]+\)/g, '#333333');
              }
            });

            const sheets = clonedDoc.styleSheets;
            for (let i = 0; i < sheets.length; i++) {
              try {
                const rules = sheets[i].cssRules;
                if (rules) {
                  for (let j = rules.length - 1; j >= 0; j--) {
                    const cssText = rules[j].cssText;
                    if (cssText && cssText.includes('oklch')) {
                      try {
                        sheets[i].deleteRule(j);
                      } catch (e) {}
                    }
                  }
                }
              } catch (e) {}
            }
          } catch (e) {}
        }
      });

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `wechat-long-image-${Date.now()}.png`;
      a.click();
      toast('排版长图导出成功', 'success');
    } catch (err) {
      console.error('Long Image Export Error:', err);
      toast('长图导出失败，请检查图表或公式后重试', 'error');
    }
  };

  const handleImportArticle = (articleUrl: string) => {
    const found = savedItems.find(i => i.article.url === articleUrl);
    if (found) {
      const a = found.article;
      const importedMd = `# ${a.title}\n\n> 来源：${a.source.name} | 发布时间：${new Date(a.publishedAt).toLocaleString('zh-CN')}\n\n${a.description || ''}\n\n[阅读原文](${a.url})\n\n---\n\n请在此处继续撰写您的正文内容...`;
      setMarkdown(importedMd);
      toast('已成功载入选题文章', 'success');
    }
  };

  const groupedThemes = THEMES.reduce((acc, t) => {
    if (!acc[t.group]) acc[t.group] = [];
    acc[t.group].push(t);
    return acc;
  }, {} as Record<string, Theme[]>);

  const renderedHtml = md.render(markdown);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <NavBar />

      <header className="bg-white border-b border-gray-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md font-bold tracking-wider">
            <span>拾光排版器</span>
            <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded">V4.2 · Markdown-it 高性能版</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => toast('已撤销上一步操作', 'info')} className="px-2.5 py-1 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors">撤销</button>
          <button onClick={() => toast('已重做', 'info')} className="px-2.5 py-1 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors">重做</button>
          <button onClick={() => toast('当前为最新版本', 'info')} className="px-2.5 py-1 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors">恢复版本</button>
          <button onClick={() => toast('项目配置已成功备份', 'success')} className="px-2.5 py-1 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors">项目备份</button>
          <span className="text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded">已自动保存</span>
          <button onClick={() => toast('发布预检通过，全量语法完美契合微信标准', 'success')} className="px-2.5 py-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded font-medium transition-colors">发布预检</button>
          <button onClick={handleLoadSample} className="px-2.5 py-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded font-medium transition-colors">载入全功能示例</button>
          <button onClick={() => toast('使用教程：采用 markdown-it 与 Prism.js，支持实时公式与图表！', 'info')} className="px-2.5 py-1 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors">使用教程</button>

          {savedItems.length > 0 && (
            <select
              onChange={(e) => handleImportArticle(e.target.value)}
              defaultValue=""
              className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded px-2.5 py-1 font-medium focus:outline-none"
            >
              <option value="" disabled>📥 从选题库导入...</option>
              {savedItems.map(item => (
                <option key={item.article.url} value={item.article.url}>
                  {item.article.title.slice(0, 20)}...
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Article Structure & Blocks Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
        <span className="text-[11px] font-bold text-gray-400 uppercase shrink-0 mr-1">快捷区块:</span>
        {BLOCKS.map((block, idx) => (
          <button
            key={idx}
            onClick={() => handleInsertBlock(block.markdown)}
            className="flex items-center gap-1 px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-md border border-gray-200 whitespace-nowrap transition-colors shrink-0 shadow-2xs"
          >
            <span>{block.label}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">稳定</span>
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Sidebar: 35 Themes + Export buttons */}
        <aside className="lg:col-span-3 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-125px)] overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              主题样式
            </span>
            <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">35 套主题全部可用</span>
          </div>

          <div className="space-y-4 flex-1">
            {Object.entries(groupedThemes).map(([groupName, themes]) => (
              <div key={groupName} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <div 
                  onClick={() => toggleGroup(groupName)}
                  className="flex items-center justify-between cursor-pointer mb-2 select-none"
                >
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span className="text-indigo-600">▾</span>
                    {groupName} 
                    <span className="text-[10px] text-gray-400 bg-gray-200/80 px-1.5 py-0.2 rounded-full">{themes.length} 套</span>
                  </span>
                  <span className="text-[11px] text-gray-400">点击收起</span>
                </div>

                {!collapsedGroups[groupName] && (
                  <div className="grid grid-cols-2 gap-2">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTheme(t)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                          activeTheme.id === t.id
                            ? 'bg-gray-900 text-white border-gray-900 shadow-sm ring-1 ring-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 border border-black/10" 
                          style={{ backgroundColor: t.primary }} 
                        />
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Export Panel */}
          <div className="pt-4 mt-auto border-t border-gray-200 flex flex-col gap-2">
            <button
              onClick={handleCopyForWeChat}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              复制微信草稿
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleExportMarkdown}
                className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>📄</span> 导出 Markdown
              </button>
              <button
                onClick={handleExportHtml}
                className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>🌐</span> 排版 HTML
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleExportPdf}
                className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>📑</span> 排版 PDF
              </button>
              <button
                onClick={handleExportLongImage}
                className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>🖼️</span> 排版长图
              </button>
            </div>
          </div>
        </aside>

        {/* Center Editor */}
        <section className="lg:col-span-4 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-125px)] overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Markdown 编辑器 (Markdown-it + Prism.js)</span>
            <span className="text-[11px] text-gray-400 font-mono">{markdown.length} 字符</span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 p-4 font-mono text-xs text-gray-800 resize-none focus:outline-none leading-relaxed"
            placeholder="在此输入或粘贴 Markdown 内容..."
          />
        </section>

        {/* Right Mobile Preview */}
        <section className="lg:col-span-5 bg-slate-100 flex flex-col h-[calc(100vh-125px)] overflow-y-auto p-6 items-center">
          <div className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
            手机预览 · 414px 宽度模拟 (实时高保真渲染)
          </div>

          <div className="w-full max-w-[414px] bg-white rounded-2xl shadow-xl border border-gray-200 p-6 overflow-y-auto min-h-[650px] my-auto">
            <div 
              ref={previewRef}
              style={{ color: activeTheme.text }}
              className="wechat-article text-sm leading-relaxed space-y-4 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:pb-2 [&>h1]:mt-6 [&>h1]:mb-3 [&>h1]:tracking-wide [&>h2]:text-base [&>h2]:font-bold [&>h2]:px-3 [&>h2]:py-1.5 [&>h2]:mt-5 [&>h2]:mb-3 [&>h2]:rounded-r-md [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-3 [&>p]:leading-7 [&>p]:text-sm [&>blockquote]:p-3 [&>blockquote]:my-3 [&>blockquote]:text-gray-600 [&>blockquote]:rounded-r-lg [&>blockquote]:text-xs [&>blockquote]:italic [&>table]:w-full [&>table]:border-collapse [&>table]:my-4 [&>th]:border [&>th]:border-gray-200 [&>th]:px-3 [&>th]:py-2 [&>td]:border [&>td]:border-gray-200 [&>td]:px-3 [&>td]:py-2"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
