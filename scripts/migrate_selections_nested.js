#!/usr/bin/env node
/**
 * One-shot migration: flat `selections/{n}` -> top-level `{type_slug}/{n}`.
 *
 * Usage:
 *   node scripts/migrate_selections_nested.js [--dry-run] [--content-path=softgems_content]
 *
 * - Groups folders by `selection_type` in meta.txt
 * - Sorts by `$date_created` ascending per type
 * - Assigns new slugs 1, 2, 3... (counter reset per type)
 * - Removes `selection_type` and `document_number_name` from migrated meta
 * - Updates gem `box_selection_path` and `selection_membership_paths` keys
 * - Writes `.slug-sequence.json` under each `{type_slug}/`
 * - Removes `selections/.slug-sequence.json` and any leftover path-map files
 *
 * Also remaps any already-nested `selections/{type}/{n}` -> `{type}/{n}`.
 * Old flat URLs are not preserved (no legacy path map).
 */

const fs = require("fs-extra");
const path = require("path");
const TOML = require("@iarna/toml");

const SELECTION_TYPE_TO_SLUG = Object.freeze({
  simple: "simple",
  "bo\u00eete": "box",
  boite: "box",
  "memo in": "memo-in",
  "return memo in": "return-memo-in",
  "buying invoice": "buying-invoice",
  "memo out": "memo-out",
  "return memo out": "return-memo-out",
  "sale invoice": "sale-invoice",
  "partner invoice": "partner-invoice",
  "credit note": "credit-note",
  importation: "importation",
  "importation return": "importation-return",
});

const VALID_TYPE_SLUGS = new Set(Object.values(SELECTION_TYPE_TO_SLUG));
const FLAT_NUMERIC_RE = /^\d+$/;

function loadContentPath(argv) {
  const flag = argv.find((arg) => arg.startsWith("--content-path="));
  if (flag) return flag.split("=")[1];

  const base_settings = require(path.join(__dirname, "..", "settings_base.json"));
  let content_path = base_settings.contentPath || "softgems_content";
  const settings_path = path.join(__dirname, "..", "settings.json");
  if (fs.existsSync(settings_path)) {
    try {
      const override = JSON.parse(fs.readFileSync(settings_path, "utf8"));
      if (override.contentPath) content_path = override.contentPath;
    } catch (err) {
      console.warn("Warning: could not parse settings.json:", err.message);
    }
  }
  return content_path;
}

function resolveContentRoot(content_path) {
  const repo_root = path.join(__dirname, "..");
  return path.isAbsolute(content_path)
    ? content_path
    : path.join(repo_root, content_path);
}

function readMetaFile(meta_path) {
  const raw = fs.readFileSync(meta_path, "utf8");
  return TOML.parse(raw);
}

function writeMetaFile(meta_path, meta, dry_run) {
  const body = TOML.stringify(meta);
  if (dry_run) return;
  fs.writeFileSync(meta_path, body, "utf8");
}

function stripMigratedSelectionMeta(meta) {
  delete meta.selection_type;
  delete meta.document_number_name;
  return meta;
}

function remapPath(path_value, path_map) {
  const cleaned = String(path_value || "").trim().replace(/\\/g, "/");
  if (!cleaned) return cleaned;
  return path_map.get(cleaned) || cleaned;
}

function remapMembershipPaths(raw_map, path_map) {
  if (!raw_map || typeof raw_map !== "object" || Array.isArray(raw_map)) {
    return raw_map;
  }
  const next = {};
  for (const [key, value] of Object.entries(raw_map)) {
    const new_key = remapPath(key, path_map);
    next[new_key] = value;
  }
  return next;
}

async function listFlatSelectionFolders(selections_root) {
  if (!(await fs.pathExists(selections_root))) return [];

  const entries = await fs.readdir(selections_root, { withFileTypes: true });
  const flat = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!FLAT_NUMERIC_RE.test(entry.name)) continue;
    flat.push(entry.name);
  }

  return flat.sort((a, b) => Number(a) - Number(b));
}

