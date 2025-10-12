import { useEffect, useRef } from 'react';
import { useScript } from '../../hooks/useScript';

const P5_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.2/p5.min.js';
const ANIMATION_DURATION = 420;
const PARTICLE_LIFESPAN = 520;
const PULSE_LIFESPAN = 620;

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
    const previousHighlights = useRef(step?.highlights || {});
    const effectsRef = useRef({ pulses: [], sparks: [] });
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

        const generatePulses = (indices, tone) => {
            if (!Array.isArray(indices)) return;
            const now = getTimestamp();
            const pulses = indices.map((index) => ({
                index,
                tone,
                created: now,
            }));
            effectsRef.current.pulses.push(...pulses);
        };

        const generateSparks = (indices) => {
            if (!Array.isArray(indices)) return;
            const now = getTimestamp();
            indices.forEach((index) => {
                const sparks = Array.from({ length: 14 }, (_, sparkIndex) => ({
                    index,
                    angle: (sparkIndex / 14) * Math.PI * 2,
                    speed: 36 + Math.random() * 28,
                    created: now,
                    offset: Math.random() * 6,
                }));
                effectsRef.current.sparks.push(...sparks);
            });
        };

        const nextHighlights = step?.highlights || {};
        const previous = previousHighlights.current || {};

        const nextCompare = new Set(nextHighlights.compare || []);
        const previousCompare = new Set(previous.compare || []);
        const newlyCompared = [...nextCompare].filter((index) => !previousCompare.has(index));
        generatePulses(newlyCompared, 'compare');

        const nextSwap = new Set(nextHighlights.swap || []);
        const previousSwap = new Set(previous.swap || []);
        const newlySwapped = [...nextSwap].filter((index) => !previousSwap.has(index));
        generatePulses(newlySwapped, 'swap');
        generateSparks(newlySwapped);

        const nextKeyIndex =
            typeof nextHighlights.keyIndex === 'number' ? [nextHighlights.keyIndex] : undefined;
        const previousKeyIndex =
            typeof previous.keyIndex === 'number' ? [previous.keyIndex] : undefined;

        if (nextKeyIndex) {
            const shouldPulseKey = !previousKeyIndex || previousKeyIndex[0] !== nextKeyIndex[0];
            if (shouldPulseKey) {
                generatePulses(nextKeyIndex, 'key');
            }
        }

        previousHighlights.current = nextHighlights;

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
            const easeOutBack = (value) => 1 + 1.04 * (value - 1) ** 3 + 0.3 * (value - 1) ** 2;
            let backgroundDrift = 0;

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
                backgroundDrift += p.deltaTime * 0.0004;
                p.background('#020617');
                const radialGradient = p.drawingContext.createRadialGradient(
                    width * 0.5,
                    height * 0.35,
                    0,
                    width * 0.5,
                    height * 0.35,
                    Math.max(width, height)
                );
                radialGradient.addColorStop(0, 'rgba(56,189,248,0.28)');
                radialGradient.addColorStop(0.6, 'rgba(15,23,42,0.95)');
                radialGradient.addColorStop(1, 'rgba(15,23,42,1)');
                p.drawingContext.save();
                p.drawingContext.fillStyle = radialGradient;
                p.noStroke();
                p.rect(0, 0, width, height);
                p.drawingContext.restore();

                const gridSpacing = 36;
                const driftX = (Math.sin(backgroundDrift) * gridSpacing) / 2;
                const driftY = (Math.cos(backgroundDrift * 1.6) * gridSpacing) / 2;

                p.stroke(30, 58, 138, 80);
                p.strokeWeight(1);
                p.noFill();

                for (let x = -gridSpacing; x < width + gridSpacing; x += gridSpacing) {
                    p.line(x + driftX, 0, x + driftX, height);
                }
                for (let y = -gridSpacing; y < height + gridSpacing; y += gridSpacing) {
                    p.line(0, y + driftY, width, y + driftY);
                }

                const glowRadius = Math.max(width, height) * 0.08;
                p.noStroke();
                p.fill(56, 189, 248, 36);
                p.ellipse(width * 0.5, height * 0.82, glowRadius * 2.6, glowRadius);
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
                const eased = clamp(progress < 0.72 ? easeOutCubic(progress / 0.72) : easeOutBack(progress), 0, 1);
                const interpolated = to.map((value, index) => {
                    const fromValue = from[index] ?? value;
                    return fromValue + (value - fromValue) * eased;
                });

                if (progress >= 1) {
                    animationState.current.active = false;
                    const hasActiveEffects =
                        effectsRef.current.pulses.length > 0 || effectsRef.current.sparks.length > 0;
                    if (instanceRef.current && !hasActiveEffects) {
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
                const pulse = 0.6 + 0.4 * Math.sin(p.millis() / 220);

                const now = getTimestamp();
                effectsRef.current.pulses = effectsRef.current.pulses.filter((pulseEffect) => now - pulseEffect.created < PULSE_LIFESPAN);
                effectsRef.current.sparks = effectsRef.current.sparks.filter((sparkEffect) => now - sparkEffect.created < PARTICLE_LIFESPAN);

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

                const renderPulses = () => {
                    effectsRef.current.pulses.forEach((pulseEffect) => {
                        const elapsed = now - pulseEffect.created;
                        const t = clamp(elapsed / PULSE_LIFESPAN, 0, 1);
                        const easedScale = easeOutCubic(1 - t);
                        const x = padding + pulseEffect.index * barWidth + barWidth / 2;
                        const pulseWidth = barWidth * 1.4 * (1 + t * 0.65);
                        const tone = (() => {
                            switch (pulseEffect.tone) {
                                case 'swap':
                                    return p.color(244, 63, 94, 120 * (1 - t));
                                case 'key':
                                    return p.color(99, 102, 241, 140 * (1 - t));
                                default:
                                    return p.color(245, 158, 11, 100 * (1 - t));
                            }
                        })();
                        tone.setAlpha(120 * easedScale);
                        p.noStroke();
                        p.fill(tone);
                        p.rect(
                            x - pulseWidth / 2,
                            padding - 12 * (1 + t * 0.4),
                            pulseWidth,
                            barAreaHeight + 24 * (1 + t * 0.5),
                            12
                        );
                    });
                };

                const renderSparks = () => {
                    effectsRef.current.sparks.forEach((sparkEffect) => {
                        const elapsed = now - sparkEffect.created;
                        const t = clamp(elapsed / PARTICLE_LIFESPAN, 0, 1);
                        const fade = 1 - t;
                        const x = padding + sparkEffect.index * barWidth + barWidth / 2;
                        const radius = (sparkEffect.speed * elapsed) / 1000 + sparkEffect.offset;
                        const px = x + Math.cos(sparkEffect.angle) * radius;
                        const py = padding + barAreaHeight - Math.sin(sparkEffect.angle) * radius * 0.6;
                        p.noStroke();
                        p.fill(56 + 120 * fade, 189 * fade, 248 * fade, 160 * fade);
                        p.circle(px, py, 4 + 4 * fade);
                    });
                };

                renderPulses();

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

                    const glow = p.color(14, 165, 233, 110 + pulse * 20);
                    p.fill(glow);
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

                renderSparks();

                if (current.message) {
                    p.noStroke();
                    p.fill('#38bdf8');
                    p.textSize(14);
                    p.textAlign(p.LEFT, p.BOTTOM);
                    p.text(current.message, padding, height - 12);
                }

                const hasAnimatedEffects =
                    animationState.current?.active ||
                    effectsRef.current.pulses.length > 0 ||
                    effectsRef.current.sparks.length > 0;
                if (!hasAnimatedEffects && instanceRef.current) {
                    instanceRef.current.noLoop();
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
