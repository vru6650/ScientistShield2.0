import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import Fuse from 'fuse.js';
import { FaHeading, FaListUl, FaListOl, FaQuoteLeft, FaCode, FaTable, FaImage } from 'react-icons/fa';
import SlashCommandList from './SlashCommandList.jsx'; // Ensure this path is correct

const getCommandItems = ({ editor }) => [
    { title: 'Heading', icon: <FaHeading />, command: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { title: 'Bullet List', icon: <FaListUl />, command: () => editor.chain().focus().toggleBulletList().run() },
    { title: 'Numbered List', icon: <FaListOl />, command: () => editor.chain().focus().toggleOrderedList().run() },
    { title: 'Blockquote', icon: <FaQuoteLeft />, command: () => editor.chain().focus().toggleBlockquote().run() },
    { title: 'Code Block', icon: <FaCode />, command: () => editor.chain().focus().toggleCodeBlock().run() },
    { title: 'Table', icon: <FaTable />, command: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { title: 'Image', icon: <FaImage />, command: () => document.getElementById('image-upload-button')?.click() },
];

const suggestion = {
    items: ({ query, editor }) => {
        const commands = getCommandItems({ editor });
        if (!query) return commands;
        const fuse = new Fuse(commands, { keys: ['title'] });
        return fuse.search(query).map(result => result.item);
    },
    render: () => {
        let component;
        let popup;

        return {
            onStart: props => {
                component = new ReactRenderer(SlashCommandList, { props, editor: props.editor });
                if (!props.clientRect) return;
                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },
            onUpdate(props) {
                component.updateProps(props);
                if (!props.clientRect) return;
                popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }
                return component.ref?.onKeyDown(props);
            },
            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};

export default suggestion;