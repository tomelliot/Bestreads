# Bestreads ChatGPT App

A ChatGPT Apps SDK application built with Next.js that demonstrates how to create custom UI components that render within ChatGPT conversations.

## Architecture Overview

This project uses a **Next.js server** that serves dual purposes:

1. **MCP Server** (`app/mcp/route.ts`) - Exposes tools and resources to ChatGPT via the Model Context Protocol
2. **React Component Host** - Serves the React component HTML that renders inside ChatGPT's iframe

### Data Flow

```
ChatGPT → MCP Tool Call → Next.js MCP Server → Tool Response (structuredContent)
                                                      ↓
ChatGPT → Resource Request → Next.js Serves HTML → React Component Hydrates
                                                      ↓
React Component → useWidgetProps() → window.openai.toolOutput → Renders UI
```

## Scaffolding Tools (MCP Server)

Tools are registered in `app/mcp/route.ts` using the `createMcpHandler` pattern.

### 1. Define Tool Schema

Use Zod to define the input schema:

```typescript
import { z } from "zod";

server.registerTool(
  "my_tool_id",
  {
    title: "My Tool",
    description: "What this tool does",
    inputSchema: {
      userId: z.string().describe("The user ID"),
      name: z.string().describe("The user's name"),
    },
    _meta: widgetMeta(myWidget), // Links tool to widget resource
  },
  async ({ userId, name }) => {
    // Tool implementation
  }
);
```

### 2. Return Structured Content

The tool handler must return `structuredContent` in the response. This data is passed to your React component:

```typescript
async ({ userId, name }) => {
  return {
    content: [{ type: "text", text: "Tool executed successfully" }],
    structuredContent: {
      userId,
      name,
      timestamp: new Date().toISOString(),
      // Add any data your component needs
    },
    _meta: widgetMeta(myWidget),
  };
}
```

### 3. Register Widget Resource

Each tool that renders a UI needs a corresponding resource that serves the React component HTML:

```typescript
const myWidget: ContentWidget = {
  id: "my_tool_id",
  title: "My Tool",
  templateUri: "ui://widget/my-widget.html",
  invoking: "Loading...",
  invoked: "Loaded",
  html: await getAppsSdkCompatibleHtml(baseURL, "/my-component"),
  description: "Displays my component",
  widgetDomain: "https://example.com",
};

server.registerResource(
  "my-widget",
  myWidget.templateUri,
  {
    title: myWidget.title,
    description: myWidget.description,
    mimeType: "text/html+skybridge",
    _meta: {
      "openai/widgetDescription": myWidget.description,
      "openai/widgetPrefersBorder": true,
    },
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/html+skybridge",
        text: `<html>${myWidget.html}</html>`,
        _meta: {
          "openai/widgetDescription": myWidget.description,
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": myWidget.widgetDomain,
        },
      },
    ],
  })
);
```

**Key Points:**
- `templateUri` must match the `openai/outputTemplate` in tool metadata
- `html` is fetched from a Next.js route (e.g., `/my-component`)
- The resource handler returns the HTML wrapped in `<html>` tags

## Scaffolding Components (ChatGPT SDK)

React components are standard Next.js pages that read data from ChatGPT via the `window.openai` API.

### 1. Create Component Page

Create a new page in `app/my-component/page.tsx`:

```tsx
"use client";

import { useWidgetProps } from "@/app/hooks";

export default function MyComponent() {
  const props = useWidgetProps<{
    userId?: string;
    name?: string;
    timestamp?: string;
  }>();

  return (
    <div>
      <h1>Hello, {props?.name}</h1>
      <p>User ID: {props?.userId}</p>
    </div>
  );
}
```

### 2. Access Tool Output Data

Use the `useWidgetProps()` hook to access data from the tool's `structuredContent`:

```tsx
const toolOutput = useWidgetProps<MyToolOutputType>();
```

This hook reads from `window.openai.toolOutput`, which contains the `structuredContent` returned by your tool.

### 3. Access Other ChatGPT Globals

Use hooks from `app/hooks` to access other ChatGPT context:

```tsx
import {
  useDisplayMode,      // "inline" | "pip" | "fullscreen"
  useMaxHeight,        // Container max height
  useWidgetState,      // Persistent widget state
  useCallTool,         // Call MCP tools from component
  useSendMessage,      // Send follow-up messages
} from "@/app/hooks";
```

### 4. Widget State (Persistent Data)

Use `useWidgetState()` to persist data across user interactions:

```tsx
const [state, setState] = useWidgetState<{ favorites: string[] }>({
  favorites: [],
});

// Update state (automatically persisted and sent to ChatGPT)
setState({ favorites: [...state.favorites, newItem] });
```

**Important:** Widget state is scoped to a single widget instance and is visible to ChatGPT. Keep payloads under 4k tokens.

## Design Guidelines for ChatGPT Components

Components in `app/mcp-components/` must follow OpenAI's design guidelines to ensure they feel native to ChatGPT. The layout at `app/mcp-components/layout.tsx` enforces these constraints.

### Key Constraints

- **Typography**: Use system fonts only (inherit platform-native fonts like SF Pro on iOS, Roboto on Android). No custom fonts, even in fullscreen modes.
- **Colors**: 
  - Use system colors for text, icons, and spatial elements (dividers, backgrounds)
  - Brand colors are **only allowed on primary buttons** via CSS variables (`--brand-primary`)
  - Do not override text colors or backgrounds with brand colors
- **Spacing**: Use system grid spacing and maintain consistent padding
- **Accessibility**: Maintain WCAG AA contrast ratios, provide alt text for images, support text resizing

### Using Brand Colors on Buttons

```tsx
// Apply brand color to primary buttons
<button data-brand="primary" className="btn-primary">
  Action
</button>
```

The brand color CSS variables are defined in `app/mcp-components/widgets.css` and can be customized per your brand.

**Full guidelines:** See [`docs/openai/design-guidelines .md`](server/docs/openai/design-guidelines%20.md) for complete visual design, tone, and interaction guidelines.

## Passing Data Between Tool and Component

### Tool → Component

1. **Tool returns `structuredContent`:**
   ```typescript
   return {
     structuredContent: {
       name: "John",
       data: { /* ... */ },
     },
   };
   ```

2. **Component reads via `useWidgetProps()`:**
   ```tsx
   const props = useWidgetProps<{ name: string; data: any }>();
   // props.name === "John"
   ```

### Component → Tool (via `callTool`)

Components can call tools directly using `useCallTool()`:

```tsx
const callTool = useCallTool();

async function refreshData() {
  await callTool("my_tool_id", { userId: "123" });
}
```

**Note:** Tools must be marked as component-accessible in the MCP server configuration.

## Reference

- [ChatGPT Apps SDK - Custom UX Guide](https://developers.openai.com/apps-sdk/build/custom-ux#overview)
- [ChatGPT Apps SDK - MCP Server Guide](https://developers.openai.com/apps-sdk/build/mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io)

## Project Structure

```
server/
├── app/
│   ├── mcp/
│   │   └── route.ts          # MCP server (tools & resources)
│   ├── mcp-components/       # ChatGPT widget components
│   │   ├── layout.tsx        # Widget layout (system fonts, SDK bootstrap)
│   │   ├── widgets.css       # Widget styles (design guidelines)
│   │   └── [component]/      # Individual widget pages
│   ├── hooks/                # ChatGPT SDK hooks
│   │   ├── use-widget-props.ts
│   │   ├── use-widget-state.ts
│   │   └── ...
│   ├── page.tsx              # Website landing page
│   └── layout.tsx            # Website layout (custom fonts)
└── middleware.ts             # CORS handling
```

