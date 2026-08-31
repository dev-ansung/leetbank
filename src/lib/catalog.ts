import catalogData from "../data/catalog.json";

export interface ProblemSummary {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  isPaidOnly?: boolean;
  acRate?: string;
  totalAccepted?: string;
}

export interface SearchCriteria {
  difficulty?: string;
  topic?: string;
  search?: string;
  isPaidOnly?: boolean;
}

const BLIND_75_IDS = new Set([1, 11, 15, 19, 20, 21, 23, 33, 39, 48, 49, 53, 54, 55, 56, 57, 62, 70, 73, 76, 79, 91, 98, 100, 102, 104, 105, 121, 124, 125, 128, 133, 139, 141, 143, 146, 152, 153, 190, 191, 198, 200, 206, 207, 208, 211, 212, 213, 217, 226, 230, 235, 238, 242, 252, 253, 261, 268, 269, 287, 295, 297, 300, 322, 323, 338, 347, 371, 417, 424, 435, 438, 572, 647, 1143]);

export class CatalogService {
  private static catalog: ProblemSummary[] = catalogData as ProblemSummary[];

  static getAll(): ProblemSummary[] {
    return this.catalog;
  }

  static find(idOrSlug: number | string): ProblemSummary | undefined {
    if (typeof idOrSlug === "number" || !isNaN(Number(idOrSlug))) {
      const numId = Number(idOrSlug);
      return this.catalog.find((p) => p.id === numId);
    }
    const slug = String(idOrSlug).toLowerCase().trim();
    return this.catalog.find((p) => p.slug.toLowerCase() === slug);
  }

  static search(criteria: SearchCriteria): ProblemSummary[] {
    return this.catalog.filter((p) => {
      if (criteria.difficulty && criteria.difficulty !== "All" && p.difficulty !== criteria.difficulty) {
        return false;
      }
      if (criteria.topic && !p.topics.some((t) => t.toLowerCase() === criteria.topic!.toLowerCase())) {
        return false;
      }
      if (criteria.isPaidOnly !== undefined && p.isPaidOnly !== criteria.isPaidOnly) {
        return false;
      }
      if (criteria.search) {
        const q = criteria.search.toLowerCase().trim();
        const matchesId = p.id.toString() === q;
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        const matchesTopic = p.topics.some((t) => t.toLowerCase().includes(q));
        if (!matchesId && !matchesTitle && !matchesSlug && !matchesTopic) {
          return false;
        }
      }
      return true;
    });
  }

  static getRoadmap(roadmapId: string): ProblemSummary[] {
    if (roadmapId === "blind75") {
      return this.catalog.filter((p) => BLIND_75_IDS.has(p.id));
    }
    return this.catalog;
  }

  static getRandom(criteria?: SearchCriteria): ProblemSummary {
    const list = criteria ? this.search(criteria) : this.catalog;
    if (list.length === 0) return this.catalog[0];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }
}
