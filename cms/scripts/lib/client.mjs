// Идемпотентный клиент Directus REST API для bootstrap-скриптов.
// Node 22 (глобальный fetch). Конфиг — из переменных окружения (--env-file=.env).

const URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

let token = null;

export async function login() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD не заданы (проверьте cms/.env)");
  }
  const res = await fetch(`${URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(json.errors)}`);
  token = json.data.access_token;
  return token;
}

async function api(method, path, body) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // 204 / пустой ответ
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = json?.errors ? JSON.stringify(json.errors) : text;
    const e = new Error(`${method} ${path} → ${res.status}: ${err}`);
    e.status = res.status;
    throw e;
  }
  return json?.data ?? null;
}

export const get = (path) => api("GET", path);
export const post = (path, body) => api("POST", path, body);
export const patch = (path, body) => api("PATCH", path, body);

// Возвращает null при 404 вместо исключения.
async function tryGet(path) {
  try {
    return await api("GET", path);
  } catch (e) {
    if (e.status === 403 || e.status === 404) return null;
    throw e;
  }
}

// ── Схема ───────────────────────────────────────────────────────────────────

export async function ensureCollection(collection, { meta = {}, fields } = {}) {
  const existing = await tryGet(`/collections/${collection}`);
  if (existing) return false;
  const pk = fields ?? [
    {
      field: "id",
      type: "integer",
      meta: { hidden: true },
      schema: { is_primary_key: true, has_auto_increment: true },
    },
  ];
  await post("/collections", { collection, meta, schema: {}, fields: pk });
  console.log(`  + collection ${collection}`);
  return true;
}

export async function ensureField(collection, field, def) {
  const existing = await tryGet(`/fields/${collection}/${field}`);
  if (existing) return false;
  await post(`/fields/${collection}`, { field, ...def });
  console.log(`  + field ${collection}.${field}`);
  return true;
}

export async function ensureRelation(rel) {
  const existing = await tryGet(`/relations/${rel.collection}/${rel.field}`);
  if (existing) return false;
  await post("/relations", rel);
  console.log(`  + relation ${rel.collection}.${rel.field} → ${rel.related_collection}`);
  return true;
}

// M2O: FK-поле + связь. relatedPkType: 'integer' (коллекции) или 'uuid' (users/files).
export async function ensureM2O(
  collection,
  field,
  related,
  { pkType = "integer", special = ["m2o"], interface: iface = "select-dropdown-m2o", onDelete = "SET NULL", required = false, meta = {} } = {},
) {
  await ensureField(collection, field, {
    type: pkType,
    meta: { special, interface: iface, required, ...meta },
    schema: {},
  });
  await ensureRelation({
    collection,
    field,
    related_collection: related,
    schema: { on_delete: onDelete },
    meta: {},
  });
}

// Файловое M2O (одно изображение/файл).
export async function ensureFile(collection, field, { iface = "file-image", meta = {} } = {}) {
  await ensureM2O(collection, field, "directus_files", {
    pkType: "uuid",
    special: ["file"],
    interface: iface,
    onDelete: "SET NULL",
    meta,
  });
}

// M2M через junction-коллекцию <collection>_<field>.
// kind: 'files' (→ directus_files) или произвольная related-коллекция.
export async function ensureM2M(collection, field, related, { junction, sortable = true } = {}) {
  const junctionName = junction ?? `${collection}_${field}`;
  const isFiles = related === "directus_files";
  const parentFk = `${collection}_id`;
  const relatedFk = isFiles ? "directus_files_id" : `${related}_id`;
  const relatedPkType = related === "directus_files" ? "uuid" : "integer";

  // junction-коллекция (скрытая)
  await ensureCollection(junctionName, { meta: { hidden: true, icon: "import_export" } });

  // FK на родителя
  await ensureField(junctionName, parentFk, {
    type: "integer",
    meta: { hidden: true },
    schema: {},
  });
  await ensureRelation({
    collection: junctionName,
    field: parentFk,
    related_collection: collection,
    schema: { on_delete: "CASCADE" },
    meta: { one_field: field, sort_field: sortable ? "sort" : null, junction_field: relatedFk },
  });

  // FK на связанную коллекцию/файлы
  await ensureField(junctionName, relatedFk, {
    type: relatedPkType,
    meta: { hidden: true },
    schema: {},
  });
  await ensureRelation({
    collection: junctionName,
    field: relatedFk,
    related_collection: related,
    schema: { on_delete: "CASCADE" },
    meta: { junction_field: parentFk },
  });

  if (sortable) {
    await ensureField(junctionName, "sort", { type: "integer", meta: { hidden: true }, schema: {} });
  }

  // alias-поле на родителе
  await ensureField(collection, field, {
    type: "alias",
    meta: {
      special: [isFiles ? "files" : "m2m"],
      interface: isFiles ? "files" : "list-m2m",
    },
  });
}

