const PQueue = require("p-queue").default;

let _folder_listing_queue;
let _archive_queue;

function _defaults() {
  const tq = global.settings?.taskQueues || {};
  return {
    folderListing:
      Number(tq.folderListing) > 0 ? Number(tq.folderListing) : 4,
    archive: Number(tq.archive) > 0 ? Number(tq.archive) : 2,
    getFoldersChunkSize:
      Number(tq.getFoldersChunkSize) > 0 ? Number(tq.getFoldersChunkSize) : 32,
  };
}

/**
 * Call once at startup (after global.settings is set). Safe to call again — no-op.
 * Concurrency is read from settings.taskQueues in settings_base.json / settings.json.
 */
function init() {
  if (_folder_listing_queue) return;
  const { folderListing, archive } = _defaults();
  _folder_listing_queue = new PQueue({ concurrency: folderListing });
  _archive_queue = new PQueue({ concurrency: archive });
}

function runFolderListing(fn, options = {}) {
  if (!_folder_listing_queue) init();
  const { priority = 0 } = options;
  return _folder_listing_queue.add(fn, { priority });
}

/** Lets I/O, other HTTP handlers, and higher-priority queue tasks interleave (like the old setImmediate loop). */
function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

/** Slugs processed per batch in `getFolders` before yielding; tune via settings.taskQueues.getFoldersChunkSize */
function getFoldersChunkSize() {
  return _defaults().getFoldersChunkSize;
}

/** ZIP / archiver work (folder download, type download, sources bundle). */
function runArchive(fn) {
  if (!_archive_queue) init();
  return _archive_queue.add(fn);
}

module.exports = {
  init,
  runFolderListing,
  runArchive,
  yieldEventLoop,
  getFoldersChunkSize,
};
