import { searchWorks, getAuthor, getCoverUrl } from "./open-library-api";

export interface BookResult {
  title?: string;
  author_name?: string[];
  cover?: string;
}

export interface SearchBooksResponse {
  start: number;
  num_found: number;
  docs: BookResult[];
}

interface SearchBooksOptions {
  query: string;
  limit?: number;
  page?: number;
}

export async function searchBooks(
  options: SearchBooksOptions
): Promise<SearchBooksResponse> {
  const { query, limit = 5, page = 1 } = options;

  // Search for works
  const searchResults = await searchWorks({
    query,
    limit,
    page,
  });

  // Fetch author names for each work
  const docsWithAuthors = await Promise.all(
    searchResults.docs.map(async (doc) => {
      const authorNames: string[] = [];

      if (doc.author_key && doc.author_key.length > 0) {
        // Fetch author names for all authors
        const authorPromises = doc.author_key.map(async (authorKey) => {
          try {
            const author = await getAuthor(authorKey);
            return author.name || author.personal_name || null;
          } catch (error) {
            // If author fetch fails, return null
            console.error(`Failed to fetch author ${authorKey}:`, error);
            return null;
          }
        });

        const names = await Promise.all(authorPromises);
        authorNames.push(
          ...names.filter((name): name is string => name !== null)
        );
      }

      const coverUrl = doc.cover_i
        ? getCoverUrl({ isbn: doc.isbn[0], coverId: doc.cover_i })
        : undefined;

      return {
        key: doc.key || "unknown",
        title: doc.title,
        author_name: authorNames.length > 0 ? authorNames : undefined,
        cover: coverUrl || "unknown",
        isbn: doc.isbn,
      };
    })
  );

  return {
    start: searchResults.start,
    num_found: searchResults.num_found,
    docs: docsWithAuthors,
  };
}
