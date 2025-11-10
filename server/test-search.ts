import { searchBooks } from "./services/search-books";

const query = process.argv[2] || "lord of the rings";

async function main() {
  try {
    const results = await searchBooks({ query });
    console.log(results);
  } catch (error) {
    console.error("Error searching books:", error);
    process.exit(1);
  }
}

main();
