/**
 * Seed script — loads sample problems into the database.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Problem = require('../models/Problem');

const problems = [
  {
    title: 'Reverse String',
    slug: 'reverse-string',
    difficulty: 'Easy',
    description: `Write a function that reverses a string. The input is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    tags: ['String', 'Two Pointers'],
    examples: [
      { input: 'hello', output: 'olleh', explanation: 'The reversed string is "olleh".' },
      { input: 'Hannah', output: 'hannaH', explanation: 'The reversed string is "hannaH".' },
    ],
    constraints: '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { input: 'Hannah', expectedOutput: 'hannaH', isHidden: false },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: true },
      { input: 'CollabCode', expectedOutput: 'edoCballoC', isHidden: true },
    ],
    timeLimit: 1000,
    memoryLimit: 256,
    starterCode: {
      python: `def reverse_string(s):\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(reverse_string(s))\n`,
      java: `import java.util.*;\npublic class Main {\n    public static String reverseString(String s) {\n        // Write your solution here\n        return s;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(reverseString(sc.nextLine()));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nstring reverseString(string s) {\n    // Write your solution here\n    return s;\n}\nint main() {\n    string s;\n    getline(cin, s);\n    cout << reverseString(s) << endl;\n    return 0;\n}\n`,
      c: `#include <stdio.h>\n#include <string.h>\n// Write your solution here\nint main() {\n    char s[100001];\n    scanf("%s", s);\n    printf("%s\\n", s);\n    return 0;\n}\n`,
      javascript: `const reverseString = (s) => {\n    // Write your solution here\n    return s;\n};\nconst input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();\nconsole.log(reverseString(input));\n`,
    },
  },
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    difficulty: 'Easy',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    tags: ['String', 'Two Pointers'],
    examples: [
      { input: 'A man, a plan, a canal: Panama', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 'race a car', output: 'false', explanation: '"raceacar" is not a palindrome.' },
    ],
    constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isHidden: false },
      { input: ' ', expectedOutput: 'true', isHidden: true },
      { input: 'No lemon, no melon', expectedOutput: 'true', isHidden: true },
    ],
    timeLimit: 1000,
    memoryLimit: 256,
    starterCode: {
      python: `def is_palindrome(s):\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(str(is_palindrome(s)).lower())\n`,
      java: `import java.util.*;\npublic class Main {\n    public static boolean isPalindrome(String s) {\n        // Write your solution here\n        return true;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(isPalindrome(sc.nextLine()));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nbool isPalindrome(string s) {\n    // Write your solution here\n    return true;\n}\nint main() {\n    string s;\n    getline(cin, s);\n    cout << (isPalindrome(s) ? "true" : "false") << endl;\n    return 0;\n}\n`,
      c: `#include <stdio.h>\n// Write your solution here\nint main() {\n    char s[200001];\n    fgets(s, sizeof(s), stdin);\n    printf("true\\n");\n    return 0;\n}\n`,
      javascript: `const isPalindrome = (s) => {\n    // Write your solution here\n    return true;\n};\nconst input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();\nconsole.log(isPalindrome(input));\n`,
    },
  },
  {
    title: 'Binary Tree Inorder Traversal',
    slug: 'binary-tree-inorder-traversal',
    difficulty: 'Medium',
    description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.`,
    tags: ['Tree', 'DFS', 'Binary Tree'],
    examples: [
      { input: '1 null 2 3', output: '[1, 3, 2]', explanation: 'Inorder traversal visits left, root, then right.' },
    ],
    constraints: 'The number of nodes in the tree is in the range [0, 100].\n-100 <= Node.val <= 100',
    testCases: [
      { input: '1 null 2 3', expectedOutput: '[1, 3, 2]', isHidden: false },
      { input: 'null', expectedOutput: '[]', isHidden: true },
      { input: '1', expectedOutput: '[1]', isHidden: true },
    ],
    timeLimit: 1000,
    memoryLimit: 256,
    starterCode: {
      python: `def inorder_traversal(root):\n    # Write your solution here\n    pass\n`,
      java: `import java.util.*;\npublic class Main {\n    public static List<Integer> inorderTraversal(TreeNode root) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\nvector<int> inorderTraversal(TreeNode* root) {\n    // Write your solution here\n    return {};\n}\n`,
      c: `// Write your solution here\n`,
      javascript: `const inorderTraversal = (root) => {\n    // Write your solution here\n    return [];\n};\n`,
    },
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    tags: ['Hash Table', 'String', 'Sliding Window'],
    examples: [
      { input: 'abcabcbb', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 'bbbbb', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 'pwwkew', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb', expectedOutput: '1', isHidden: false },
      { input: 'pwwkew', expectedOutput: '3', isHidden: false },
      { input: '', expectedOutput: '0', isHidden: true },
      { input: ' ', expectedOutput: '1', isHidden: true },
      { input: 'au', expectedOutput: '2', isHidden: true },
    ],
    timeLimit: 2000,
    memoryLimit: 256,
    starterCode: {
      python: `def length_of_longest_substring(s):\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(length_of_longest_substring(s))\n`,
      java: `import java.util.*;\npublic class Main {\n    public static int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(lengthOfLongestSubstring(sc.nextLine()));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint lengthOfLongestSubstring(string s) {\n    // Write your solution here\n    return 0;\n}\nint main() {\n    string s;\n    getline(cin, s);\n    cout << lengthOfLongestSubstring(s) << endl;\n    return 0;\n}\n`,
      c: `#include <stdio.h>\n#include <string.h>\n// Write your solution here\nint main() {\n    char s[50001];\n    fgets(s, sizeof(s), stdin);\n    printf("0\\n");\n    return 0;\n}\n`,
      javascript: `const lengthOfLongestSubstring = (s) => {\n    // Write your solution here\n    return 0;\n};\nconst input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();\nconsole.log(lengthOfLongestSubstring(input));\n`,
    },
  },
    // ============================================================
  // 7. SORT AN ARRAY
  // ============================================================
  {
    title: 'Sort an Array',
    slug: 'sort-an-array',
    difficulty: 'Medium',
    description: `Given an integer array, return the values sorted in ascending order.

Design an efficient sorting solution suitable for large arrays.`,
    tags: ['Array', 'Sorting', 'Divide and Conquer', 'Merge Sort'],
    examples: [
      {
        input: '5 2 3 1',
        output: '[1,2,3,5]',
        explanation: 'The values are rearranged into ascending order.',
      },
      {
        input: '5 1 1 2 0 0',
        output: '[0,0,1,1,2,5]',
      },
    ],
    constraints:
      '1 <= nums.length <= 5 * 10^4\n-5 * 10^4 <= nums[i] <= 5 * 10^4',
    testCases: [
      { input: '5 2 3 1', expectedOutput: '[1,2,3,5]', isHidden: false },
      { input: '5 1 1 2 0 0', expectedOutput: '[0,0,1,1,2,5]', isHidden: false },
      { input: '1', expectedOutput: '[1]', isHidden: true },
      { input: '3 -1 2 -5 0', expectedOutput: '[-5,-1,0,2,3]', isHidden: true },
    ],
    timeLimit: 2000,
    memoryLimit: 256,

    starterCode: {
      python: `def sort_array(nums):
    # Write your solution here
    return nums

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    ans = sort_array(nums)
    print("[" + ",".join(map(str, ans)) + "]")
`,

      java: `import java.util.*;

public class Main {
    public static int[] sortArray(int[] nums) {
        // Write your solution here
        return nums;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                .mapToInt(Integer::parseInt)
                .toArray();

        int[] ans = sortArray(nums);

        System.out.print("[");
        for (int i = 0; i < ans.length; i++) {
            if (i > 0) System.out.print(",");
            System.out.print(ans[i]);
        }
        System.out.println("]");
    }
}
`,

      cpp: `#include <iostream>
#include <vector>
using namespace std;

vector<int> sortArray(vector<int> nums) {
    // Write your solution here
    return nums;
}

int main() {
    vector<int> nums;
    int x;

    while (cin >> x)
        nums.push_back(x);

    vector<int> ans = sortArray(nums);

    cout << "[";
    for (int i = 0; i < ans.size(); i++) {
        if (i) cout << ",";
        cout << ans[i];
    }
    cout << "]";

    return 0;
}
`,

      c: `#include <stdio.h>

int main() {
    int nums[50000];
    int n = 0;

    while (scanf("%d", &nums[n]) == 1)
        n++;

    // Write your sorting solution here

    printf("[");
    for (int i = 0; i < n; i++) {
        if (i) printf(",");
        printf("%d", nums[i]);
    }
    printf("]");

    return 0;
}
`,

      javascript: `function sortArray(nums) {
    // Write your solution here
    return nums;
}

const input = require('fs').readFileSync(0, 'utf8').trim();
const nums = input ? input.split(/\\s+/).map(Number) : [];

console.log(JSON.stringify(sortArray(nums)));
`,
    },
  },

  // ============================================================
  // 8. SUM OF SUBARRAY RANGES
  // ============================================================
  {
    title: 'Sum of Subarray Ranges',
    slug: 'sum-of-subarray-ranges',
    difficulty: 'Medium',
    description: `For each non-empty contiguous subarray, calculate its range as the maximum value minus the minimum value.

Return the sum of the ranges of all possible subarrays.`,
    tags: ['Array', 'Stack', 'Monotonic Stack'],
    examples: [
      {
        input: '1 2 3',
        output: '4',
        explanation: 'The ranges of all contiguous subarrays add up to 4.',
      },
      {
        input: '1 3 3',
        output: '4',
      },
    ],
    constraints:
      '1 <= nums.length <= 1000\n-10^9 <= nums[i] <= 10^9',
    testCases: [
      { input: '1 2 3', expectedOutput: '4', isHidden: false },
      { input: '1 3 3', expectedOutput: '4', isHidden: false },
      { input: '4 -2 -3 4 1', expectedOutput: '59', isHidden: true },
      { input: '5', expectedOutput: '0', isHidden: true },
    ],
    timeLimit: 2000,
    memoryLimit: 256,

    starterCode: {
      python: `def subarray_ranges(nums):
    # Write your solution here
    return 0

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    print(subarray_ranges(nums))
`,

      java: `import java.util.*;

public class Main {
    public static long subArrayRanges(int[] nums) {
        // Write your solution here
        return 0L;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                .mapToInt(Integer::parseInt)
                .toArray();

        System.out.println(subArrayRanges(nums));
    }
}
`,

      cpp: `#include <iostream>
#include <vector>
using namespace std;

long long subArrayRanges(vector<int>& nums) {
    // Write your solution here
    return 0;
}

int main() {
    vector<int> nums;
    int x;

    while (cin >> x)
        nums.push_back(x);

    cout << subArrayRanges(nums);
    return 0;
}
`,

      c: `#include <stdio.h>

long long subArrayRanges(long long nums[], int n) {
    // Write your solution here
    return 0;
}

int main() {
    long long nums[1000];
    int n = 0;

    while (scanf("%lld", &nums[n]) == 1)
        n++;

    printf("%lld", subArrayRanges(nums, n));
    return 0;
}
`,

      javascript: `function subArrayRanges(nums) {
    // Write your solution here
    return 0;
}

const nums = require('fs')
    .readFileSync(0, 'utf8')
    .trim()
    .split(/\\s+/)
    .filter(Boolean)
    .map(Number);

console.log(subArrayRanges(nums));
`,
    },
  },
  // ============================================================
  // 10. MERGE TWO SORTED LISTS
  // ============================================================
  {
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    description: `Two sorted sequences represent the values of two linked lists.

Merge them into one sorted sequence and return the merged values.`,
    tags: ['Linked List', 'Two Pointers', 'Recursion'],
    examples: [
      {
        input: '1 2 4\\n1 3 4',
        output: '[1,1,2,3,4,4]',
      },
      {
        input: '\\n0',
        output: '[0]',
      },
    ],
    constraints:
      '0 <= number of nodes in each list <= 50\n-100 <= Node.val <= 100\nBoth lists are sorted.',
    testCases: [
      {
        input: '1 2 4\n1 3 4',
        expectedOutput: '[1,1,2,3,4,4]',
        isHidden: false,
      },
      {
        input: '\n0',
        expectedOutput: '[0]',
        isHidden: false,
      },
      {
        input: '-3 -1 2\n-2 0 4',
        expectedOutput: '[-3,-2,-1,0,2,4]',
        isHidden: true,
      },
    ],
    timeLimit: 1000,
    memoryLimit: 256,

    starterCode: {
      python: `def merge_two_lists(a, b):
    # Write your solution here
    return []

if __name__ == "__main__":
    import sys

    lines = sys.stdin.read().splitlines()

    a = list(map(int, lines[0].split())) if len(lines) > 0 and lines[0].strip() else []
    b = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []

    ans = merge_two_lists(a, b)

    print("[" + ",".join(map(str, ans)) + "]")
`,

      java: `import java.util.*;

public class Main {
    public static List<Integer> mergeTwoLists(int[] a, int[] b) {
        // Write your solution here
        return new ArrayList<>();
    }

    static int[] parse(String line) {
        if (line == null || line.trim().isEmpty())
            return new int[0];

        return Arrays.stream(line.trim().split("\\\\s+"))
                .mapToInt(Integer::parseInt)
                .toArray();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        String line1 = sc.hasNextLine() ? sc.nextLine() : "";
        String line2 = sc.hasNextLine() ? sc.nextLine() : "";

        List<Integer> result =
                mergeTwoLists(parse(line1), parse(line2));

        System.out.println(
                result.toString().replace(" ", "")
        );
    }
}
`,

      cpp: `#include <iostream>
#include <sstream>
#include <vector>
using namespace std;

vector<int> mergeTwoLists(vector<int> a, vector<int> b) {
    // Write your solution here
    return {};
}

vector<int> parseLine(string line) {
    vector<int> nums;
    stringstream ss(line);
    int x;

    while (ss >> x)
        nums.push_back(x);

    return nums;
}

int main() {
    string line1, line2;

    getline(cin, line1);
    getline(cin, line2);

    vector<int> ans =
        mergeTwoLists(parseLine(line1), parseLine(line2));

    cout << "[";

    for (int i = 0; i < ans.size(); i++) {
        if (i) cout << ",";
        cout << ans[i];
    }

    cout << "]";
    return 0;
}
`,

      c: `#include <stdio.h>

// Implement merge logic here.
// Input contains two sorted sequences.

int main() {
    return 0;
}
`,

      javascript: `function mergeTwoLists(a, b) {
    // Write your solution here
    return [];
}

const lines = require('fs')
    .readFileSync(0, 'utf8')
    .split(/\\r?\\n/);

const a =
    lines[0] && lines[0].trim()
        ? lines[0].trim().split(/\\s+/).map(Number)
        : [];

const b =
    lines[1] && lines[1].trim()
        ? lines[1].trim().split(/\\s+/).map(Number)
        : [];

console.log(JSON.stringify(mergeTwoLists(a, b)));
`,
    },
  },

  // ============================================================
  // 11. FIRST MISSING POSITIVE
  // ============================================================
  {
    title: 'First Missing Positive',
    slug: 'first-missing-positive',
    difficulty: 'Hard',
    description: `Given an unsorted integer array, return the smallest positive integer that does not appear in the array.

Try to solve the problem efficiently using constant additional space.`,
    tags: ['Array', 'Hashing', 'In-place'],
    examples: [
      { input: '1 2 0', output: '3' },
      { input: '3 4 -1 1', output: '2' },
      { input: '7 8 9 11 12', output: '1' },
    ],
    constraints:
      '1 <= nums.length <= 10^5\n-2^31 <= nums[i] <= 2^31 - 1',
    testCases: [
      { input: '1 2 0', expectedOutput: '3', isHidden: false },
      { input: '3 4 -1 1', expectedOutput: '2', isHidden: false },
      { input: '7 8 9 11 12', expectedOutput: '1', isHidden: false },
      { input: '1 1', expectedOutput: '2', isHidden: true },
      { input: '2 1', expectedOutput: '3', isHidden: true },
    ],
    timeLimit: 2000,
    memoryLimit: 256,

    starterCode: {
      python: `def first_missing_positive(nums):
    # Write your solution here
    return 1

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    print(first_missing_positive(nums))
`,

      java: `import java.util.*;

public class Main {
    public static int firstMissingPositive(int[] nums) {
        // Write your solution here
        return 1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int[] nums = Arrays.stream(sc.nextLine().trim().split("\\\\s+"))
                .mapToInt(Integer::parseInt)
                .toArray();

        System.out.println(firstMissingPositive(nums));
    }
}
`,

      cpp: `#include <iostream>
#include <vector>
using namespace std;

int firstMissingPositive(vector<int>& nums) {
    // Write your solution here
    return 1;
}

int main() {
    vector<int> nums;
    int x;

    while (cin >> x)
        nums.push_back(x);

    cout << firstMissingPositive(nums);
    return 0;
}
`,

      c: `#include <stdio.h>

int firstMissingPositive(int nums[], int n) {
    // Write your solution here
    return 1;
}

int main() {
    int nums[100000];
    int n = 0;

    while (scanf("%d", &nums[n]) == 1)
        n++;

    printf("%d", firstMissingPositive(nums, n));
    return 0;
}
`,

      javascript: `function firstMissingPositive(nums) {
    // Write your solution here
    return 1;
}

const nums = require('fs')
    .readFileSync(0, 'utf8')
    .trim()
    .split(/\\s+/)
    .filter(Boolean)
    .map(Number);

console.log(firstMissingPositive(nums));
`,
    },
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Seeding problems...');

    await Problem.deleteMany({});

    const publishedProblems = problems.map((problem) => ({
      ...problem,
      isPublished: true,
    }));

    const created = await Problem.insertMany(publishedProblems);

    console.log(`✅ Seeded ${created.length} problems:`);
    created.forEach((p) => {
      console.log(`   - ${p.title} [${p.difficulty}] (${p.testCases.length} test cases)`);
    });

    await mongoose.disconnect();
    console.log('🌱 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
