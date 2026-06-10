# -*- coding: utf-8 -*-
"""
Build the two TeachPlay microcredential Qualtrics surveys (az1):

  PRE  — "TeachPlay Microcredential — Informed Consent & Start"
  POST — "TeachPlay Microcredential — Completion Survey"

GATE POLICY = completion/submission, NOT consent-yes. Submitting the form
passes the gate. Research-data-use is an OPT-IN that never blocks the
credential and never screens anyone out. There is NO screen-out branch.

Token + datacenter are read PROGRAMMATICALLY from the inline TOKEN/DC in
  C:\\Users\\jewoo\\Projects\\AIMedia_IRB\\build_surveys_v2.py
so the token never appears in this file or the transcript. The proven helper
PATTERNS (call/mc/te/matrix/db/new_survey/add_block/add_q/ed_decl/flow PUT/
publish_activate + EOS redirect via options) are COPIED here (not imported,
because importing build_surveys_v2 executes survey creation on import).

Run:  python tools/build_teachplay_surveys.py
"""
import sys, io, os, re, json, time, urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ---------- read token + DC programmatically (never echo the token) ----------
REF = r"C:\Users\jewoo\Projects\AIMedia_IRB\build_surveys_v2.py"
def _read_token_dc(path):
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()
    tok = re.search(r'TOKEN\s*=\s*"([^"]+)"', src)
    dc  = re.search(r'DC\s*=\s*"([^"]+)"', src)
    if not tok or not dc:
        raise SystemExit("could not parse TOKEN/DC from reference script")
    return tok.group(1), dc.group(1)

TOKEN, DC = _read_token_dc(REF)
BASE = f"https://{DC}.qualtrics.com/API/v3"
H = {"X-API-TOKEN": TOKEN, "Content-Type": "application/json"}

# Restore the credential file the survey-build skill expects (token value only).
TOKEN_FILE = r"C:\Users\jewoo\Desktop\token_qualtrics.txt"
try:
    if not os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(TOKEN)
        print("restored token file (value not shown)")
except Exception as e:
    print("token file restore note:", e)

# TeachPlay return endpoints (server-side verified gate lands here).
CONSENT_REDIRECT = ("https://teachplay.dev/api/consent-complete"
                    "?learner_id=${e://Field/learner_id}"
                    "&sig=${e://Field/sig}"
                    "&rid=${e://Field/ResponseID}")
POST_REDIRECT = ("https://teachplay.dev/api/survey-complete"
                 "?learner_id=${e://Field/learner_id}"
                 "&sig=${e://Field/sig}"
                 "&rid=${e://Field/ResponseID}")

# ---------- API helper (copied pattern) ----------
def call(m, p, b=None):
    req = urllib.request.Request(f"{BASE}{p}", data=(json.dumps(b).encode() if b is not None else None), headers=H, method=m)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print(f"!! {m} {p} -> {e.code}\n{e.read().decode()[:700]}"); raise

# ---------- question builders (copied patterns) ----------
def mc(tag, text, choices, force=True, single=True):
    ch = {str(i+1): {"Display": c} for i, c in enumerate(choices)}
    return {"QuestionText": text, "DataExportTag": tag, "QuestionType": "MC",
            "Selector": "SAVR" if single else "MAVR", "SubSelector": "TX",
            "Configuration": {"QuestionDescriptionOption": "UseText"}, "Choices": ch,
            "ChoiceOrder": [str(i+1) for i in range(len(choices))],
            "Validation": {"Settings": {"ForceResponse": "ON" if force else "OFF", "ForceResponseType": "ON" if force else "OFF", "Type": "None"}},
            "Language": []}

def te(tag, text, force=False, multiline=False):
    return {"QuestionText": text, "DataExportTag": tag, "QuestionType": "TE", "Selector": "ESTB" if multiline else "SL",
            "Configuration": {"QuestionDescriptionOption": "UseText"},
            "Validation": {"Settings": {"ForceResponse": "ON" if force else "OFF", "Type": "None"}}, "Language": []}

