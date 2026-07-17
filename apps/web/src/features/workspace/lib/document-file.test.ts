import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';
import { describe, expect, it } from 'vitest';
import { exportDocx, importDocx, sanitizeDocumentHtml } from './document-file';

describe('document Word file helpers', () => {
  it('keeps supported rich document blocks and strips executable markup', () => {
    const result = sanitizeDocumentHtml('<h1>Brief</h1><p><strong>Bold</strong> text<script>alert(1)</script></p><ul><li>One</li></ul>');

    expect(result).toContain('<h1>Brief</h1>');
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<ul><li>One</li></ul>');
    expect(result).not.toContain('script');
  });

  it('imports a Word heading and paragraph as rich HTML', async () => {
    const source = new Document({
      sections: [{ children: [new Paragraph({ text: 'Launch brief', heading: HeadingLevel.HEADING_1 }), new Paragraph('Ready for review.')] }],
    });
    const blob = await Packer.toBlob(source);
    const file = new File([blob], 'brief.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const imported = await importDocx(file);

    expect(imported).toContain('<h1>Launch brief</h1>');
    expect(imported).toContain('<p>Ready for review.</p>');
  });
  it('imports Word tables as semantic HTML tables', async () => {
    const source = new Document({
      sections: [{ children: [new Table({ rows: [
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Milestone')] }), new TableCell({ children: [new Paragraph('Owner')] })] }),
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Prototype')] }), new TableCell({ children: [new Paragraph('Khanh')] })] }),
      ] })] }],
    });
    const blob = await Packer.toBlob(source);
    const file = new File([blob], 'roadmap.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const imported = await importDocx(file);

    expect(imported).toContain('<table>');
    expect(imported).toContain('<td><p>Milestone</p></td>');
    expect(imported).toContain('<td><p>Khanh</p></td>');
  });  it('creates a Word blob from rich document blocks', async () => {
    const file = await exportDocx('Project brief', '<h1>Launch</h1><p><strong>Ready</strong> for review.</p><ol><li>Ship</li></ol>');

    expect(file.type).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(file.size).toBeGreaterThan(0);
  });
});