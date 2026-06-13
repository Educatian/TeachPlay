/**
 * Evidence file-upload reroute.
 *
 * The React evidence editor's dropzone was wired (by the original template) to
 * upload files to a Supabase Storage project — a project that is dead/unreachable
 * on this deployment, so every file upload failed ("the file still cannot be
 * uploaded during the evidence session"). TeachPlay's real backend is the
 * Cloudflare Worker, not Supabase.
 *
 * The React app is a frozen prebuilt bundle (no source to rebuild), so we patch
 * at the edge — the same overlay pattern as the other teachplay-*.js scripts:
 * intercept the supabase-js storage upload `fetch`, divert the bytes to
 * POST /api/evidence-file (the platform's system of record), and return a
 * Supabase-Storage-shaped success response so the editor's own "uploaded ✓"
 * UI resolves unchanged. No supabase request ever leaves the browser.
 *
 * supabase-js resolves the global `fetch` at call time, and uploads only happen
 * on user action (long after load), so a deferred patch installed here is in
 * place before any upload fires.
 */
(() => {
  if (window.__tpEvidenceUploadPatched) return;
  window.__tpEvidenceUploadPatched = true;

  const nativeFetch = window.fetch.bind(window);
  // The dropzone POSTs to <supabase>/storage/v1/object/evidence-uploads/<path>.
  const UPLOAD_RE = /\/storage\/v1\/object\/(?:evidence-uploads|.+)\//;

  const safeGet = (key) => { try { return localStorage.getItem(key) || ''; } catch (_) { return ''; } };

  const jsonResponse = (obj, status) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });

  // A Supabase-StorageApiError-shaped body so the editor surfaces a real message.
  const errorResponse = (status, message) =>
    jsonResponse({ statusCode: String(status), error: message, message }, status);

  // Pull the uploaded File out of whatever supabase-js handed to fetch. For a
  // browser File/Blob, supabase-js builds FormData and appends it under the
  // empty field name ""; it can also send a raw Blob directly.
  const extractFile = (init) => {
    const body = init && init.body;
    if (!body) return null;
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      const f = body.get('');
      return f instanceof Blob ? f : null;
    }
    if (body instanceof Blob) return body;
    return null;
  };

  const isUpload = (url, init) => {
    const method = ((init && init.method) || 'GET').toUpperCase();
    if (method !== 'POST') return false;
    if (typeof url !== 'string') return false;
    if (url.indexOf('/storage/v1/object/') === -1) return false;
    // Don't touch signed-url issuance / listing / info endpoints.
    if (url.indexOf('/object/sign/') !== -1) return false;
    if (url.indexOf('/object/upload/sign/') !== -1) return false;
    if (url.indexOf('/object/list/') !== -1) return false;
    return UPLOAD_RE.test(url);
  };

  window.fetch = async function (input, init) {
    let url = '';
    try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch (_) {}
    // Requests created via `new Request(url, init)` carry method/body on `input`.
    const merged = init || (input instanceof Request ? input : {});

    if (!isUpload(url, merged) && !(input instanceof Request && isUpload(url, { method: input.method, body: undefined }))) {
      return nativeFetch(input, init);
    }

    const file = extractFile(merged) || (input instanceof Request ? await input.clone().blob().catch(() => null) : null);
    if (!file) {
      // Couldn't recover the bytes — fail clearly rather than hit the dead host.
      return errorResponse(400, 'Could not read the selected file. Please try again.');
    }

    const learnerId = safeGet('hb:learner_id');
    if (!learnerId) {
      return errorResponse(401, 'Please enroll / sign in before uploading evidence files.');
    }

    try {
      const res = await nativeFetch('/api/evidence-file', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Learner-ID': learnerId,
          'X-Learner-Token': safeGet('hb:learner_token'),
          'X-File-Name': encodeURIComponent(file.name || 'upload'),
          'X-File-Type': file.type || '',
        },
        body: file,
      });

      let data = {};
      try { data = await res.clone().json(); } catch (_) {}

      if (res.ok && data && data.Id) {
        // Supabase StorageFileApi.upload reads { Id, Key } from the JSON body.
        return jsonResponse({ Id: data.Id, Key: data.Key || `evidence-uploads/${data.Id}` }, 200);
      }
      const msg = (data && (data.error || data.message)) ||
        (res.status === 503 ? 'Evidence file uploads are not enabled yet on this deployment.' : `Upload failed (${res.status}).`);
      return errorResponse(res.status || 500, msg);
    } catch (e) {
      return errorResponse(500, 'Network error while uploading. Please try again.');
    }
  };
})();
