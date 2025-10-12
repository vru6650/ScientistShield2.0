import { useEffect, useRef } from 'react';
import { useScript } from '../../hooks/useScript';

const D3_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js';

const StructureCanvas = ({ step }) => {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const scriptStatus = useScript(D3_CDN);

    useEffect(() => {
        if (scriptStatus !== 'ready') return;
        if (typeof window === 'undefined' || !window.d3 || !containerRef.current) return;

        const d3 = window.d3;
        const width = containerRef.current.clientWidth || 640;
        const height = containerRef.current.clientHeight || 360;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const drawPlaceholder = (message) => {
            svg.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width)
                .attr('height', height)
                .attr('rx', 18)
                .attr('fill', '#0f172a')
                .attr('stroke', '#1e293b');

            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', 16)
                .attr('fill', '#94a3b8')
                .text(message);
        };

        if (!step) {
            drawPlaceholder('Awaiting data structure state…');
            return;
        }

        if (step.mode === 'graph' && step.graph) {
            const nodes = step.graph.nodes.map((node) => ({ ...node }));
            const links = step.graph.edges.map((edge) => ({ ...edge }));

            const simulation = d3
                .forceSimulation(nodes)
                .force('charge', d3.forceManyBody().strength(-260))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collision', d3.forceCollide().radius(32))
                .force('link', d3.forceLink(links).id((d) => d.id).distance(Math.min(width, height) / 3))
                .stop();

            for (let i = 0; i < 200; i += 1) {
                simulation.tick();
            }

            svg
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width)
                .attr('height', height)
                .attr('rx', 18)
                .attr('fill', '#0f172a');

            const linkGroup = svg.append('g').attr('stroke-linecap', 'round');
            linkGroup
                .selectAll('line')
                .data(links)
                .join('line')
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y)
                .attr('stroke-width', (d) => (d.active ? 3 : 1.5))
                .attr('stroke', (d) => (d.active ? '#38bdf8' : '#334155'))
                .attr('opacity', (d) => (d.active ? 1 : 0.8));

            const nodeGroup = svg.append('g');
            const nodeEnter = nodeGroup
                .selectAll('g')
                .data(nodes)
                .join('g')
                .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

            nodeEnter
                .append('circle')
                .attr('r', 20)
                .attr('fill', (d) => {
                    if (d.current) return '#38bdf8';
                    if (d.frontier) return '#fbbf24';
                    if (d.visited) return '#10b981';
                    return '#1e293b';
                })
                .attr('stroke', (d) => (d.current ? '#bae6fd' : '#475569'))
                .attr('stroke-width', 2);

            nodeEnter
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr('font-size', 12)
                .attr('fill', '#e2e8f0')
                .text((d) => d.label ?? d.id);

            if (Array.isArray(step.graph.nodes) && step.graph.nodes.length > 0) {
                const legendY = height - 24;
                const order = step.graph.nodes[0].order || [];
                if (order.length) {
                    svg
                        .append('text')
                        .attr('x', 16)
                        .attr('y', legendY)
                        .attr('fill', '#cbd5f5')
                        .attr('font-size', 12)
                        .text(`Visited order: ${order.join(' → ')}`);
                }
            }
            return;
        }

        if (step.mode === 'tree' && step.tree) {
            const rootData = d3.hierarchy(step.tree);
            const layout = d3.tree().size([width - 80, height - 100]);
            layout(rootData);

            svg
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width)
                .attr('height', height)
                .attr('rx', 18)
                .attr('fill', '#0f172a');

            const link = svg
                .append('g')
                .attr('fill', 'none')
                .attr('stroke', '#334155')
                .attr('stroke-width', 2);

            link
                .selectAll('path')
                .data(rootData.links())
                .join('path')
                .attr(
                    'd',
                    d3
                        .linkVertical()
                        .x((d) => d.x + 40)
                        .y((d) => d.y + 40),
                )
                .attr('opacity', 0.7);

            const node = svg
                .append('g')
                .selectAll('g')
                .data(rootData.descendants())
                .join('g')
                .attr('transform', (d) => `translate(${d.x + 40}, ${d.y + 40})`);

            node
                .append('circle')
                .attr('r', 20)
                .attr('fill', (d) => {
                    if (step.highlights?.inserted === d.data.id) return '#38bdf8';
                    if (step.highlights?.current === d.data.id) return '#f97316';
                    return '#1e293b';
                })
                .attr('stroke', '#475569')
                .attr('stroke-width', 2);

            node
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr('font-size', 12)
                .attr('fill', '#e2e8f0')
                .text((d) => d.data.value);

            if (step.highlights?.value !== undefined) {
                svg
                    .append('text')
                    .attr('x', 16)
                    .attr('y', height - 24)
                    .attr('fill', '#a855f7')
                    .attr('font-size', 12)
                    .text(`Inserting value: ${step.highlights.value}`);
            }
            return;
        }

        drawPlaceholder('No visualization available for this step.');
    }, [scriptStatus, step]);

    return (
        <div ref={containerRef} className="relative h-full w-full">
            {scriptStatus !== 'ready' ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/80 text-slate-300">
                    Loading D3.js…
                </div>
            ) : null}
            <svg ref={svgRef} className="h-full w-full" />
        </div>
    );
};

export default StructureCanvas;
