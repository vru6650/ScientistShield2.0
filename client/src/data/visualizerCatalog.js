export const algorithmGroups = [
    {
        id: 'sorting',
        label: 'Sorting algorithms',
        description: 'Visualize how comparison-based sorting algorithms transform an array over time.',
        algorithms: [
            {
                id: 'bubble-sort',
                name: 'Bubble Sort',
                summary: 'Repeatedly swap adjacent out-of-order pairs until the array is sorted.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const data = [...config.array];
  const sorted = new Set();

  const snapshot = (details) => {
    emit({
      mode: 'sorting',
      array: [...data],
      ...details,
    });
  };

  for (let end = data.length - 1; end > 0; end -= 1) {
    for (let i = 0; i < end; i += 1) {
      snapshot({
        stage: 'compare',
        message: \`Compare indices \${i} and \${i + 1}\`,
        highlights: {
          compare: [i, i + 1],
          boundary: end,
          sorted: Array.from(sorted),
        },
      });

      if (data[i] > data[i + 1]) {
        const temp = data[i];
        data[i] = data[i + 1];
        data[i + 1] = temp;
        snapshot({
          stage: 'swap',
          message: \`Swap indices \${i} and \${i + 1}\`,
          highlights: {
            swap: [i, i + 1],
            boundary: end,
            sorted: Array.from(sorted),
          },
        });
      }
    }
    sorted.add(end);
    snapshot({
      stage: 'locked',
      message: \`Index \${end} fixed\`,
      highlights: { sorted: Array.from(sorted) },
    });
  }

  sorted.add(0);
  snapshot({
    stage: 'complete',
    message: 'Array sorted',
    highlights: { sorted: Array.from(sorted) },
  });

  return { totalSwaps: Array.from(sorted).length };
}`,
                    python: `def run_algorithm(config, emit):
    data = list(config['array'])
    sorted_indices = set()

    def snapshot(stage, message, highlights=None):
        emit({
            'mode': 'sorting',
            'array': list(data),
            'stage': stage,
            'message': message,
            'highlights': highlights or {},
        })

    for end in range(len(data) - 1, 0, -1):
        for i in range(0, end):
            snapshot('compare', f'Compare indices {i} and {i + 1}', {
                'compare': [i, i + 1],
                'boundary': end,
                'sorted': list(sorted_indices),
            })
            if data[i] > data[i + 1]:
                data[i], data[i + 1] = data[i + 1], data[i]
                snapshot('swap', f'Swap indices {i} and {i + 1}', {
                    'swap': [i, i + 1],
                    'boundary': end,
                    'sorted': list(sorted_indices),
                })
        sorted_indices.add(end)
        snapshot('locked', f'Index {end} fixed', {
            'sorted': list(sorted_indices)
        })

    sorted_indices.add(0)
    snapshot('complete', 'Array sorted', {
        'sorted': list(sorted_indices)
    })

    return {'passes': len(sorted_indices)}
`,
                },
            },
            {
                id: 'merge-sort',
                name: 'Merge Sort',
                summary: 'Recursively split the array then merge ordered sub-arrays.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const data = [...config.array];
  const buffer = [...data];

  const snapshot = (details) => {
    emit({
      mode: 'sorting',
      array: [...data],
      ...details,
    });
  };

  const merge = (start, mid, end) => {
    for (let index = start; index <= end; index += 1) {
      buffer[index] = data[index];
    }

    let left = start;
    let right = mid + 1;
    let current = start;

    while (left <= mid && right <= end) {
      snapshot({
        stage: 'compare',
        message: \`Compare left \${left} and right \${right}\`,
        highlights: {
          window: [start, end],
          compare: [left, right],
          pivot: mid,
        },
      });

      if (buffer[left] <= buffer[right]) {
        data[current] = buffer[left];
        snapshot({
          stage: 'write',
          message: \`Write \${buffer[left]} into index \${current}\`,
          highlights: {
            window: [start, end],
            keyIndex: current,
          },
        });
        left += 1;
      } else {
        data[current] = buffer[right];
        snapshot({
          stage: 'write',
          message: \`Write \${buffer[right]} into index \${current}\`,
          highlights: {
            window: [start, end],
            keyIndex: current,
          },
        });
        right += 1;
      }
      current += 1;
    }

    while (left <= mid) {
      data[current] = buffer[left];
      snapshot({
        stage: 'write',
        message: \`Flush left value \${buffer[left]}\`,
        highlights: {
          window: [start, end],
          keyIndex: current,
        },
      });
      left += 1;
      current += 1;
    }

    while (right <= end) {
      data[current] = buffer[right];
      snapshot({
        stage: 'write',
        message: \`Flush right value \${buffer[right]}\`,
        highlights: {
          window: [start, end],
          keyIndex: current,
        },
      });
      right += 1;
      current += 1;
    }

    snapshot({
      stage: 'merged',
      message: \`Merged range [\${start}, \${end}]\`,
      highlights: {
        window: [start, end],
        sorted: Array.from({ length: end - start + 1 }, (_, index) => start + index),
      },
    });
  };

  const sort = (start, end) => {
    if (start >= end) return;
    const mid = Math.floor((start + end) / 2);
    snapshot({
      stage: 'split',
      message: \`Split range [\${start}, \${end}] at \${mid}\`,
      highlights: {
        window: [start, end],
        pivot: mid,
      },
    });
    sort(start, mid);
    sort(mid + 1, end);
    merge(start, mid, end);
  };

  sort(0, data.length - 1);
  snapshot({
    stage: 'complete',
    message: 'Merge sort complete',
    highlights: {
      sorted: Array.from({ length: data.length }, (_, index) => index),
    },
  });

  return { segments: data.length };
}`,
                    python: `def run_algorithm(config, emit):
    data = list(config['array'])
    buffer = list(data)

    def snapshot(stage, message, highlights=None):
        emit({
            'mode': 'sorting',
            'array': list(data),
            'stage': stage,
            'message': message,
            'highlights': highlights or {},
        })

    def merge(start, mid, end):
        for idx in range(start, end + 1):
            buffer[idx] = data[idx]

        left, right = start, mid + 1
        current = start

        while left <= mid and right <= end:
            snapshot('compare', f'Compare left {left} and right {right}', {
                'window': [start, end],
                'compare': [left, right],
                'pivot': mid,
            })

            if buffer[left] <= buffer[right]:
                data[current] = buffer[left]
                snapshot('write', f'Write {buffer[left]} into {current}', {
                    'window': [start, end],
                    'keyIndex': current,
                })
                left += 1
            else:
                data[current] = buffer[right]
                snapshot('write', f'Write {buffer[right]} into {current}', {
                    'window': [start, end],
                    'keyIndex': current,
                })
                right += 1
            current += 1

        while left <= mid:
            data[current] = buffer[left]
            snapshot('write', f'Flush left {buffer[left]}', {
                'window': [start, end],
                'keyIndex': current,
            })
            left += 1
            current += 1

        while right <= end:
            data[current] = buffer[right]
            snapshot('write', f'Flush right {buffer[right]}', {
                'window': [start, end],
                'keyIndex': current,
            })
            right += 1
            current += 1

        snapshot('merged', f'Merged range [{start}, {end}]', {
            'window': [start, end],
            'sorted': list(range(start, end + 1)),
        })

    def sort(start, end):
        if start >= end:
            return
        mid = (start + end) // 2
        snapshot('split', f'Split range [{start}, {end}] at {mid}', {
            'window': [start, end],
            'pivot': mid,
        })
        sort(start, mid)
        sort(mid + 1, end)
        merge(start, mid, end)

    sort(0, len(data) - 1)
    snapshot('complete', 'Merge sort complete', {
        'sorted': list(range(len(data)))
    })
    return {'segments': len(data)}
`,
                },
            },
            {
                id: 'quick-sort',
                name: 'Quick Sort',
                summary: 'Partition around a pivot to sort subarrays independently.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const data = [...config.array];
  const sorted = new Set();

  const snapshot = (details) => {
    emit({
      mode: 'sorting',
      array: [...data],
      ...details,
    });
  };

  const partition = (left, right, depth) => {
    const pivotIndex = right;
    const pivotValue = data[pivotIndex];
    let storeIndex = left;

    snapshot({
      stage: 'partition',
      message: \`Partition [\${left}, \${right}] with pivot \${pivotIndex}\`,
      highlights: {
        window: [left, right],
        pivot: pivotIndex,
        depth,
        sorted: Array.from(sorted),
      },
    });

    for (let i = left; i < right; i += 1) {
      snapshot({
        stage: 'compare',
        message: 'Compare index ' + i + ' with pivot',
        highlights: {
          window: [left, right],
          compare: [i, pivotIndex],
          keyIndex: storeIndex,
          pivot: pivotIndex,
          sorted: Array.from(sorted),
        },
      });
      if (data[i] < pivotValue) {
        if (i !== storeIndex) {
          const temp = data[i];
          data[i] = data[storeIndex];
          data[storeIndex] = temp;
          snapshot({
            stage: 'swap',
            message: \`Swap \${i} with \${storeIndex}\`,
            highlights: {
              swap: [i, storeIndex],
              window: [left, right],
              pivot: pivotIndex,
              sorted: Array.from(sorted),
            },
          });
        }
        storeIndex += 1;
      }
    }

    if (storeIndex !== pivotIndex) {
      const temp = data[storeIndex];
      data[storeIndex] = data[pivotIndex];
      data[pivotIndex] = temp;
      snapshot({
        stage: 'pivot-swap',
        message: \`Place pivot at \${storeIndex}\`,
        highlights: {
          swap: [storeIndex, pivotIndex],
          pivot: storeIndex,
          sorted: Array.from(sorted),
        },
      });
    }

    sorted.add(storeIndex);
    snapshot({
      stage: 'pivot-fixed',
      message: \`Pivot locked at \${storeIndex}\`,
      highlights: { sorted: Array.from(sorted) },
    });

    return storeIndex;
  };

  const sort = (left, right, depth = 0) => {
    if (left >= right) return;
    const pivotLocation = partition(left, right, depth);
    sort(left, pivotLocation - 1, depth + 1);
    sort(pivotLocation + 1, right, depth + 1);
  };

  sort(0, data.length - 1);
  snapshot({
    stage: 'complete',
    message: 'Quick sort complete',
    highlights: {
      sorted: Array.from({ length: data.length }, (_, index) => index),
    },
  });

  return { pivots: sorted.size };
}`,
                    python: `def run_algorithm(config, emit):
    data = list(config['array'])
    sorted_positions = set()

    def snapshot(stage, message, highlights=None):
        emit({
            'mode': 'sorting',
            'array': list(data),
            'stage': stage,
            'message': message,
            'highlights': highlights or {},
        })

    def partition(left, right, depth):
        pivot_index = right
        pivot_value = data[pivot_index]
        store_index = left

        snapshot('partition', f'Partition [{left}, {right}] with pivot {pivot_index}', {
            'window': [left, right],
            'pivot': pivot_index,
            'depth': depth,
            'sorted': list(sorted_positions),
        })

        for idx in range(left, right):
            snapshot('compare', f'Compare index {idx} with pivot', {
                'window': [left, right],
                'compare': [idx, pivot_index],
                'keyIndex': store_index,
                'pivot': pivot_index,
                'sorted': list(sorted_positions),
            })
            if data[idx] < pivot_value:
                if idx != store_index:
                    data[idx], data[store_index] = data[store_index], data[idx]
                    snapshot('swap', f'Swap {idx} with {store_index}', {
                        'swap': [idx, store_index],
                        'window': [left, right],
                        'pivot': pivot_index,
                        'sorted': list(sorted_positions),
                    })
                store_index += 1

        if store_index != pivot_index:
            data[store_index], data[pivot_index] = data[pivot_index], data[store_index]
            snapshot('pivot-swap', f'Place pivot at {store_index}', {
                'swap': [store_index, pivot_index],
                'pivot': store_index,
                'sorted': list(sorted_positions),
            })

        sorted_positions.add(store_index)
        snapshot('pivot-fixed', f'Pivot locked at {store_index}', {
            'sorted': list(sorted_positions)
        })
        return store_index

    def sort(left, right, depth=0):
        if left >= right:
            return
        pivot_location = partition(left, right, depth)
        sort(left, pivot_location - 1, depth + 1)
        sort(pivot_location + 1, right, depth + 1)

    sort(0, len(data) - 1)
    snapshot('complete', 'Quick sort complete', {
        'sorted': list(range(len(data)))
    })
    return {'pivots': len(sorted_positions)}
`,
                },
            },
        ],
    },
    {
        id: 'searching',
        label: 'Searching algorithms',
        description: 'Observe how iterative and divide-and-conquer strategies locate a target.',
        algorithms: [
            {
                id: 'linear-search',
                name: 'Linear Search',
                summary: 'Scan each element sequentially until the desired value is found.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const data = [...config.array];
  const target = config.target;

  const snapshot = (stage, message, highlights = {}, variables = {}) => {
    emit({
      mode: 'sorting',
      array: [...data],
      stage,
      message,
      highlights,
      debug: {
        stack: [\`linearSearch(array, target=\${target})\`],
        variables,
      },
    });
  };

  snapshot('start', \`Locate \${target} using linear search\`, { window: [0, data.length - 1] }, { target, length: data.length });

  for (let index = 0; index < data.length; index += 1) {
    snapshot('scan', \`Inspect index \${index}\`, { keyIndex: index, window: [0, index] }, { target, index, value: data[index] });
    if (data[index] === target) {
      snapshot('found', \`Found \${target} at index \${index}\`, { targetIndex: index, keyIndex: index }, { target, index, value: data[index] });
      snapshot('complete', 'Linear search complete', { targetIndex: index }, { target, index });
      return { index };
    }
  }

  snapshot('complete', \`\${target} was not located in the array\`, {}, { target, index: -1 });
  return { index: -1 };
}`,
                    python: `def run_algorithm(config, emit):
    data = list(config['array'])
    target = config['target']

    def snapshot(stage, message, highlights=None, variables=None):
        emit({
            'mode': 'sorting',
            'array': list(data),
            'stage': stage,
            'message': message,
            'highlights': highlights or {},
            'debug': {
                'stack': [f"linearSearch(array, target={target})"],
                'variables': variables or {}
            }
        })

    snapshot('start', f'Locate {target} using linear search', {'window': [0, len(data) - 1]}, {'target': target, 'length': len(data)})

    for index, value in enumerate(data):
        snapshot('scan', f'Inspect index {index}', {'keyIndex': index, 'window': [0, index]}, {'target': target, 'index': index, 'value': value})
        if value == target:
            snapshot('found', f'Found {target} at index {index}', {'targetIndex': index, 'keyIndex': index}, {'target': target, 'index': index, 'value': value})
            snapshot('complete', 'Linear search complete', {'targetIndex': index}, {'target': target, 'index': index})
            return {'index': index}

    snapshot('complete', f'{target} was not located in the array', {}, {'target': target, 'index': -1})
    return {'index': -1}
`,
                },
            },
            {
                id: 'binary-search',
                name: 'Binary Search',
                summary: 'Halve the remaining search window by comparing against the midpoint.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const data = [...config.array];
  const target = config.target;
  let low = 0;
  let high = data.length - 1;

  const snapshot = (stage, message, highlights = {}, variables = {}) => {
    emit({
      mode: 'sorting',
      array: [...data],
      stage,
      message,
      highlights,
      debug: {
        stack: [\`binarySearch(array, target=\${target})\`],
        variables,
      },
    });
  };

  snapshot('start', \`Locate \${target} using binary search\`, { window: [low, high] }, { target, low, high });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = data[mid];

    snapshot('compare', \`Compare index \${mid}\`, { window: [low, high], pivot: mid }, { target, low, high, mid, value });

    if (value === target) {
      snapshot('found', \`Target \${target} located at index \${mid}\`, { window: [mid, mid], targetIndex: mid, pivot: mid }, { target, index: mid, value });
      snapshot('complete', 'Binary search complete', { targetIndex: mid }, { target, index: mid });
      return { index: mid };
    }

    if (value < target) {
      low = mid + 1;
      snapshot('narrow', \`Discard left half up to index \${mid}\`, { window: [low, high] }, { target, low, high, mid, value });
    } else {
      high = mid - 1;
      snapshot('narrow', \`Discard right half from index \${mid}\`, { window: [low, high] }, { target, low, high, mid, value });
    }
  }

  snapshot('complete', \`\${target} was not located in the array\`, {}, { target, index: -1 });
  return { index: -1 };
}`,
                    python: `def run_algorithm(config, emit):
    data = list(config['array'])
    target = config['target']
    low = 0
    high = len(data) - 1

    def snapshot(stage, message, highlights=None, variables=None):
        emit({
            'mode': 'sorting',
            'array': list(data),
            'stage': stage,
            'message': message,
            'highlights': highlights or {},
            'debug': {
                'stack': [f"binarySearch(array, target={target})"],
                'variables': variables or {}
            }
        })

    snapshot('start', f'Locate {target} using binary search', {'window': [low, high]}, {'target': target, 'low': low, 'high': high})

    while low <= high:
        mid = (low + high) // 2
        value = data[mid]

        snapshot('compare', f'Compare index {mid}', {'window': [low, high], 'pivot': mid}, {'target': target, 'low': low, 'high': high, 'mid': mid, 'value': value})

        if value == target:
            snapshot('found', f'Target {target} located at index {mid}', {'window': [mid, mid], 'targetIndex': mid, 'pivot': mid}, {'target': target, 'index': mid, 'value': value})
            snapshot('complete', 'Binary search complete', {'targetIndex': mid}, {'target': target, 'index': mid})
            return {'index': mid}

        if value < target:
            low = mid + 1
            snapshot('narrow', f'Discard left half up to index {mid}', {'window': [low, high]}, {'target': target, 'low': low, 'high': high, 'mid': mid, 'value': value})
        else:
            high = mid - 1
            snapshot('narrow', f'Discard right half from index {mid}', {'window': [low, high]}, {'target': target, 'low': low, 'high': high, 'mid': mid, 'value': value})

    snapshot('complete', f'{target} was not located in the array', {}, {'target': target, 'index': -1})
    return {'index': -1}
`,
                },
            },
        ],
    },
    {
        id: 'graph',
        label: 'Graph traversal',
        description: 'Track how breadth-first and depth-first search explore a connected graph.',
        algorithms: [
            {
                id: 'bfs',
                name: 'Breadth-First Search',
                summary: 'Explore the graph level by level from the starting node.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const adjacency = new Map();
  config.nodes.forEach((node) => adjacency.set(node.id, new Set()));
  config.edges.forEach((edge) => {
    adjacency.get(edge.source).add(edge.target);
    adjacency.get(edge.target).add(edge.source);
  });

  const visited = new Set();
  const queue = [];
  const order = [];

  const snapshot = (stage, message, current, highlightEdge) => {
    emit({
      mode: 'graph',
      stage,
      message,
      graph: {
        nodes: config.nodes.map((node) => ({
          ...node,
          visited: visited.has(node.id),
          frontier: queue.includes(node.id),
          current: node.id === current,
          order: [...order],
        })),
        edges: config.edges.map((edge) => ({
          ...edge,
          active:
            !!highlightEdge &&
            ((edge.source === highlightEdge.source && edge.target === highlightEdge.target) ||
              (edge.source === highlightEdge.target && edge.target === highlightEdge.source)),
        })),
      },
    });
  };

  visited.add(config.startNode);
  queue.push(config.startNode);
  snapshot('start', \`Begin BFS at \${config.startNode}\`, config.startNode, null);

  while (queue.length > 0) {
    const nodeId = queue.shift();
    order.push(nodeId);
    snapshot('visit', \`Visit \${nodeId}\`, nodeId, null);

    const neighbors = Array.from(adjacency.get(nodeId)).sort();
    neighbors.forEach((neighbor) => {
      const edge = { source: nodeId, target: neighbor };
      snapshot('inspect', \`Inspect edge \${nodeId} → \${neighbor}\`, nodeId, edge);
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        snapshot('enqueue', \`Queue \${neighbor}\`, nodeId, edge);
      }
    });
  }

  snapshot('complete', 'BFS traversal complete', null, null);
  return { visited: order };
}`,
                    python: `def run_algorithm(config, emit):
    adjacency = {node['id']: set() for node in config['nodes']}
    for edge in config['edges']:
        adjacency[edge['source']].add(edge['target'])
        adjacency[edge['target']].add(edge['source'])

    visited = set()
    queue = []
    order = []

    def snapshot(stage, message, current=None, edge=None):
        emit({
            'mode': 'graph',
            'stage': stage,
            'message': message,
            'graph': {
                'nodes': [
                    {
                        **node,
                        'visited': node['id'] in visited,
                        'frontier': node['id'] in queue,
                        'current': node['id'] == current,
                        'order': list(order),
                    }
                    for node in config['nodes']
                ],
                'edges': [
                    {
                        **edge_info,
                        'active': bool(edge) and ((edge_info['source'] == edge['source'] and edge_info['target'] == edge['target']) or (edge_info['source'] == edge['target'] and edge_info['target'] == edge['source']))
                    }
                    for edge_info in config['edges']
                ],
            },
        })

    start = config['startNode']
    visited.add(start)
    queue.append(start)
    snapshot('start', f'Begin BFS at {start}', start)

    while queue:
        node_id = queue.pop(0)
        order.append(node_id)
        snapshot('visit', f'Visit {node_id}', node_id)
        for neighbor in sorted(adjacency[node_id]):
            edge = {'source': node_id, 'target': neighbor}
            snapshot('inspect', f'Inspect edge {node_id} → {neighbor}', node_id, edge)
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                snapshot('enqueue', f'Queue {neighbor}', node_id, edge)

    snapshot('complete', 'BFS traversal complete')
    return {'visited': order}
`,
                },
            },
            {
                id: 'dfs',
                name: 'Depth-First Search',
                summary: 'Dive down each branch as far as possible before backtracking.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const adjacency = new Map();
  config.nodes.forEach((node) => adjacency.set(node.id, new Set()));
  config.edges.forEach((edge) => {
    adjacency.get(edge.source).add(edge.target);
    adjacency.get(edge.target).add(edge.source);
  });

  const visited = new Set();
  const stack = [];
  const order = [];

  const snapshot = (stage, message, current, highlightEdge) => {
    emit({
      mode: 'graph',
      stage,
      message,
      graph: {
        nodes: config.nodes.map((node) => ({
          ...node,
          visited: visited.has(node.id),
          frontier: stack.includes(node.id),
          current: node.id === current,
          order: [...order],
        })),
        edges: config.edges.map((edge) => ({
          ...edge,
          active:
            !!highlightEdge &&
            ((edge.source === highlightEdge.source && edge.target === highlightEdge.target) ||
              (edge.source === highlightEdge.target && edge.target === highlightEdge.source)),
        })),
      },
    });
  };

  stack.push(config.startNode);
  snapshot('start', \`Begin DFS at \${config.startNode}\`, config.startNode, null);

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (visited.has(nodeId)) {
      snapshot('skip', \`Skip \${nodeId} (already visited)\`, nodeId, null);
      continue;
    }
    visited.add(nodeId);
    order.push(nodeId);
    snapshot('visit', \`Visit \${nodeId}\`, nodeId, null);

    const neighbors = Array.from(adjacency.get(nodeId)).sort().reverse();
    neighbors.forEach((neighbor) => {
      const edge = { source: nodeId, target: neighbor };
      snapshot('consider', \`Consider neighbor \${neighbor}\`, nodeId, edge);
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
        snapshot('push', \`Push \${neighbor} onto stack\`, nodeId, edge);
      }
    });
  }

  snapshot('complete', 'DFS traversal complete', null, null);
  return { visited: order };
}`,
                    python: `def run_algorithm(config, emit):
    adjacency = {node['id']: set() for node in config['nodes']}
    for edge in config['edges']:
        adjacency[edge['source']].add(edge['target'])
        adjacency[edge['target']].add(edge['source'])

    visited = set()
    stack = []
    order = []

    def snapshot(stage, message, current=None, edge=None):
        emit({
            'mode': 'graph',
            'stage': stage,
            'message': message,
            'graph': {
                'nodes': [
                    {
                        **node,
                        'visited': node['id'] in visited,
                        'frontier': node['id'] in stack,
                        'current': node['id'] == current,
                        'order': list(order),
                    }
                    for node in config['nodes']
                ],
                'edges': [
                    {
                        **edge_info,
                        'active': bool(edge) and ((edge_info['source'] == edge['source'] and edge_info['target'] == edge['target']) or (edge_info['source'] == edge['target'] and edge_info['target'] == edge['source']))
                    }
                    for edge_info in config['edges']
                ],
            },
        })

    stack.append(config['startNode'])
    snapshot('start', f"Begin DFS at {config['startNode']}", config['startNode'])

    while stack:
        node_id = stack.pop()
        if node_id in visited:
            snapshot('skip', f'Skip {node_id} (already visited)', node_id)
            continue
        visited.add(node_id)
        order.append(node_id)
        snapshot('visit', f'Visit {node_id}', node_id)
        for neighbor in sorted(adjacency[node_id], reverse=True):
            edge = {'source': node_id, 'target': neighbor}
            snapshot('consider', f'Consider {neighbor}', node_id, edge)
            if neighbor not in visited:
                stack.append(neighbor)
                snapshot('push', f'Push {neighbor}', node_id, edge)

    snapshot('complete', 'DFS traversal complete')
    return {'visited': order}
`,
                },
            },
        ],
    },
    {
        id: 'trees',
        label: 'Tree operations',
        description: 'Understand how binary search trees evolve as values are inserted.',
        algorithms: [
            {
                id: 'bst-insert',
                name: 'BST Insertion',
                summary: 'Insert each value while preserving the binary search tree invariant.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  let nodeCounter = 0;
  const createNode = (value) => ({ id: \`node-\${nodeCounter += 1}\`, value, left: null, right: null });

  const serialize = (node) => {
    if (!node) return null;
    const children = [];
    if (node.left) children.push(serialize(node.left));
    if (node.right) children.push(serialize(node.right));
    return { id: node.id, value: node.value, children };
  };

  let root = null;

  const snapshot = (stage, message, highlights) => {
    emit({
      mode: 'tree',
      stage,
      message,
      tree: serialize(root),
      highlights: highlights || {},
    });
  };

  config.values.forEach((value, index) => {
    if (!root) {
      root = createNode(value);
      snapshot('insert', \`Insert \${value} as root\`, { inserted: root.id, value });
      return;
    }

    let current = root;
    let parent = null;
    let direction = null;

    while (current) {
      snapshot('compare', \`Compare \${value} with \${current.value}\`, { current: current.id, value });
      parent = current;
      if (value < current.value) {
        direction = 'left';
        if (!current.left) break;
        current = current.left;
      } else {
        direction = 'right';
        if (!current.right) break;
        current = current.right;
      }
    }

    const newNode = createNode(value);
    if (direction === 'left') {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    snapshot('insert', \`Insert \${value} to the \${direction} of \${parent.value}\`, {
      current: parent.id,
      inserted: newNode.id,
      value,
    });

    if (index === config.values.length - 1) {
      snapshot('complete', 'BST insertion complete', { value });
    }
  });

  return { nodeCount: config.values.length };
}`,
                    python: `def run_algorithm(config, emit):
    node_counter = {'value': 0}

    def create_node(value):
        node_counter['value'] += 1
        return {'id': f"node-{node_counter['value']}", 'value': value, 'left': None, 'right': None}

    def serialize(node):
        if not node:
            return None
        children = []
        if node['left']:
            children.append(serialize(node['left']))
        if node['right']:
            children.append(serialize(node['right']))
        return {'id': node['id'], 'value': node['value'], 'children': children}

    root = None

    def snapshot(stage, message, highlights=None):
        emit({
            'mode': 'tree',
            'stage': stage,
            'message': message,
            'tree': serialize(root),
            'highlights': highlights or {},
        })

    for index, value in enumerate(config['values']):
        if root is None:
            root = create_node(value)
            snapshot('insert', f'Insert {value} as root', {'inserted': root['id'], 'value': value})
            continue

        current = root
        parent = None
        direction = None

        while current:
            snapshot('compare', f"Compare {value} with {current['value']}", {'current': current['id'], 'value': value})
            parent = current
            if value < current['value']:
                direction = 'left'
                if not current['left']:
                    break
                current = current['left']
            else:
                direction = 'right'
                if not current['right']:
                    break
                current = current['right']

        new_node = create_node(value)
        if direction == 'left':
            parent['left'] = new_node
        else:
            parent['right'] = new_node

        snapshot('insert', f"Insert {value} to the {direction} of {parent['value']}", {
            'current': parent['id'],
            'inserted': new_node['id'],
            'value': value,
        })

        if index == len(config['values']) - 1:
            snapshot('complete', 'BST insertion complete', {'value': value})

    return {'nodeCount': len(config['values'])}
`,
                },
            },
        ],
    },
    {
        id: 'recursion',
        label: 'Recursion walkthroughs',
        description: 'See how recursive calls expand and unwind on the call stack.',
        algorithms: [
            {
                id: 'factorial-recursion',
                name: 'Factorial (recursive)',
                summary: 'Trace factorial(n) as each call pushes a frame and returns its contribution.',
                templates: {
                    javascript: `function runAlgorithm(config, emit) {
  const stack = [];
  let frameId = 0;
  const input = typeof config.value === 'number' ? config.value : 5;

  const snapshot = (stage, message, highlightId = null, options = {}) => {
    const stackFrames = stack.map((frame, index) => ({
      id: frame.id,
      label: frame.label,
      value: frame.value,
      status: frame.status,
      result: frame.result ?? null,
      depth: index + 1,
    }));
    const highlights = { ...(options.highlights || {}) };
    if (highlightId) {
      highlights.currentFrame = highlightId;
    }
    emit({
      mode: 'stack',
      stage,
      message,
      stack: stackFrames,
      highlights,
      debug: {
        stack: stackFrames.slice().reverse().map((frame) => frame.label),
        variables: options.variables ?? undefined,
      },
    });
  };

  const pushFrame = (n) => {
    frameId += 1;
    const frame = {
      id: \`frame-\${frameId}\`,
      label: \`factorial(\${n})\`,
      value: n,
      status: 'active',
      result: null,
    };
    stack.push(frame);
    return frame;
  };

  const factorial = (n) => {
    const frame = pushFrame(n);
    snapshot('call', \`Call factorial(\${n})\`, frame.id, { variables: { n } });

    if (n <= 1) {
      frame.status = 'base';
      frame.result = 1;
      snapshot('base', \`Base case for n = \${n}\`, frame.id, {
        highlights: { returnValue: 1 },
        variables: { n, result: 1 },
      });
      frame.status = 'returning';
      snapshot('return', \`Return 1 from factorial(\${n})\`, frame.id, {
        highlights: { returnValue: 1 },
        variables: { n, result: 1 },
      });
      stack.pop();
      return 1;
    }

    frame.status = 'suspended';
    snapshot('recurse', \`Recurse with factorial(\${n - 1})\`, frame.id, {
      variables: { n, next: n - 1 },
    });

    const subResult = factorial(n - 1);

    frame.status = 'returning';
    frame.result = n * subResult;
    snapshot('combine', \`Combine \${n} × \${subResult}\`, frame.id, {
      highlights: { returnValue: frame.result },
      variables: { n, subResult, result: frame.result },
    });

    snapshot('return', \`Return \${frame.result} from factorial(\${n})\`, frame.id, {
      highlights: { returnValue: frame.result },
      variables: { n, result: frame.result },
    });

    stack.pop();
    if (stack.length) {
      stack[stack.length - 1].status = 'active';
    }
    return frame.result;
  };

  const result = factorial(input);
  snapshot('complete', \`Factorial(\${input}) = \${result}\`, null, {
    highlights: { returnValue: result },
    variables: { n: input, result },
  });
  return { result };
}`,
                    python: `def run_algorithm(config, emit):
    value = config.get('value', 5)
    stack = []
    frame_id = 0

    def snapshot(stage, message, highlight_id=None, highlights=None, variables=None):
        frames = [
            {
                'id': frame['id'],
                'label': frame['label'],
                'value': frame['value'],
                'status': frame['status'],
                'result': frame.get('result'),
                'depth': index + 1,
            }
            for index, frame in enumerate(stack)
        ]
        effective = dict(highlights or {})
        if highlight_id:
            effective['currentFrame'] = highlight_id
        emit({
            'mode': 'stack',
            'stage': stage,
            'message': message,
            'stack': frames,
            'highlights': effective,
            'debug': {
                'stack': [frame['label'] for frame in reversed(frames)],
                'variables': variables,
            },
        })

    def push_frame(n):
        nonlocal frame_id
        frame_id += 1
        frame = {
            'id': f'frame-{frame_id}',
            'label': f'factorial({n})',
            'value': n,
            'status': 'active',
            'result': None,
        }
        stack.append(frame)
        return frame

    def factorial(n):
        frame = push_frame(n)
        snapshot('call', f'Call factorial({n})', frame['id'], variables={'n': n})

        if n <= 1:
            frame['status'] = 'base'
            frame['result'] = 1
            snapshot('base', f'Base case for n = {n}', frame['id'], highlights={'returnValue': 1}, variables={'n': n, 'result': 1})
            frame['status'] = 'returning'
            snapshot('return', f'Return 1 from factorial({n})', frame['id'], highlights={'returnValue': 1}, variables={'n': n, 'result': 1})
            stack.pop()
            return 1

        frame['status'] = 'suspended'
        snapshot('recurse', f'Recurse with factorial({n - 1})', frame['id'], variables={'n': n, 'next': n - 1})

        sub_result = factorial(n - 1)

        frame['status'] = 'returning'
        frame['result'] = n * sub_result
        snapshot('combine', f'Combine {n} × {sub_result}', frame['id'], highlights={'returnValue': frame['result']}, variables={'n': n, 'subResult': sub_result, 'result': frame['result']})
        snapshot('return', f'Return {frame['result']} from factorial({n})', frame['id'], highlights={'returnValue': frame['result']}, variables={'n': n, 'result': frame['result']})

        stack.pop()
        if stack:
            stack[-1]['status'] = 'active'
        return frame['result']

    result = factorial(value)
    snapshot('complete', f'Factorial({value}) = {result}', highlights={'returnValue': result}, variables={'n': value, 'result': result})
    return {'result': result}
`,
                },
            },
        ],
    },
];

export const findAlgorithmById = (identifier) => {
    for (const group of algorithmGroups) {
        const match = group.algorithms.find((algo) => algo.id === identifier);
        if (match) {
            return { group, algorithm: match };
        }
    }
    return null;
};
