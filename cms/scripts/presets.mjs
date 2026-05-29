// Фаза 1 — глобальный дефолтный layout коллекции deals: Kanban по полю status.
// Использует layout-расширение advanced-kanban-layout (Marketplace).
// Если расширение не установлено, Directus откатывается к таблице — без ошибок.
import { login, get, post, patch } from "./lib/client.mjs";

const KANBAN = "advanced-kanban-layout";

async function ensureGlobalPreset(collection, body) {
  const found = await get(
    `/presets?filter[collection][_eq]=${collection}&filter[user][_null]=true&filter[role][_null]=true&filter[bookmark][_null]=true&fields=id&limit=1`,
  );
  if (found?.length) {
    await patch(`/presets/${found[0].id}`, body);
    console.log(`  ~ preset ${collection} (обновлён)`);
    return found[0].id;
  }
  const created = await post("/presets", { collection, user: null, role: null, bookmark: null, ...body });
  console.log(`  + preset ${collection} (создан)`);
  return created.id;
}

async function main() {
  await login();
  console.log("Presets: Kanban для deals…");
  await ensureGlobalPreset("deals", {
    layout: KANBAN,
    layout_query: { [KANBAN]: { fields: ["title", "client_object", "amount", "commission_status"] } },
    layout_options: {
      [KANBAN]: {
        groupField: "status",
        title: "{{title}}",
        sortField: "sort",
        showUngrouped: true,
      },
    },
  });
  console.log("Presets готовы.");
}

main().catch((e) => {
  console.error("\nОШИБКА:", e.message);
  process.exit(1);
});
