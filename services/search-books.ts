import { searchWorks, getAuthor } from "./open-library-api";

export interface BookResult {
  title?: string;
  author_name?: string[];
  isbn?: string[];
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
  const { query, limit = 10, page = 1 } = options;

  // Search for works
  const searchResults = await searchWorks({
    query,
    limit,
    page,
    fields: ["title", "author_key", "isbn"],
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
        authorNames.push(...names.filter((name): name is string => name !== null));
      }

      return {
        title: doc.title,
        author_name: authorNames.length > 0 ? authorNames : undefined,
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

