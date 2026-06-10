#!/usr/bin/env python3
"""
Offline heavy-modeling kit for TeachPlay credential validity.

Reads the de-identified JSONL produced by GET /api/admin/export and computes the
iterative / heavy statistics that the Cloudflare Worker deliberately does NOT:

  * 1PL / Rasch IRT  — item difficulties (b) + person abilities (theta) via
                       joint MLE (scipy.optimize), reported on the logit scale.
  * 2PL IRT          — adds per-item discrimination (a) when the data support it
                       (>= 8 persons and >= 4 items; otherwise skipped).
  * Reliability      — Cronbach's alpha / KR-20 cross-check against the Worker.
  * Kappa study      — Cohen's (pairwise), Fleiss' (>=3 raters), Gwet's AC1, each
                       with nonparametric bootstrap 95% CIs.

WHY OFFLINE: IRT fitting is iterative optimization; bootstrap CIs are many
resamples. Both violate the Worker's "closed-form, cheap, no libraries" rule, so
they live here and run on the user's machine over an export file. The Worker's
closed-form KR-20 / kappa are the LIVE dashboard numbers; this script is the
research-grade cross-check and the IRT layer.

Usage:
    python analysis/psychometrics.py export.jsonl
    python analysis/psychometrics.py export.jsonl --out analysis/out/psychometrics_offline.json --boot 2000

Deps: numpy, scipy (see requirements.txt). No torch required. Not run in CI.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from itertools import combinations

import numpy as np

try:
    from scipy.optimize import minimize
except Exception:  # pragma: no cover
    minimize = None

LEVELS = ["Emerging", "Developing", "Proficient", "Exemplary"]


# ── load ──────────────────────────────────────────────────────────────────────
def load_jsonl(path):
    recs = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                recs.append(json.loads(line))
    return recs


# ── item matrix ─────────────────────────────────────────────────────────────--
def build_item_matrix(recs):
    """
    Complete-case person x item 0/1 matrix from rec['items'].

    Learners answer different item sets, so a naive "all items, all learners"
    intersection is usually empty. We instead keep items answered by >=60% of the
    learners who answered ANY item (or >=3), then keep the learners who answered
    that whole set — the same complete-case rule the Worker uses. This recovers
    the common quiz core that supports an IRT fit.
    """
    per_learner = []
    item_cov = {}
    for r in recs:
        d = {it["item_id"]: int(it["correct"]) for it in r.get("items", [])}
        if d:
            per_learner.append((r["pid"], d))
            for i in d:
                item_cov[i] = item_cov.get(i, 0) + 1
    n_with_items = len(per_learner)
    if n_with_items == 0:
        return [], [], np.zeros((0, 0))
    min_cov = max(3, int(np.ceil(0.6 * n_with_items)))
    kept = sorted([i for i, c in item_cov.items() if c >= min_cov])
    if len(kept) < 2:  # fall back to most-covered items
        kept = sorted([i for i, _ in sorted(item_cov.items(), key=lambda kv: -kv[1])[:8]])
    rows, pids = [], []
    for pid, d in per_learner:
        if all(i in d for i in kept) and kept:
            rows.append([d[i] for i in kept])
            pids.append(pid)
    X = np.array(rows, dtype=float) if rows else np.zeros((0, len(kept)))
    return kept, pids, X


# ── reliability cross-check ────────────────────────────────────────────────────
def cronbach_alpha(X):
    n, k = X.shape
    if n < 2 or k < 2:
        return None
    item_var = X.var(axis=0, ddof=1)
    total_var = X.sum(axis=1).var(ddof=1)
    if total_var == 0:
        return None
    return (k / (k - 1)) * (1 - item_var.sum() / total_var)


# ── 1PL / Rasch via joint MLE ───────────────────────────────────────────────────
def _sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def fit_rasch(X, ridge=1e-3, maxiter=500):
    """
    Rasch (1PL): P(correct) = sigmoid(theta_p - b_i). Joint MLE of person
    abilities theta and item difficulties b with a small ridge for identifiability
    (theta centered at 0). Returns (theta, b) on the logit scale.
    """
    if minimize is None:
        raise RuntimeError("scipy not available; pip install -r analysis/requirements.txt")
    n, k = X.shape
    if n < 3 or k < 2:
        return None

    def unpack(v):
        theta = v[:n]
        b = v[n:]
        theta = theta - theta.mean()  # center for identifiability
        return theta, b

    def negloglik(v):
        theta, b = unpack(v)
        z = theta[:, None] - b[None, :]
        p = _sigmoid(z)
        eps = 1e-9
        ll = X * np.log(p + eps) + (1 - X) * np.log(1 - p + eps)
        return -ll.sum() + ridge * (np.sum(b**2) + np.sum(theta**2))

    x0 = np.zeros(n + k)
    res = minimize(negloglik, x0, method="L-BFGS-B", options={"maxiter": maxiter})
    theta, b = unpack(res.x)
    return {"theta": theta.tolist(), "b": b.tolist(), "converged": bool(res.success),
            "neg_loglik": float(res.fun)}


def fit_2pl(X, ridge=1e-2, maxiter=800):
    """
    2PL: P = sigmoid(a_i (theta_p - b_i)). Only attempted with enough data.
    Returns per-item a (discrimination) and b plus person theta, or None.
    """
    if minimize is None:
        raise RuntimeError("scipy not available")
    n, k = X.shape
    if n < 8 or k < 4:
        return None

    def unpack(v):
        theta = v[:n]
        loga = v[n:n + k]   # log a to keep a > 0
        b = v[n + k:]
        theta = theta - theta.mean()
        return theta, np.exp(loga), b

    def negloglik(v):
        theta, a, b = unpack(v)
        z = a[None, :] * (theta[:, None] - b[None, :])
        p = _sigmoid(z)
        eps = 1e-9
        ll = X * np.log(p + eps) + (1 - X) * np.log(1 - p + eps)
        return -ll.sum() + ridge * (np.sum(b**2) + np.sum(theta**2) + np.sum((np.log(a))**2))

    x0 = np.concatenate([np.zeros(n), np.zeros(k), np.zeros(k)])
    res = minimize(negloglik, x0, method="L-BFGS-B", options={"maxiter": maxiter})
    theta, a, b = unpack(res.x)
    return {"a": a.tolist(), "b": b.tolist(), "theta": theta.tolist(),
            "converged": bool(res.success), "neg_loglik": float(res.fun)}


# ── kappa study (Cohen / Fleiss / Gwet) with bootstrap CIs ─────────────────────
def cohen_kappa(a, b, cats=LEVELS):
    a, b = list(a), list(b)
    n = len(a)
    if n == 0:
        return None
    agree = sum(1 for i in range(n) if a[i] == b[i])
    po = agree / n
    m1 = {c: a.count(c) / n for c in cats}
    m2 = {c: b.count(c) / n for c in cats}
    pe = sum(m1[c] * m2[c] for c in cats)
    return 1.0 if pe == 1 else (po - pe) / (1 - pe)


def gwet_ac1(a, b, cats=LEVELS):
    a, b = list(a), list(b)
    n = len(a)
    if n == 0:
        return None
    q = len(cats)
    agree = sum(1 for i in range(n) if a[i] == b[i])
    po = agree / n
    pe = 0.0
    if q > 1:
        for c in cats:
            pi = (a.count(c) + b.count(c)) / (2 * n)
            pe += pi * (1 - pi)
        pe /= (q - 1)
    return 1.0 if pe == 1 else (po - pe) / (1 - pe)


def fleiss_kappa(counts, n_raters):
    counts = np.asarray(counts, dtype=float)
    N, k = counts.shape
    if N == 0 or n_raters < 2:
        return None
    pc = counts.sum(axis=0) / (N * n_raters)
    Pi = (np.square(counts).sum(axis=1) - n_raters) / (n_raters * (n_raters - 1))
    pbar = Pi.mean()
    pe = float(np.square(pc).sum())
    return 1.0 if pe == 1 else (pbar - pe) / (1 - pe)


def bootstrap_ci(stat_fn, pairs, n_boot=2000, seed=7):
    """Nonparametric bootstrap 95% CI over the list of (a,b) coded pairs."""
    if not pairs:
        return None
    rng = np.random.default_rng(seed)
    idx = np.arange(len(pairs))
    vals = []
    for _ in range(n_boot):
        samp = rng.choice(idx, size=len(idx), replace=True)
        aa = [pairs[i][0] for i in samp]
        bb = [pairs[i][1] for i in samp]
        v = stat_fn(aa, bb)
        if v is not None:
            vals.append(v)
    if not vals:
        return None
    lo, hi = np.percentile(vals, [2.5, 97.5])
    return {"point": stat_fn([p[0] for p in pairs], [p[1] for p in pairs]),
            "ci_low": float(lo), "ci_high": float(hi), "n_boot": len(vals)}


def kappa_study(recs, n_boot=2000):
    # cell (pid, criterion) -> {rater: level}
    cells = {}
    raters = set()
    for r in recs:
        for rr in r.get("rubric_raters", []):
            key = (r["pid"], rr["criterion"])
            cells.setdefault(key, {})[rr["rater"]] = rr["level"]
            raters.add(rr["rater"])
    raters = sorted(raters)
    if len(raters) < 2:
        return {"status": "insufficient", "note": "needs >=2 raters on the same portfolio",
                "n_raters": len(raters)}

    out = {"status": "ok", "n_raters": len(raters), "raters": raters, "pairwise": []}
    for ra, rb in combinations(raters, 2):
        pairs = [(m[ra], m[rb]) for m in cells.values() if ra in m and rb in m]
        if not pairs:
            continue
        out["pairwise"].append({
            "rater_a": ra, "rater_b": rb, "n": len(pairs),
            "cohen_kappa": bootstrap_ci(cohen_kappa, pairs, n_boot),
            "gwet_ac1": bootstrap_ci(gwet_ac1, pairs, n_boot),
        })

    # pooled first-two-raters-per-cell + Fleiss if uniform >=3
    pooled, fleiss_rows, fr, uniform = [], [], None, True
    for m in cells.values():
        ents = list(m.values())
        if len(ents) >= 2:
            pooled.append((ents[0], ents[1]))
            fleiss_rows.append([ents.count(lv) for lv in LEVELS])
            if fr is None:
                fr = len(ents)
            elif fr != len(ents):
                uniform = False
    out["overall"] = {
        "n_double_scored_cells": len(pooled),
        "cohen_kappa": bootstrap_ci(cohen_kappa, pooled, n_boot),
        "gwet_ac1": bootstrap_ci(gwet_ac1, pooled, n_boot),
        "fleiss_kappa": (fleiss_kappa(fleiss_rows, fr) if (fr and fr >= 3 and uniform) else None),
    }
    return out


# ── main ────────────────────────────────────────────────────────────────────--
def main(argv=None):
    ap = argparse.ArgumentParser(description="TeachPlay offline psychometrics (IRT + kappa study).")
    ap.add_argument("export", help="path to export.jsonl from /api/admin/export")
    ap.add_argument("--out", default="analysis/out/psychometrics_offline.json")
    ap.add_argument("--boot", type=int, default=2000, help="bootstrap resamples for kappa CIs")
    args = ap.parse_args(argv)

    recs = load_jsonl(args.export)
    item_ids, pids, X = build_item_matrix(recs)

    result = {
        "source": os.path.abspath(args.export),
        "n_records": len(recs),
        "item_matrix": {"n_persons": int(X.shape[0]), "n_items": int(X.shape[1]), "item_ids": item_ids},
    }

    # reliability cross-check
    result["reliability"] = {
        "cronbach_alpha_kr20": (None if X.shape[0] < 2 else cronbach_alpha(X)),
        "note": "Cross-check against the Worker's live KR-20 (should match closely).",
    }

    # IRT
    if X.shape[0] >= 3 and X.shape[1] >= 2:
        rasch = fit_rasch(X)
        if rasch:
            rasch["item_difficulty"] = dict(zip(item_ids, rasch["b"]))
        result["rasch_1pl"] = rasch
        twopl = fit_2pl(X)
        if twopl:
            twopl["item_discrimination"] = dict(zip(item_ids, twopl["a"]))
            twopl["item_difficulty"] = dict(zip(item_ids, twopl["b"]))
        result["irt_2pl"] = twopl or {"status": "skipped", "note": "needs >=8 persons and >=4 items"}
    else:
        result["rasch_1pl"] = {"status": "insufficient", "n_persons": int(X.shape[0]), "n_items": int(X.shape[1])}
        result["irt_2pl"] = {"status": "insufficient"}

    # kappa study
    result["kappa_study"] = kappa_study(recs, n_boot=args.boot)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2)
    print(f"wrote {args.out}")
    # Compact stdout summary
    rel = result["reliability"]["cronbach_alpha_kr20"]
    print(f"  n_persons={X.shape[0]} n_items={X.shape[1]}  alpha/KR20={rel}")
    if isinstance(result.get("rasch_1pl"), dict) and "b" in result["rasch_1pl"]:
        print(f"  rasch converged={result['rasch_1pl'].get('converged')}")
    ks = result["kappa_study"]
    if ks.get("status") == "ok":
        ck = ks["overall"]["cohen_kappa"]
        print(f"  IRR: raters={ks['n_raters']} cohen_kappa={ck['point'] if ck else None}")
    else:
        print(f"  IRR: {ks.get('note')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
