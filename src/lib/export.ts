import type { NewsArticle } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink } from 'docx';
import { jsPDF } from 'jspdf';

function articleToMarkdown(a: NewsArticle, index: number): string {
  const date = new Date(a.publishedAt).toLocaleString('zh-CN');
  return [
    `## ${index + 1}. ${a.title}`,
    `> ${a.source.name} · ${date}`,
    '',
    a.description || '',
    '',
    a.urlToImage ? `![图片](${a.urlToImage})` : '',
    '',
    `[阅读原文](${a.url})`,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function exportMarkdown(articles: NewsArticle[], query: string): string {
  const header = [
    `# 搜索结果: "${query}"`,
    `导出时间: ${new Date().toLocaleString('zh-CN')}`,
    `共 ${articles.length} 条结果`,
    '',
    '---',
    '',
  ].join('\n');

  const body = articles.map((a, i) => articleToMarkdown(a, i)).join('\n');
  return header + body;
}

export async function exportDocx(articles: NewsArticle[], query: string): Promise<Blob> {
  const sections = articles.flatMap((a, i) => [
    new Paragraph({
      text: `${i + 1}. ${a.title}`,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${a.source.name} · ${new Date(a.publishedAt).toLocaleString('zh-CN')}`, italics: true, color: '666666' }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: a.description || '',
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new ExternalHyperlink({
          children: [new TextRun({ text: '阅读原文', color: '0000FF', underline: {} })],
          link: a.url,
        }),
      ],
      spacing: { after: 400 },
    }),
  ]);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `搜索结果: ${query}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 },
        }),
        ...sections,
      ],
    }],
  });

  return await Packer.toBlob(doc);
}

export function exportPDF(articles: NewsArticle[], query: string) {
  const doc = new jsPDF();
  let y = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(`NewsFinder: ${query}`, margin, y);
  y += 15;

  articles.forEach((a, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    const titleLines = doc.splitTextToSize(`${i + 1}. ${a.title}`, pageWidth - margin * 2);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 7;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${a.source.name} | ${new Date(a.publishedAt).toLocaleDateString()}`, margin, y);
    y += 10;

    doc.setTextColor(0);
    const descLines = doc.splitTextToSize(a.description || '', pageWidth - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 10;
  });

  return doc.output('blob');
}

export function exportJSON(articles: NewsArticle[], query: string): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      query,
      totalResults: articles.length,
      articles,
    },
    null,
    2
  );
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportCSV(articles: NewsArticle[]): string {
  const header = ['标题', '来源', '作者', '发布时间', '摘要', '链接', '图片'];
  const rows = articles.map((a) =>
    [
      escapeCSV(a.title),
      escapeCSV(a.source.name),
      escapeCSV(a.author || ''),
      a.publishedAt,
      escapeCSV(a.description || ''),
      a.url,
      a.urlToImage || '',
    ].join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
