import { useEffect, useRef } from 'react';
import { useScript } from '../../hooks/useScript';

const P5_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.2/p5.min.js';
const ANIMATION_DURATION = 480;

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

const getTimestamp = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const SortingCanvas = ({ step }) => {
    const containerRef = useRef(null);
    const instanceRef = useRef(null);
    const latestStep = useRef(step);
    const previousStep = useRef(step);
    const animationState = useRef(null);
    const scriptStatus = useScript(P5_CDN);

    useEffect(() => {
        latestStep.current = step;

        if (!step || !Array.isArray(step.array)) {
            animationState.current = null;
        } else {
            const previousArray = Array.isArray(previousStep.current?.array) ? [...previousStep.current.array] : [...step.array];
            const nextArray = [...step.array];

            animationState.current = {
                active: true,
                from: previousArray,
                to: nextArray,
                start: getTimestamp(),
                duration: ANIMATION_DURATION,
            };
        }

        previousStep.current = step;

        if (instanceRef.current && scriptStatus === 'ready') {
            instanceRef.current.loop();
        }
    }, [step, scriptStatus]);

    useEffect(() => {
        if (scriptStatus !== 'ready') return () => {};
        if (!containerRef.current || typeof window === 'undefined' || !window.p5) return () => {};

        const sketch = (p) => {
            const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
            const easeOutCubic = (value) => 1 - (1 - value) ** 3;

            p.setup = () => {
                const width = containerRef.current?.clientWidth || 600;
                const height = containerRef.current?.clientHeight || 360;
                const canvas = p.createCanvas(width, height);
                canvas.parent(containerRef.current);
                p.frameRate(60);
                p.noSmooth();
            };

            p.windowResized = () => {
                const width = containerRef.current?.clientWidth || 600;
                const height = containerRef.current?.clientHeight || 360;
                p.resizeCanvas(width, height, true);
            };

            const drawGradientBackground = (width, height) => {
                p.background('#0f172a');
                const gradientSteps = 5;
                for (let i = 0; i < gradientSteps; i += 1) {
                    const alpha = 180 - i * 24;
                    p.noStroke();
                    p.fill(15, 23, 42, alpha);
                    p.rect(0, 0, width, height - i * 10, 18);
                }
            };

            const resolveInterpolatedValues = (targetValues) => {
                if (!animationState.current?.active) {
                    return targetValues;
                }

                const { from, to, start, duration } = animationState.current;
                if (!Array.isArray(from) || !Array.isArray(to) || to.length !== targetValues.length) {
                    animationState.current.active = false;
                    return targetValues;
                }

                const elapsed = getTimestamp() - start;
                const progress = clamp(elapsed / duration, 0, 1);
                const eased = easeOutCubic(progress);
                const interpolated = to.map((value, index) => {
                    const fromValue = from[index] ?? value;
                    return fromValue + (value - fromValue) * eased;
                });

                if (progress >= 1) {
                    animationState.current.active = false;
                    if (instanceRef.current) {
                        instanceRef.current.noLoop();
                    }
                }

                return interpolated;
            };

            p.draw = () => {
                const current = latestStep.current;
                const width = p.width;
                const height = p.height;

                p.push();
                p.drawingContext.save();
                drawGradientBackground(width, height);
                p.drawingContext.restore();
                p.pop();

                if (!current || !Array.isArray(current.array) || current.array.length === 0) {
                    p.noStroke();
                    p.fill(148, 163, 184);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(16);
                    p.text('Awaiting algorithm steps…', width / 2, height / 2);
                    if (instanceRef.current) {
                        instanceRef.current.noLoop();
                    }
                    return;
                }

                const targetValues = current.array;
                const values = resolveInterpolatedValues(targetValues);
                const maxValue = targetValues.reduce((acc, value) => Math.max(acc, Math.abs(value)), 1);
                const padding = 36;
                const barAreaWidth = width - padding * 2;
                const barWidth = Math.max(barAreaWidth / targetValues.length, 8);
                const barAreaHeight = height - padding * 2;
                const highlights = current.highlights || {};
                const pulse = 0.6 + 0.4 * Math.sin(p.millis() / 250);

                if (Array.isArray(highlights.window)) {
                    const [start, end] = highlights.window;
                    const startX = padding + barWidth * start;
                    const windowWidth = barWidth * (end - start + 1);
                    p.noStroke();
                    p.fill(56, 189, 248, 28 + pulse * 32);
                    p.rect(startX, padding, windowWidth, barAreaHeight, 10);
                }

                if (typeof highlights.boundary === 'number') {
                    const boundaryX = padding + barWidth * (highlights.boundary + 1);
                    p.stroke('#475569');
                    p.strokeWeight(1);
                    p.line(boundaryX, padding, boundaryX, padding + barAreaHeight);
                }

                values.forEach((value, index) => {
                    const actual = targetValues[index];
                    const magnitude = Math.abs(value);
                    const normalized = Math.max(magnitude / maxValue, 0.04);
                    const barHeight = barAreaHeight * normalized;
                    const x = padding + index * barWidth;
                    const y = padding + (barAreaHeight - barHeight);
                    const isNegative = actual < 0;
                    const color = resolveBarColor(index, highlights);

                    p.noStroke();
                    const fillColor = p.color(color);
                    const isSorted = Array.isArray(highlights.sorted) && highlights.sorted.includes(index);
                    const intensity = isSorted ? 230 : 180;
                    fillColor.setAlpha(intensity + pulse * 40);
                    p.fill(fillColor);
                    p.rect(x + 2, y, barWidth - 4, barHeight, 8);

                    if (isNegative) {
                        p.fill('#f87171');
                        p.rect(x + 2, padding + barAreaHeight - 4, barWidth - 4, 4, 2);
                    }

                    p.fill(14, 165, 233, 90);
                    p.rect(x + 4, y - 6, barWidth - 8, 6, 4);

                    p.fill('#e2e8f0');
                    p.textAlign(p.CENTER, p.BOTTOM);
                    p.textSize(12);
                    p.text(actual, x + barWidth / 2, y - 6);

                    p.fill('#94a3b8');
                    p.textAlign(p.CENTER, p.TOP);
                    p.textSize(10);
                    p.text(index, x + barWidth / 2, padding + barAreaHeight + 8);
                });

                if (current.message) {
                    p.noStroke();
                    p.fill('#38bdf8');
                    p.textSize(14);
                    p.textAlign(p.LEFT, p.BOTTOM);
                    p.text(current.message, padding, height - 12);
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
