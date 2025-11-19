"use client";

import { useEffect } from "react";
import SearchResultsPage from "@/app/mcp-components/search-results/page";
import { SET_GLOBALS_EVENT_TYPE, SetGlobalsEvent } from "@/app/hooks/types";

// Mock book data for testing
const mockBookResults = [
  {
    title: "The Great Gatsby",
    author_name: ["F. Scott Fitzgerald"],
    cover: "https://covers.openlibrary.org/b/id/8229351-L.jpg",
    key: "/works/OL82563W",
  },
  {
    title: "To Kill a Mockingbird",
    author_name: ["Harper Lee"],
    cover: "https://covers.openlibrary.org/b/id/8267186-L.jpg",
    key: "/works/OL82564W",
  },
  {
    title: "1984",
    author_name: ["George Orwell"],
    cover: "https://covers.openlibrary.org/b/id/8267187-L.jpg",
    key: "/works/OL82565W",
  },
  {
    title: "Pride and Prejudice",
    author_name: ["Jane Austen"],
    cover: "https://covers.openlibrary.org/b/id/8267188-L.jpg",
    key: "/works/OL82566W",
  },
  {
    title: "The Catcher in the Rye",
    author_name: ["J.D. Salinger"],
    cover: "https://covers.openlibrary.org/b/id/8267189-L.jpg",
    key: "/works/OL82567W",
  },
  {
    title: "Lord of the Flies",
    author_name: ["William Golding"],
    cover: "https://covers.openlibrary.org/b/id/8267190-L.jpg",
    key: "/works/OL82568W",
  },
];

export default function TestPage() {
  useEffect(() => {
    // Mock the ChatGPT SDK context for testing
    if (typeof window !== "undefined") {
      // Initialize window.openai if it doesn't exist
      if (!(window as any).openai) {
        (window as any).openai = {};
      }

      const mockToolOutput = {
        query: "classic literature",
        results: mockBookResults,
        totalFound: 150,
      };

      // Set mock toolOutput (widget props) directly on window.openai
      (window as any).openai.toolOutput = mockToolOutput;

      // Mock other required OpenAI SDK methods
      (window as any).openai.setWidgetState = () => Promise.resolve();
      (window as any).openai.openExternal = () => {};

      // Dispatch the event to trigger useSyncExternalStore subscriptions
      const event = new CustomEvent(SET_GLOBALS_EVENT_TYPE, {
        detail: {
          globals: {
            toolOutput: mockToolOutput,
          },
        },
      }) as SetGlobalsEvent;

      window.dispatchEvent(event);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Search Results Component Test
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This page tests the SearchResultsPage component with mock data
          </p>
        </div>
        <SearchResultsPage />
      </div>
    </div>
  );
}
