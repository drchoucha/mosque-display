#!/usr/bin/env node
/**
 * bump-cache-version.js
 *
 * يرفع رقم CACHE_VERSION في service-worker.js بمقدار 1 تلقائيًا.
 * يُستدعى من git pre-commit hook (انظر .githooks/pre-commit) في كل
 * commit، فلا حاجة لتذكّر رفعه يدويًا.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TARGET_FILE = 'service-worker.js';
// يطابق: const CACHE_VERSION = "أي-نص-vN";  بغض النظر عن نوع علامات الاقتباس
const VERSION_REGEX = /(const\s+CACHE_VERSION\s*=\s*['"][^'"]*-v)(\d+)(['"])/;

const filePath = path.join(__dirname, TARGET_FILE);
const content = fs.readFileSync(filePath, 'utf8');

const match = content.match(VERSION_REGEX);
if (!match) {
  console.error(
    `bump-cache-version: تعذّر العثور على CACHE_VERSION بصيغة "-vN" في ${TARGET_FILE}`
  );
  process.exit(1);
}

const oldNum = parseInt(match[2], 10);
const newNum = oldNum + 1;
const updated = content.replace(VERSION_REGEX, `$1${newNum}$3`);

fs.writeFileSync(filePath, updated, 'utf8');
console.log(`bump-cache-version: ${TARGET_FILE} v${oldNum} -> v${newNum}`);
