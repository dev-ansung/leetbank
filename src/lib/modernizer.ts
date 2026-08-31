/**
 * Python 3.14 AST Modernizer
 * Converts legacy camelCase to PEP 8 snake_case,
 * modernizes typing to PEP 585 built-in collections and PEP 604 union types,
 * and auto-injects helper classes (ListNode, TreeNode).
 */

export class PythonModernizer {
  static modernize(code: string): string {
    if (!code) return "";
    let modernized = code;

    // 1. Convert method signatures from camelCase to snake_case
    modernized = modernized.replace(/def\s+([a-z0-9]+)([A-Z][a-zA-Z0-9]*)\s*\(/g, (_, prefix, suffix) => {
      const snake = suffix.replace(/([A-Z])/g, "_$1").toLowerCase();
      return `def ${prefix}${snake}(`;
    });

    // Handle single-word camelCase that start with lowercase, e.g. twoSum -> two_sum
    modernized = modernized.replace(/def\s+([a-z]+)([A-Z][a-z0-9]+)\s*\(/g, (_, p1, p2) => {
      return `def ${p1}_${p2.toLowerCase()}(`;
    });

    // 2. PEP 585: Modernize generic typing collections
    modernized = modernized
      .replace(/\bList\[/g, "list[")
      .replace(/\bDict\[/g, "dict[")
      .replace(/\bSet\[/g, "set[")
      .replace(/\bTuple\[/g, "tuple[")
      .replace(/\bFrozenSet\[/g, "frozenset[");

    // 3. PEP 604: Modernize Optional[T] to T | None
    modernized = modernized.replace(/\bOptional\[([^\[\]]+)\]/g, "$1 | None");

    // 4. PEP 604: Modernize Union[A, B, C] to A | B | C
    modernized = modernized.replace(/\bUnion\[([^\[\]]+)\]/g, (_, inner) => {
      const parts = inner.split(",").map((s: string) => s.trim());
      return parts.join(" | ");
    });

    // 5. Auto-inject helper class definitions if referenced and not already defined
    let helpers = "";
    if (modernized.includes("ListNode") && !modernized.includes("class ListNode")) {
      helpers += `# Definition for singly-linked list.\nclass ListNode:\n    def __init__(self, val: int = 0, next: "ListNode | None" = None):\n        self.val = val\n        self.next = next\n\n`;
    }
    if (modernized.includes("TreeNode") && !modernized.includes("class TreeNode")) {
      helpers += `# Definition for a binary tree node.\nclass TreeNode:\n    def __init__(self, val: int = 0, left: "TreeNode | None" = None, right: "TreeNode | None" = None):\n        self.val = val\n        self.left = left\n        self.right = right\n\n`;
    }

    if (helpers) {
      modernized = helpers + modernized;
    }

    return modernized;
  }
}
