// Language IDs for Judge0 (CE) — see https://judge0.com
// These default to the common RapidAPI CE language ids.
const LANG_IDS = {
  java: parseInt(process.env.LANG_JAVA || '62', 10),
  c: parseInt(process.env.LANG_C || '50', 10),
  cpp: parseInt(process.env.LANG_CPP || '54', 10),
  python: parseInt(process.env.LANG_PYTHON || '71', 10),
  javascript: parseInt(process.env.LANG_JAVASCRIPT || '63', 10),
};

// Judge0 language id -> CollabCode language key
const ID_TO_LANG = Object.fromEntries(
  Object.entries(LANG_IDS).map(([k, v]) => [v, k])
);

// Map our language keys to Monaco language identifiers
const MONACO_LANG = {
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  javascript: 'javascript',
};

// Default code snippet shown when a new editor opens, per language
const DEFAULT_SNIPPETS = {
  java: `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  python: `# Write your solution here\nif __name__ == "__main__":\n    pass\n`,
  javascript: `// Write your solution here\nconst main = () => {\n};\n\nmain();\n`,
};

module.exports = { LANG_IDS, ID_TO_LANG, MONACO_LANG, DEFAULT_SNIPPETS };