async function collectLegacyRows(selections_root, flat_slugs) {
  const rows = [];

  for (const slug of flat_slugs) {
    const folder_path = path.join(selections_root, slug);
    const meta_path = path.join(folder_path, "meta.txt");
    if (!(await fs.pathExists(meta_path))) {
      console.warn(`Skipping selections/${slug}: missing meta.txt`);
      continue;
    }

    let meta;
    try {
      meta = readMetaFile(meta_path);
    } catch (err) {
      console.warn(`Skipping selections/${slug}: invalid meta.txt (${err.message})`);
      continue;
    }

    const selection_type = String(meta.selection_type || "").trim();
    const type_slug = SELECTION_TYPE_TO_SLUG[selection_type];
    if (!type_slug) {
      console.warn(
        `Skipping selections/${slug}: unknown selection_type "${selection_type}"`
      );
      continue;
    }

    rows.push({
      old_slug: slug,
      old_path: `selections/${slug}`,
      type_slug,
      selection_type,
      date_created: meta.$date_created || "",
      folder_path,
      meta_path,
    });
  }

  return rows;
}

function groupAndSortRows(rows) {
  const by_type = new Map();
  for (const row of rows) {
    if (!by_type.has(row.type_slug)) by_type.set(row.type_slug, []);
    by_type.get(row.type_slug).push(row);
  }

  for (const group of by_type.values()) {
    group.sort((a, b) => {
      const ta = new Date(a.date_created).getTime() || 0;
      const tb = new Date(b.date_created).getTime() || 0;
      if (ta !== tb) return ta - tb;
      return Number(a.old_slug) - Number(b.old_slug);
    });
  }

  return by_type;
}

/**
 * Move already-nested `selections/{type}/{n}` ? `{type}/{n}` at content root.
 */
async function remountNestedUnderSelections({ content_root, selections_root, dry_run }) {
  const path_map = new Map();
  if (!(await fs.pathExists(selections_root))) return path_map;

  for (const type_slug of VALID_TYPE_SLUGS) {
    const nested_type_root = path.join(selections_root, type_slug);
    if (!(await fs.pathExists(nested_type_root))) continue;

    const entries = await fs.readdir(nested_type_root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!FLAT_NUMERIC_RE.test(entry.name)) continue;

      const old_path = `selections/${type_slug}/${entry.name}`;
      const new_path = `${type_slug}/${entry.name}`;
      const src = path.join(nested_type_root, entry.name);
      const dest = path.join(content_root, type_slug, entry.name);

      path_map.set(old_path, new_path);
      console.log(`  remount ${old_path} ? ${new_path}`);

      if (dry_run) continue;

      await fs.ensureDir(path.dirname(dest));
      await fs.move(src, dest, { overwrite: false });
    }

    const nested_seq = path.join(nested_type_root, ".slug-sequence.json");
    const top_seq = path.join(content_root, type_slug, ".slug-sequence.json");
    if (await fs.pathExists(nested_seq)) {
      console.log(`  remount sequence ${type_slug}/.slug-sequence.json`);
      if (!dry_run) {
        await fs.ensureDir(path.dirname(top_seq));
        if (!(await fs.pathExists(top_seq))) {
          await fs.move(nested_seq, top_seq, { overwrite: false });
        } else {
          await fs.remove(nested_seq);
        }
      }
    }
  }

  return path_map;
}

async function migrateFlatSelections({ content_root, selections_root, dry_run }) {
  const flat_slugs = await listFlatSelectionFolders(selections_root);
  if (flat_slugs.length === 0) {
    console.log("No flat numeric selection folders found under selections/.");
    return new Map();
  }

  console.log(`Found ${flat_slugs.length} flat selection folder(s) to migrate.`);

  const rows = await collectLegacyRows(selections_root, flat_slugs);
  const grouped = groupAndSortRows(rows);
  const path_map = new Map();
  const last_id_by_type = new Map();

  for (const [type_slug, group] of grouped.entries()) {
    if (!VALID_TYPE_SLUGS.has(type_slug)) continue;

    const type_root = path.join(content_root, type_slug);
    let next_id = 0;

    for (const row of group) {
      next_id += 1;
      const new_slug = String(next_id);
      const new_path = `${type_slug}/${new_slug}`;
      const dest_folder = path.join(type_root, new_slug);

      path_map.set(row.old_path, new_path);
      last_id_by_type.set(type_slug, next_id);

      console.log(`  ${row.old_path} ? ${new_path} (${row.selection_type})`);

      if (dry_run) continue;

      await fs.ensureDir(type_root);
      await fs.move(row.folder_path, dest_folder, { overwrite: false });

      const meta_path = path.join(dest_folder, "meta.txt");
      const meta = stripMigratedSelectionMeta(readMetaFile(meta_path));
      writeMetaFile(meta_path, meta, false);
    }
  }

  for (const [type_slug, last_id] of last_id_by_type.entries()) {
    const state_path = path.join(content_root, type_slug, ".slug-sequence.json");
    console.log(`  write ${path.relative(process.cwd(), state_path)} last_id=${last_id}`);
    if (!dry_run) {
      await fs.ensureDir(path.dirname(state_path));
      await fs.writeJSON(state_path, { last_id }, { spaces: 2 });
    }
  }

  return path_map;
}