def matrix(tag, text, statements, scale=None, force=True):
    scale = scale or ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    return {"QuestionText": text, "DataExportTag": tag, "QuestionType": "Matrix", "Selector": "Likert", "SubSelector": "SingleAnswer",
            "Configuration": {"QuestionDescriptionOption": "UseText", "TextPosition": "inline", "ChoiceColumnWidth": 25, "RepeatHeaders": "none", "WhiteSpace": "ON", "MobileFirst": True},
            "Choices": {str(i+1): {"Display": s} for i, s in enumerate(statements)},
            "ChoiceOrder": [str(i+1) for i in range(len(statements))],
            "Answers": {str(i+1): {"Display": d} for i, d in enumerate(scale)},
            "AnswerOrder": [str(i+1) for i in range(len(scale))],
            "Validation": {"Settings": {"ForceResponse": "ON" if force else "OFF", "ForceResponseType": "ON", "Type": "None"}}, "Language": []}

def slider_nps(tag, text):
    # 0-10 NPS recommend item, rendered as a single-answer 11-point MC bar.
    return mc(tag, text, [str(i) for i in range(0, 11)], force=True)

def db(tag, text):
    return {"QuestionText": text, "DataExportTag": tag, "QuestionType": "DB", "Selector": "TB",
            "Configuration": {"QuestionDescriptionOption": "UseText"}, "Language": []}

# ---------- generic builders (copied patterns) ----------
def new_survey(name):
    r = call("POST", "/survey-definitions", {"SurveyName": name, "Language": "EN", "ProjectCategory": "CORE"})["result"]
    return r["SurveyID"], r.get("DefaultBlockID")

def add_block(sid, desc):
    return call("POST", f"/survey-definitions/{sid}/blocks", {"Type": "Standard", "Description": desc})["result"]["BlockID"]

def add_q(sid, q, block):
    return call("POST", f"/survey-definitions/{sid}/questions?blockId={block}", q)["result"]["QuestionID"]

def ed_decl():
    # Embedded Data declaration at TOP of the flow. Fields captured from the
    # link query string: learner_id, sig, cohort. Declared (empty Value) so
    # Qualtrics binds the query params and they are addressable in the redirect.
    return {"Type": "EmbeddedData", "FlowID": "FL_edtop", "EmbeddedData": [
        {"Description": "learner_id", "Type": "Recipient", "Field": "learner_id", "VariableType": "String", "Value": "", "AnalyzeText": False},
        {"Description": "sig", "Type": "Recipient", "Field": "sig", "VariableType": "String", "Value": "", "AnalyzeText": False},
        {"Description": "cohort", "Type": "Recipient", "Field": "cohort", "VariableType": "String", "Value": "", "AnalyzeText": False}]}

def publish_activate(sid, desc):
    call("POST", f"/survey-definitions/{sid}/versions", {"Published": True, "Description": desc})
    call("PUT", f"/surveys/{sid}", {"isActive": True})

def end_survey_redirect(redirect_url):
    # End-of-survey REDIRECT, set via the flow (the reliable API path; the
    # /options endpoint rejects EOSRedirectURL/EOSMessageOptions on this brand).
    # EndingType "Advanced" + Options.SurveyTermination="Redirect" + EOSRedirectURL
    # round-trips and renders as a real EOS redirect.
    return {"Type": "EndSurvey", "FlowID": "FL_eos", "EndingType": "Advanced",
            "Options": {"Advanced": "true", "SurveyTermination": "Redirect",
                        "EOSRedirectURL": redirect_url}}

