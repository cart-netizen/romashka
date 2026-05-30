// Фаза 1 — схема контент-модели Directus (IMPLEMENTATION_PLAN.md §2).
// Идемпотентно: повторный запуск не ломает уже созданное.
import {
  login,
  ensureCollection,
  ensureField,
  ensureM2O,
  ensureFile,
  ensureM2M,
} from "./lib/client.mjs";

// ── шорткаты определений полей ────────────────────────────────────────────────
const string = (opts = {}) => ({
  type: "string",
  meta: { interface: "input", ...opts.meta },
  schema: { ...(opts.required ? { is_nullable: false } : {}), ...opts.schema },
});
const text = (iface = "input-multiline") => ({ type: "text", meta: { interface: iface } });
const wysiwyg = () => ({ type: "text", meta: { interface: "input-rich-text-html" } });
const integer = (def) => ({ type: "integer", meta: { interface: "input" }, schema: def != null ? { default_value: def } : {} });
const float = () => ({ type: "float", meta: { interface: "input" }, schema: {} });
const boolean = (def = false) => ({ type: "boolean", meta: { interface: "boolean" }, schema: { default_value: def } });
const slug = () => ({ type: "string", meta: { interface: "input", options: { slug: true } }, schema: { is_unique: true } });
const icon = () => ({ type: "string", meta: { interface: "select-icon" } });

const dropdown = (choices, def) => ({
  type: "string",
  meta: { interface: "select-dropdown", options: { choices }, display: "labels" },
  schema: def ? { default_value: def } : {},
});
const ch = (value, text) => ({ text, value });

const status = () =>
  dropdown([ch("published", "Опубликовано"), ch("draft", "Черновик"), ch("archived", "Архив")], "draft");

const multiSelect = (choices) => ({
  type: "csv",
  meta: { interface: "select-multiple-dropdown", special: ["cast-csv"], options: { choices } },
  schema: {},
});

const repeater = (fields) => ({
  type: "json",
  meta: { interface: "list", special: ["cast-json"], options: { fields } },
});
const sub = (field, name, half = true) => ({
  field,
  type: field.endsWith("_cm") ? "integer" : "string",
  name,
  meta: { interface: "input", width: half ? "half" : "full" },
});

const createdAt = () => ({
  type: "timestamp",
  meta: { special: ["date-created"], interface: "datetime", readonly: true, width: "half" },
});
const updatedAt = () => ({
  type: "timestamp",
  meta: { special: ["date-updated"], interface: "datetime", readonly: true, width: "half" },
});

const sortMeta = { sort_field: "sort", archive_field: "status", archive_value: "archived", unarchive_value: "draft" };

