// client/src/tiptap/ColoredCodeBlock.js
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';

const ColoredCodeBlock = CodeBlockLowlight.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            // Add custom attributes here if needed, but for color we can rely on spans
        };
    },

    content: 'text*', // Allow text and styling within the code block
});

export default ColoredCodeBlock;