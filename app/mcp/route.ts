import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { searchBooks } from "@/services/search-books";

export const revalidate = 0;

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  console.log("getAppsSdkCompatibleHtml", baseUrl, path);
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  // Book search widget
  const searchResultsHtml = await getAppsSdkCompatibleHtml(
    baseURL,
    "/mcp-components/search-results"
  );

  const searchBooksWidget: ContentWidget = {
    id: "search_books",
    title: "Search Books",
    templateUri: "ui://widget/search-books-template.html",
    invoking: "Searching for books...",
    invoked: "Book search completed",
    html: searchResultsHtml,
    description: "Displays book search results",
    widgetDomain: "https://openlibrary.org",
  };

  server.registerResource(
    "search-books-widget",
    searchBooksWidget.templateUri,
    {
      title: searchBooksWidget.title,
      description: searchBooksWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": searchBooksWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${searchBooksWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": searchBooksWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": searchBooksWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    searchBooksWidget.id,
    {
      title: searchBooksWidget.title,
      description:
        "Search for books using Open Library API. Returns the top 3 results with titles, authors, and cover images.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "The search term to find books (e.g., title, author, ISBN)"
          ),
      },
      _meta: widgetMeta(searchBooksWidget),
    },
    async ({ query }) => {
      const results = await searchBooks({ query, limit: 3, page: 1 });

      // Format results for the component
      const topResults = results.docs.slice(0, 3).map((book) => ({
        title: book.title || "Unknown Title",
        author_name: book.author_name || ["Unknown Author"],
        cover: book.cover && book.cover !== "unknown" ? book.cover : undefined,
        key: book.key,
      }));

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.num_found} books. Showing top 3 results.`,
          },
        ],
        structuredContent: {
          query,
          results: topResults,
          totalFound: results.num_found,
        },
        _meta: widgetMeta(searchBooksWidget),
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
