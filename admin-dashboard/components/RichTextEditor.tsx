import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border-gray bg-surface-hover rounded-t-lg">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('bold') ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <Bold size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('italic') ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <Italic size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('underline') ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <UnderlineIcon size={16} />
            </button>

            <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('bulletList') ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <List size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive('orderedList') ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <ListOrdered size={16} />
            </button>

            <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <AlignLeft size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <AlignCenter size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
            >
                <AlignRight size={16} />
            </button>

            <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

            <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-1.5 rounded hover:bg-zinc-700 transition-colors text-gray-400 disabled:opacity-50"
            >
                <Undo size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-1.5 rounded hover:bg-zinc-700 transition-colors text-gray-400 disabled:opacity-50"
            >
                <Redo size={16} />
            </button>
        </div>
    );
};

export default function RichTextEditor({ value, onChange, placeholder, readOnly = false }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: value,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base prose-invert focus:outline-none min-h-[150px] p-4 text-gray-300 max-w-none',
            },
        },
    });

    return (
        <div className={`border rounded-lg overflow-hidden flex flex-col ${readOnly ? 'border-transparent bg-transparent' : 'border-border-gray bg-surface'}`}>
            {!readOnly && <MenuBar editor={editor} />}
            <EditorContent editor={editor} className={readOnly ? '[&>div]:p-0' : ''} />
            <style jsx global>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #9ca3af;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
                .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
                .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { color: #f3f4f6; font-weight: 600; margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
}
