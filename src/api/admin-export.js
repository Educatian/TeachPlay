/**
 * GET /api/admin/export — de-identified research export for OFFLINE modeling.
 *
 * Admin-gated (checkAdminAuth). Emits one JSONL record per learner (default), or
 * CSV with ?format=csv (flattened item-response long form). This is the bridge to
 * the offline heavy-modeling kit (analysis/psychometrics.py): the Worker stays
 * closed-form and cheap, Python does iterative IRT/Rasch + bootstrap κ CIs.
 *
 * DE-IDENTIFICATION: every learner id and every rater email is replaced by a
 * STABLE salted SHA-256 hash (first 16 hex chars). The salt is derived from the
 * Worker's ISSUER_API_KEY (a server-only secret) so hashes are stable across
 * exports but NOT reversible without the key, and they differ from any other
 * deployment. No name, no email, no raw learner id is ever emitted.
 *
 * JSONL record schema (one per learner) — documented inline and in analysis/README.md:
 *   {
 *     "v": 1,
 *     "pid": "<16-hex>",                      // hashed learner id (stable pseudonym)
 *     "cohort": "<string|null>",
 *     "sessions_done": <int>,                 // distinct sessions completed
 *     "cred_status": "issued|pending|null",
 *     "items": [ {"item_id":"quiz-item/LO 1.1","correct":0|1}, ... ],  // last attempt per item
 *     "quiz_totals": [ {"quiz":"quiz/s02-quiz","raw":2,"max":4}, ... ],
 *     "self_assessment": [ {"phase":"pre|post","skill":"LXD","raw":1,"max":4}, ... ],
 *     "rubric_raters": [ {"criterion":"d1-learner-specificity","rater":"<16-hex>","level":"Proficient"}, ... ]
 *   }
 *
 * READ-ONLY. No PII. Touches nothing about signing / VC / gate.
 */

import { checkAdminAuth } from '../lib/auth.js';
import { getClientIp, rateLimit } from '../lib/security.js';
import { ALL_CRITERION_IDS, LEVELS, rubricTablesExist, ratersTableExists } from '../lib/rubric.js';

const SCHEMA_VERSION = 1;

