import { z } from "zod";
import packageJson from "../package.json";

const BookDocSchema = z.object({
  cover_i: z.number().optional(),
  has_fulltext: z.boolean().optional(),
  edition_count: z.number().optional(),
  title: z.string().optional(),
  author_name: z.array(z.string()).optional(),
  first_publish_year: z.number().optional(),
  key: z.string().optional(),
  ia: z.array(z.string()).optional(),
  author_key: z.array(z.string()).optional(),
  public_scan_b: z.boolean().optional(),
  isbn: z.array(z.string()).optional(),
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
  title?: string;
  author_key?: string[];
  isbn?: string[];
}

export interface SearchWorksResponse {
  start: number;
  num_found: number;
  docs: WorkDoc[];
}

export async function searchWorks(
  options: SearchWorksOptions
): Promise<SearchWorksResponse> {
  const { query, limit = 10, page = 1, fields } = options;

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));

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
