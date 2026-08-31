import { ProblemFetcher } from "../src/lib/fetcher";

const testIds = [1, 20, 2058, 269, 253, 3, 5, 234];
console.log("=== RUNNING QA ON SAMPLE PROBLEMS ===");
for (const id of testIds) {
  const p = await ProblemFetcher.fetchProblem(id);
  const tcValid = p.testCases.length > 0 && p.testCases.every(tc => tc.input && tc.expected !== undefined);
  console.log(`Problem #${p.id} ${p.title} (${p.difficulty}) [${p.isPaidOnly ? 'Premium' : 'Free'}]:`);
  console.log(`  - Statement Length: ${p.descriptionHtml.length} chars`);
  console.log(`  - Starter Code: ${Object.keys(p.starterCode).length} languages`);
  console.log(`  - Reference Solutions: ${p.solutions.length} solutions`);
  console.log(`  - Test Cases: ${p.testCases.length} parsed (Valid: ${tcValid})`);
  if (p.testCases.length > 0) {
    console.log(`    Sample TC 1: Input="${p.testCases[0].input}" | Expected="${p.testCases[0].expected}"`);
  }
}