# ---------- design header (copied pattern, retitled) ----------
def header(phase):
    css = ("<style>"
      "body,.Skin{background:#f6f6f7;font-family:'Helvetica Neue',Arial,sans-serif;}"
      ".Skin .SkinInner,.Skin #SkinContent{max-width:760px;margin:0 auto;}"
      ".Skin .QuestionOuter{background:#fff;border:1px solid #ededed;border-radius:14px;"
        "padding:22px 26px;margin:0 0 18px;box-shadow:0 1px 4px rgba(0,0,0,.05);}"
      ".Skin .QuestionText{font-size:16px;line-height:1.55;color:#262626;}"
      ".Skin .Matrix tr:nth-child(even){background:#faf5f6;}"
      ".Skin #Buttons .NextButton,.Skin input.NextButton{"
        "background:#9E1B32!important;border:1px solid #9E1B32!important;color:#fff!important;"
        "border-radius:9px;padding:11px 26px;font-weight:600;box-shadow:none;}"
      ".Skin #ProgressBar .Inner,.Skin .progress-bar .fill{background:#9E1B32!important;}"
      ".Skin #Header{border-bottom:3px solid #9E1B32;padding-bottom:8px;margin-bottom:20px;}"
      "</style>")
    banner = ("<div style='text-align:center;padding:6px 0;'>"
      "<span style='font-size:12px;letter-spacing:.5px;color:#7a8082;'>THE UNIVERSITY OF ALABAMA &middot; COLLEGE OF EDUCATION</span><br>"
      "<span style='font-size:19px;font-weight:700;color:#9E1B32;'>TeachPlay Microcredential</span><br>"
      f"<span style='font-size:12px;color:#7a8082;'>{phase} &middot; AI-enhanced Educational Game Design</span></div>")
    return css + banner

def design(sid, phase, browser_title):
    """GET options, set design (title/skin/buttons), then PUT. The EOS redirect
    is NOT set here — this brand's /options endpoint rejects EOSRedirectURL; the
    redirect is set as an EndSurvey flow element instead (see end_survey_redirect)."""
    o = call("GET", f"/survey-definitions/{sid}/options")["result"]
    o.update({"SurveyTitle": browser_title, "ProgressBarDisplay": "VerboseText",
              "BackButton": "true", "NextButton": "Next  →", "PreviousButton": "←  Back",
              "Header": header(phase),
              "Footer": "<div style='text-align:center;font-size:11px;color:#9aa0a1;'>"
                        "Questions? Dr. Jewoong Moon (jmoon19@ua.edu) &middot; Voluntary &amp; confidential</div>"})
    call("PUT", f"/survey-definitions/{sid}/options", o)
    return o

def anon_link(sid):
    return f"https://{DC}.qualtrics.com/jfe/form/{sid}"

# ======================= BUILD PRE (consent) =======================
print("### PRE — Informed Consent & Start ###")
CONSENT_INTRO = (
 "<strong>TeachPlay Microcredential — Informed Consent &amp; Start</strong><br><br>"
 "<strong>Program:</strong> AI-enhanced Educational Game Design, a twelve-session "
 "microcredential from The University of Alabama, College of Education (ACHE / UA "
 "state microcredential).<br>"
 "<strong>Principal Investigator:</strong> Dr. Jewoong Moon (jmoon19@ua.edu)<br>"
 "<strong>IRB Protocol:</strong> [IRB PROTOCOL NUMBER — PLACEHOLDER]<br><br>"
 "This form starts your program. <strong>Completing and submitting this form is all "
 "that is required to begin</strong> — your answers to the optional research questions "
 "below do <em>not</em> affect your access to the program or your credential in any way.<br><br>"
 "<strong>What the program collects:</strong> to operate the microcredential we record "
 "your name and email (to issue and verify your credential), your session progress, your "
 "portfolio deliverables, and assessment scores. This operational data is handled in a "
 "de-identified form wherever possible and is used to run the program and issue your "
 "credential.<br><br>"
 "<strong>Voluntary participation:</strong> participation in any <em>research</em> use of "
 "your de-identified data is entirely voluntary and will not affect your grade, standing, "
 "credential, or relationship with the University. You may decline research use and still "
 "earn the full credential. You may withdraw research consent at any time by emailing the "
 "PI.<br><br>"
 "<strong>Contact:</strong> Dr. Jewoong Moon, jmoon19@ua.edu."
)

