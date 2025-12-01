// tools/list-anthropic-models.ts
import Anthropic from "@anthropic-ai/sdk";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Fehlt: ANTHROPIC_API_KEY in deiner ENV");
    process.exit(1);
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const models = await client.models.list();

  console.log("Verfügbare Claude-Modelle:\n");
  for (const m of models.data) {
    console.log("-", m.id);
  }
}

main().catch((err) => {
  console.error("Fehler beim Abfragen der Modelle:");
  console.error(err);
  process.exit(1);
});
