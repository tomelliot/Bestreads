- open library from archive.org (the internet archive) is rad
- can't use [FastMCP](https://github.com/punkpeye/fastmcp/) because it doesn't support resources
- set up a cloudflare tunnel from <subdomain>.tomelliot.net -> local server for dev
- need to have 2 servers (& therefore 2 tunnel subdomains): one hosts the MCP server, the second hosts the assets for the components
- there's not really a good way to prototype within chatgpt - they're proxying requests so you can't really hot reload
- using https://github.com/vercel-labs/chatgpt-apps-sdk-nextjs-starter is mostly good
    - need to set `export const revalidate = 0;` in `app/mcp/route.ts`
    - even then, updating the component doesn't cause a reload unless you force the page to be re-rendered by going to that page in your browser
- OpenAI provides guidelines on styling - they want to keep things uniform. Branding can be applied to things like buttons and accents, but they wnat you to use the default fonts etc.
    