pre_sid, pre_def = new_survey("TeachPlay Microcredential — Informed Consent & Start")
b_consent = pre_def or add_block(pre_sid, "Informed Consent")
add_q(pre_sid, db("consent_intro", CONSENT_INTRO), b_consent)
# (a) acknowledgment — single choice. Submitting (any path) passes the gate;
# this is an acknowledgment, NOT a screen-out.
add_q(pre_sid, mc("ack_read",
    "I have read and understand the information above about the TeachPlay microcredential program.",
    ["I have read and understand."], force=True), b_consent)
# (b) OPT-IN research data use — never blocks.
add_q(pre_sid, mc("consent_research",
    "<strong>Optional:</strong> You may use my <strong>de-identified</strong> data for research "
    "on this microcredential. (This is optional and does not affect my access or my credential.)",
    ["Yes — use my de-identified data for research.", "No — do not use my data for research."], force=True), b_consent)
# (c) OPT-IN follow-up contact — never blocks.
add_q(pre_sid, mc("consent_followup",
    "<strong>Optional:</strong> You may contact me for follow-up research (e.g., a short interview "
    "or later survey). (Optional; does not affect my access or my credential.)",
    ["Yes — you may contact me for follow-up research.", "No — do not contact me for follow-up."], force=True), b_consent)

flow = call("GET", f"/survey-definitions/{pre_sid}/flow")["result"]
flow["Flow"] = [ed_decl(),
                {"ID": b_consent, "Type": "Block", "FlowID": "FL_con"},
                end_survey_redirect(CONSENT_REDIRECT)]
flow["Properties"] = {"Count": len(flow["Flow"])}
call("PUT", f"/survey-definitions/{pre_sid}/flow", flow)
design(pre_sid, "Informed Consent & Start", "TeachPlay — Consent & Start")
publish_activate(pre_sid, "v1 consent")
print("PRE SurveyID:", pre_sid)

# ======================= BUILD POST (completion) =======================
print("### POST — Completion Survey ###")
post_sid, post_def = new_survey("TeachPlay Microcredential — Completion Survey")
b_intro = post_def or add_block(post_sid, "Completion Survey")
add_q(post_sid, db("post_intro",
    "<strong>TeachPlay Microcredential — Completion Survey</strong><br><br>"
    "You finished the program — congratulations. Completing and submitting this short survey "
    "unlocks your certificate. The research questions at the end are optional and never affect "
    "your certificate."), b_intro)

# Satisfaction + NPS
b_sat = add_block(post_sid, "Overall")
add_q(post_sid, mc("satisfaction",
    "Overall, how satisfied are you with the TeachPlay microcredential?",
    ["1 — Very dissatisfied", "2", "3", "4", "5 — Very satisfied"], force=True), b_sat)
add_q(post_sid, slider_nps("nps_recommend",
    "How likely are you to recommend this microcredential to a colleague? (0 = not at all likely, "
    "10 = extremely likely)"), b_sat)

# Self-reported competence gain (objective->mechanic->evidence; playtest&evidence; AI HITL/provenance)
b_comp = add_block(post_sid, "Competence Gain")
add_q(post_sid, db("comp_intro", "<strong>Competence gain</strong><br>Rate how much you agree, "
    "based on what you can now do after the program."), b_comp)
add_q(post_sid, matrix("comp_gain",
    "<strong>As a result of this program, I can now…</strong>",
    ["Align a learning objective to a game mechanic and to the evidence it produces (objective → mechanic → evidence).",
     "Run a five-minute playtest and use the evidence from it to revise a design.",
     "Use AI design tools with a human in the loop and document provenance of AI-assisted work."]), b_comp)

# Component usefulness
b_use = add_block(post_sid, "Component Usefulness")
add_q(post_sid, matrix("component_use",
    "<strong>How useful was each part of the program?</strong>",
    ["The written sessions / handbook",
     "The concept-primer videos",
     "The portfolio / evidence work",
     "The AI design tools"],
    scale=["Not at all useful", "Slightly useful", "Moderately useful", "Very useful", "Essential"]), b_use)

# Workload buckets
b_work = add_block(post_sid, "Workload")
add_q(post_sid, mc("workload",
    "About how many total hours did the program take you to complete?",
    ["Under 10 hours", "10–20 hours", "21–35 hours", "36–50 hours", "More than 50 hours"], force=True), b_work)