async function main() {
  await login();
  console.log("Схема: создаю коллекции…");

  // 1) базовые коллекции (PK) — до связей
  const collections = [
    ["factories", { icon: "factory", ...sortMeta }],
    ["categories", { icon: "category", ...sortMeta }],
    ["subcategories", { icon: "label", ...sortMeta }],
    ["colors", { icon: "palette", sort_field: "sort" }],
    ["menu_promos", { icon: "ad_units", ...sortMeta }],
    ["usp_messages", { icon: "campaign", ...sortMeta }],
    ["products", { icon: "weekend", ...sortMeta }],
    ["reviews", { icon: "reviews", archive_field: "status", archive_value: "archived", unarchive_value: "draft" }],
    ["leads", { icon: "call_received" }],
    ["subscribers", { icon: "mail" }],
    ["materials", { icon: "folder_shared", ...sortMeta }],
    ["deals", { icon: "handshake" }],
    ["showcase_scenes", { icon: "image", ...sortMeta }],
    ["showcase_hotspots", { icon: "my_location", sort_field: "sort" }],
  ];
  for (const [name, meta] of collections) await ensureCollection(name, { meta });
  await ensureCollection("site_settings", { meta: { icon: "settings", singleton: true } });

  console.log("Схема: поля и связи…");

  // 2) factories
  await ensureField("factories", "name", { ...string({ required: true }) });
  await ensureField("factories", "slug", slug());
  await ensureFile("factories", "logo");
  await ensureField("factories", "description", wysiwyg());
  await ensureField("factories", "website", string());
  await ensureField("factories", "sort", integer());
  await ensureField("factories", "status", status());

  // 3) categories
  await ensureField("categories", "name", string({ required: true }));
  await ensureField("categories", "slug", slug());
  await ensureField("categories", "description", text());
  await ensureFile("categories", "hero_image");
  await ensureField("categories", "sort", integer());
  await ensureField("categories", "status", status());

  // 4) subcategories
  await ensureField("subcategories", "name", string({ required: true }));
  await ensureField("subcategories", "slug", { type: "string", meta: { interface: "input", options: { slug: true } } });
  await ensureM2O("subcategories", "category", "categories", { onDelete: "CASCADE", required: true });
  await ensureField("subcategories", "sort", integer());
  await ensureField("subcategories", "status", status());

  // 5) colors
  await ensureField("colors", "name", string({ required: true }));
  await ensureField("colors", "hex", { type: "string", meta: { interface: "select-color" } });
  await ensureFile("colors", "swatch_image"); // фото-свотч обивки (текстура)
  await ensureField("colors", "sort", integer());

  // 6) menu_promos
  await ensureM2O("menu_promos", "category", "categories", { onDelete: "CASCADE", required: true });
  await ensureField("menu_promos", "title", string({ required: true }));
  await ensureFile("menu_promos", "image");
  await ensureField("menu_promos", "link", string());
  await ensureField("menu_promos", "sort", integer());
  await ensureField("menu_promos", "status", status());

  // 7) usp_messages
  await ensureField("usp_messages", "text", text());
  await ensureField("usp_messages", "icon", icon());
  await ensureField("usp_messages", "sort", integer());
  await ensureField("usp_messages", "status", status());

  // 8) products
  await ensureField("products", "name", string({ required: true }));
  await ensureField("products", "slug", slug());
  await ensureField("products", "sku", string());
  await ensureM2O("products", "category", "categories", { onDelete: "SET NULL", required: true });
  await ensureM2O("products", "subcategory", "subcategories", { onDelete: "SET NULL" });
  await ensureM2O("products", "factory", "factories", { onDelete: "SET NULL", required: true });
  await ensureField("products", "price_from", integer());
  await ensureField("products", "short_description", text());
  await ensureField("products", "description", wysiwyg());
  await ensureFile("products", "main_image");
  await ensureM2M("products", "gallery", "directus_files");
  await ensureField("products", "frame", dropdown([ch("massiv", "Массив"), ch("metal", "Металл"), ch("fanera", "Фанера")]));
  await ensureField(
    "products",
    "upholstery",
    multiSelect([
      ch("boucle", "Букле"),
      ch("jacquard", "Жаккард"),
      ch("linen", "Лён"),
      ch("leather", "Натуральная кожа"),
      ch("blended", "Смесовая ткань"),
      ch("chenille", "Шенилл"),
    ]),
  );
  await ensureM2M("products", "colors", "colors");
  await ensureField(
    "products",
    "characteristics",
    repeater([sub("label", "Характеристика"), sub("value", "Значение")]),
  );
  await ensureField(
    "products",
    "sizes",
    repeater([sub("label", "Название", false), sub("width_cm", "Ширина, см"), sub("height_cm", "Высота, см"), sub("depth_cm", "Глубина, см")]),
  );
  await ensureM2M("products", "dimensions_images", "directus_files");
  await ensureField("products", "lead_time_note", string());
  await ensureField("products", "width_cm", integer());
  await ensureField("products", "height_cm", integer());
  await ensureField("products", "depth_cm", integer());
  await ensureField("products", "variants_count", integer());
  await ensureField("products", "style", string());
  await ensureField("products", "is_bestseller", boolean());
  await ensureField("products", "is_new", boolean());
  await ensureField("products", "is_sale", boolean());
  await ensureField("products", "in_stock", boolean(true));
  await ensureField("products", "sort", integer());
  await ensureField("products", "status", status());

  // 9) reviews
  await ensureM2O("reviews", "product", "products", { onDelete: "CASCADE", required: true });
  await ensureField("reviews", "author_name", string());
  await ensureField("reviews", "rating", { type: "integer", meta: { interface: "slider", options: { minValue: 1, maxValue: 5, stepInterval: 1 } } });
  await ensureField("reviews", "text", text());
  await ensureField("reviews", "status", status());
  await ensureField("reviews", "created_at", createdAt());

  // 10) leads (Public: create)
  await ensureField("leads", "name", string());
  await ensureField("leads", "phone", string({ required: true }));
  await ensureField("leads", "email", string());
  await ensureField("leads", "message", text());
  await ensureM2O("leads", "product", "products", { onDelete: "SET NULL" });
  await ensureField("leads", "selected_size", string());
  await ensureField("leads", "source_page", string());
  await ensureField("leads", "type", dropdown([ch("callback", "Обратный звонок"), ch("price_request", "Узнать цену"), ch("contact", "Контактная форма")], "price_request"));
  await ensureField("leads", "status", dropdown([ch("new", "Новая"), ch("processed", "Обработана")], "new"));
  await ensureField("leads", "created_at", createdAt());

  // 11) subscribers (Public: create; промо-поля заполняет сервер)
  await ensureField("subscribers", "contact", string({ required: true }));
  await ensureField("subscribers", "consent", boolean());
  await ensureField("subscribers", "source_page", string());
  await ensureField("subscribers", "promo_code", string());
  await ensureField("subscribers", "promo_channel", dropdown([ch("email", "E-mail"), ch("max", "MAX")]));
  await ensureField("subscribers", "promo_sent_at", { type: "timestamp", meta: { interface: "datetime" } });
  await ensureField("subscribers", "promo_status", dropdown([ch("issued", "Выдан"), ch("redeemed", "Использован")]));
  await ensureField("subscribers", "created_at", createdAt());

  // 12) materials (Designer: read)
  await ensureField("materials", "title", string({ required: true }));
  await ensureField("materials", "description", text());
  await ensureFile("materials", "file", { iface: "file" });
  await ensureField("materials", "url", string());
  await ensureField(
    "materials",
    "category",
    dropdown([ch("price", "Прайсы"), ch("drawings", "Чертежи"), ch("textures", "Фактуры"), ch("terms", "Условия"), ch("marketing", "Маркетинг")]),
  );
  await ensureField("materials", "sort", integer());
  await ensureField("materials", "status", status());

  // 13) deals (Designer: read own)
  await ensureField("deals", "number", string());
  await ensureField("deals", "title", string({ required: true }));
  await ensureM2O("deals", "designer", "directus_users", { pkType: "uuid", onDelete: "SET NULL", required: true });
  await ensureField("deals", "client_object", string());
  await ensureField("deals", "items", text());
  await ensureField("deals", "amount", integer());
  await ensureField(
    "deals",
    "status",
    dropdown(
      [ch("new", "Новая"), ch("ordered", "Заказано у фабрики"), ch("shipped", "Отгружено"), ch("delivered", "Доставлено"), ch("closed", "Закрыта")],
      "new",
    ),
  );
  await ensureField("deals", "commission_amount", integer());
  await ensureField(
    "deals",
    "commission_status",
    dropdown([ch("accrued", "Начислено"), ch("ready_to_pay", "Готово к выплате"), ch("paid", "Выплачено")], "accrued"),
  );
  await ensureField("deals", "comment", text());
  await ensureM2M("deals", "attachments", "directus_files");
  await ensureField("deals", "created_at", createdAt());
  await ensureField("deals", "updated_at", updatedAt());

  // 14) showcase_scenes
  await ensureField("showcase_scenes", "title", string({ required: true }));
  await ensureFile("showcase_scenes", "image");
  await ensureField("showcase_scenes", "sort", integer());
  await ensureField("showcase_scenes", "status", status());

  // 15) showcase_hotspots
  await ensureM2O("showcase_hotspots", "scene", "showcase_scenes", { onDelete: "CASCADE", required: true });
  await ensureM2O("showcase_hotspots", "product", "products", { onDelete: "CASCADE", required: true });
  await ensureField("showcase_hotspots", "pos_x", float());
  await ensureField("showcase_hotspots", "pos_y", float());
  await ensureField("showcase_hotspots", "sort", integer());

  // 16) site_settings (singleton)
  await ensureField("site_settings", "phone", string());
  await ensureField("site_settings", "email", string());
  await ensureField("site_settings", "work_hours", string());
  await ensureField("site_settings", "address", text());
  await ensureField("site_settings", "map_embed", text());
  await ensureField("site_settings", "messenger_max_link", string());
  await ensureField("site_settings", "vk_link", string());
  await ensureField("site_settings", "telegram_link", string());
  await ensureField("site_settings", "seo_default_title", string());
  await ensureField("site_settings", "seo_default_description", text());
  await ensureField("site_settings", "hero_title", string());
  await ensureField("site_settings", "hero_subtitle", text());
  await ensureFile("site_settings", "hero_video", { iface: "file" });
  await ensureField("site_settings", "timeline_title", string());
  await ensureField(
    "site_settings",
    "timeline",
    repeater([
      { field: "year", type: "string", name: "Год", meta: { interface: "input", width: "half" } },
      { field: "title", type: "string", name: "Заголовок", meta: { interface: "input", width: "half" } },
      { field: "text", type: "string", name: "Описание", meta: { interface: "input-multiline", width: "full" } },
    ]),
  );
  await ensureField("site_settings", "dimensions_disclaimer", text());
  await ensureField("site_settings", "default_lead_time_note", string());
  await ensureField("site_settings", "promo_amount", integer(5000));
  await ensureField("site_settings", "promo_code_prefix", string());
  await ensureField("site_settings", "promo_static_code", string());

  console.log("Схема готова.");
}

main().catch((e) => {
  console.error("\nОШИБКА:", e.message);
  process.exit(1);
});
