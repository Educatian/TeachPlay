"""TeachPlay perception × efficacy instrument items.

Wording is the editable surface — adjust here, builder scripts import.
All Likert items are 5-point. Reliability-preserving short forms only
(every construct >= 3 items so Cronbach's alpha / McDonald's omega are
estimable per Hair 2019; CFA deferred to cohort 2 when N pools >= 150).

Sources:
- UMUX (Lewis, Utesch & Maher 2013) — 4-item, alpha = .79-.83
- AI-use Self-Efficacy — Bandura task-specific adaptation; Wang et al. 2023 GenAI-SE short
- Credential value perception — Phillips & Cohen 2023 MVS, single-composite short
- Designer identity — Kafai & Fields 2018 designer-identity, top-loading 4
- Teaching Self-Efficacy contagion — Tschannen-Moran TSES adapted
- Demographics — IPEDS / NCTQ standard categories

Pre/post analysis: identical wording on shared blocks (AI-use SE, Designer
identity) so paired Cohen's d_z is interpretable. Credential block uses
expectation/realization framing (different but symmetric).
"""

# ---- Pseudonymous matching code (PII-free) ---------------------------------
MATCHING_CODE_INSTRUCTION = (
    "<p>To pair your responses across the program without storing any "
    "identifying information, please create a 4-character code using this "
    "rule:</p>"
    "<ol>"
    "<li>First letter of your <b>mother's first name</b></li>"
    "<li>Two-digit number of your <b>birth month</b> (01-12)</li>"
    "<li>First letter of your <b>favorite color</b></li>"
    "</ol>"
    "<p>Example: Karen, July, Blue → <b>K07B</b>. "
    "Use the same code on every TeachPlay survey.</p>"
)

# ---- Tag block (Post and Pre share T0; cohort comes via EmbeddedData) ------
TAG_ITEMS_POST = [
    # (builder, text, tag)
    ("text_entry",
     "Your 4-character matching code (see instructions above):",
     "T0_match_code", True),
    ("mc_single",
     "Your professional role:",
     "T1_role",
     ["Pre-service teacher",
      "In-service K-5 teacher",
      "In-service 6-8 teacher",
      "In-service 9-12 teacher",
      "Higher education instructor",
      "Instructional designer / LXD professional",
      "School / district administrator",
      "Other",
      "Prefer not to say"],
     True),
    ("mc_single",
     "Approximately how many hours did you spend on TeachPlay across all 12 sessions? "
     "(stated program hours = 36)",
     "T2_hours_actual",
     ["Less than 18 hours", "18-30 hours", "31-42 hours",
      "43-54 hours", "More than 54 hours", "Don't remember"],
     False),
]

# ---- UMUX (4 items, agree-Likert) -----------------------------------------
UMUX = [
    ("TeachPlay's capabilities meet my requirements.",
     "UMUX_1_capabilities"),
    ("Using TeachPlay is a frustrating experience.",
     "UMUX_2_frustration_R"),
    ("TeachPlay is easy to use.",
     "UMUX_3_easeofuse"),
    ("I have to spend too much time correcting things in TeachPlay.",
     "UMUX_4_correcting_R"),
]

# ---- AI-use self-efficacy (4 items, confidence-Likert; Pre + Post identical)
AI_SE = [
    ("I can use generative AI tools (ChatGPT, Claude, etc.) to draft "
     "instructional content for my own classroom.",
     "AISE_1_draft"),
    ("I can prompt generative AI tools to revise game-design ideas "
     "based on student needs.",
     "AISE_2_prompt"),
    ("I can recognize when an AI output needs revision before I use it "
     "with students.",
     "AISE_3_critique"),
    ("I can integrate AI-generated content into a coherent educational "
     "gamelet I would use in class.",
     "AISE_4_integrate"),
]

# ---- Credential value perception (Post; agree-Likert) ----------------------
CRED_VALUE = [
    ("The AI-Enhanced Instructional Game Designer badge signals valuable "
     "skills within my profession.",
     "CV_1_signal"),
    ("My peers and supervisors will recognize this credential as meaningful.",
     "CV_2_social"),
    ("This credential will help me access better professional opportunities.",
     "CV_3_economic"),
    ("The credential reflects skills I will actually use in my classroom.",
     "CV_4_realized"),
]