# Same two opt-in consent items as PRE — never block.
b_research = add_block(post_sid, "Optional Research Permissions")
add_q(post_sid, db("research_intro", "<strong>Optional research permissions</strong><br>"
    "These are optional and do not affect your certificate."), b_research)
add_q(post_sid, mc("consent_research",
    "<strong>Optional:</strong> You may use my <strong>de-identified</strong> data for research on this microcredential.",
    ["Yes — use my de-identified data for research.", "No — do not use my data for research."], force=True), b_research)
add_q(post_sid, mc("consent_followup",
    "<strong>Optional:</strong> You may contact me for follow-up research.",
    ["Yes — you may contact me for follow-up research.", "No — do not contact me for follow-up."], force=True), b_research)

# Open-ended
b_open = add_block(post_sid, "Open Feedback")
add_q(post_sid, te("most_valuable", "What was the most valuable part of the program?", multiline=True), b_open)
add_q(post_sid, te("improve", "What would you improve?", multiline=True), b_open)

flow2 = call("GET", f"/survey-definitions/{post_sid}/flow")["result"]
flow2["Flow"] = [ed_decl(),
    {"ID": b_intro, "Type": "Block", "FlowID": "FL_intro"},
    {"ID": b_sat, "Type": "Standard", "FlowID": "FL_sat"},
    {"ID": b_comp, "Type": "Standard", "FlowID": "FL_comp"},
    {"ID": b_use, "Type": "Standard", "FlowID": "FL_use"},
    {"ID": b_work, "Type": "Standard", "FlowID": "FL_work"},
    {"ID": b_research, "Type": "Standard", "FlowID": "FL_res"},
    {"ID": b_open, "Type": "Standard", "FlowID": "FL_open"},
    end_survey_redirect(POST_REDIRECT)]
flow2["Properties"] = {"Count": len(flow2["Flow"])}
call("PUT", f"/survey-definitions/{post_sid}/flow", flow2)
design(post_sid, "Completion Survey", "TeachPlay — Completion Survey")
publish_activate(post_sid, "v1 completion")
print("POST SurveyID:", post_sid)

# ======================= VERIFY (GET back) =======================
def verify(sid, label, expect_redirect):
    print(f"\n=== VERIFY {label} ({sid}) ===")
    d = call("GET", f"/survey-definitions/{sid}")["result"]
    blocks = d.get("Blocks", {})
    qs = d.get("Questions", {})
    print("  blocks:", len(blocks), "questions:", len(qs))
    tags = sorted({q.get("DataExportTag") for q in qs.values()})
    print("  question tags:", tags)
    # embedded-data fields present in flow?
    flow = d.get("SurveyFlow", {}).get("Flow", [])
    eds = []
    for el in flow:
        if el.get("Type") == "EmbeddedData":
            eds += [f.get("Field") for f in el.get("EmbeddedData", [])]
    print("  embedded-data fields:", eds)
    got = None
    for el in flow:
        if el.get("Type") == "EndSurvey":
            got = (el.get("Options") or {}).get("EOSRedirectURL")
    print("  EOS redirect set:", "YES" if got else "NO (set in dashboard — see spec)")
    if got:
        print("  redirect URL:", got)
    print("  anon link:", anon_link(sid))
    return {"sid": sid, "anon": anon_link(sid), "eds": eds, "redirect": got, "tags": tags}

pre_v = verify(pre_sid, "PRE/consent", CONSENT_REDIRECT)
post_v = verify(post_sid, "POST/completion", POST_REDIRECT)

print("\n=== SUMMARY ===")
print(json.dumps({
    "QUALTRICS_CONSENT_SID": pre_sid,
    "QUALTRICS_POST_SID": post_sid,
    "datacenter": DC,
    "consent_anon_link": pre_v["anon"],
    "post_anon_link": post_v["anon"],
    "consent_redirect_set": bool(pre_v["redirect"]),
    "post_redirect_set": bool(post_v["redirect"]),
}, indent=2))
print("\nPRE_SID=", pre_sid, "POST_SID=", post_sid)
