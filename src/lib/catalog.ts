import catalogData from "../data/catalog.json";
import tracksData from "../data/tracks.json";

export interface ProblemSummary {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  isPaidOnly?: boolean;
  acRate?: number;
  totalAcs?: number;
  totalSubmitted?: number;
}

export interface TrackSummary {
  id: string;
  name: string;
  description: string;
  total: number;
  problemIds: number[];
}

export interface SearchCriteria {
  difficulty?: string;
  topic?: string;
  search?: string;
  isPaidOnly?: boolean;
}

const TRACK_MAP = new Map<string, Set<number>>();
tracksData.tracks.forEach((t) => {
  TRACK_MAP.set(t.id, new Set(t.problemIds));
});

export class CatalogService {
  private static catalog: ProblemSummary[] = catalogData as ProblemSummary[];

  static getAll(): ProblemSummary[] {
    return CatalogService.catalog;
  }

  static getTracks(): TrackSummary[] {
    return tracksData.tracks;
  }

  static find(idOrSlug: number | string): ProblemSummary | undefined {
    if (typeof idOrSlug === "number" || !Number.isNaN(Number(idOrSlug))) {
      const numId = Number(idOrSlug);
      return CatalogService.catalog.find((p) => p.id === numId);
    }
    const slug = String(idOrSlug).toLowerCase().trim();
    return CatalogService.catalog.find((p) => p.slug.toLowerCase() === slug);
  }

  static search(criteria: SearchCriteria): ProblemSummary[] {
    return CatalogService.catalog.filter((p) => {
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
    const ids = TRACK_MAP.get(roadmapId);
    if (ids) {
      return CatalogService.catalog.filter((p) => ids.has(p.id));
    }
    return CatalogService.catalog;
  }

  static getRandom(criteria?: SearchCriteria): ProblemSummary {
    const list = criteria ? CatalogService.search(criteria) : CatalogService.catalog;
    if (list.length === 0) return CatalogService.catalog[0];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }
}
