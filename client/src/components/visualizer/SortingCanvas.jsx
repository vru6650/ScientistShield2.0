import { useEffect, useRef } from 'react';
import { useScript } from '../../hooks/useScript';

const P5_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.2/p5.min.js';

const resolveBarColor = (index, highlights = {}) => {
    const sorted = new Set(highlights.sorted || []);
    const compare = new Set(highlights.compare || []);
    const swap = new Set(highlights.swap || []);

    if (sorted.has(index)) return '#10b981';
    if (swap.has(index)) return '#f43f5e';
    if (compare.has(index)) return '#f59e0b';
    if (typeof highlights.keyIndex === 'number' && highlights.keyIndex === index) return '#6366f1';
    if (typeof highlights.pivot === 'number' && highlights.pivot === index) return '#38bdf8';
    if (typeof highlights.targetIndex === 'number' && highlights.targetIndex === index) return '#22d3ee';
    return '#334155';
};

const SortingCanvas = ({ step }) => {
    const containerRef = useRef(null);
    const instanceRef = useRef(null);
    const latestStep = useRef(step);
    const scriptStatus = useScript(P5_CDN);

    useEffect(() => {
        latestStep.current = step;
        if (instanceRef.current && scriptStatus === 'ready') {
            instanceRef.current.redraw();
        }
    }, [step, scriptStatus]);

    useEffect(() => {
        if (scriptStatus !== 'ready') return () => {};
        if (!containerRef.current || typeof window === 'undefined' || !window.p5) return () => {};

        const sketch = (p) => {
            p.setup = () => {
                const width = containerRef.current?.clientWidth || 600;
                const height = containerRef.current?.clientHeight || 360;
                const canvas = p.createCanvas(width, height);
                canvas.parent(containerRef.current);
                p.frameRate(60);
                p.noLoop();
                p.background(15, 23, 42);
            };

            p.windowResized = () => {
                const width = containerRef.current?.clientWidth || 600;
                const height = containerRef.current?.clientHeight || 360;
                p.resizeCanvas(width, height, true);
                p.redraw();
            };

            p.draw = () => {
                const current = latestStep.current;
                const width = p.width;
                const height = p.height;
                p.background('#0f172a');

                if (!current || !Array.isArray(current.array) || current.array.length === 0) {
                    p.noStroke();
                    p.fill(148, 163, 184);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(16);
                    p.text('Awaiting algorithm steps…', width / 2, height / 2);
                    return;
                }

                const values = current.array;
                const maxValue = values.reduce((acc, value) => Math.max(acc, Math.abs(value)), 1);
                const padding = 36;
                const barAreaWidth = width - padding * 2;
                const barWidth = Math.max(barAreaWidth / values.length, 8);
                const barAreaHeight = height - padding * 2;
                const highlights = current.highlights || {};

                if (Array.isArray(highlights.window)) {
                    const [start, end] = highlights.window;
                    const startX = padding + barWidth * start;
                    const windowWidth = barWidth * (end - start + 1);
                    p.noStroke();
                    p.fill(56, 189, 248, 28);
                    p.rect(startX, padding, windowWidth, barAreaHeight, 6);
                }

                if (typeof highlights.boundary === 'number') {
                    const boundaryX = padding + barWidth * (highlights.boundary + 1);
                    p.stroke('#475569');
                    p.strokeWeight(1);
                    p.line(boundaryX, padding, boundaryX, padding + barAreaHeight);
                }

                values.forEach((value, index) => {
                    const magnitude = Math.abs(value);
                    const normalized = Math.max(magnitude / maxValue, 0.04);
                    const barHeight = barAreaHeight * normalized;
                    const x = padding + index * barWidth;
                    const y = padding + (barAreaHeight - barHeight);
                    const isNegative = value < 0;
                    const color = resolveBarColor(index, highlights);

                    p.noStroke();
                    p.fill(color);
                    p.rect(x + 2, y, barWidth - 4, barHeight, 6);

                    if (isNegative) {
                        p.fill('#f87171');
                        p.rect(x + 2, padding + barAreaHeight - 4, barWidth - 4, 4, 2);
                    }

                    p.fill('#e2e8f0');
                    p.textAlign(p.CENTER, p.BOTTOM);
                    p.textSize(12);
                    p.text(value, x + barWidth / 2, y - 6);

                    p.fill('#94a3b8');
                    p.textAlign(p.CENTER, p.TOP);
                    p.textSize(10);
                    p.text(index, x + barWidth / 2, padding + barAreaHeight + 6);
                });

                if (current.message) {
                    p.noStroke();
                    p.fill('#38bdf8');
                    p.textSize(14);
                    p.textAlign(p.LEFT, p.BOTTOM);
                    p.text(current.message, padding, height - 10);
                }
            };
        };

        const instance = new window.p5(sketch);
        instanceRef.current = instance;

        return () => {
            if (instanceRef.current) {
                instanceRef.current.remove();
                instanceRef.current = null;
            }
        };
    }, [scriptStatus]);

    return (
        <div className="relative h-full w-full">
            {scriptStatus !== 'ready' ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/80 text-slate-300">
                    Loading p5.js…
                </div>
            ) : null}
            <div ref={containerRef} className="h-full w-full" />
        </div>
    );
};

export default SortingCanvas;