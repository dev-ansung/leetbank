import { describe, expect, it } from "bun:test";
import { PythonModernizer } from "../src/lib/modernizer";

describe("Python 3.14 AST Modernizer TDD Suite", () => {
  it("should convert camelCase method signatures to PEP 8 snake_case", () => {
    const code = "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass\n";
    const modernized = PythonModernizer.modernize(code);
    expect(modernized).toContain("def two_sum(self");
  });

  it("should modernize typing generics to PEP 585 built-in collections", () => {
    const code = "def solve(self, a: List[int], b: Dict[str, List[int]], c: Set[int]) -> Tuple[int, str]:\n    pass\n";
    const modernized = PythonModernizer.modernize(code);
    expect(modernized).toContain("list[int]");
    expect(modernized).toContain("dict[str, list[int]]");
    expect(modernized).toContain("set[int]");
    expect(modernized).toContain("tuple[int, str]");
    expect(modernized).not.toContain("List[");
  });

  it("should modernize Optional and Union types to PEP 604 union syntax", () => {
    const code = "def find(self, root: Optional[TreeNode]) -> Union[int, str, None]:\n    pass\n";
    const modernized = PythonModernizer.modernize(code);
    expect(modernized).toContain("TreeNode | None");
    expect(modernized).toContain("int | str | None");
    expect(modernized).not.toContain("Optional[");
    expect(modernized).not.toContain("Union[");
  });

  it("should auto-inject ListNode and TreeNode definitions when referenced", () => {
    const code = "class Solution:\n    def merge(self, l1: ListNode | None, l2: ListNode | None) -> ListNode | None:\n        pass\n";
    const modernized = PythonModernizer.modernize(code);
    expect(modernized).toContain("class ListNode:");
    expect(modernized).toContain("self.val = val");
    expect(modernized).toContain("self.next = next");
  });
});
