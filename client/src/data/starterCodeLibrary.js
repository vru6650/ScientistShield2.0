export const STARTER_CODE_LIBRARY = [
    {
        id: 'javascript',
        language: 'JavaScript',
        label: 'JavaScript (Node.js)',
        notes: 'Reads stdin using fs.readFileSync and provides a solve() helper just like GeeksforGeeks templates.',
        code: `const fs = require('fs');

function solve(lines) {
    // TODO: Parse input lines and compute the answer
    return lines.join('\n');
}

function main() {
    const input = fs.readFileSync(0, 'utf8').trim().split(/\r?\n/);
    const result = solve(input);
    if (typeof result !== 'undefined') {
        console.log(result);
    }
}

main();`,
    },
    {
        id: 'python',
        language: 'Python',
        label: 'Python 3',
        notes: 'Provides a solve() function and direct stdin read mirroring common competitive programming setups.',
        code: `import sys


def solve():
    data = sys.stdin.read().strip().split()
    # TODO: Work with the tokens from data and return/print the answer
    return None


def main():
    result = solve()
    if result is not None:
        print(result)


if __name__ == "__main__":
    main()`,
    },
    {
        id: 'cpp',
        language: 'C++',
        label: 'C++ (17)',
        notes: 'Includes fast I/O toggles and a solve() stub similar to the GeeksforGeeks practice environment.',
        code: `#include <bits/stdc++.h>
using namespace std;

void solve() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // TODO: Read input and write output
}

int main() {
    solve();
    return 0;
}`,
    },
    {
        id: 'java',
        language: 'Java',
        label: 'Java',
        notes: 'Offers a FastScanner helper and PrintWriter for buffered output, matching GfG starter files.',
        code: `import java.io.*;
import java.util.*;

public class Main {
    static FastScanner fs = new FastScanner(System.in);
    static PrintWriter out = new PrintWriter(System.out);

    static void solve() {
        // TODO: Read input with fs and write output with out
    }

    public static void main(String[] args) {
        solve();
        out.flush();
    }

    static class FastScanner {
        private final InputStream in;
        private final byte[] buffer = new byte[1 << 16];
        private int ptr = 0, len = 0;

        FastScanner(InputStream is) {
            in = is;
        }

        private int read() throws IOException {
            if (ptr >= len) {
                len = in.read(buffer);
                ptr = 0;
                if (len <= 0) return -1;
            }
            return buffer[ptr++];
        }

        int nextInt() throws IOException {
            int c;
            while ((c = read()) <= ' ') {
                if (c == -1) return -1;
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = read();
            }
            int val = 0;
            while (c > ' ') {
                val = val * 10 + c - '0';
                c = read();
            }
            return val * sign;
        }

        long nextLong() throws IOException {
            long c;
            while ((c = read()) <= ' ') {
                if (c == -1) return -1;
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = read();
            }
            long val = 0;
            while (c > ' ') {
                val = val * 10 + c - '0';
                c = read();
            }
            return val * sign;
        }

        String next() throws IOException {
            int c;
            while ((c = read()) <= ' ') {
                if (c == -1) return null;
            }
            StringBuilder sb = new StringBuilder();
            while (c > ' ') {
                sb.append((char) c);
                c = read();
            }
            return sb.toString();
        }
    }
}`,
    },
    {
        id: 'csharp',
        language: 'C#',
        label: 'C#',
        notes: 'Console program scaffold with eager stdin read and a placeholder Solve method.',
        code: `using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
    public static void Main()
    {
        var input = Console.In.ReadToEnd();
        var result = Solve(input);
        if (!string.IsNullOrEmpty(result))
        {
            Console.WriteLine(result);
        }
    }

    private static string Solve(string rawInput)
    {
        // TODO: Parse rawInput and build the answer
        return string.Empty;
    }
}`,
    },
];

export const getStarterTemplateById = (id) =>
    STARTER_CODE_LIBRARY.find((template) => template.id === id);
