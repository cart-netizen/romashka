// Фаза 1 — сиды контента + тестовый дизайнер и сделки (idempotent).
import {
  login,
  get,
  post,
  patch,
  ensureRole,
  ensureItem,
  ensureItemBy,
  ensureUpload,
  updateSingleton,
  PUBLIC_FOLDER_ID,
} from "./lib/client.mjs";

const placeholderSvg = (label, bg = "#532529") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">` +
  `<rect width="1200" height="900" fill="${bg}"/>` +
  `<rect x="40" y="40" width="1120" height="820" fill="none" stroke="#F5F0E8" stroke-width="3"/>` +
  `<text x="600" y="470" font-family="Georgia, serif" font-size="64" fill="#F5F0E8" text-anchor="middle">${label}</text>` +
  `</svg>`;

// Текстура-свотч обивки (имитация ткани) заданного цвета.
const fabricSvg = (hex) => {
  let dots = "";
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(Math.random() * 400);
    const y = Math.floor(Math.random() * 400);
    const o = (Math.random() * 0.12).toFixed(2);
    dots += `<circle cx="${x}" cy="${y}" r="${1 + Math.floor(Math.random() * 2)}" fill="#000" opacity="${o}"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">` +
    `<rect width="400" height="400" fill="${hex}"/>${dots}</svg>`
  );
};

async function ensureUser(email, data) {
  const found = await get(`/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id&limit=1`);
  if (found?.length) {
    await patch(`/users/${found[0].id}`, data);
    return found[0].id;
  }
  const created = await post("/users", { email, ...data });
  console.log(`  + user ${email}`);
  return created.id;
}

