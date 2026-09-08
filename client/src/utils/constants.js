export const LANGUAGES = [
  { key: 'python', label: 'Python', monaco: 'python', judge0: 71 },
  { key: 'java', label: 'Java', monaco: 'java', judge0: 62 },
  { key: 'cpp', label: 'C++', monaco: 'cpp', judge0: 54 },
  { key: 'c', label: 'C', monaco: 'c', judge0: 50 },
  { key: 'javascript', label: 'JavaScript', monaco: 'javascript', judge0: 63 },
];

export const DEFAULT_SNIPPETS = {
  python: '# Write your solution here\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
  javascript: '// Write your solution here\n',
};

export const DIFFICULTY_COLORS = {
  Easy: 'badge-easy',
  Medium: 'badge-medium',
  Hard: 'badge-hard',
};

export const STATUS_COLORS = {
  Accepted: 'text-success',
  'Wrong Answer': 'text-danger',
  'Time Limit Exceeded': 'text-warning',
  'Runtime Error': 'text-danger',
  'Compilation Error': 'text-danger',
};

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function formatTime(date) {
  if (!date) {
    return 'No date';
  }

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'No date';
  }

  const now = new Date();
  const diff = (now - d) / 1000;

  if (diff < 60) {
    return 'just now';
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
