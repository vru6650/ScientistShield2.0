export function normalizeDataset(input, fallback = [5, 2, 9, 1, 6, 4]) {
    const numbers = input
        .split(/[, \n]+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .map(Number)
        .filter((value) => Number.isFinite(value));

    if (numbers.length === 0) {
        return [...fallback];
    }

    return numbers.slice(0, 16); // keep arrays digestible for animation
}

const cloneArray = (array) => array.map((value) => value);

const baseStep = (array, message, line, meta = {}) => ({
    array: cloneArray(array),
    message,
    line,
    ...meta,
});

export function generateBubbleSortSteps(values) {
    const array = cloneArray(values);
    const steps = [
        baseStep(array, 'Initial sequence ready for bubble sort.', 'start', {
            highlights: {},
            info: { phase: 'overview', swaps: 0, passes: 0 },
        }),
    ];

    let swaps = 0;
    for (let end = array.length - 1; end > 0; end--) {
        let passSwaps = 0;

        steps.push(
            baseStep(
                array,
                `Starting pass with unsorted tail ending at index ${end}.`,
                'outer-loop',
                {
                    highlights: { boundary: end },
                    info: { phase: 'pass', end, swaps, pass: array.length - end },
                },
            ),
        );

        for (let i = 0; i < end; i++) {
            const j = i + 1;
            steps.push(
            baseStep(
                array,
                `Compare values at positions ${i} and ${j}.`,
                'compare',
                {
                    highlights: { compare: [i, j], boundary: end },
                    info: {
                        phase: 'compare',
                        indices: [i, j],
                        swaps,
                        pass: array.length - end,
                        pointers: [
                            { index: i, label: 'i' },
                            { index: j, label: 'j' },
                        ],
                    },
                },
            ),
        );

            if (array[i] > array[j]) {
                [array[i], array[j]] = [array[j], array[i]];
                swaps += 1;
                passSwaps += 1;
                steps.push(
            baseStep(
                array,
                `Swap elements at indices ${i} and ${j}.`,
                'swap',
                {
                    highlights: {
                        swap: [i, j],
                        boundary: end,
                    },
                    info: {
                        phase: 'swap',
                        indices: [i, j],
                        swaps,
                        pass: array.length - end,
                        pointers: [
                            { index: i, label: 'i' },
                            { index: j, label: 'j' },
                        ],
                    },
                },
            ),
        );
            }
        }

        steps.push(
            baseStep(
                array,
                `Pass complete${passSwaps ? ` with ${passSwaps} swap(s)` : ' without swaps'}; element at index ${end} is sorted.`,
                'mark-sorted',
                {
                    highlights: {
                        sorted: Array.from({ length: array.length - end }, (_, idx) => array.length - 1 - idx),
                    },
                    info: {
                        phase: 'pass-complete',
                        swaps,
                        pass: array.length - end,
                    },
                },
            ),
        );
    }

    steps.push(
        baseStep(array, 'Array fully sorted via bubble sort.', 'done', {
            highlights: { sorted: Array.from({ length: array.length }, (_, idx) => idx) },
            info: { phase: 'complete', swaps },
        }),
    );

    return steps;
}

export function generateInsertionSortSteps(values) {
    const array = cloneArray(values);
    const steps = [
        baseStep(array, 'Initial sequence ready for insertion sort.', 'start', {
            highlights: {},
            info: { phase: 'overview' },
        }),
    ];

    for (let i = 1; i < array.length; i++) {
        const key = array[i];
        let j = i - 1;

        steps.push(
            baseStep(array, `Begin inserting value ${key} from index ${i}.`, 'select-key', {
                highlights: { keyIndex: i, sorted: Array.from({ length: i }, (_, idx) => idx) },
                info: {
                    phase: 'key-selected',
                    key,
                    i,
                    pointers: [{ index: i, label: 'key' }],
                },
            }),
        );

        while (j >= 0 && array[j] > key) {
            steps.push(
                baseStep(array, `Compare key ${key} with value ${array[j]} at index ${j}.`, 'shift', {
                    highlights: {
                        compare: [j, j + 1],
                        insertionIndex: j + 1,
                        keyIndex: i,
                        sorted: Array.from({ length: i }, (_, idx) => idx),
                    },
                    info: {
                        phase: 'compare',
                        key,
                        j,
                        destination: j + 1,
                        pointers: [
                            { index: j, label: 'j' },
                            { index: j + 1, label: 'slot' },
                            { index: i, label: 'key' },
                        ],
                    },
                }),
            );

            array[j + 1] = array[j];

            steps.push(
                baseStep(array, `Shift value ${array[j + 1]} from index ${j} to ${j + 1}.`, 'shift', {
                    highlights: {
                        compare: [j, j + 1],
                        insertionIndex: j + 1,
                        keyIndex: i,
                        sorted: Array.from({ length: i }, (_, idx) => idx),
                    },
                    info: {
                        phase: 'shift',
                        from: j,
                        to: j + 1,
                        key,
                        pointers: [
                            { index: j, label: 'j' },
                            { index: j + 1, label: 'slot' },
                            { index: i, label: 'key' },
                        ],
                    },
                }),
            );

            j -= 1;
        }

        const insertionIndex = j + 1;
        array[insertionIndex] = key;
        steps.push(
            baseStep(array, `Place key value ${key} at index ${insertionIndex}.`, 'insert', {
                highlights: {
                    keyIndex: insertionIndex,
                    sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
                },
                info: {
                    phase: 'inserted',
                    position: insertionIndex,
                    key,
                    pointers: [
                        { index: insertionIndex, label: 'slot' },
                        { index: insertionIndex, label: 'key' },
                    ],
                },
            }),
        );
    }

    steps.push(
        baseStep(array, 'Array fully sorted via insertion sort.', 'done', {
            highlights: { sorted: Array.from({ length: array.length }, (_, idx) => idx) },
            info: { phase: 'complete' },
        }),
    );

    return steps;
}

export function generateBinarySearchSteps(values, target) {
    const sorted = cloneArray(values).sort((a, b) => a - b);
    const steps = [
        baseStep(sorted, `Prepare sorted array for binary search.`, 'start', {
            highlights: { sorted: Array.from({ length: sorted.length }, (_, idx) => idx) },
            info: {
                phase: 'overview',
                target,
                pointers: [
                    { index: 0, label: 'L' },
                    { index: sorted.length - 1, label: 'R' },
                ],
            },
        }),
    ];

    let left = 0;
    let right = sorted.length - 1;
    let iteration = 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midValue = sorted[mid];
        steps.push(
            baseStep(
                sorted,
                `Iteration ${iteration}: mid index ${mid} with value ${midValue}.`,
                'midpoint',
                {
                    highlights: { window: [left, right], pivot: mid, target },
                    info: {
                        phase: 'mid',
                        left,
                        right,
                        mid,
                        target,
                        pointers: [
                            { index: left, label: 'L' },
                            { index: mid, label: 'mid' },
                            { index: right, label: 'R' },
                        ],
                    },
                },
            ),
        );

        if (midValue === target) {
            steps.push(
                baseStep(sorted, `Target ${target} found at index ${mid}.`, 'found', {
                    highlights: { pivot: mid, targetIndex: mid },
                    info: {
                        phase: 'found',
                        index: mid,
                        target,
                        pointers: [{ index: mid, label: 'found' }],
                    },
                }),
            );
            return steps;
        }

        if (midValue < target) {
            steps.push(
                baseStep(sorted, `Target is greater than ${midValue}; search right half.`, 'move-right', {
                    highlights: {
                        window: [mid + 1, right],
                        discarded: [left, mid],
                    },
                    info: {
                        phase: 'shift-right',
                        left: mid + 1,
                        right,
                        target,
                        pointers: [
                            { index: mid + 1, label: 'L' },
                            { index: right, label: 'R' },
                        ],
                    },
                }),
            );
            left = mid + 1;
        } else {
            steps.push(
                baseStep(sorted, `Target is less than ${midValue}; search left half.`, 'move-left', {
                    highlights: {
                        window: [left, mid - 1],
                        discarded: [mid, right],
                    },
                    info: {
                        phase: 'shift-left',
                        left,
                        right: mid - 1,
                        target,
                        pointers: [
                            { index: left, label: 'L' },
                            { index: mid - 1, label: 'R' },
                        ],
                    },
                }),
            );
            right = mid - 1;
        }
        iteration += 1;
    }

    steps.push(
        baseStep(sorted, `Target ${target} not found in the array.`, 'not-found', {
            highlights: { window: [-1, -1] },
            info: { phase: 'failed', target },
        }),
    );

    return steps;
}
