import React, { useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export const ResizableImageNode = ({ node, updateAttributes, selected }) => {
    const containerRef = useRef(null);

    const handleMouseDown = (event) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = containerRef.current.offsetWidth;

        const handleMouseMove = (moveEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            updateAttributes({ width: `${newWidth}px` });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <NodeViewWrapper ref={containerRef} className="resizable-image-container" style={{ width: node.attrs.width }}>
            <img
                src={node.attrs.src}
                alt={node.attrs.alt}
                className={`rounded-lg ${selected ? 'ring-2 ring-blue-500' : ''}`}
            />
            <div
                className="resize-handle"
                onMouseDown={handleMouseDown}
                title="Resize image"
            ></div>
        </NodeViewWrapper>
    );
};