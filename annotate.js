// annotate.js — text highlighting + notes + Markdown export.
//
// Lets the reader select any text in the page and click "Highlight" or
// "Note" in a small floating toolbar. Highlights wrap the selection in
// <mark class="hb-anno-highlight">. Notes attach a short text comment.
//
// Storage:
//   localStorage['hb:annotations'] = JSON array of records:
//     { id, page, title, text, prefix, suffix, note, ts }
//   page = location.pathname so each page restores its own highlights
//   prefix/suffix = up to 30 chars before/after the selection in
//     document.body.textContent — used to disambiguate when the same
//     phrase appears multiple times on the page
//
// UI surfaces (auto-injected, no markup changes required in pages):
//   - floating selection toolbar (appears on text selection)
//   - "Notes (N)" link added to the utility bar (top-right) — opens a
//     side panel listing every annotation on this page, with "Download
//     all annotations" (Markdown) and "Clear page annotations" actions
//   - clicking an existing highlight opens a per-highlight popover
//     (Add/Edit note · Remove)

(function () {
  'use strict';

  var STORE_KEY  = 'hb:annotations';
  var CONTEXT_LEN = 30;

  // ─── Storage ─────────────────────────────────────────────────
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch (_) { return []; }
  }
  function saveAll(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }
    catch (e) { console.warn('[annotate] save failed', e); }
  }
  function pageRecords() {
    var p = location.pathname;
    return loadAll().filter(function (a) { return a.page === p; });
  }
  function upsert(rec) {
    var all = loadAll();
    var idx = -1;
    for (var i = 0; i < all.length; i++) if (all[i].id === rec.id) { idx = i; break; }
    if (idx >= 0) all[idx] = rec; else all.push(rec);
    saveAll(all);
  }
  function remove(id) {
    saveAll(loadAll().filter(function (a) { return a.id !== id; }));
  }
  function uid() {
    return 'a_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ─── Page text indexing for prefix/suffix anchors ────────────
  function pageText() { return document.body.innerText || document.body.textContent || ''; }

  function captureContext(selectedText) {
    var full = pageText();
    var i = full.indexOf(selectedText);
    if (i < 0) return { prefix: '', suffix: '' };
    var prefix = full.slice(Math.max(0, i - CONTEXT_LEN), i);
    var suffix = full.slice(i + selectedText.length, i + selectedText.length + CONTEXT_LEN);
    return { prefix: prefix.trim(), suffix: suffix.trim() };
  }

  // ─── Wrapping a Range in a <mark> ────────────────────────────
  function wrapRange(range, id) {
    if (range.collapsed) return null;
    var mark = document.createElement('mark');
    mark.className = 'hb-anno-highlight';
    mark.dataset.annoId = id;
    try {
      range.surroundContents(mark);
      return mark;
    } catch (_) {
      // Range crosses element boundaries — fall back to text-node walk
      return wrapAcrossNodes(range, id);
    }
  }

  function wrapAcrossNodes(range, id) {
    // Collect text nodes within the range and wrap each slice individually.
    // Tag them all with the same anno id so they behave as one annotation.
    var walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      { acceptNode: function (n) { return range.intersectsNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } }
    );
    var textNodes = []; var n;
    while ((n = walker.nextNode())) textNodes.push(n);
    var first = null;
    textNodes.forEach(function (tn) {
      var s = (tn === range.startContainer) ? range.startOffset : 0;
      var e = (tn === range.endContainer)   ? range.endOffset   : tn.nodeValue.length;
      if (e <= s) return;
      var slice = tn.nodeValue.slice(s, e);
      if (!slice.trim()) return;
      var before = tn.nodeValue.slice(0, s);
      var after  = tn.nodeValue.slice(e);
      var mark = document.createElement('mark');
      mark.className = 'hb-anno-highlight';
      mark.dataset.annoId = id;
      mark.textContent = slice;
      var parent = tn.parentNode;
      if (before) parent.insertBefore(document.createTextNode(before), tn);
      parent.insertBefore(mark, tn);
      if (after)  parent.insertBefore(document.createTextNode(after), tn);
      parent.removeChild(tn);
      if (!first) first = mark;
    });
    return first;
  }

  // ─── Restore stored annotations on page load ─────────────────
  function restore() {
    pageRecords().forEach(function (rec) {
      // Skip if already wrapped (e.g. SPA re-render)
      if (document.querySelector('mark[data-anno-id="' + rec.id + '"]')) return;
      var range = locate(rec);
      if (range) wrapRange(range, rec.id);
    });
  }

  function locate(rec) {
    // Walk text nodes; find the one containing the selection's start
    // anchored by prefix + leading chars of text.
    var needle = rec.text;
    if (!needle) return null;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      // Skip already-marked annotations and script/style
      var p = n.parentNode;
      if (!p) continue;
      if (p.tagName === 'SCRIPT' || p.tagName === 'STYLE') continue;
      var txt = n.nodeValue;
      var idx = txt.indexOf(needle);
      while (idx !== -1) {
        // Confirm prefix matches the chars right before this position
        if (rec.prefix) {
          var precede = txt.slice(Math.max(0, idx - rec.prefix.length), idx).trim();
          if (precede.slice(-rec.prefix.length) !== rec.prefix.trim().slice(-precede.length)) {
            // weak prefix match — accept anyway if no other candidates,
            // but try to find a stricter match first
            idx = txt.indexOf(needle, idx + 1);
            continue;
          }
        }
        var range = document.createRange();
        range.setStart(n, idx);
        range.setEnd(n, idx + needle.length);
        return range;
      }
    }
    return null;
  }

  // ─── Floating selection toolbar ──────────────────────────────
  var toolbar = null;
  function ensureToolbar() {
    if (toolbar) return toolbar;
    toolbar = document.createElement('div');
    toolbar.className = 'hb-anno-toolbar';
    toolbar.innerHTML =
      '<button type="button" data-act="highlight" title="Highlight">🖍 Highlight</button>' +
      '<button type="button" data-act="note"      title="Highlight + add a note">📝 Note</button>';
    document.body.appendChild(toolbar);
    toolbar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    toolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      var act = btn.dataset.act;
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) return hideToolbar();
      var range = sel.getRangeAt(0);
      var text  = sel.toString().trim();
      if (!text) return hideToolbar();
      var ctx = captureContext(text);
      var rec = {
        id: uid(), page: location.pathname, title: document.title,
        text: text, prefix: ctx.prefix, suffix: ctx.suffix,
        note: '', ts: Date.now(),
      };
      // Wrap + persist immediately so the highlight visual lands now;
      // the note (if requested) is then collected in the drawer and
      // patched onto the same record.
      wrapRange(range, rec.id);
      upsert(rec);
      sel.removeAllRanges();
      hideToolbar();
      refreshNotesBadge();
      if (act === 'note') {
        openNoteDrawer({
          mode: 'add', text: rec.text, value: '',
          onSave: function (val) {
            rec.note = (val || '').trim();
            upsert(rec);
            refreshList();
          },
          onCancel: function () {
            // Drawer closing without saving keeps the highlight; user
            // can still add a note later via the popover.
          },
        });
      }
    });
    return toolbar;
  }

  function showToolbarFor(range) {
    ensureToolbar();
    var rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return hideToolbar();
    toolbar.style.display = 'flex';
    // Position above the selection; clamp to viewport.
    var top = rect.top + window.scrollY - 44;
    var left = rect.left + window.scrollX + (rect.width / 2) - 80;
    if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - 180));
    toolbar.style.top  = top  + 'px';
    toolbar.style.left = left + 'px';
  }
  function hideToolbar() { if (toolbar) toolbar.style.display = 'none'; }

  document.addEventListener('selectionchange', function () {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return hideToolbar();
    var range = sel.getRangeAt(0);
    // Don't show toolbar over our own UI
    var anc = range.commonAncestorContainer;
    var ancEl = anc.nodeType === 1 ? anc : anc.parentElement;
    if (ancEl && ancEl.closest && ancEl.closest('.hb-anno-toolbar, .hb-anno-panel, .hb-anno-popover, input, textarea')) return hideToolbar();
    showToolbarFor(range);
  });

  // ─── Per-highlight popover (click an existing highlight) ─────
  var popover = null;
  function ensurePopover() {
    if (popover) return popover;
    popover = document.createElement('div');
    popover.className = 'hb-anno-popover';
    document.body.appendChild(popover);
    return popover;
  }
  function showPopover(mark, rec) {
    ensurePopover();
    popover.innerHTML =
      '<div class="hb-anno-popover__note">' + (rec.note ? escapeHtml(rec.note) : '<em style="color:#888;">No note</em>') + '</div>' +
      '<div class="hb-anno-popover__actions">' +
        '<button data-act="edit">' + (rec.note ? 'Edit note' : 'Add note') + '</button>' +
        '<button data-act="remove">Remove</button>' +
      '</div>';
    var rect = mark.getBoundingClientRect();
    popover.style.display = 'block';
    popover.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    popover.style.left = (rect.left + window.scrollX) + 'px';
    popover.querySelector('[data-act="edit"]').onclick = function () {
      hidePopover();
      openNoteDrawer({
        mode: rec.note ? 'edit' : 'add',
        text: rec.text, value: rec.note || '',
        onSave: function (val) {
          rec.note = (val || '').trim();
          upsert(rec);
          refreshList();
        },
      });
    };
    popover.querySelector('[data-act="remove"]').onclick = function () {
      document.querySelectorAll('mark[data-anno-id="' + rec.id + '"]').forEach(function (m) {
        var p = m.parentNode;
        while (m.firstChild) p.insertBefore(m.firstChild, m);
        p.removeChild(m);
      });
      remove(rec.id);
      hidePopover();
      refreshNotesBadge();
    };
  }
  function hidePopover() { if (popover) popover.style.display = 'none'; }

  document.addEventListener('click', function (e) {
    var mark = e.target.closest && e.target.closest('mark.hb-anno-highlight');
    if (mark) {
      var id = mark.dataset.annoId;
      var rec = loadAll().filter(function (a) { return a.id === id; })[0];
      if (rec) showPopover(mark, rec);
      return;
    }
    if (popover && !popover.contains(e.target)) hidePopover();
  });

  // ─── "Notes (N)" utility-bar link + side panel ───────────────
  var panel = null, badge = null;
  function ensureBadge() {
    if (badge) return badge;
    var slot = document.querySelector('.utility__right');
    if (!slot) return null;
    var a = document.createElement('a');
    a.href = '#'; a.id = 'hb-anno-toggle';
    a.style.display = 'inline-flex';
    a.style.alignItems = 'center';
    a.style.gap = '4px';
    a.textContent = 'Notes';
    var n = document.createElement('span');
    n.className = 'hb-anno-badge'; n.textContent = '0';
    a.appendChild(n);
    a.addEventListener('click', function (e) { e.preventDefault(); togglePanel(); });
    // Insert before any existing trailing link (e.g. myBama)
    slot.insertBefore(a, slot.firstChild);
    badge = n;
    return badge;
  }
  function refreshNotesBadge() {
    ensureBadge();
    if (!badge) return;
    var n = pageRecords().length;
    badge.textContent = n;
    badge.style.display = n > 0 ? '' : 'none';
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('aside');
    panel.className = 'hb-anno-panel';
    panel.innerHTML =
      '<div class="hb-anno-panel__head">' +
        '<strong>Annotations</strong>' +
        '<button class="hb-anno-panel__close" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="hb-anno-panel__local-warning" id="hb-anno-local-warn" hidden>' +
        '<strong>Local-only storage.</strong> Your highlights live in this browser and ' +
        'will be lost if you clear site data or switch devices. Download a Markdown ' +
        'export every few weeks to keep them safe.' +
      '</div>' +
      '<div class="hb-anno-panel__actions">' +
        '<button data-act="dl-page">Download this page</button>' +
        '<button data-act="dl-all">Download all (.md)</button>' +
        '<button data-act="dl-json">Export JSON</button>' +
        '<button data-act="clear-page" class="warn">Clear this page</button>' +
      '</div>' +
      '<div class="hb-anno-panel__list" id="hb-anno-list"></div>';
    document.body.appendChild(panel);
    panel.querySelector('.hb-anno-panel__close').onclick = function () { panel.classList.remove('is-open'); };
    panel.querySelector('[data-act="dl-page"]').onclick  = function () { downloadMd(true); };
    panel.querySelector('[data-act="dl-all"]').onclick   = function () { downloadMd(false); };
    panel.querySelector('[data-act="dl-json"]').onclick  = function () { downloadJson(); };
    panel.querySelector('[data-act="clear-page"]').onclick = function () {
      if (!window.confirm('Remove all annotations on this page?')) return;
      pageRecords().forEach(function (r) { remove(r.id); });
      document.querySelectorAll('mark.hb-anno-highlight').forEach(function (m) {
        var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m);
      });
      refreshList(); refreshNotesBadge();
    };
    return panel;
  }
  function togglePanel() {
    ensurePanel();
    panel.classList.toggle('is-open');
    if (panel.classList.contains('is-open')) refreshList();
  }
  function refreshList() {
    var list = document.getElementById('hb-anno-list');
    if (!list) return;
    // Show the local-only warning when:
    //   - total count >= 10 (user has invested real effort), OR
    //   - more than 30 days since last export (real "you should back up"
    //     condition that doesn't depend only on volume).
    var warn = document.getElementById('hb-anno-local-warn');
    if (warn) {
      var total = loadAll().length;
      var lastExport = 0;
      try { lastExport = parseInt(localStorage.getItem('hb:annotations:last-export') || '0', 10); } catch (_) {}
      var daysSinceExport = (Date.now() - lastExport) / (1000 * 60 * 60 * 24);
      var oldUnexported = total > 0 && (lastExport === 0 || daysSinceExport > 30);
      warn.hidden = total < 10 && !oldUnexported;
      // If reason is age-based, message that explicitly.
      if (oldUnexported && total > 0 && total < 10) {
        warn.innerHTML =
          '<strong>Backup recommended.</strong> It\'s been &gt; 30 days since you ' +
          'last exported your annotations. Browser data can be cleared at any time — ' +
          'a quick <em>Download all (.md)</em> below keeps your notes safe.';
      } else if (total >= 10) {
        warn.innerHTML =
          '<strong>Local-only storage.</strong> Your highlights live in this browser and ' +
          'will be lost if you clear site data or switch devices. Download a Markdown ' +
          'export every few weeks to keep them safe.';
      }
    }
    var recs = pageRecords();
    if (!recs.length) { list.innerHTML = '<p style="color:#888;font-size:13px;padding:8px;">No annotations on this page yet.</p>'; return; }
    list.innerHTML = recs.map(function (r) {
      return '<div class="hb-anno-item">' +
        '<div class="hb-anno-item__text">' + escapeHtml(r.text) + '</div>' +
        (r.note ? '<div class="hb-anno-item__note">' + escapeHtml(r.note) + '</div>' : '') +
        '<div class="hb-anno-item__meta">' + new Date(r.ts).toLocaleString() + '</div>' +
      '</div>';
    }).join('');
  }

  // ─── Note drawer (slides in from the right; folds away on save) ──
  var drawer = null;
  function ensureDrawer() {
    if (drawer) return drawer;
    drawer = document.createElement('aside');
    drawer.className = 'hb-anno-drawer';
    drawer.innerHTML =
      '<div class="hb-anno-drawer__head">' +
        '<strong class="hb-anno-drawer__title">Add note</strong>' +
        '<button class="hb-anno-drawer__close" aria-label="Close" type="button">×</button>' +
      '</div>' +
      '<blockquote class="hb-anno-drawer__quote"></blockquote>' +
      '<label class="hb-anno-drawer__label" for="hb-anno-drawer-ta">Your note</label>' +
      '<textarea id="hb-anno-drawer-ta" rows="6" placeholder="What stood out? What do you want to do with this later?"></textarea>' +
      '<div class="hb-anno-drawer__actions">' +
        '<button type="button" data-act="cancel">Cancel</button>' +
        '<button type="button" data-act="save" class="primary">Save note</button>' +
      '</div>' +
      '<p class="hb-anno-drawer__hint">Cmd/Ctrl + Enter to save · Esc to close</p>';
    document.body.appendChild(drawer);
    return drawer;
  }

  function openNoteDrawer(opts) {
    ensureDrawer();
    var titleEl = drawer.querySelector('.hb-anno-drawer__title');
    var quoteEl = drawer.querySelector('.hb-anno-drawer__quote');
    var ta      = drawer.querySelector('textarea');
    var save    = drawer.querySelector('[data-act="save"]');
    var cancel  = drawer.querySelector('[data-act="cancel"]');
    var close   = drawer.querySelector('.hb-anno-drawer__close');

    titleEl.textContent = opts.mode === 'edit' ? 'Edit note' : 'Add note';
    quoteEl.textContent = opts.text || '';
    ta.value = opts.value || '';

    function commit() {
      var val = ta.value;
      closeDrawer();
      if (typeof opts.onSave === 'function') opts.onSave(val);
    }
    function abort() {
      closeDrawer();
      if (typeof opts.onCancel === 'function') opts.onCancel();
    }
    save.onclick   = commit;
    cancel.onclick = abort;
    close.onclick  = abort;
    ta.onkeydown   = function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); abort(); }
    };

    drawer.classList.add('is-open');
    setTimeout(function () { ta.focus(); }, 60);
  }
  function closeDrawer() { if (drawer) drawer.classList.remove('is-open'); }

  // ─── Export ──────────────────────────────────────────────────
  function downloadMd(pageOnly) {
    var recs = pageOnly ? pageRecords() : loadAll();
    if (!recs.length) { window.alert('No annotations to export.'); return; }
    var groups = {};
    recs.forEach(function (r) { (groups[r.page] = groups[r.page] || []).push(r); });
    var lines = [];
    lines.push('# TeachPlay annotations export');
    lines.push('');
    lines.push('_Exported ' + new Date().toISOString() + '_');
    lines.push('');
    Object.keys(groups).sort().forEach(function (p) {
      var first = groups[p][0];
      lines.push('## ' + (first.title || p));
      lines.push('`' + p + '`');
      lines.push('');
      groups[p].forEach(function (r) {
        lines.push('- > ' + r.text.replace(/\n+/g, ' ').trim());
        if (r.note) lines.push('  - **Note:** ' + r.note.replace(/\n+/g, ' ').trim());
      });
      lines.push('');
    });
    saveBlob(lines.join('\n'), 'text/markdown',
      'teachplay-annotations-' + (pageOnly ? slug(location.pathname) + '-' : '') + ymd() + '.md');
  }
  function downloadJson() {
    var recs = loadAll();
    if (!recs.length) { window.alert('No annotations to export.'); return; }
    saveBlob(JSON.stringify(recs, null, 2), 'application/json', 'teachplay-annotations-' + ymd() + '.json');
  }
  function saveBlob(content, mime, filename) {
    var blob = new Blob([content], { type: mime + ';charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 200);
    // Stamp the export so the 30-day reminder doesn't keep nagging.
    try { localStorage.setItem('hb:annotations:last-export', String(Date.now())); } catch (_) {}
    refreshList();
  }
  function ymd() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function slug(s) { return (s || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'page'; }
  function escapeHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ─── Styles ──────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('hb-anno-style')) return;
    var s = document.createElement('style'); s.id = 'hb-anno-style';
    s.textContent = [
      'mark.hb-anno-highlight {',
      '  background: rgba(255, 220, 100, 0.55);',
      '  color: inherit; padding: 0 2px; border-radius: 2px;',
      '  cursor: help;',
      '  transition: background-color .15s ease;',
      '}',
      'mark.hb-anno-highlight:hover { background: rgba(255, 200, 60, 0.85); }',

      '.hb-anno-toolbar {',
      '  position: absolute; z-index: 99998;',
      '  display: none; gap: 4px;',
      '  background: #1a1a1a; color: #fff;',
      '  padding: 6px; border-radius: 8px;',
      '  box-shadow: 0 6px 20px rgba(0,0,0,0.35);',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  font-size: 13px;',
      '}',
      '.hb-anno-toolbar button {',
      '  background: transparent; color: #fff; border: 0;',
      '  padding: 6px 10px; border-radius: 5px; cursor: pointer; font-size: 13px;',
      '}',
      '.hb-anno-toolbar button:hover { background: #333; }',

      '.hb-anno-popover {',
      '  position: absolute; z-index: 99998; display: none;',
      '  background: #fff; border: 1px solid #ddd; border-radius: 8px;',
      '  padding: 10px 12px; min-width: 220px; max-width: 320px;',
      '  box-shadow: 0 6px 24px rgba(0,0,0,0.18);',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  font-size: 13px; line-height: 1.4;',
      '}',
      '.hb-anno-popover__note { margin-bottom: 8px; color: #222; white-space: pre-wrap; }',
      '.hb-anno-popover__actions { display: flex; gap: 6px; }',
      '.hb-anno-popover__actions button {',
      '  flex: 1; padding: 5px 8px; font-size: 12px; cursor: pointer;',
      '  background: #f4f3f0; border: 1px solid #ddd; border-radius: 4px;',
      '}',
      '.hb-anno-popover__actions button:hover { background: #e8e6e2; }',
      '.hb-anno-popover__actions [data-act="remove"]:hover { background: #fde2e2; border-color: #be1a2f; color: #be1a2f; }',

      '.hb-anno-badge {',
      '  display: inline-block; min-width: 18px; height: 18px;',
      '  padding: 0 5px; border-radius: 9px; line-height: 18px;',
      '  background: #be1a2f; color: #fff;',
      '  font-size: 11px; font-weight: 700; text-align: center;',
      '}',
      '.hb-anno-badge:empty, .hb-anno-badge[data-zero] { display: none; }',

      '.hb-anno-panel {',
      '  position: fixed; top: 0; right: 0; bottom: 0;',
      '  width: 360px; max-width: 88vw;',
      '  background: #fff; border-left: 1px solid #e0ddd8;',
      '  box-shadow: -8px 0 30px rgba(0,0,0,0.12);',
      '  display: flex; flex-direction: column;',
      '  transform: translateX(100%); transition: transform .25s ease;',
      '  z-index: 99999;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.hb-anno-panel.is-open { transform: translateX(0); }',
      '.hb-anno-panel__head {',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  padding: 14px 18px; border-bottom: 1px solid #e0ddd8;',
      '  background: #be1a2f; color: #fff;',
      '}',
      '.hb-anno-panel__close { background: transparent; color: #fff; border: 0; font-size: 22px; cursor: pointer; line-height: 1; }',
      '.hb-anno-panel__local-warning {',
      '  background: #fff7e6; border-left: 3px solid #b8860b;',
      '  padding: 12px 16px; margin: 12px 18px;',
      '  font-size: 12.5px; line-height: 1.5; color: #5a3e0c;',
      '  border-radius: 4px;',
      '}',
      '.hb-anno-panel__local-warning strong { color: #8a4a10; display: block; margin-bottom: 3px; }',
      '.hb-anno-panel__actions {',
      '  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;',
      '  padding: 12px 18px; border-bottom: 1px solid #e0ddd8;',
      '}',
      '.hb-anno-panel__actions button {',
      '  padding: 8px 10px; font-size: 12px; cursor: pointer;',
      '  background: #f4f3f0; border: 1px solid #ddd; border-radius: 5px;',
      '}',
      '.hb-anno-panel__actions button:hover { background: #e8e6e2; }',
      '.hb-anno-panel__actions button.warn:hover { background: #fde2e2; border-color: #be1a2f; color: #be1a2f; }',
      '.hb-anno-panel__list { flex: 1; overflow-y: auto; padding: 10px 18px 24px; }',
      '.hb-anno-item { padding: 10px 0; border-bottom: 1px dashed #eee; font-size: 13px; }',
      '.hb-anno-item__text { color: #1a1a1a; line-height: 1.45; }',
      '.hb-anno-item__text::before { content: "“"; color: #be1a2f; font-weight: 700; }',
      '.hb-anno-item__text::after  { content: "”"; color: #be1a2f; font-weight: 700; }',
      '.hb-anno-item__note { margin-top: 4px; color: #555; font-style: italic; }',
      '.hb-anno-item__meta { margin-top: 4px; color: #aaa; font-size: 11px; }',

      // Note drawer — slides in from the right, folds away after save
      '.hb-anno-drawer {',
      '  position: fixed; top: 0; right: 0; bottom: 0;',
      '  width: 380px; max-width: 92vw;',
      '  background: #fff; border-left: 1px solid #e0ddd8;',
      '  box-shadow: -10px 0 32px rgba(0,0,0,0.16);',
      '  display: flex; flex-direction: column;',
      '  padding: 18px 22px 22px;',
      '  transform: translateX(105%); transition: transform .25s ease;',
      '  z-index: 100002;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.hb-anno-drawer.is-open { transform: translateX(0); }',
      '.hb-anno-drawer__head {',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  margin-bottom: 14px;',
      '}',
      '.hb-anno-drawer__title { font-size: 16px; color: #1a1a1a; }',
      '.hb-anno-drawer__close {',
      '  background: transparent; border: 0; font-size: 24px;',
      '  color: #888; cursor: pointer; line-height: 1;',
      '}',
      '.hb-anno-drawer__close:hover { color: #be1a2f; }',
      '.hb-anno-drawer__quote {',
      '  margin: 0 0 14px;',
      '  padding: 10px 12px;',
      '  background: rgba(255, 220, 100, 0.35);',
      '  border-left: 3px solid #be1a2f;',
      '  font-size: 13px; line-height: 1.5; color: #333;',
      '  border-radius: 4px;',
      '  max-height: 120px; overflow-y: auto;',
      '}',
      '.hb-anno-drawer__label {',
      '  display: block; margin-bottom: 4px;',
      '  font-size: 12px; font-weight: 600;',
      '  text-transform: uppercase; letter-spacing: 0.06em; color: #666;',
      '}',
      '.hb-anno-drawer textarea {',
      '  width: 100%; box-sizing: border-box;',
      '  padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px;',
      '  font-family: inherit; font-size: 14px; line-height: 1.5;',
      '  resize: vertical; min-height: 120px;',
      '}',
      '.hb-anno-drawer textarea:focus {',
      '  outline: none; border-color: #be1a2f;',
      '  box-shadow: 0 0 0 3px rgba(190,26,47,0.15);',
      '}',
      '.hb-anno-drawer__actions {',
      '  display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end;',
      '}',
      '.hb-anno-drawer__actions button {',
      '  padding: 8px 16px; border-radius: 6px; cursor: pointer;',
      '  font-size: 13px; font-weight: 600; font-family: inherit;',
      '  background: #f4f3f0; color: #333; border: 1px solid #ddd;',
      '}',
      '.hb-anno-drawer__actions button:hover { background: #e8e6e2; }',
      '.hb-anno-drawer__actions button.primary {',
      '  background: #be1a2f; color: #fff; border-color: #be1a2f;',
      '}',
      '.hb-anno-drawer__actions button.primary:hover { background: #9c1526; border-color: #9c1526; }',
      '.hb-anno-drawer__hint {',
      '  margin: 10px 0 0; font-size: 11px; color: #999; text-align: right;',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ─── Boot ────────────────────────────────────────────────────
  function init() {
    injectStyles();
    restore();
    refreshNotesBadge();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.hbAnnotate = {
    list: pageRecords,
    listAll: loadAll,
    downloadMd: downloadMd,
    downloadJson: downloadJson,
    openPanel: function () { ensurePanel(); panel.classList.add('is-open'); refreshList(); },
  };
})();