async function sha256hex(s) {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleAdminExport(request, env) {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  const limit = await rateLimit(env, 'admin', getClientIp(request), 30, 60);
  if (!limit.ok) return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) {
    return new Response(JSON.stringify(auth.body), {
      status: auth.code, headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  if (!env.DB) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  const format = (new URL(request.url).searchParams.get('format') || 'jsonl').toLowerCase();

  // Salt = key-derived pepper. Stable per deployment, not reversible without the key.
  const salt = 'teachplay-export-v1|' + (env.ISSUER_API_KEY || 'no-key');
  const pid = (id) => sha256hex(salt + '|learner|' + id).then(h => h.slice(0, 16));
  const rid = (email) => sha256hex(salt + '|rater|' + (email || 'anonymous')).then(h => h.slice(0, 16));

  try {
    const learnersRes = await env.DB.prepare(
      `SELECT l.id, l.cohort, l.cred_status,
         (SELECT COUNT(DISTINCT activity_id) FROM xapi_events e
            WHERE e.learner_id = l.id AND e.verb='completed' AND e.activity_type='session') AS sessions_done
       FROM learners l ORDER BY l.enrolled_at ASC`
    ).all();
    const learners = learnersRes.results || [];

    // Pull all event/score rows once, bucket by learner in JS (class-sized).
    const [itemsRes, quizRes, saRes] = await Promise.all([
      env.DB.prepare(
        `SELECT learner_id, activity_id, success, id FROM xapi_events
          WHERE verb='answered' AND activity_type='quiz-item' AND success IS NOT NULL ORDER BY id ASC`
      ).all(),
      env.DB.prepare(
        `SELECT learner_id, activity_id, score_raw, score_max FROM xapi_events
          WHERE verb='scored' AND activity_type='quiz' AND score_raw IS NOT NULL`
      ).all(),
      env.DB.prepare(
        `SELECT learner_id, activity_id, score_raw, score_max FROM xapi_events
          WHERE verb='responded' AND activity_type='self-assessment' AND score_raw IS NOT NULL`
      ).all(),
    ]);

    let raterRows = [];
    if (await rubricTablesExist(env) && await ratersTableExists(env)) {
      const rr = await env.DB.prepare(
        'SELECT learner_id, criterion_id, scorer_email, level FROM rubric_scores_raters'
      ).all();
      raterRows = (rr.results || []).filter(r => ALL_CRITERION_IDS.includes(r.criterion_id) && LEVELS.includes(r.level));
    }

    // Bucket.
    const items = bucket(itemsRes.results, r => r.learner_id);   // ordered asc → last attempt wins below
    const quiz = bucket(quizRes.results, r => r.learner_id);
    const sa = bucket(saRes.results, r => r.learner_id);
    const raters = bucket(raterRows, r => r.learner_id);

    const records = [];
    for (const l of learners) {
      const lid = l.id;
      const phash = await pid(lid);

      // last attempt per item
      const lastItem = new Map();
      for (const r of (items.get(lid) || [])) lastItem.set(String(r.activity_id), r.success ? 1 : 0);

      const rec = {
        v: SCHEMA_VERSION,
        pid: phash,
        cohort: l.cohort ?? null,
        sessions_done: Number(l.sessions_done) || 0,
        cred_status: l.cred_status ?? null,
        items: [...lastItem.entries()].map(([item_id, correct]) => ({ item_id, correct })),
        quiz_totals: (quiz.get(lid) || []).map(r => ({ quiz: String(r.activity_id), raw: r.score_raw, max: r.score_max })),
        self_assessment: (sa.get(lid) || []).map(r => {
          const aid = String(r.activity_id);
          const m = aid.match(/^self-assessment\/(pre|post)\/(.+)$/);
          return { phase: m ? m[1] : null, skill: m ? m[2] : aid, raw: r.score_raw, max: r.score_max };
        }),
        rubric_raters: [],
      };
      for (const r of (raters.get(lid) || [])) {
        rec.rubric_raters.push({ criterion: r.criterion_id, rater: await rid(r.scorer_email), level: r.level });
      }
      records.push(rec);
    }

    if (format === 'csv') {
      return csvResponse(records);
    }
    const body = records.map(r => JSON.stringify(r)).join('\n') + (records.length ? '\n' : '');
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store',
        'content-disposition': 'attachment; filename="teachplay_export.jsonl"',
      },
    });
  } catch (e) {
    console.error('export failed', e);
    return new Response(JSON.stringify({ error: 'export-failed' }), {
      status: 500, headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}

function bucket(rows, keyFn) {
  const m = new Map();
  for (const r of (rows || [])) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

/**
 * Long-form CSV: one row per item response (the most modeling-friendly shape).
 * Columns: pid,cohort,sessions_done,cred_status,kind,key,value,extra
 */
function csvResponse(records) {
  const lines = ['pid,cohort,sessions_done,cred_status,kind,key,value,extra'];
  const esc = (s) => {
    const v = s == null ? '' : String(s);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  for (const r of records) {
    const base = [r.pid, r.cohort, r.sessions_done, r.cred_status];
    for (const it of r.items) lines.push([...base, 'item', it.item_id, it.correct, ''].map(esc).join(','));
    for (const q of r.quiz_totals) lines.push([...base, 'quiz', q.quiz, q.raw, q.max].map(esc).join(','));
    for (const s of r.self_assessment) lines.push([...base, 'self_' + s.phase, s.skill, s.raw, s.max].map(esc).join(','));
    for (const rr of r.rubric_raters) lines.push([...base, 'rubric', rr.criterion, rr.level, rr.rater].map(esc).join(','));
  }
  return new Response(lines.join('\n') + '\n', {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'cache-control': 'no-store',
      'content-disposition': 'attachment; filename="teachplay_export.csv"',
    },
  });
}
