import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSESSMENTS_BY_SUBJECT, SUBJECT_POOLS } from './assessment-image-sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(__dirname, '../public/images');
const assessmentDir = path.join(publicRoot, 'assessments');
const subjectDir = path.join(publicRoot, 'subjects');
const fallback = path.join(publicRoot, 'fallback-campus.jpg');

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error('File too small');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

fs.mkdirSync(assessmentDir, { recursive: true });

let ok = 0;
let failed = 0;

for (const [subject, slugs] of Object.entries(ASSESSMENTS_BY_SUBJECT)) {
  const pool = SUBJECT_POOLS[subject];
  let subjectAnchor = null;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const dest = path.join(assessmentDir, `${slug}.jpg`);
    try {
      const size = await download(pool[i], dest);
      console.log(`OK assessment ${slug} (${size} bytes)`);
      if (!subjectAnchor) subjectAnchor = dest;
      ok++;
    } catch (err) {
      let recovered = false;
      for (let j = 0; j < pool.length; j++) {
        if (j === i) continue;
        try {
          const size = await download(pool[j], dest);
          console.log(`OK assessment ${slug} via alt ${j} (${size} bytes)`);
          if (!subjectAnchor) subjectAnchor = dest;
          ok++;
          recovered = true;
          break;
        } catch {
          // try next alt
        }
      }
      if (!recovered) {
        if (subjectAnchor) fs.copyFileSync(subjectAnchor, dest);
        else fs.copyFileSync(fallback, dest);
        console.log(`Fallback assessment ${slug}: ${err.message}`);
        failed++;
      }
    }
  }

  const subjectDest = path.join(subjectDir, `${subject}.jpg`);
  try {
    const size = await download(pool[0], subjectDest);
    console.log(`OK subject ${subject} (${size} bytes)`);
  } catch (err) {
    console.log(`Subject ${subject} kept existing: ${err.message}`);
  }
}

console.log(`\nDone: ${ok} assessments downloaded, ${failed} fallbacks.`);
