import crypto from 'crypto';
import { runAlgorithmVisualization } from './visualizer.service.js';

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const buildFrame = (payload) => {
    const dataBuffer = Buffer.from(payload, 'utf8');
    const length = dataBuffer.length;
    let header;

    if (length < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81; // FIN + text frame
        header[1] = length;
    } else if (length < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(length, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(length), 2);
    }

    return Buffer.concat([header, dataBuffer]);
};

const decodeMessage = (buffer) => {
    if (buffer.length < 2) return null;

    const firstByte = buffer[0];
    const opcode = firstByte & 0x0f;

    if (opcode === 0x8) {
        return { type: 'close' };
    }

    if (opcode === 0x9) {
        return { type: 'ping', payload: buffer.slice(0, 2) };
    }

    const secondByte = buffer[1];
    const isMasked = Boolean(secondByte & 0x80);
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
        if (buffer.length < 4) return null;
        payloadLength = buffer.readUInt16BE(2);
        offset = 4;
    } else if (payloadLength === 127) {
        if (buffer.length < 10) return null;
        payloadLength = Number(buffer.readBigUInt64BE(2));
        offset = 10;
    }

    const totalLength = offset + (isMasked ? 4 : 0) + payloadLength;
    if (buffer.length < totalLength) return null;

    let payloadBuffer = buffer.slice(offset, totalLength);

    if (isMasked) {
        const mask = payloadBuffer.slice(0, 4);
        payloadBuffer = payloadBuffer.slice(4);
        const unmasked = Buffer.alloc(payloadBuffer.length);
        for (let i = 0; i < payloadBuffer.length; i += 1) {
            unmasked[i] = payloadBuffer[i] ^ mask[i % 4];
        }
        payloadBuffer = unmasked;
    }

    const remaining = buffer.slice(totalLength);
    return {
        type: 'text',
        payload: payloadBuffer.toString('utf8'),
        remaining,
    };
};

const sendFrame = (socket, data) => {
    try {
        socket.write(buildFrame(JSON.stringify(data)));
    } catch (error) {
        // Ignore send errors on closing sockets
    }
};

const sendPong = (socket, payload) => {
    const response = Buffer.from([0x8a, payload[1] & 0x7f]);
    socket.write(response);
};

const contexts = new WeakMap();

const emitStep = (socket, index) => {
    const context = contexts.get(socket);
    if (!context || !Array.isArray(context.steps) || context.steps.length === 0) {
        return false;
    }

    const clampedIndex = Math.min(Math.max(index, 0), context.steps.length - 1);
    const step = context.steps[clampedIndex];

    sendFrame(socket, {
        type: 'step',
        index: clampedIndex,
        totalSteps: context.steps.length,
        step,
    });

    context.currentIndex = clampedIndex;
    context.stepIndex = clampedIndex + 1;
    return true;
};

const scheduleNextStep = (socket) => {
    const context = contexts.get(socket);
    if (!context || context.paused) return;

    if (context.stepIndex >= context.steps.length) {
        sendFrame(socket, { type: 'complete', totalSteps: context.steps.length });
        context.paused = true;
        context.timer = null;
        return;
    }

    emitStep(socket, context.stepIndex);

    if (context.paused) {
        return;
    }

    context.timer = setTimeout(() => scheduleNextStep(socket), context.speed);
};

const handleRunRequest = async (socket, payload) => {
    const context = contexts.get(socket);
    if (!context) return;

    context.paused = true;
    if (context.timer) {
        clearTimeout(context.timer);
        context.timer = null;
    }

    const speed = clamp(Number(payload.speed) || context.speed, 120, 2000);

    try {
        const result = await runAlgorithmVisualization({
            algorithmId: payload.algorithmId,
            language: payload.language,
            code: payload.code,
            params: payload.params,
        });

        if (!result || !Array.isArray(result.steps)) {
            sendFrame(socket, {
                type: 'error',
                message: 'Unable to generate visualization steps for the requested algorithm.',
            });
            return;
        }

        context.steps = result.steps;
        context.stepIndex = 0;
        context.currentIndex = -1;
        context.speed = speed;
        context.paused = false;
        context.lastRequest = {
            algorithmId: payload.algorithmId,
            language: payload.language,
            code: payload.code,
            params: payload.params,
        };

        sendFrame(socket, {
            type: 'meta',
            totalSteps: result.steps.length,
            summary: result.summary || null,
            config: result.config || null,
        });

        scheduleNextStep(socket);
    } catch (error) {
        sendFrame(socket, {
            type: 'error',
            message: error?.message || 'Unexpected error executing the algorithm.',
        });
    }
};

