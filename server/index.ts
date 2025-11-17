import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { searchBooks } from "./services/search-books";
import packageJson from "./package.json";

const server = new McpServer({
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

// Load locally built assets (produced by your component build)
const TESTCOMPONENT_JS = readFileSync("../web/dist/TestComponent.js", "utf8");
console.log(TESTCOMPONENT_JS);
const TESTCOMPONENT_CSS = (() => {
  try {
    return readFileSync("../web/dist/TestComponent.css", "utf8");
  } catch {
    return ""; // CSS optional
  }
})();

server.registerResource(
  "test-component-widget",
  "ui://widget/test-component-board.html",
  {},
  async () => {
    console.log("test-component-widget resource called");
    return {
      contents: [
        {
          uri: "ui://widget/test-component-board.html",
          mimeType: "text/html+skybridge",
          text: `
          <div>
          <div>here is some test content</div>
          <div id="test-component-root"><div>here is some test content that should be replaced by the test component</div></div>
          </div>
${TESTCOMPONENT_CSS ? `<style>${TESTCOMPONENT_CSS}</style>` : ""}
<script type="module">${TESTCOMPONENT_JS}</script>
        `.trim(),
          _meta: {
            /* 
            Renders the widget within a rounded border and shadow. 
            Otherwise, the HTML is rendered full-bleed in the conversation
          */
            "openai/widgetPrefersBorder": true,

            /* 
            Assigns a subdomain for the HTML. 
            When set, the HTML is rendered within `chatgpt-com.web-sandbox.oaiusercontent.com`
            It's also used to configure the base url for external links.
          */
            "openai/widgetDomain": "https://chatgpt.com",

            /*
            Required to make external network requests from the HTML code. 
            Also used to validate `openai.openExternal()` requests. 
          */
            "openai/widgetCSP": {
              // Maps to `connect-src` rule in the iframe CSP
              connect_domains: ["https://chatgpt.com"],
              // Maps to style-src, style-src-elem, img-src, font-src, media-src etc. in the iframe CSP
              resource_domains: ["https://*.oaistatic.com"],
            },
          },
        },
      ],
    };
  }
);

server.registerTool(
  "searchBook",
  {
    title: "Search for books",
    description: "Use this to search for books",
    inputSchema: searchBookParametersSchema.shape,
    _meta: {
      // associate this tool with the HTML template
      "openai/outputTemplate": "ui://widget/test-component-board.html",
      // labels to display in ChatGPT when the tool is called
      "openai/toolInvocation/invoking": "Displaying the test component",
      "openai/toolInvocation/invoked": "Displayed the test component",
    },
  },
  async (args: z.infer<typeof searchBookParametersSchema>) => {
    console.log("searchBook tool called with args:", args);
    const results = await searchBooks({
      query: args.searchTerm,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
);

// Set up Express and HTTP transport
const app = express();
app.use(express.json());

app.post("/mcp", async (req: express.Request, res: express.Response) => {
  // Create a new transport for each request to prevent request ID collisions
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || "8000");
app
  .listen(port, () => {
    console.log(`Demo MCP Server running on http://localhost:${port}/mcp`);
  })
  .on("error", (error: Error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
