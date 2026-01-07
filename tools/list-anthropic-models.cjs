// tools/list-anthropic-models.cjs
 

// 1) Erst versuchen, .env.local zu laden
require("dotenv").config({ path: ".env.local" });

// 2) Fallback auf .env, falls .env.local nicht existiert oder leer ist
if (!process.env.ANTHROPIC_API_KEY) {
  require("dotenv").config();
}

const Anthropic = require("@anthropic-ai/sdk");

async function main() {
  console.log(
    "Geladener API-Key (Teil):",
    (process.env.ANTHROPIC_API_KEY || "").slice(0, 6) + "..."
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ Kein ANTHROPIC_API_KEY gefunden (.env.local oder .env)");
    process.exit(1);
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const models = await client.models.list();

    console.log("\nVerfügbare Claude-Modelle:\n");
    for (const m of models.data) {
      console.log("-", m.id);
    }
  } catch (err) {
    console.error("\n❌ Fehler beim Abfragen der Modelle:");
    console.error(err);
  }
}

main();
