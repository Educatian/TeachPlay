// Local JSON-LD context registry. Keeping the context metadata local avoids
// import.meta URL construction in @digitalbazaar/credentials-context, which
// Cloudflare's Worker module loader rejects at deploy/runtime.
import undefinedTermsV2 from './undefined-terms-v2.js';
import v1 from './v1.js';
import v2 from './v2.js';

export const contexts = new Map([
  ['https://www.w3.org/ns/credentials/undefined-terms/v2', undefinedTermsV2],
  ['https://www.w3.org/2018/credentials/v1', v1],
  ['https://www.w3.org/ns/credentials/v2', v2],
]);
