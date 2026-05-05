// focus-trap.js — minimal WAI-ARIA focus-trap helper for modals.
//
// Usage from any module that opens a modal/drawer/panel:
//   var release = window.hbFocusTrap.trap(panelEl, { onEscape: closePanel });
//   ...
//   release();   // call when closing — restores prior focus
//
// Behavior:
//   - On trap: focus moves to the first focusable inside the element
//   - Tab cycles forward, Shift+Tab cycles backward (clamps at first/last)
//   - Esc invokes opts.onEscape if provided (for close-on-Esc parity)
//   - On release: focus is restored to wherever it was before trap()
//
// Dynamic DOM is supported — focusable list is recomputed every keydown.

(function () {
  'use strict';

  var FOCUSABLE_SEL = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  function visible(el) {
    if (!el) return false;
    if (el.offsetParent === null && el.tagName !== 'BODY') return false;
    var s = window.getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none';
  }

  function getFocusable(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll(FOCUSABLE_SEL),
      visible
    );
  }

  function trap(root, opts) {
    opts = opts || {};
    var prevFocus = document.activeElement;
    // Focus the first focusable (or the explicit initialFocus) on next frame
    // so the modal has time to render.
    setTimeout(function () {
      var fs = getFocusable(root);
      var target = opts.initialFocus || fs[0] || root;
      try { target.focus(); } catch (_) {}
    }, 30);

    function onKey(e) {
      if (e.key === 'Escape' && typeof opts.onEscape === 'function') {
        e.preventDefault();
        opts.onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      var fs = getFocusable(root);
      if (!fs.length) return;
      var first = fs[0];
      var last = fs[fs.length - 1];
      var current = document.activeElement;
      // If focus has escaped the trap, pull it back.
      if (!root.contains(current)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);

    return function release() {
      document.removeEventListener('keydown', onKey);
      if (prevFocus && typeof prevFocus.focus === 'function') {
        try { prevFocus.focus(); } catch (_) {}
      }
    };
  }

  window.hbFocusTrap = { trap: trap };
})();
