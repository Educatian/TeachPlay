(() => {
  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const blockedNames = /^(demo learner|preview learner|guest|learner)$/i;

  const safeGet = (key) => {
    try { return localStorage.getItem(key) || ''; }
    catch (_) { return ''; }
  };

  const parseJson = (value) => {
    try { return JSON.parse(value || 'null'); }
    catch (_) { return null; }
  };

  const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const sanitizeId = (id) => normalize(id)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  const makeIdentity = ({ id, name, email, source }) => {
    const learnerId = normalize(id);
    const learnerName = normalize(name);
    const learnerEmail = normalize(email).toLowerCase();
    if (!learnerId || !learnerName || blockedNames.test(learnerName) || !validEmail(learnerEmail)) return null;
    return {
      id: learnerId,
      name: learnerName,
      email: learnerEmail,
      source,
      credentialId: `TP-${sanitizeId(learnerId)}-${new Date().getFullYear()}`,
    };
  };

  const fromRegistration = () => makeIdentity({
    id: safeGet('hb:learner_id'),
    name: safeGet('hb:learner_name') || safeGet('tp:pending-learner-name'),
    email: safeGet('hb:learner_email') || safeGet('tp:pending-learner-email'),
    source: 'teachplay-registration',
  });

  const fromSupabaseSession = () => {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('sb-') || !key.includes('auth-token')) continue;
      const stored = parseJson(safeGet(key));
      const user = stored?.user || stored?.currentSession?.user;
      const metadata = user?.user_metadata || {};
      const identity = makeIdentity({
        id: user?.id,
        name: metadata.name || metadata.full_name || metadata.display_name,
        email: user?.email,
        source: 'supabase-auth',
      });
      if (identity) return identity;
    }
    return null;
  };

  window.TeachPlayLearnerIdentity = {
    current: () => fromRegistration() || fromSupabaseSession(),
  };

  document.addEventListener('submit', () => {
    const name = normalize(document.querySelector('#auth-name')?.value);
    const email = normalize(document.querySelector('#auth-email')?.value).toLowerCase();
    if (!name || !validEmail(email)) return;
    try {
      localStorage.setItem('tp:pending-learner-name', name);
      localStorage.setItem('tp:pending-learner-email', email);
    } catch (_) {}
  }, true);
})();
