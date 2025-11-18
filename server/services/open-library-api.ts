import { z } from "zod";
import packageJson from "../package.json";

const BookDocSchema = z.object({
  key: z.string(),
  cover_i: z.number(),
  title: z.string(),
  author_key: z.array(z.string()),
  has_fulltext: z.boolean().optional(),
  edition_count: z.number().optional(),
  author_name: z.array(z.string()).optional(),
  first_publish_year: z.number().optional(),
  ia: z.array(z.string()).optional(),
  public_scan_b: z.boolean().optional(),
  isbn: z.array(z.string()),
});

const OpenLibrarySearchResponseSchema = z.object({
  start: z.number(),
  num_found: z.number(),
  docs: z.array(BookDocSchema),
});

type OpenLibrarySearchResponse = z.infer<
  typeof OpenLibrarySearchResponseSchema
>;

// Author API schemas and types
const AuthorSchema = z.object({
  key: z.string(),
  name: z.string().optional(),
  alternate_names: z.array(z.string()).optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  personal_name: z.string().optional(),
});

type Author = z.infer<typeof AuthorSchema>;

// Search API wrapper
export interface SearchWorksOptions {
  query: string;
  limit?: number;
  page?: number;
  fields?: string[];
}

export interface WorkDoc {
  key: string;
  title: string;
  author_key: string[];
  cover_i: number;
  isbn: string[];
}

export interface SearchWorksResponse {
  start: number;
  num_found: number;
  docs: WorkDoc[];
}

export async function searchWorks(
  options: SearchWorksOptions
): Promise<SearchWorksResponse> {
  const {
    query,
    limit = 10,
    page = 1,
    fields = ["key", "title", "author_key", "isbn", "cover_i"],
  } = options;

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort", "rating desc");

  if (fields && fields.length > 0) {
    url.searchParams.set("fields", fields.join(","));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": `bestreads/${packageJson.version} bestreads@tomelliot.net`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Open Library API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const parsed = OpenLibrarySearchResponseSchema.parse(data);

  return {
    start: parsed.start,
    num_found: parsed.num_found,
    docs: parsed.docs.map((doc) => ({
      key: doc.key,
      cover_i: doc.cover_i,
      title: doc.title,
      author_key: doc.author_key,
      isbn: doc.isbn,
    })),
  };
}

// Author API wrapper
export async function getAuthor(authorKey: string): Promise<Author> {
  // Remove leading /authors/ if present
  const cleanKey = authorKey.replace(/^\/?authors\//, "");
  const url = `https://openlibrary.org/authors/${cleanKey}.json`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": `bestreads/${packageJson.version} bestreads@tomelliot.net`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Open Library API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return AuthorSchema.parse(data);
}

// Cover API wrapper
export type CoverSize = "S" | "M" | "L";

export interface GetCoverUrlOptions {
  coverId?: number;
  isbn?: string;
  olid?: string;
  size?: CoverSize;
}

/**
 * Generates a cover URL using the Open Library Covers API
 * @param options - Options for generating the cover URL
 * @returns Cover URL string, or undefined if no valid identifier is provided
 */
export function getCoverUrl(options: GetCoverUrlOptions): string | undefined {
  const { coverId, isbn, olid, size = "M" } = options;

  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
  }

  if (coverId !== undefined) {
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  }

  if (olid) {
    return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`;
  }
  return undefined;
}