const handleReset = async (socket) => {
    const context = contexts.get(socket);
    if (!context || !context.lastRequest) {
        sendFrame(socket, { type: 'reset' });
        return;
    }

    try {
        const result = await runAlgorithmVisualization(context.lastRequest);
        context.steps = result.steps ?? [];
        context.stepIndex = 0;
        context.currentIndex = -1;
        context.paused = true;
        if (context.timer) {
            clearTimeout(context.timer);
            context.timer = null;
        }

        sendFrame(socket, {
            type: 'reset',
            totalSteps: context.steps.length,
            summary: result.summary || null,
            config: result.config || null,
        });

        if (context.steps.length > 0) {
            emitStep(socket, 0);
            sendFrame(socket, { type: 'paused' });
        }
    } catch (error) {
        sendFrame(socket, {
            type: 'error',
            message: error?.message || 'Unable to reset the visualization.',
        });
    }
};

const handleMessage = (socket, message) => {
    const context = contexts.get(socket);
    if (!context) return;

    switch (message.type) {
        case 'run':
            handleRunRequest(socket, message);
            break;
        case 'pause':
            context.paused = true;
            if (context.timer) {
                clearTimeout(context.timer);
                context.timer = null;
            }
            sendFrame(socket, { type: 'paused' });
            break;
        case 'resume':
            if (context.steps.length === 0) return;
            if (!context.paused) return;
            context.paused = false;
            if (context.timer) {
                clearTimeout(context.timer);
                context.timer = null;
            }
            scheduleNextStep(socket);
            sendFrame(socket, { type: 'resumed' });
            break;
        case 'reset':
            handleReset(socket);
            break;
        case 'step': {
            if (context.steps.length === 0) return;
            context.paused = true;
            if (context.timer) {
                clearTimeout(context.timer);
                context.timer = null;
            }

            const currentIndex = typeof context.currentIndex === 'number' ? context.currentIndex : -1;
            const direction = typeof message.direction === 'string' ? message.direction.toLowerCase() : null;
            let targetIndex = currentIndex;

            if (typeof message.index === 'number' && Number.isFinite(message.index)) {
                targetIndex = Math.round(message.index);
            } else if (direction === 'forward') {
                targetIndex = currentIndex + 1;
            } else if (direction === 'back') {
                targetIndex = currentIndex - 1;
            }

            emitStep(socket, targetIndex);
            sendFrame(socket, { type: 'paused' });
            break;
        }
        case 'speed':
            context.speed = clamp(Number(message.speed) || context.speed, 120, 2000);
            if (!context.paused && context.timer) {
                clearTimeout(context.timer);
                context.timer = null;
                scheduleNextStep(socket);
            }
            sendFrame(socket, { type: 'speed-updated', speed: context.speed });
            break;
        default:
            break;
    }
};

const initializeConnection = (socket) => {
    const state = {
        buffer: Buffer.alloc(0),
        paused: true,
        stepIndex: 0,
        steps: [],
        timer: null,
        speed: 400,
        lastRequest: null,
        currentIndex: -1,
    };

    contexts.set(socket, state);
    sendFrame(socket, { type: 'connected' });

    socket.on('data', (chunk) => {
        let currentBuffer = Buffer.concat([state.buffer, chunk]);

        while (currentBuffer.length > 0) {
            const decoded = decodeMessage(currentBuffer);
            if (!decoded) {
                state.buffer = currentBuffer;
                return;
            }

            if (decoded.type === 'close') {
                socket.end();
                return;
            }

            if (decoded.type === 'ping') {
                sendPong(socket, decoded.payload);
                currentBuffer = decoded.remaining ?? Buffer.alloc(0);
                continue;
            }

            if (decoded.type === 'text') {
                state.buffer = decoded.remaining ?? Buffer.alloc(0);
                currentBuffer = state.buffer;
                try {
                    const parsed = JSON.parse(decoded.payload);
                    handleMessage(socket, parsed);
                } catch (error) {
                    sendFrame(socket, { type: 'error', message: 'Invalid message payload received.' });
                }
            } else {
                currentBuffer = decoded.remaining ?? Buffer.alloc(0);
            }
        }
    });

    socket.on('end', () => {
        if (state.timer) {
            clearTimeout(state.timer);
        }
    });

    socket.on('error', () => {
        if (state.timer) {
            clearTimeout(state.timer);
        }
    });
};

export const setupVisualizerSocket = (server) => {
    server.on('upgrade', (request, socket) => {
        if (request.url !== '/ws/visualizer') {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
            return;
        }

        const key = request.headers['sec-websocket-key'];
        if (!key) {
            socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
            socket.destroy();
            return;
        }

        const acceptKey = crypto
            .createHash('sha1')
            .update(key + WEBSOCKET_GUID)
            .digest('base64');

        const responseHeaders = [
            'HTTP/1.1 101 Switching Protocols',
            'Upgrade: websocket',
            'Connection: Upgrade',
            `Sec-WebSocket-Accept: ${acceptKey}`,
        ];

        socket.write(responseHeaders.concat('\r\n').join('\r\n'));

        initializeConnection(socket);
    });
};

