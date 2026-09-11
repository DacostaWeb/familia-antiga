// Markdown dentro e fora do editor.
import type { Editor } from '@tiptap/react';

type ComMarkdown = {
  markdown: { getMarkdown(): string };
};

export function markdownDoEditor(editor: Editor): string {
  const storage = editor.storage as unknown as ComMarkdown;
  return storage.markdown.getMarkdown();
}

export function porMarkdownNoEditor(editor: Editor, texto: string): void {
  if (!texto) return;
  editor.commands.setContent(texto);
}

// Nome de ficheiro seguro para exportar (sem caracteres problemáticos).
export function nomeFicheiro(titulo: string): string {
  return (
    titulo
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'nota'
  );
}
