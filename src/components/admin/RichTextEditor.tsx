'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { useCallback, useEffect, useRef } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight,
    Link as LinkIcon, Image as ImageIcon, Quote, Code,
    Undo, Redo, Highlighter, Minus
} from 'lucide-react';
import styles from './RichTextEditor.module.scss';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const isInternalChange = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Image.configure({ inline: false, allowBase64: true }),
            Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            Placeholder.configure({ placeholder: placeholder || 'Bắt đầu viết bài...' }),
            Highlight,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            isInternalChange.current = true;
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // Sync external value changes
    useEffect(() => {
        if (!editor) return;
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        const currentHTML = editor.getHTML();
        if (value !== currentHTML) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor]);

    const addImage = useCallback(() => {
        if (!editor) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.data?.url) {
                    editor.chain().focus().setImage({ src: data.data.url }).run();
                }
            } catch {
                // fallback to base64
                const reader = new FileReader();
                reader.onloadend = () => {
                    editor.chain().focus().setImage({ src: reader.result as string }).run();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }, [editor]);

    const addLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Nhập URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
        <button
            type="button"
            className={`${styles.toolBtn} ${active ? styles.toolBtnActive : ''}`}
            onClick={onClick}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className={styles.editor}>
            <div className={styles.toolbar}>
                <div className={styles.toolGroup}>
                    <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={16} /></ToolBtn>
                </div>

                <div className={styles.toolSep} />

                <div className={styles.toolGroup}>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={16} /></ToolBtn>
                </div>

                <div className={styles.toolSep} />

                <div className={styles.toolGroup}>
                    <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={16} /></ToolBtn>
                </div>

                <div className={styles.toolSep} />

                <div className={styles.toolGroup}>
                    <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={16} /></ToolBtn>
                </div>

                <div className={styles.toolSep} />

                <div className={styles.toolGroup}>
                    <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code size={16} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={16} /></ToolBtn>
                </div>

                <div className={styles.toolSep} />

                <div className={styles.toolGroup}>
                    <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Add Link"><LinkIcon size={16} /></ToolBtn>
                    <ToolBtn onClick={addImage} title="Upload Image"><ImageIcon size={16} /></ToolBtn>
                </div>
            </div>

            <EditorContent editor={editor} className={styles.content} />
        </div>
    );
}
