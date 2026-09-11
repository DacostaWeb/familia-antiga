// Editor de notas — Tiptap com formatação visível, guardado num documento Yjs.
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import * as Y from 'yjs';
import { useEffect } from 'react';
import { markdownDoEditor, porMarkdownNoEditor } from '../lib/markdown';
import { IconeDescarregar } from '../icons';

type Props = {
  doc: Y.Doc;
  titulo: string;
  aoMudarTitulo: (t: string) => void;
  markdownInicial?: string; // para importar um .md já ao abrir
};

export default function Editor({ doc, titulo, aoMudarTitulo, markdownInicial }: Props) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }),
        Collaboration.configure({ document: doc, field: 'conteudo' }),
        Link.configure({ openOnClick: false }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Markdown.configure({ html: false, linkify: true, breaks: false }),
      ],
      content: '',
    },
    [doc],
  );

  // Importar markdown uma vez, quando o editor existe e o documento é o certo.
  useEffect(() => {
    if (editor && markdownInicial) porMarkdownNoEditor(editor, markdownInicial);
    // só ao montar / trocar de documento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, doc]);

  if (!editor) return <p className="notafb">A abrir o editor…</p>;

  return (
    <div className="editor-nota">
      <input
        value={titulo}
        onChange={(e) => aoMudarTitulo(e.target.value)}
        placeholder="Título da nota"
        aria-label="Título da nota"
        style={{ width: '100%', fontWeight: 700 }}
      />
      <div className="editor-barra" role="toolbar" aria-label="Formatação">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'ativo' : ''}
          aria-pressed={editor.isActive('heading', { level: 2 })}
        >
          Título
        </button>
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'ativo' : ''} aria-pressed={editor.isActive('bold')}>
          <strong>B</strong>
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'ativo' : ''} aria-pressed={editor.isActive('italic')}>
          <em>I</em>
        </button>
        <button
          onClick={() => {
            const url = window.prompt('Endereço do link:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={editor.isActive('link') ? 'ativo' : ''}
          aria-pressed={editor.isActive('link')}
        >
          Link
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'ativo' : ''}>
          • Lista
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'ativo' : ''}>
          1. Lista
        </button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive('taskList') ? 'ativo' : ''}>
          ☑ Lista de tarefas
        </button>
        <button
          onClick={() => {
            const texto = markdownDoEditor(editor);
            const blob = new Blob([texto], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${titulo || 'nota'}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <IconeDescarregar tamanho={16} /> .md
        </button>
        <button onClick={() => porMarkdownNoEditor(editor, window.prompt('Cola aqui o conteúdo Markdown:') ?? '')}>Importar .md</button>
      </div>
      <EditorContent editor={editor} />
      <p className="notafb">
        Atalhos Markdown funcionam: “# ” para título, “- ” para lista, “**negrito**”, “*itálico*”, “[ ] tarefa”.
      </p>
    </div>
  );
}