async function migrateGems({ gems_root, path_map, dry_run }) {
  if (path_map.size === 0) return 0;
  if (!(await fs.pathExists(gems_root))) {
    console.log("No gems/ folder � skipping gem reference updates.");
    return 0;
  }

  const entries = await fs.readdir(gems_root, { withFileTypes: true });
  let updated = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const meta_path = path.join(gems_root, entry.name, "meta.txt");
    if (!(await fs.pathExists(meta_path))) continue;

    let meta;
    try {
      meta = readMetaFile(meta_path);
    } catch {
      continue;
    }

    let changed = false;
    const gem_path = `gems/${entry.name}`;

    const box_path = String(meta.box_selection_path || "").trim();
    if (box_path && path_map.has(box_path)) {
      meta.box_selection_path = path_map.get(box_path);
      changed = true;
    }

    if (
      meta.selection_membership_paths &&
      typeof meta.selection_membership_paths === "object"
    ) {
      const remapped = remapMembershipPaths(
        meta.selection_membership_paths,
        path_map
      );
      if (JSON.stringify(remapped) !== JSON.stringify(meta.selection_membership_paths)) {
        meta.selection_membership_paths = remapped;
        changed = true;
      }
    }

    if (!changed) continue;

    updated += 1;
    console.log(`  update ${gem_path}`);
    writeMetaFile(meta_path, meta, dry_run);
  }

  return updated;
}

async function cleanupSelectionsRoot({ content_root, selections_root, dry_run }) {
  if (!(await fs.pathExists(selections_root))) return;

  const global_state = path.join(selections_root, ".slug-sequence.json");
  if (await fs.pathExists(global_state)) {
    console.log(`  remove ${path.relative(process.cwd(), global_state)}`);
    if (!dry_run) await fs.remove(global_state);
  }

  for (const map_name of [
    ".legacy-path-map.json",
    ".selection-legacy-path-map.json",
  ]) {
    for (const root of [selections_root, content_root]) {
      const map_path = path.join(root, map_name);
      if (await fs.pathExists(map_path)) {
        console.log(`  remove ${path.relative(process.cwd(), map_path)}`);
        if (!dry_run) await fs.remove(map_path);
      }
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const dry_run = argv.includes("--dry-run");
  const content_path = loadContentPath(argv);
  const content_root = resolveContentRoot(content_path);
  const selections_root = path.join(content_root, "selections");
  const gems_root = path.join(content_root, "gems");

  console.log(`Content root: ${content_root}`);
  if (dry_run) console.log("DRY RUN � no files will be modified.\n");

  const remount_map = await remountNestedUnderSelections({
    content_root,
    selections_root,
    dry_run,
  });
  const flat_map = await migrateFlatSelections({
    content_root,
    selections_root,
    dry_run,
  });

  const path_map = new Map([...remount_map, ...flat_map]);
  console.log(`\nPath map: ${path_map.size} selection(s)`);

  await cleanupSelectionsRoot({ content_root, selections_root, dry_run });

  const gems_updated = await migrateGems({ gems_root, path_map, dry_run });
  console.log(`Gems updated: ${gems_updated}`);

  if (dry_run) {
    console.log("\nRe-run without --dry-run to apply changes.");
  } else {
    console.log("\nMigration complete.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
