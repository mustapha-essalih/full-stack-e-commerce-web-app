import { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
      }`}
      aria-label={label}
    >
      {children || label}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Write something...' }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);
  const toggleHeading = useCallback(
    (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run(),
    [editor],
  );
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  const toggleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]);
  const setLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-64 animate-pulse rounded-lg border border-secondary-200 bg-secondary-50" />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-secondary-300">
      <div className="flex flex-wrap items-center gap-1 border-b border-secondary-200 bg-white px-3 py-2">
        <ToolButton active={editor.isActive('bold')} onClick={toggleBold} label="Bold">
          <strong>B</strong>
        </ToolButton>
        <ToolButton active={editor.isActive('italic')} onClick={toggleItalic} label="Italic">
          <em>I</em>
        </ToolButton>
        <ToolButton active={editor.isActive('underline')} onClick={toggleUnderline} label="Underline">
          <span className="underline">U</span>
        </ToolButton>

        <div className="mx-1 h-5 w-px bg-secondary-200" />

        <ToolButton active={editor.isActive('heading', { level: 1 })} onClick={() => toggleHeading(1)} label="Heading 1">
          H1
        </ToolButton>
        <ToolButton active={editor.isActive('heading', { level: 2 })} onClick={() => toggleHeading(2)} label="Heading 2">
          H2
        </ToolButton>
        <ToolButton active={editor.isActive('heading', { level: 3 })} onClick={() => toggleHeading(3)} label="Heading 3">
          H3
        </ToolButton>

        <div className="mx-1 h-5 w-px bg-secondary-200" />

        <ToolButton active={editor.isActive('bulletList')} onClick={toggleBulletList} label="Bullet list">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </ToolButton>
        <ToolButton active={editor.isActive('orderedList')} onClick={toggleOrderedList} label="Ordered list">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </ToolButton>
        <ToolButton active={editor.isActive('blockquote')} onClick={toggleBlockquote} label="Blockquote">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </ToolButton>

        <div className="mx-1 h-5 w-px bg-secondary-200" />

        <ToolButton active={editor.isActive('link')} onClick={setLink} label="Link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </ToolButton>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none bg-white px-4 py-3 min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1 [&_.ProseMirror]:min-h-[200px]"
      />
    </div>
  );
}
