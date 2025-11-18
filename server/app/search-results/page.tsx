"use client";

import { useWidgetProps } from "@/app/hooks";
import { ImageCard, Carousel } from "@ainativekit/ui";
import "@ainativekit/ui/styles";

interface BookResult {
  title: string;
  author_name: string[];
  cover?: string;
  key: string;
}

interface SearchResultsProps extends Record<string, unknown> {
  query?: string;
  results?: BookResult[];
  totalFound?: number;
}

export default function SearchResultsPage() {
  const props = useWidgetProps<SearchResultsProps>({
    query: "",
    results: [],
    totalFound: 0,
  });

  const results = props?.results || [];

  if (results.length === 0) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-600 dark:text-gray-400">
          No search results found. Try searching for a book title or author.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {props?.query && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Search Results for &quot;{props.query}&quot;
          </h2>
          {props.totalFound !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {props.totalFound} book{props.totalFound !== 1 ? "s" : ""}{" "}
              (showing top {results.length})
            </p>
          )}
        </div>
      )}

      <Carousel align="start" loop={false} gap="var(--ai-spacing-4)">
        {results.map((book, index) => (
          <ImageCard
            key={book.key || index}
            image={
              book.cover
                ? {
                    src: book.cover,
                    alt: `Cover for ${book.title}`,
                  }
                : "https://via.placeholder.com/300x400?text=No+Cover"
            }
            title={book.title}
            subtitle={book.author_name.join(", ")}
            actionIcon="product-tag"
            actionLabel={`Purchase ${book.title}`}
            onAction={() => {
              // Handle book purchase
              console.log("Purchase book:", book);
            }}
          />
        ))}
      </Carousel>
    </div>
  );
}
