import { FastMCP } from "fastmcp";
import { z } from "zod";
import { searchBooks } from "./services/search-books";
import packageJson from "./package.json";

const server = new FastMCP({
  name: "Bestreads",
  version: packageJson.version as `${number}.${number}.${number}`,
});

const searchBookParametersSchema = z.object({
  searchTerm: z
    .string()
    .describe(
      "The search term to find books - book title, author name, series name, etc."
    ),
});

server.addTool({
  name: "searchBook",
  description: "Use this to search for books",
  parameters: searchBookParametersSchema,
  execute: async (args: z.infer<typeof searchBookParametersSchema>) => {
    const results = await searchBooks({
      query: args.searchTerm,
    });
    return JSON.stringify(results, null, 2);
  },
});

server.start({
  transportType: "httpStream",
});
