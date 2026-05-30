// Фаза 1 — роли, политики и permissions (Directus 11).
// Public: read опубликованного каталога + create leads/subscribers.
// Designer: read только своих deals, read materials, read/update своего профиля.
import {
  login,
  ensureRole,
  ensurePolicy,
  ensureAccess,
  ensurePermission,
  ensureFolder,
  setUploadFolder,
  PUBLIC_POLICY,
  PUBLIC_FOLDER_ID,
} from "./lib/client.mjs";

// Файловые поля каталога — загрузка по умолчанию в публичную папку.
const PUBLIC_FILE_FIELDS = [
  ["products", "main_image"],
  ["products", "gallery"],
  ["products", "dimensions_images"],
  ["categories", "hero_image"],
  ["factories", "logo"],
  ["menu_promos", "image"],
  ["showcase_scenes", "image"],
];

const PUBLISHED = { status: { _eq: "published" } };
const OWN_USER = { _eq: "$CURRENT_USER" };

// Коллекции каталога/контента, читаемые публично по фильтру status=published.
const PUBLIC_PUBLISHED = [
  "products",
  "categories",
  "subcategories",
  "factories",
  "menu_promos",
  "usp_messages",
  "showcase_scenes",
  "reviews",
];
// Публично читаемые без статуса (справочники, связи, синглтон).
const PUBLIC_OPEN = [
  "colors",
  "showcase_hotspots",
  "site_settings",
  "products_colors",
  "products_gallery",
  "products_dimensions_images",
];

async function main() {
  await login();

  // Публичная папка файлов (каталог). Приватные файлы — вне неё.
  await ensureFolder(PUBLIC_FOLDER_ID, "Каталог (публичные файлы)");
  // Файловые поля каталога загружают в публичную папку по умолчанию
  for (const [coll, field] of PUBLIC_FILE_FIELDS) {
    await setUploadFolder(coll, field, PUBLIC_FOLDER_ID);
  }

  // ── Public ──────────────────────────────────────────────────────────────
  console.log("Доступ: Public…");
  for (const c of PUBLIC_PUBLISHED) {
    await ensurePermission(PUBLIC_POLICY, c, "read", { permissions: PUBLISHED });
  }
  for (const c of PUBLIC_OPEN) {
    await ensurePermission(PUBLIC_POLICY, c, "read", { permissions: {} });
  }
  // файлы — только из публичной папки (фото каталога); приватные недоступны публично
  await ensurePermission(PUBLIC_POLICY, "directus_files", "read", {
    permissions: { folder: { _eq: PUBLIC_FOLDER_ID } },
  });
  // create leads — только поля формы (status/created_at заполняются сервером/дефолтом)
  await ensurePermission(PUBLIC_POLICY, "leads", "create", {
    fields: ["name", "phone", "email", "message", "product", "selected_size", "source_page", "type"],
  });
  // create subscribers — только контакт+согласие+страница (промо-поля заполняет сервер)
  await ensurePermission(PUBLIC_POLICY, "subscribers", "create", {
    fields: ["contact", "consent", "source_page"],
  });

  // ── Designer ────────────────────────────────────────────────────────────
  console.log("Доступ: Designer…");
  const roleId = await ensureRole("Designer", {
    icon: "design_services",
    description: "Дизайнер-партнёр: свои сделки + материалы (только чтение).",
  });
  const policyId = await ensurePolicy("Designer Policy", {
    icon: "design_services",
    app_access: false,
    admin_access: false,
    enforce_tfa: false,
    description: "Доступ дизайнера к своим сделкам и материалам.",
  });
  await ensureAccess({ role: roleId, policy: policyId });

  // свои сделки
  await ensurePermission(policyId, "deals", "read", {
    permissions: { designer: OWN_USER },
  });
  // вложения своих сделок (junction) + файлы
  await ensurePermission(policyId, "deals_attachments", "read", {
    permissions: { deals_id: { designer: OWN_USER } },
  });
  await ensurePermission(policyId, "directus_files", "read", { permissions: {} });
  // материалы (опубликованные)
  await ensurePermission(policyId, "materials", "read", { permissions: PUBLISHED });
  // свой профиль
  await ensurePermission(policyId, "directus_users", "read", {
    permissions: { id: OWN_USER },
  });
  await ensurePermission(policyId, "directus_users", "update", {
    permissions: { id: OWN_USER },
    fields: ["first_name", "last_name", "email", "password", "avatar", "location", "title", "description", "language"],
  });

  console.log("Доступ готов.");
}

main().catch((e) => {
  console.error("\nОШИБКА:", e.message);
  process.exit(1);
});