# ---- Credential expectation (Pre; agree-Likert; symmetric to CRED_VALUE) ---
CRED_EXPECT = [
    ("I expect the AI-Enhanced Instructional Game Designer badge to signal "
     "valuable skills within my profession.",
     "CE_1_signal"),
    ("I expect my peers and supervisors to recognize this credential as "
     "meaningful.",
     "CE_2_social"),
    ("I expect this credential to help me access better professional "
     "opportunities.",
     "CE_3_economic"),
    ("I expect the credential to reflect skills I will actually use in "
     "my classroom.",
     "CE_4_realized"),
]

# ---- Designer identity (Pre + Post identical; agree-Likert) ----------------
DESIGNER_ID = [
    ("I see myself as a designer of learning experiences.",
     "DI_1_self"),
    ("Designing instructional games is part of who I am as an educator.",
     "DI_2_part_of_me"),
    ("When I solve teaching problems, I think like a designer.",
     "DI_3_thinking"),
    ("Designing educational games gives me a sense of agency in my "
     "profession.",
     "DI_4_agency"),
]

# ---- Teaching self-efficacy contagion (Post only; confidence-Likert) -------
TSE_CONTAGION = [
    ("I am confident that my own students will engage with the gamelets "
     "I design.",
     "TSE_1_engage"),
    ("I am confident I can teach core content using gamelets I create.",
     "TSE_2_teach"),
    ("I am confident my AI-enhanced gamelets will improve my classroom "
     "outcomes.",
     "TSE_3_outcome"),
]

# ---- Demographics (Pre only; D1-D6 core, D7 opt-in) -----------------------
DEMOGRAPHICS = [
    ("mc_single",
     "Your professional role:",
     "D1_role",
     ["Pre-service teacher",
      "In-service K-5 teacher",
      "In-service 6-8 teacher",
      "In-service 9-12 teacher",
      "Higher education instructor",
      "Instructional designer / LXD professional",
      "School / district administrator",
      "Other",
      "Prefer not to say"],
     True),
    ("mc_multi",
     "Grade level(s) you teach or target (select all that apply):",
     "D2_grade",
     ["PreK / K", "1-2", "3-5", "6-8", "9-12",
      "Higher education", "Adult / corporate",
      "Not currently teaching", "Prefer not to say"],
     False),
    ("mc_single",
     "Gender:",
     "D3_gender",
     ["Woman", "Man", "Non-binary / genderqueer",
      "Prefer to self-describe", "Prefer not to say"],
     False),
    ("mc_multi",
     "Subject area(s) you teach (select all that apply):",
     "D4_subject",
     ["English / Language Arts", "Mathematics", "Science / STEM",
      "Social Studies", "Computer Science / Technology",
      "Arts", "Special Education",
      "Multiple subjects (elementary)", "Other",
      "Prefer not to say"],
     False),
    ("mc_single",
     "Years of teaching experience:",
     "D5_years",
     ["0 (pre-service)", "1-3", "4-9", "10-19", "20+",
      "Prefer not to say"],
     False),
    ("mc_single",
     "Institution type:",
     "D6_institution",
     ["Public school (K-12)", "Private school (K-12)",
      "Charter school (K-12)", "Higher education",
      "Non-school setting", "Prefer not to say"],
     False),
    # D7 = optional opt-in race / ethnicity (aggregate-only reporting; n>=10 cell rule)
    ("mc_multi",
     "(Optional) Race / ethnicity — select all that apply. Reported in "
     "aggregate only (cells with fewer than 10 respondents are not "
     "broken out):",
     "D7_race_optin",
     ["American Indian or Alaska Native",
      "Asian",
      "Black or African American",
      "Hispanic or Latino",
      "Native Hawaiian or Other Pacific Islander",
      "White",
      "Two or more races",
      "Prefer to self-describe",
      "Prefer not to say"],
     False),
]