async function main() {
  await login();
  console.log("Сиды: файлы-плейсхолдеры…");
  // Каталожные файлы — в публичной папке (доступны публично через /assets)
  const pub = { folder: PUBLIC_FOLDER_ID };
  const imgSofa = await ensureUpload("placeholder-sofa.svg", placeholderSvg("Диван"), { title: "Плейсхолдер: диван", ...pub });
  const imgScene = await ensureUpload("placeholder-scene.svg", placeholderSvg("Интерьер", "#9E5A33"), { title: "Плейсхолдер: сцена", ...pub });
  const imgDraw = await ensureUpload("placeholder-drawing.svg", placeholderSvg("Чертёж", "#221E1A"), { title: "Плейсхолдер: чертёж", ...pub });
  // Приватный файл материалов — вне публичной папки (только через кабинет-прокси)
  const imgMaterial = await ensureUpload("placeholder-material.svg", placeholderSvg("Материал", "#2f5d50"), {
    title: "Плейсхолдер: материал",
  });

  console.log("Сиды: site_settings…");
  await updateSingleton("site_settings", {
    phone: "+7 (000) 000-00-00",
    email: "info@romashka.example",
    work_hours: "Пн–Вс: 10:00–20:00",
    address: "г. Барнаул, проспект Космонавтов, 6г",
    messenger_max_link: "",
    seo_default_title: "Мебельный салон «Ромашка» — премиальная мебель в Барнауле",
    seo_default_description: "Диваны, кровати, кресла и тумбочки от фабрик-партнёров. Салон в Барнауле, доставка по Сибири.",
    hero_title: "Премиальная мебель для вашего дома",
    hero_subtitle: "Диваны, кровати, кресла и тумбочки от проверенных фабрик. Подбор, доставка и сборка по Сибири.",
    timeline_title: "Наш путь с 2013 года",
    timeline: [
      { year: "2013", title: "Открытие салона", text: "Первый шоурум премиальной мебели в Барнауле." },
      { year: "2016", title: "Рост ассортимента", text: "Партнёрство с фабриками премиум-сегмента, расширение коллекций." },
      { year: "2019", title: "Доставка по Сибири", text: "Запустили доставку и профессиональную сборку в регионах." },
      { year: "2022", title: "Новый шоурум", text: "Расширили экспозицию на проспекте Космонавтов." },
      { year: "2025", title: "Кабинет дизайнеров", text: "Программа сотрудничества для дизайнеров-партнёров." },
    ],
    dimensions_disclaimer: "Все изделия измерены вручную. Возможна незначительная погрешность 1–3 см.",
    default_lead_time_note: "Срок изготовления — от 4 недель.",
    promo_amount: 5000,
    promo_code_prefix: "ROMASHKA",
  });

  console.log("Сиды: цвета…");
  const colors = {};
  for (const [name, hex] of [
    ["Бежевый", "#E8DCC8"],
    ["Графитовый", "#2E2C2A"],
    ["Терракотовый", "#9E5A33"],
    ["Бордовый", "#532529"],
    ["Изумрудный", "#2F5D50"],
    ["Молочный", "#F5F0E8"],
  ]) {
    const swatch = await ensureUpload(`swatch-${hex.slice(1)}.svg`, fabricSvg(hex), { title: `Обивка: ${name}`, ...pub });
    colors[name] = await ensureItem("colors", "name", name, {
      hex,
      swatch_image: swatch,
      sort: Object.keys(colors).length + 1,
    });
  }

  console.log("Сиды: категории…");
  const cat = {};
  const categories = [
    ["Диваны", "sofas"],
    ["Кровати", "beds"],
    ["Кресла", "armchairs"],
    ["Тумбочки", "nightstands"],
  ];
  let cs = 1;
  for (const [name, slug] of categories) {
    cat[slug] = await ensureItemBy("categories", { slug }, { name, slug, sort: cs++, status: "published", hero_image: imgScene });
  }

  console.log("Сиды: подкатегории (Диваны)…");
  const sub = {};
  const sofaSubs = [
    ["Угловые", "uglovye"],
    ["Прямые", "pryamye"],
    ["Двухместные", "dvuhmestnye"],
    ["Трёхместные", "tryohmestnye"],
    ["Модульные", "modulnye"],
    ["Кожаные", "kozhanye"],
  ];
  let ss = 1;
  for (const [name, slug] of sofaSubs) {
    sub[slug] = await ensureItemBy("subcategories", { slug }, { name, slug, category: cat.sofas, sort: ss++, status: "published" });
  }

  console.log("Сиды: menu_promos…");
  await ensureItemBy("menu_promos", { title: "Новинки" }, { title: "Новинки", category: cat.sofas, image: imgSofa, link: "/catalog/sofas?is_new=1", sort: 1, status: "published" });
  await ensureItemBy("menu_promos", { title: "Хиты коллекции" }, { title: "Хиты коллекции", category: cat.sofas, image: imgSofa, link: "/catalog/sofas?is_bestseller=1", sort: 2, status: "published" });

  console.log("Сиды: usp_messages…");
  await ensureItemBy("usp_messages", { text: "Персональный подбор обивки — отправим образцы тканей." }, { text: "Персональный подбор обивки — отправим образцы тканей.", icon: "palette", sort: 1, status: "published" });
  await ensureItemBy("usp_messages", { text: "Доставка и сборка по всей Сибири." }, { text: "Доставка и сборка по всей Сибири.", icon: "local_shipping", sort: 2, status: "published" });

  console.log("Сиды: материалы (для кабинета дизайнера)…");
  const materials = [
    ["Прайс-лист 2026", "price", "Актуальные цены и условия для партнёров."],
    ["Чертежи и 3D-модели", "drawings", "Технические чертежи и модели коллекций."],
    ["Образцы тканей и фактур", "textures", "Каталог обивочных материалов."],
    ["Условия сотрудничества", "terms", "Договор и регламент работы с дизайнерами."],
  ];
  let ms = 1;
  for (const [title, category, description] of materials) {
    await ensureItemBy("materials", { title }, { title, category, description, file: imgMaterial, sort: ms++, status: "published" });
  }

  console.log("Сиды: фабрики…");
  const fac = {};
  const factories = [
    ["Ателье Комфорт", "atelier-komfort"],
    ["Мебель Премиум", "mebel-premium"],
    ["Сибирский Стиль", "sibirskiy-stil"],
    ["Гранд Диван", "grand-divan"],
  ];
  let fs = 1;
  for (const [name, slug] of factories) {
    fac[slug] = await ensureItemBy("factories", { slug }, { name, slug, logo: imgSofa, description: `<p>Фабрика «${name}» — партнёр салона «Ромашка».</p>`, sort: fs++, status: "published" });
  }

  console.log("Сиды: товары…");
  const products = [
    {
      slug: "divan-milano", name: "Диван «Милано»", sku: "SF-1001", category: cat.sofas, subcategory: sub.uglovye, factory: fac["atelier-komfort"],
      price_from: 189000, frame: "massiv", upholstery: ["boucle", "chenille"], is_bestseller: true, in_stock: true,
      short_description: "Угловой диван с глубокой посадкой и съёмными чехлами.",
      colorNames: ["Бежевый", "Терракотовый", "Графитовый"],
    },
    {
      slug: "divan-toscana", name: "Диван «Тоскана»", sku: "SF-1002", category: cat.sofas, subcategory: sub.pryamye, factory: fac["mebel-premium"],
      price_from: 154000, frame: "fanera", upholstery: ["linen", "jacquard"], is_new: true, in_stock: true,
      short_description: "Прямой трёхместный диван в средиземноморском стиле.",
      colorNames: ["Молочный", "Изумрудный"],
    },
    {
      slug: "divan-bergamo", name: "Диван «Бергамо»", sku: "SF-1003", category: cat.sofas, subcategory: sub.kozhanye, factory: fac["sibirskiy-stil"],
      price_from: 246000, frame: "metal", upholstery: ["leather"], is_sale: true, in_stock: false,
      short_description: "Кожаный диван с электрореклайнером.",
      colorNames: ["Бордовый", "Графитовый"],
    },
  ];

  for (const [i, p] of products.entries()) {
    const sizes = [
      { label: "2-местный", width_cm: 230, height_cm: 84, depth_cm: 106 },
      { label: "3-местный", width_cm: 317, height_cm: 84, depth_cm: 106 },
    ];
    const characteristics = [
      { label: "Каркас", value: p.frame === "massiv" ? "Массив берёзы" : p.frame === "fanera" ? "Берёзовая фанера" : "Металлокаркас" },
      { label: "Обивка", value: "Текстиль / кожа (по выбору)" },
      { label: "Наполнение сиденья", value: "ППУ + независимый пружинный блок" },
      { label: "Ножки", value: "Массив дуба" },
      { label: "Уход", value: "Сухая чистка, мягкая щётка" },
    ];
    const id = await ensureItemBy("products", { slug: p.slug }, {
      name: p.name, slug: p.slug, sku: p.sku, category: p.category, subcategory: p.subcategory, factory: p.factory,
      price_from: p.price_from, short_description: p.short_description,
      description: `<p>${p.name} — образец премиальной работы фабрики. Доступен в нескольких размерах и вариантах обивки.</p>`,
      main_image: imgSofa,
      gallery: [{ directus_files_id: imgSofa }],
      dimensions_images: [{ directus_files_id: imgDraw }],
      frame: p.frame, upholstery: p.upholstery,
      colors: p.colorNames.map((n) => ({ colors_id: colors[n] })),
      characteristics, sizes, variants_count: sizes.length,
      lead_time_note: "Срок изготовления — от 5 недель.",
      width_cm: 317, height_cm: 84, depth_cm: 106, style: "Современный",
      is_bestseller: !!p.is_bestseller, is_new: !!p.is_new, is_sale: !!p.is_sale, in_stock: !!p.in_stock,
      sort: i + 1, status: "published",
    });
    p.id = id;
  }

  console.log("Сиды: отзывы…");
  await ensureItemBy("reviews", { author_name: "Анна К." }, { product: products[0].id, author_name: "Анна К.", rating: 5, text: "Диван превзошёл ожидания, обивку подобрали идеально.", status: "published" });
  await ensureItemBy("reviews", { author_name: "Игорь П." }, { product: products[0].id, author_name: "Игорь П.", rating: 4, text: "Качество отличное, доставка чуть задержалась.", status: "published" });

  console.log("Сиды: showcase-сцены…");
  const scene = await ensureItemBy("showcase_scenes", { title: "Гостиная в тёплых тонах" }, { title: "Гостиная в тёплых тонах", image: imgScene, sort: 1, status: "published" });
  // хотспоты (без уникального ключа — создаём, если у сцены их ещё нет)
  const existingHotspots = await get(`/items/showcase_hotspots?filter[scene][_eq]=${scene}&fields=id&limit=1`);
  if (!existingHotspots?.length) {
    await post("/items/showcase_hotspots", { scene, product: products[0].id, pos_x: 32.5, pos_y: 60.0, sort: 1 });
    await post("/items/showcase_hotspots", { scene, product: products[1].id, pos_x: 68.0, pos_y: 55.0, sort: 2 });
    console.log("  + hotspots (2)");
  }

  console.log("Сиды: тестовые дизайнеры и сделки…");
  const designerRole = await ensureRole("Designer");
  const d1 = await ensureUser("designer@romashka.ru", { password: "designer123", first_name: "Дизайнер", last_name: "Первый", role: designerRole, status: "active" });
  const d2 = await ensureUser("designer2@romashka.ru", { password: "designer123", first_name: "Дизайнер", last_name: "Второй", role: designerRole, status: "active" });

  await ensureItemBy("deals", { number: "2026-001" }, { number: "2026-001", title: "Гостиная, ЖК «Огни»", designer: d1, client_object: "Квартира, 3 комн.", items: "Диван «Милано», кресло", amount: 250000, status: "ordered", commission_amount: 12500, commission_status: "accrued", comment: "Замер выполнен." });
  await ensureItemBy("deals", { number: "2026-002" }, { number: "2026-002", title: "Лофт на Ленина", designer: d1, client_object: "Студия", items: "Диван «Тоскана»", amount: 180000, status: "delivered", commission_amount: 9000, commission_status: "ready_to_pay" });
  await ensureItemBy("deals", { number: "2026-003" }, { number: "2026-003", title: "Загородный дом", designer: d2, client_object: "Дом, 200 м²", items: "Диван «Бергамо», 2 кресла", amount: 320000, status: "new", commission_amount: 16000, commission_status: "accrued" });

  console.log("Сиды готовы.");
}

main().catch((e) => {
  console.error("\nОШИБКА:", e.message);
  process.exit(1);
});
