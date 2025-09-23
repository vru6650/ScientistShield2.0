// client/src/tiptap/CodeSnippet.js
import { Node } from '@tiptap/core';

const CodeSnippet = Node.create({
    name: 'codeSnippet',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            snippetId: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-snippet-id]',
                getAttrs: (element) => {
                    return {
                        snippetId: element.getAttribute('data-snippet-id'),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', { 'data-snippet-id': HTMLAttributes.snippetId }];
    },
});

export default CodeSnippet;