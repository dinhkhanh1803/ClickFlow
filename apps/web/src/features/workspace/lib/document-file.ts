import mammoth from 'mammoth/mammoth.browser';
import { AlignmentType, Document, HeadingLevel, LevelFormat, Packer, Paragraph, TextRun } from 'docx';

const allowedTags = new Set(['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'b', 'em', 'i', 'u', 'a', 'br', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td']);

type TextStyle = {
  bold?: boolean;
  italics?: boolean;
  underline?: Record<string, never>;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function safeUrl(value: string) {
  return /^(https?:|mailto:|#|data:image\/)/i.test(value) ? value : '';
}

function sanitizeNode(node: ChildNode): string {
  if (node.nodeType === 3) return escapeHtml(node.textContent ?? '');
  if (node.nodeType !== 1) return '';

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map(sanitizeNode).join('');
  if (!allowedTags.has(tag)) return children;
  if (tag === 'br') return '<br>';
  if (tag === 'img') {
    const src = safeUrl(element.getAttribute('src') ?? '');
    const alt = escapeHtml(element.getAttribute('alt') ?? '');
    return src ? `<img src="${escapeHtml(src)}" alt="${alt}">` : '';
  }
  if (tag === 'a') {
    const href = safeUrl(element.getAttribute('href') ?? '');
    return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${children}</a>` : children;
  }
  const normalizedTag = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag;
  return `<${normalizedTag}>${children}</${normalizedTag}>`;
}

export function sanitizeDocumentHtml(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.body.childNodes).map(sanitizeNode).join('');
}

export async function importDocx(file: File) {
  if (!file.name.toLowerCase().endsWith('.docx')) throw new Error('Please choose a .docx file.');
  const result = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
      ],
    },
  );
  return sanitizeDocumentHtml(result.value);
}

function textRuns(node: ChildNode, style: TextStyle = {}): TextRun[] {
  if (node.nodeType === 3) return node.textContent ? [new TextRun({ text: node.textContent, ...style })] : [];
  if (node.nodeType !== 1) return [];

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag === 'br') return [new TextRun({ break: 1, ...style })];
  const nextStyle: TextStyle = {
    ...style,
    ...(tag === 'strong' || tag === 'b' ? { bold: true } : {}),
    ...(tag === 'em' || tag === 'i' ? { italics: true } : {}),
    ...(tag === 'u' ? { underline: {} } : {}),
  };
  return Array.from(element.childNodes).flatMap((child) => textRuns(child, nextStyle));
}

function paragraphFromElement(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  const children = textRuns(element);
  if (tag === 'h1') return new Paragraph({ children, heading: HeadingLevel.HEADING_1 });
  if (tag === 'h2') return new Paragraph({ children, heading: HeadingLevel.HEADING_2 });
  if (tag === 'h3') return new Paragraph({ children, heading: HeadingLevel.HEADING_3 });
  if (tag === 'blockquote') return new Paragraph({ children, indent: { left: 720 }, border: { left: { color: '818CF8', space: 8, style: 'single', size: 12 } } });
  if (tag === 'pre' || tag === 'code') return new Paragraph({ children: textRuns(element, { italics: false }), shading: { fill: 'F1F5F9' } });
  return new Paragraph({ children });
}

function paragraphsFromElement(element: HTMLElement): Paragraph[] {
  const tag = element.tagName.toLowerCase();
  if (tag === 'ul' || tag === 'ol') {
    return Array.from(element.children)
      .filter((child) => child.tagName.toLowerCase() === 'li')
      .map((child) => new Paragraph({
        children: textRuns(child),
        ...(tag === 'ul' ? { bullet: { level: 0 } } : { numbering: { reference: 'clickflow-numbered-list', level: 0 } }),
      }));
  }
  if (tag === 'img') return [];
  return [paragraphFromElement(element)];
}

export async function exportDocx(title: string, html: string) {
  const parsed = new DOMParser().parseFromString(sanitizeDocumentHtml(html), 'text/html');
  const bodyParagraphs = Array.from(parsed.body.children).flatMap((element) => paragraphsFromElement(element as HTMLElement));
  const document = new Document({
    numbering: {
      config: [{
        reference: 'clickflow-numbered-list',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START }],
      }],
    },
    sections: [{ children: [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), ...bodyParagraphs] }],
  });
  return Packer.toBlob(document);
}