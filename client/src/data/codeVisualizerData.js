import { FaBullseye, FaClock, FaCogs } from 'react-icons/fa';

const binarySearchArray = [4, 8, 15, 16, 23, 42];

export const codeVisualizerCatalog = [
    {
        id: 'binary-search',
        title: 'Binary Search Explorer',
        summary: 'Watch how a divide-and-conquer strategy narrows a sorted array until the target element is isolated.',
        difficulty: 'Intermediate',
        tags: ['Algorithms', 'Divide & Conquer', 'Arrays'],
        metrics: [
            { label: 'Example size', value: '6 items' },
            { label: 'Comparisons', value: '3 total' },
            { label: 'Time complexity', value: 'O(log n)' },
        ],
        languages: {
            javascript: {
                label: 'JavaScript',
                highlight: 'javascript',
                code: `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const candidate = nums[mid];

    if (candidate === target) {
      return mid;
    }

    if (candidate < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
                steps: [
                    {
                        title: 'Initialize search window',
                        description:
                            'Set the left pointer to the start of the sorted list and the right pointer to the final index.',
                        lines: [2, 3],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 0, right: 5, target: 3 },
                            metrics: [
                                { label: 'left', value: 0 },
                                { label: 'right', value: 5 },
                                { label: 'target value', value: 16 },
                            ],
                            note: 'Our example array is already sorted. The target lives at index 3 but the algorithm does not know that yet.',
                            timeline: [
                                { label: 'Setup', description: 'Boundaries cover the full array.' },
                            ],
                        },
                    },
                    {
                        title: 'Inspect the middle element',
                        description:
                            'Compute the middle index and inspect the candidate value. Here the middle value is smaller than the target.',
                        lines: [5, 6, 7],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 0, right: 5, mid: 2, target: 3 },
                            metrics: [
                                { label: 'mid', value: 2 },
                                { label: 'candidate', value: 15 },
                            ],
                            timeline: [
                                { label: 'Midpoint', description: 'mid = floor((0 + 5) / 2) ➜ 2' },
                                { label: 'Comparison', description: '15 < 16 so the target must be to the right.' },
                            ],
                        },
                    },
                    {
                        title: 'Shrink from the left',
                        description:
                            'Move the left pointer just past the middle element because anything left of mid is smaller than the target.',
                        lines: [13, 14],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 5, mid: 2, target: 3 },
                            metrics: [
                                { label: 'left', value: 3 },
                                { label: 'window size', value: '3 elements' },
                            ],
                            timeline: [
                                { label: 'Discard', description: 'Everything before index 3 can be ignored.' },
                            ],
                        },
                    },
                    {
                        title: 'Recompute the midpoint',
                        description:
                            'Recalculate the middle index in the smaller window. The new candidate overshoots the target.',
                        lines: [5, 6, 7],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 5, mid: 4, target: 3 },
                            metrics: [
                                { label: 'mid', value: 4 },
                                { label: 'candidate', value: 23 },
                            ],
                            timeline: [
                                { label: 'Midpoint', description: 'mid = floor((3 + 5) / 2) ➜ 4' },
                                { label: 'Comparison', description: '23 > 16 so the target is to the left.' },
                            ],
                        },
                    },
                    {
                        title: 'Tighten from the right',
                        description:
                            'Shift the right pointer left so that the search window collapses around the remaining possibility.',
                        lines: [15, 16],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 3, mid: 4, target: 3 },
                            metrics: [
                                { label: 'right', value: 3 },
                                { label: 'window size', value: '1 element' },
                            ],
                            timeline: [
                                { label: 'Discard', description: 'Everything after index 3 is removed.' },
                            ],
                        },
                    },
                    {
                        title: 'Target discovered',
                        description:
                            'The window collapses to a single index. The candidate equals the target so the function returns the index.',
                        lines: [6, 7, 9, 10],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 3, mid: 3, target: 3 },
                            metrics: [
                                { label: 'mid', value: 3 },
                                { label: 'candidate', value: 16 },
                            ],
                            timeline: [
                                { label: 'Comparison', description: 'candidate === target' },
                                { label: 'Return', description: 'Return 3 and exit the loop.' },
                            ],
                            console: ['binarySearch([...], 16) ➜ 3'],
                        },
                    },
                ],
            },
            python: {
                label: 'Python',
                highlight: 'python',
                code: `def binary_search(nums, target):
    left = 0
    right = len(nums) - 1

    while left <= right:
        mid = (left + right) // 2
        candidate = nums[mid]

        if candidate == target:
            return mid

        if candidate < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1`,
                steps: [
                    {
                        title: 'Initialize bounds',
                        description: 'Left and right delimiters wrap the full sorted list.',
                        lines: [2, 3],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 0, right: 5, target: 3 },
                            metrics: [
                                { label: 'left', value: 0 },
                                { label: 'right', value: 5 },
                                { label: 'target', value: 16 },
                            ],
                            note: 'Python version mirrors the JavaScript implementation but uses integer division (//) to compute the midpoint.',
                        },
                    },
                    {
                        title: 'Probe the mid value',
                        description: 'mid sits at index 2 producing candidate 15 which is too small.',
                        lines: [5, 6],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 0, right: 5, mid: 2, target: 3 },
                            metrics: [
                                { label: 'mid', value: 2 },
                                { label: 'candidate', value: 15 },
                            ],
                        },
                    },
                    {
                        title: 'Advance left pointer',
                        description: 'Candidate < target so move left forward by one position.',
                        lines: [9, 10],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 5, mid: 2, target: 3 },
                            metrics: [
                                { label: 'left', value: 3 },
                                { label: 'window', value: 'indices 3..5' },
                            ],
                        },
                    },
                    {
                        title: 'Evaluate the new midpoint',
                        description: 'mid now lands at index 4 giving candidate 23 which overshoots the target.',
                        lines: [5, 6],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 5, mid: 4, target: 3 },
                            metrics: [
                                { label: 'mid', value: 4 },
                                { label: 'candidate', value: 23 },
                            ],
                        },
                    },
                    {
                        title: 'Retreat right pointer',
                        description: 'Candidate > target so slide the right pointer left.',
                        lines: [11, 12],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 3, mid: 4, target: 3 },
                            metrics: [
                                { label: 'right', value: 3 },
                                { label: 'window', value: 'single index' },
                            ],
                        },
                    },
                    {
                        title: 'Return the answer',
                        description: 'mid equals the target so break the loop and report the index.',
                        lines: [5, 6, 8],
                        state: {
                            array: binarySearchArray,
                            focus: { left: 3, right: 3, mid: 3, target: 3 },
                            metrics: [
                                { label: 'mid', value: 3 },
                                { label: 'candidate', value: 16 },
                            ],
                            console: ['binary_search([...], 16) -> 3'],
                        },
                    },
                ],
            },
        },
        insights: [
            {
                icon: FaBullseye,
                title: 'Sorted input required',
                body: 'Binary search only works when the collection is monotonic. Otherwise the algorithm cannot safely eliminate half the search space at a time.',
            },
            {
                icon: FaClock,
                title: 'Predictable runtime',
                body: 'Each loop iteration halves the window, producing at most log2(n) comparisons. For six elements we only needed three checks.',
            },
            {
                icon: FaCogs,
                title: 'Space efficient',
                body: 'Only a handful of integers are tracked at runtime (left, right, and mid), keeping auxiliary memory at O(1).',
            },
        ],
    },
    {
        id: 'debounce',
        title: 'Debounce Timeline',
        summary: 'Visualize how successive UI events collapse into a single invocation when you wrap a callback with debounce.',
        difficulty: 'Beginner friendly',
        tags: ['JavaScript', 'UX', 'Performance'],
        metrics: [
            { label: 'Delay', value: '300ms' },
            { label: 'Focus', value: 'Input typing' },
            { label: 'Pattern', value: 'Higher-order function' },
        ],
        languages: {
            javascript: {
                label: 'JavaScript',
                highlight: 'javascript',
                code: `function debounce(fn, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
                steps: [
                    {
                        title: 'Create the wrapper',
                        description: 'The outer function defines a timeout identifier inside the closure so every call shares the same timer.',
                        lines: [2],
                        state: {
                            metrics: [
                                { label: 'timeoutId', value: 'undefined' },
                                { label: 'delay', value: '300ms' },
                            ],
                            note: 'The closure retains timeoutId so future invocations can cancel pending work.',
                        },
                    },
                    {
                        title: 'Handle a burst of input',
                        description: 'Calling the wrapped function repeatedly keeps clearing the previous timer.',
                        lines: [4, 5],
                        state: {
                            metrics: [
                                { label: 'keystrokes', value: '5 in 220ms' },
                                { label: 'scheduled runs', value: 0 },
                            ],
                            timeline: [
                                { label: '00ms', description: 'User types "s" → timer cleared (no run yet).' },
                                { label: '060ms', description: 'User types "se" → timer cleared again.' },
                                { label: '120ms', description: 'User types "sea" → still no run.' },
                                { label: '180ms', description: 'User types "sear" → previous timeout removed.' },
                                { label: '220ms', description: 'User types "search" → latest timer waiting.' },
                            ],
                        },
                    },
                    {
                        title: 'Schedule the callback',
                        description: 'Once typing pauses, the timeout finally executes and invokes the original callback.',
                        lines: [6, 7, 8],
                        state: {
                            metrics: [
                                { label: 'pending run', value: '1' },
                                { label: 'delay remaining', value: '80ms' },
                            ],
                            timeline: [
                                { label: '300ms', description: 'No new input so the callback is scheduled.' },
                                { label: '380ms', description: 'Callback fires with the last arguments.' },
                            ],
                            console: ['Debounced callback executed once with "search"'],
                        },
                    },
                ],
            },
        },
        insights: [
            {
                icon: FaCogs,
                title: 'Closure powered',
                body: 'timeoutId stays in scope for every invocation so there is a single source of truth controlling the timer.',
            },
            {
                icon: FaClock,
                title: 'User experience boost',
                body: 'Debouncing prevents needless network requests or expensive renders when users type quickly.',
            },
        ],
    },
    {
        id: 'breadth-first-search',
        title: 'Breadth-First Search Queue',
        summary: 'Traverse a graph level by level while tracking the visited nodes and pending queue.',
        difficulty: 'Intermediate',
        tags: ['Graphs', 'Traversal', 'Queues'],
        metrics: [
            { label: 'Graph nodes', value: '6' },
            { label: 'Edges', value: '7' },
            { label: 'Order', value: 'Breadth-first' },
        ],
        languages: {
            javascript: {
                label: 'JavaScript',
                highlight: 'javascript',
                code: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];

  while (queue.length) {
    const node = queue.shift();
    order.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return order;
}`,
                steps: [
                    {
                        title: 'Seed the traversal',
                        description: 'Add the starting node to the visited set and queue so the loop has work to process.',
                        lines: [2, 3, 4],
                        state: {
                            queue: ['A'],
                            visited: ['A'],
                            order: [],
                            timeline: [
                                { label: 'Visited', description: '{A}' },
                                { label: 'Queue', description: '[A]' },
                            ],
                        },
                    },
                    {
                        title: 'Dequeue and visit',
                        description: 'Remove the first item in the queue and append it to the traversal order.',
                        lines: [6, 7],
                        state: {
                            queue: [],
                            visited: ['A'],
                            order: ['A'],
                            timeline: [
                                { label: 'Process', description: 'Pop A from queue → order = [A]' },
                            ],
                        },
                    },
                    {
                        title: 'Inspect neighbors',
                        description: 'Iterate over neighbors of the current node. Enqueue unseen vertices.',
                        lines: [9, 10, 11, 12],
                        state: {
                            queue: ['B', 'C'],
                            visited: ['A', 'B', 'C'],
                            order: ['A'],
                            timeline: [
                                { label: 'Neighbor', description: 'B discovered → enqueue B' },
                                { label: 'Neighbor', description: 'C discovered → enqueue C' },
                            ],
                        },
                    },
                    {
                        title: 'Continue level traversal',
                        description: 'Next iteration processes B which introduces D and E into the queue.',
                        lines: [6, 7, 9, 10, 11, 12],
                        state: {
                            queue: ['C', 'D', 'E'],
                            visited: ['A', 'B', 'C', 'D', 'E'],
                            order: ['A', 'B'],
                            timeline: [
                                { label: 'Process', description: 'Visit B → order = [A, B]' },
                                { label: 'Neighbor', description: 'D discovered → enqueue D' },
                                { label: 'Neighbor', description: 'E discovered → enqueue E' },
                            ],
                        },
                    },
                    {
                        title: 'Finish the search',
                        description: 'Process the remaining queue until empty which finalizes the breadth-first ordering.',
                        lines: [6, 7, 9, 10, 11, 12, 16],
                        state: {
                            queue: [],
                            visited: ['A', 'B', 'C', 'D', 'E', 'F'],
                            order: ['A', 'B', 'C', 'D', 'E', 'F'],
                            timeline: [
                                { label: 'Process', description: 'Visit C → enqueue F' },
                                { label: 'Process', description: 'Visit D & E → queue keeps shrinking' },
                                { label: 'Process', description: 'Visit F → queue empty' },
                            ],
                            console: ['bfs(graph, "A") ➜ ["A", "B", "C", "D", "E", "F"]'],
                        },
                    },
                ],
            },
        },
        insights: [
            {
                icon: FaCogs,
                title: 'Queue discipline',
                body: 'Breadth-first search relies on a first-in-first-out queue to explore each layer of the graph evenly.',
            },
            {
                icon: FaBullseye,
                title: 'Shortest path guarantee',
                body: 'When edges are unweighted, the first time you visit a node you have already found the shortest path from the start node.',
            },
        ],
    },
];

export default codeVisualizerCatalog;
