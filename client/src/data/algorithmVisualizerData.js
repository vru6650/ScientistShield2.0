import {
    generateBinarySearchSteps,
    generateBubbleSortSteps,
    generateInsertionSortSteps,
} from '../utils/algorithmVisualizer';

export const algorithmCatalog = [
    {
        id: 'bubble-sort',
        name: 'Bubble Sort',
        tagline: 'Adjacent comparisons with progressive bubbling',
        category: 'Sorting',
        complexity: {
            best: 'O(n)',
            average: 'O(n²)',
            worst: 'O(n²)',
            space: 'O(1)',
        },
        description:
            'Bubble sort repeatedly compares adjacent values, swapping whenever out of order. Each pass pushes the largest remaining value to the end of the unsorted portion.',
        pseudocode: [
            { id: 'start', text: 'procedure bubbleSort(A):' },
            { id: 'outer-loop', text: '  repeat for i from len(A) - 1 down to 1:' },
            { id: 'compare', text: '    for j from 0 to i - 1:' },
            { id: 'swap', text: '      if A[j] > A[j + 1] then swap(A[j], A[j + 1])' },
            { id: 'mark-sorted', text: '  largest element is locked at position i' },
            { id: 'done', text: 'return A' },
        ],
        presets: [
            { label: 'Random mix', dataset: '8, 3, 5, 1, 4, 9' },
            { label: 'Nearly sorted', dataset: '1, 2, 3, 4, 5, 6, 7' },
            { label: 'Reverse order', dataset: '9, 8, 7, 6, 5, 4, 3' },
        ],
        code: `function bubbleSort(array) {
  for (let end = array.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      if (array[i] > array[i + 1]) {
        [array[i], array[i + 1]] = [array[i + 1], array[i]];
      }
    }
  }
  return array;
}`,
        defaultInput: '8, 3, 5, 1, 4, 9',
        generator: generateBubbleSortSteps,
        insights: [
            'Detects sorted arrays quickly—if a pass executes with zero swaps, you can terminate early.',
            'Ideal for teaching comparisons and swaps; not suited for production at scale.',
        ],
        codeHighlights: {
            start: [1],
            'outer-loop': [2],
            compare: [3, 4],
            swap: [5],
            'mark-sorted': [2, 3, 4, 5],
            done: [9, 10],
        },
    },
    {
        id: 'insertion-sort',
        name: 'Insertion Sort',
        tagline: 'Builds a sorted prefix one element at a time',
        category: 'Sorting',
        complexity: {
            best: 'O(n)',
            average: 'O(n²)',
            worst: 'O(n²)',
            space: 'O(1)',
        },
        description:
            'Insertion sort grows a sorted prefix by extracting each new key and shifting larger elements until the correct slot is available.',
        pseudocode: [
            { id: 'start', text: 'procedure insertionSort(A):' },
            { id: 'select-key', text: '  for i from 1 to len(A) - 1:' },
            { id: 'shift', text: '    while j ≥ 0 and A[j] > key:' },
            { id: 'insert', text: '      shift A[j] to A[j + 1]' },
            { id: 'done', text: '    place key at A[j + 1]' },
        ],
        code: `function insertionSort(array) {
  for (let i = 1; i < array.length; i++) {
    const key = array[i];
    let j = i - 1;
    while (j >= 0 && array[j] > key) {
      array[j + 1] = array[j];
      j -= 1;
    }
    array[j + 1] = key;
  }
  return array;
}`,
        presets: [
            { label: 'Gap near end', dataset: '2, 4, 6, 8, 5, 9' },
            { label: 'Small list', dataset: '7, 3, 5, 2' },
            { label: 'Duplicates', dataset: '3, 3, 2, 5, 2, 7' },
        ],
        defaultInput: '12, 4, 7, 1, 3, 9',
        generator: generateInsertionSortSteps,
        insights: [
            'Efficient for nearly sorted data and runs in linear time when the input is already ordered.',
            'Insertion sort is adaptive and stable, making it a great choice for small slices.',
        ],
        codeHighlights: {
            start: [1],
            'select-key': [2, 3],
            shift: [5, 6, 7],
            insert: [9],
            done: [11, 12],
        },
    },
    {
        id: 'binary-search',
        name: 'Binary Search',
        tagline: 'Divide and conquer lookup in sorted data',
        category: 'Search',
        complexity: {
            best: 'O(1)',
            average: 'O(log n)',
            worst: 'O(log n)',
            space: 'O(1)',
        },
        description:
            'Binary search halves the search space each iteration, zeroing in on the target value in logarithmic time. Input must be sorted.',
        pseudocode: [
            { id: 'start', text: 'procedure binarySearch(A, target):' },
            { id: 'midpoint', text: '  while left ≤ right:' },
            { id: 'move-right', text: '    mid ← floor((left + right) / 2)' },
            { id: 'move-left', text: '    if A[mid] = target: return mid' },
            { id: 'found', text: '    else if A[mid] < target: left ← mid + 1' },
            { id: 'not-found', text: '    else: right ← mid - 1' },
            { id: 'done', text: 'return -1' },
        ],
        presets: [
            { label: 'Find 35', dataset: '2, 5, 12, 20, 22, 35, 50', target: '35' },
            { label: 'Missing target', dataset: '1, 4, 9, 16, 25, 36', target: '15' },
            { label: 'Large range', dataset: '5, 12, 27, 41, 56, 72, 89, 103', target: '56' },
        ],
        code: `function binarySearch(array, target) {
  let left = 0;
  let right = array.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (array[mid] === target) return mid;
    if (array[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
        defaultInput: '2, 5, 12, 20, 22, 35, 50',
        requiresTarget: true,
        defaultTarget: '20',
        generator: generateBinarySearchSteps,
        insights: [
            'Binary search only works on sorted collections, so the first step is often to sort your data.',
            'When values repeat, any matching index may be returned; additional logic is required for first/last occurrences.',
        ],
        codeHighlights: {
            start: [1, 2, 3],
            midpoint: [4, 5],
            found: [6],
            'move-right': [7],
            'move-left': [8],
            'not-found': [10],
            done: [10, 11],
        },
    },
];
