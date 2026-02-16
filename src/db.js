// src/db.js - Centralized database module
// Luu tat ca du lieu vao file JSON, dong bo giua cac phien

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Dam bao thu muc data ton tai
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cache du lieu trong RAM, chi doc file 1 lan
const cache = {};

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

// Doc du lieu tu file (co cache)
function load(collection, fallback = {}) {
  if (cache[collection] !== undefined) return cache[collection];
  const filePath = getFilePath(collection);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    cache[collection] = JSON.parse(raw);
  } catch {
    cache[collection] = typeof fallback === 'function' ? fallback() : JSON.parse(JSON.stringify(fallback));
  }
  return cache[collection];
}

// Ghi du lieu ra file
function save(collection) {
  const filePath = getFilePath(collection);
  const data = cache[collection];
  if (data === undefined) return;
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[DB] Loi khi ghi ${collection}:`, err.message);
  }
}

// Lay hoac tao 1 record trong collection
function get(collection, key, defaultValue) {
  const data = load(collection, {});
  if (data[key] === undefined && defaultValue !== undefined) {
    data[key] = typeof defaultValue === 'function' ? defaultValue() : JSON.parse(JSON.stringify(defaultValue));
    save(collection);
  }
  return data[key];
}

// Set 1 record
function set(collection, key, value) {
  const data = load(collection, {});
  data[key] = value;
  save(collection);
}

// Xoa 1 record
function remove(collection, key) {
  const data = load(collection, {});
  delete data[key];
  save(collection);
}

// Lay toan bo collection
function getAll(collection, fallback = {}) {
  return load(collection, fallback);
}

// Ghi toan bo collection
function setAll(collection, data) {
  cache[collection] = data;
  save(collection);
}

// Auto-save tat ca collections moi 30s
setInterval(() => {
  for (const collection of Object.keys(cache)) {
    save(collection);
  }
}, 30000);

module.exports = { load, save, get, set, remove, getAll, setAll, DATA_DIR };