// ── Доступ (Directus 11: роли → политики → permissions) ───────────────────────

export const PUBLIC_POLICY = "abf8a154-5b1c-4a46-ac9c-7300570f4f17";

// Фиксированный id публичной папки файлов (каталог). Приватные файлы
// (материалы, вложения сделок) хранятся вне неё и недоступны публично.
export const PUBLIC_FOLDER_ID = "a0000000-0000-4000-8000-000000000001";

export async function ensureFolder(id, name) {
  const existing = await tryGet(`/folders/${id}`);
  if (existing) return id;
  await post("/folders", { id, name });
  console.log(`  + folder ${name}`);
  return id;
}

export async function ensureRole(name, def = {}) {
  const found = await get(`/roles?filter[name][_eq]=${encodeURIComponent(name)}&fields=id`);
  if (found?.length) return found[0].id;
  const created = await post("/roles", { name, ...def });
  console.log(`  + role ${name}`);
  return created.id;
}

export async function ensurePolicy(name, def = {}) {
  const found = await get(`/policies?filter[name][_eq]=${encodeURIComponent(name)}&fields=id`);
  if (found?.length) return found[0].id;
  const created = await post("/policies", { name, ...def });
  console.log(`  + policy ${name}`);
  return created.id;
}

export async function ensureAccess({ role = null, user = null, policy }) {
  const parts = [`filter[policy][_eq]=${policy}`];
  parts.push(role ? `filter[role][_eq]=${role}` : `filter[role][_null]=true`);
  const found = await get(`/access?${parts.join("&")}&fields=id`);
  if (found?.length) return found[0].id;
  const created = await post("/access", { role, user, policy });
  console.log(`  + access role=${role ?? "public"} ↔ policy=${policy}`);
  return created.id;
}

export async function ensurePermission(policy, collection, action, opts = {}) {
  const found = await get(
    `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&fields=id`,
  );
  const body = {
    policy,
    collection,
    action,
    fields: opts.fields ?? ["*"],
    permissions: opts.permissions ?? {},
    validation: opts.validation ?? null,
    presets: opts.presets ?? null,
  };
  if (found?.length) {
    await patch(`/permissions/${found[0].id}`, body);
    return found[0].id;
  }
  const created = await post("/permissions", body);
  console.log(`  + permission ${collection}.${action} (policy ${policy.slice(0, 8)})`);
  return created.id;
}

// ── Данные (сиды) ─────────────────────────────────────────────────────────────

// Idempotent upsert по уникальному полю (напр. slug). Возвращает id записи.
export async function ensureItem(collection, uniqueField, uniqueValue, data) {
  const found = await get(
    `/items/${collection}?filter[${uniqueField}][_eq]=${encodeURIComponent(uniqueValue)}&fields=id&limit=1`,
  );
  if (found?.length) {
    await patch(`/items/${collection}/${found[0].id}`, data);
    return found[0].id;
  }
  const created = await post(`/items/${collection}`, { [uniqueField]: uniqueValue, ...data });
  return created.id;
}

export async function updateSingleton(collection, data) {
  await patch(`/items/${collection}`, data);
}

// Загрузка файла (idempotent по filename_download). content — строка/Buffer.
// folder: id папки или null (приватные файлы — вне публичной папки).
export async function ensureUpload(filename, content, { type = "image/svg+xml", title, folder = null } = {}) {
  const found = await get(
    `/files?filter[filename_download][_eq]=${encodeURIComponent(filename)}&fields=id,folder&limit=1`,
  );
  if (found?.length) {
    // выравниваем папку при повторном прогоне
    if ((found[0].folder ?? null) !== (folder ?? null)) {
      await patch(`/files/${found[0].id}`, { folder });
    }
    return found[0].id;
  }
  const form = new FormData();
  if (title) form.append("title", title);
  if (folder) form.append("folder", folder);
  form.append("file", new Blob([content], { type }), filename);
  const res = await fetch(`${URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`upload ${filename}: ${JSON.stringify(json.errors)}`);
  console.log(`  + file ${filename}`);
  return json.data.id;
}

// Создать запись, только если по фильтру ничего нет (для коллекций без уникального ключа).
export async function ensureItemBy(collection, filter, data) {
  const params = Object.entries(filter)
    .map(([k, v]) => `filter[${k}][_eq]=${encodeURIComponent(v)}`)
    .join("&");
  const found = await get(`/items/${collection}?${params}&fields=id&limit=1`);
  if (found?.length) return found[0].id;
  const created = await post(`/items/${collection}`, data);
  return created.id;
}
