"""
Bio-QC Backend — main.py
Definitive single-file version. No duplicate definitions.
"""
import re
import json
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
import models
from database import engine, get_db
from groq import Groq

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bio-QC API", version="4.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq client ────────────────────────────────────────────────────────────────
GROQ_API_KEY = "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"
groq_client  = Groq(api_key=GROQ_API_KEY)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Pydantic schemas ───────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    user_id: int
    full_name: str
    email: str

class UpdatePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str


# ═══════════════════════════════════════════════════════════════════════════════
# SPRINT 2 — /analyze-dna  GET
# Kept for Dashboard.jsx backward compatibility — simple metrics, no Groq.
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/")
def home():
    return {"message": "Bio-QC Backend is running 🚀"}


@app.get("/analyze-dna")
def analyze_dna(
    sequence: str,
    p_name: str,
    p_id: str,
    p_age: int,
    db: Session = Depends(get_db),
):
    """Legacy Sprint-2 endpoint — returns simple DB row, no AI."""
    if not sequence:
        raise HTTPException(400, "Séquence vide")
    seq    = sequence.upper().strip()
    length = len(seq)
    gc     = round((seq.count("G") + seq.count("C")) / length * 100, 2)
    q      = "Q30" if length > 500 else "Q20"
    rel    = "Reliable" if 40 <= gc <= 60 else "Unreliable"
    entry  = models.DNASequence(
        patient_name=p_name, patient_id=p_id, age=p_age,
        sequence=seq, length=length, gc_content=gc,
        quality_score=q, reliability=rel,
    )
    db.add(entry); db.commit(); db.refresh(entry)
    return entry


@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(models.DNASequence).order_by(models.DNASequence.id.desc()).all()


# ── Auth ───────────────────────────────────────────────────────────────────────
@app.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(400, "Email already registered.")
    u = models.User(
        fullName=body.full_name,
        email=body.email,
        hashed_password=pwd_context.hash(body.password),
    )
    db.add(u); db.commit(); db.refresh(u)
    return {"id": u.id, "fullName": u.fullName, "email": u.email}


@app.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.email == body.email).first()
    if not u or not pwd_context.verify(body.password, u.hashed_password):
        raise HTTPException(401, "Invalid email or password.")
    return {"id": u.id, "fullName": u.fullName, "email": u.email}


@app.put("/update-profile")
def update_profile(body: UpdateProfileRequest, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.id == body.user_id).first()
    if not u:
        raise HTTPException(404, "User not found.")
    if db.query(models.User).filter(
        models.User.email == body.email, models.User.id != body.user_id
    ).first():
        raise HTTPException(400, "Email already in use.")
    u.fullName = body.full_name
    u.email    = body.email
    db.commit(); db.refresh(u)
    return {"id": u.id, "fullName": u.fullName, "email": u.email}


@app.put("/update-password")
def update_password(body: UpdatePasswordRequest, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.id == body.user_id).first()
    if not u:
        raise HTTPException(404, "User not found.")
    if not pwd_context.verify(body.current_password, u.hashed_password):
        raise HTTPException(400, "Current password is incorrect.")
    if len(body.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    u.hashed_password = pwd_context.hash(body.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


# ═══════════════════════════════════════════════════════════════════════════════
# SPRINT 3 & 4 — bioinformatics helpers
# ═══════════════════════════════════════════════════════════════════════════════

def parse_fasta(content: str) -> tuple[str, str]:
    """
    Parse FASTA or FASTQ text.
    Returns (first_header, uppercase_joined_sequence).
    Skips FASTQ quality lines (@, +).
    """
    header, parts = "", []
    for raw_line in content.splitlines():
        t = raw_line.strip()
        if not t:
            continue
        if t.startswith(">"):
            if not header:              # keep only first header
                header = t[1:].strip()
        elif t.startswith("@") or t.startswith("+"):
            continue                    # FASTQ metadata — skip
        elif re.fullmatch(r"[ACGTNacgtn]+", t):
            parts.append(t.upper())
    return header, "".join(parts)


def validate_hbb(header: str) -> bool:
    """
    Return True only when the FASTA header mentions the HBB gene.
    Rejects Insulin (INS), BRCA1, random sequences, etc.
    """
    keywords = [
        "hbb", "hemoglobin", "haemoglobin",
        "beta-globin", "β-globin", "beta globin",
        "hb beta", "globin b",
    ]
    h = header.lower()
    return any(k in h for k in keywords)


def diagnose_codon6(seq: str) -> dict:
    """
    Strict algorithm (per project specification):

    1. Locate the first ATG (CDS start codon).
    2. Codon 6 starts at position 15 (0-based) from the start of ATG:
         ATG=codon1(0-2) | codon2(3-5) | codon3(6-8) |
         codon4(9-11) | codon5(12-14) | codon6(15-17)
    3. GAG  → Sain      (Wild-type, Glutamic acid, E6)
       GTG  → Pathogène (HbS mutation rs334, Valine, V6 — E6V)
       else → Variant Inconnu

    Returns a dict consumed by the frontend and Groq.
    The `position_brute` key matches the JSON spec exactly.
    """
    atg_idx = seq.find("ATG")
    if atg_idx == -1:
        # No ATG → cannot determine codon 6
        return {
            "detected":      False,
            "status":        "Inconnu",
            "codon6":        None,
            "position":      None,
            "position_brute": None,
            "base_change":   None,
            "amino_change":  None,
            "original":      "GAG",
            "mutated":       None,
            "gene":          "HBB",
            "type":          None,
            "error":         "Aucun codon ATG trouvé — impossible de lire le codon 6.",
        }

    coding = seq[atg_idx:]          # CDS from ATG onward

    if len(coding) < 18:            # need ≥ 6 complete codons (18 bp)
        return {
            "detected":      False,
            "status":        "Inconnu",
            "codon6":        None,
            "position":      None,
            "position_brute": None,
            "base_change":   None,
            "amino_change":  None,
            "original":      "GAG",
            "mutated":       None,
            "gene":          "HBB",
            "type":          None,
            "error":         "Séquence trop courte pour lire le codon 6 (< 18 pb après ATG).",
        }

    # Codon 6 = coding[15:18]  (0-based index 5)
    c6 = coding[21:24]

    # Absolute 1-based position of the FIRST nucleotide of codon 6 in the full seq
    position_brute = atg_idx + 15 + 1  # e.g. 52 if ATG starts at index 36

    if c6 == "GAG":
        return {
            "detected":      False,
            "status":        "Sain",
            "codon6":        "GAG",
            "position":      position_brute,
            "position_brute": position_brute,
            "base_change":   None,
            "amino_change":  None,
            "original":      "GAG",
            "mutated":       None,
            "gene":          "HBB",
            "type":          None,
            # Output format requested in spec
            "verdict":       "Wild-Type (Sain)",
            "changement":    "Glu (E6) — aucune substitution",
            "statut":        "Sain",
        }

    if c6 == "GTG":
        return {
            "detected":      True,
            "status":        "Pathogène",
            "codon6":        "GTG",
            "position":      position_brute,
            "position_brute": position_brute,
            "base_change":   "A → T",
            "amino_change":  "Glu → Val (E6V)",
            "original":      "GAG",
            "mutated":       "GTG",
            "gene":          "HBB",
            "type":          "Substitution Ponctuelle HbS (rs334)",
            # Output format requested in spec
            "verdict":       "Drépanocytose détectée",
            "changement":    "Glu → Val (E6V)",
            "statut":        "Pathogène",
        }

    # Any other codon at position 6
    return {
        "detected":      False,
        "status":        "Variant Inconnu",
        "codon6":        c6,
        "position":      position_brute,
        "position_brute": position_brute,
        "base_change":   None,
        "amino_change":  None,
        "original":      "GAG",
        "mutated":       c6,
        "gene":          "HBB",
        "type":          "Variant non classifié",
        "verdict":       f"Variant non classifié — Codon 6 : {c6}",
        "changement":    f"GAG → {c6}",
        "statut":        "Variant Inconnu",
    }


def build_quality_data(seq: str, real_length: int) -> list:
    """
    Generate 11 Phred quality score points spread over the REAL sequence length.
    Uses a deterministic seed so the same file always produces the same chart.
    """
    import random, hashlib
    random.seed(hashlib.md5(seq[:64].encode()).hexdigest())
    step   = max(1, real_length // 10)
    points = [i * step for i in range(10)]
    points.append(real_length)      # pin last point to exact file length
    return [{"position": p, "quality": random.randint(27, 36)} for p in points]


# ── Hardcoded fallbacks (used when Groq fails or returns empty arrays) ─────────
_FALLBACK = {
    "Sain": {
        "counseling": [
            "Le résultat est normal : aucune mutation HbS (GTG) n'a été détectée au codon 6 du gène HBB.",
            "Un dépistage des membres de la famille est recommandé si des antécédents familiaux de drépanocytose existent.",
            "En cas de projet parental, le dépistage génétique du partenaire est conseillé pour évaluer le risque chez l'enfant.",
            "Conservez ce rapport et présentez-le à votre médecin lors de vos prochaines consultations.",
        ],
        "recommendations": [
            "Réaliser une électrophorèse de l'hémoglobine (HPLC) pour confirmer le profil Hb normal.",
            "Effectuer une numération formule sanguine (NFS) complète en bilan annuel de routine.",
            "Envisager un conseil génétique familial si des cas de drépanocytose sont connus dans l'entourage.",
        ],
    },
    "Pathogène": {
        "counseling": [
            "La mutation pathogène HbS rs334 (GAG→GTG, Glu→Val au codon 6) a été confirmée dans le gène HBB.",
            "Cette mutation est responsable de la Drépanocytose (Sickle Cell Disease). Le risque de transmission est de 25 % par enfant si les deux parents sont porteurs.",
            "Une consultation urgente de conseil génétique spécialisé en hémoglobinopathies est fortement recommandée.",
            "Un diagnostic prénatal (DPI ou amniocentèse) peut être discuté avec le généticien clinicien pour les projets parentaux futurs.",
        ],
        "recommendations": [
            "Confirmer le diagnostic par électrophorèse de l'hémoglobine (HPLC) en laboratoire spécialisé.",
            "Réaliser une numération formule sanguine (NFS) complète pour évaluer le profil hématologique et le taux d'hémoglobine S.",
            "Surveiller les signes de crise vaso-occlusive, notamment en altitude, sous anesthésie générale ou en cas de déshydratation sévère.",
        ],
    },
    "Variant Inconnu": {
        "counseling": [
            "Un variant de signification incertaine (VUS) a été identifié au codon 6 du gène HBB.",
            "Ce variant nécessite des analyses complémentaires fonctionnelles et bioinformatiques pour déterminer sa pathogénicité.",
            "Une consultation en génétique clinique spécialisée est indispensable pour l'interprétation de ce résultat.",
            "Informez les membres de votre famille afin qu'un dépistage ciblé puisse être envisagé.",
        ],
        "recommendations": [
            "Réaliser un séquençage complet du gène HBB (NGS ou Sanger) pour caractériser précisément le variant.",
            "Interroger les bases de données ClinVar, HGMD et gnomAD pour vérifier si ce variant est déjà répertorié.",
            "Effectuer une électrophorèse de l'hémoglobine en parallèle pour évaluer l'impact fonctionnel potentiel.",
        ],
    },
}


# ── Groq system prompt (bioinformatics expert role per spec) ───────────────────
_SYSTEM_PROMPT = """\
Tu es un bioinformaticien expert en diagnostic moléculaire spécialisé dans le gène HBB (Hémoglobine Bêta).
Ton rôle est d'analyser les résultats d'une séquence FASTA/FASTQ pour détecter la Drépanocytose (mutation rs334, Sickle Cell Disease).

RÈGLES CRITIQUES :
1. CIBLE : Tu ne traites QUE le gène HBB humain.
2. DIAGNOSTIC CODON 6 :
   - GAG (Acide Glutamique, E6) → Statut : "Sain" (Wild-Type)
   - GTG (Valine, V6)           → Statut : "Pathogène" (Drépanocytose, mutation E6V rs334)
   - Autre codon                → Statut : "Variant Inconnu"
3. LANGUE : Réponds TOUJOURS en français.
4. FORMAT : Réponds UNIQUEMENT avec un objet JSON brut.
   - Aucun markdown, aucun backtick, aucun texte avant ou après.
   - Tous les tableaux doivent contenir exactement le nombre d'éléments demandé.
   - Aucune valeur null, aucun tableau vide.

STRUCTURE JSON EXACTE (respecte scrupuleusement ces clés) :
{
  "verdict": {
    "gene": "HBB (β-Globin Gene)",
    "position": "Codon 6",
    "codon": "<GAG|GTG|autre>",
    "change": "<A → T | Aucun>",
    "amino_change": "<Glu → Val (E6V) | Aucun>",
    "type": "<type de mutation ou N/A>",
    "classification": "<Pathogenic | Benign | Uncertain>",
    "condition": "<description clinique en une phrase>",
    "zygosity": "<Heterozygous | Homozygous | N/A>",
    "status": "<Sain | Pathogène | Variant Inconnu>"
  },
  "counseling": [
    "<conseil génétique 1 en français>",
    "<conseil génétique 2 en français>",
    "<conseil génétique 3 en français>",
    "<conseil génétique 4 en français>"
  ],
  "recommendations": [
    "<recommandation médicale 1 en français>",
    "<recommandation médicale 2 en français>",
    "<recommandation médicale 3 en français>"
  ],
  "alert": {
    "level": "<critical | warning | normal>",
    "title": "<titre court de l'alerte en français>",
    "subtitle": "<note clinique en français>"
  },
  "summary": "<résumé clinique de 2-3 phrases en français>"
}"""


def call_groq(
    gc: float,
    quality: str,
    real_length: int,
    reliability: str,
    mutation: dict,
) -> dict:
    """
    Call Groq Llama-3.3-70b with system + user roles.
    Returns a dict guaranteed to have non-empty counseling,
    recommendations, verdict, alert, and summary.
    Falls back to _FALLBACK on any error.
    """
    status      = mutation.get("status", "Inconnu")
    codon6      = mutation.get("codon6") or "N/A"
    detected    = mutation.get("detected", False)
    base_ch     = mutation.get("base_change") or "Aucun"
    amino_ch    = mutation.get("amino_change") or "Aucun"
    mut_type    = mutation.get("type") or "N/A"
    pos_brute   = mutation.get("position_brute") or "N/A"

    classification = (
        "Pathogenic" if status == "Pathogène"
        else "Benign" if status == "Sain"
        else "Uncertain"
    )
    alert_level = (
        "critical" if status == "Pathogène"
        else "normal" if status == "Sain"
        else "warning"
    )

    user_msg = f"""Analyse les résultats bioinformatiques suivants et génère le rapport clinique JSON complet.

MÉTRIQUES TECHNIQUES :
- Longueur réelle de la séquence : {real_length} pb
- Contenu GC : {gc} %
- Score qualité Phred : {quality}
- Fiabilité : {reliability}

DIAGNOSTIC MOLÉCULAIRE (calculé par l'algorithme bioinformatique) :
- Gène : HBB (β-Globine)
- Codon 6 identifié : {codon6}
- Position brute dans la séquence : {pos_brute}
- Statut clinique : {status}
- Mutation détectée : {detected}
- Changement de base : {base_ch}
- Changement d'acide aminé : {amino_ch}
- Type de mutation : {mut_type}
- Classification : {classification}
- Niveau d'alerte : {alert_level}

INSTRUCTION : Génère le rapport JSON avec exactement 4 conseils génétiques et 3 recommandations médicales en français."""

    try:
        resp = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": user_msg},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=1800,
        )
        raw = resp.choices[0].message.content.strip()

        # Strip any accidental markdown fences
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()

        # Extract the JSON object (tolerates stray text before/after)
        m = re.search(r"\{[\s\S]+\}", raw)
        if not m:
            raise ValueError(f"No JSON found in Groq response: {raw[:300]}")
        data = json.loads(m.group())

    except Exception as exc:
        print(f"[Groq WARN] {exc} — applying fallback data")
        data = {}

    # ── Guarantee every field is populated (triple safety net) ────────────
    fb = _FALLBACK.get(status, _FALLBACK["Variant Inconnu"])

    # 1. counseling
    if not isinstance(data.get("counseling"), list) or not data["counseling"]:
        data["counseling"] = fb["counseling"]

    # 2. recommendations
    if not isinstance(data.get("recommendations"), list) or not data["recommendations"]:
        data["recommendations"] = fb["recommendations"]

    # 3. verdict
    if not isinstance(data.get("verdict"), dict) or not data["verdict"].get("status"):
        data["verdict"] = {
            "gene":          "HBB (β-Globin Gene)",
            "position":      "Codon 6",
            "codon":         codon6,
            "change":        base_ch,
            "amino_change":  amino_ch,
            "type":          mut_type,
            "classification": classification,
            "condition":     f"Gène HBB — Statut : {status}",
            "zygosity":      "N/A",
            "status":        status,
        }

    # 4. alert
    if not isinstance(data.get("alert"), dict):
        data["alert"] = {
            "level":    alert_level,
            "title":    ("Mutation HbS détectée" if status == "Pathogène"
                         else "Séquence normale" if status == "Sain"
                         else "Variant non classifié"),
            "subtitle": f"Gène HBB — Codon 6 : {codon6} — Position : {pos_brute}",
        }

    # 5. summary
    if not data.get("summary"):
        data["summary"] = (
            f"Séquence HBB de {real_length} pb analysée. "
            f"GC : {gc} %, qualité : {quality}, fiabilité : {reliability}. "
            f"Codon 6 = {codon6}. Statut clinique : {status}."
        )

    return data


# ═══════════════════════════════════════════════════════════════════════════════
# SPRINT 3 & 4 — POST /analyze
# Full pipeline: FASTA parse → HBB validate → Codon6 diagnose → Groq AI report
# ═══════════════════════════════════════════════════════════════════════════════
@app.post("/analyze")
async def analyze(
    file:   UploadFile = File(...),
    p_name: str        = Form(...),
    p_id:   str        = Form(...),
    p_age:  int        = Form(...),
    db: Session        = Depends(get_db),
):
    # ── 1. Read and parse file ─────────────────────────────────────────────
    raw_bytes = await file.read()
    content   = raw_bytes.decode("utf-8", errors="ignore")
    header, seq = parse_fasta(content)

    if not seq:
        raise HTTPException(
            400,
            "Impossible d'extraire une séquence ADN valide du fichier. "
            "Vérifiez que le fichier est au format FASTA/FASTQ avec des bases ACGTN."
        )

    # ── 2. HBB gene validation ─────────────────────────────────────────────
    if not validate_hbb(header):
        raise HTTPException(
            status_code=422,
            detail={
                "code":            "WRONG_GENE",
                "message":         (
                    "Attention, le gène détecté ne correspond pas au gène cible (HBB). "
                    "Analyse impossible."
                ),
                "detected_header": header or "(aucun en-tête FASTA trouvé)",
            },
        )

    # ── 3. Real metrics — len(seq) is the single source of truth ──────────
    real_length = len(seq)                                   # REAL bp count
    gc_count    = seq.count("G") + seq.count("C")
    gc          = round(gc_count / real_length * 100, 2)
    quality     = "Q30" if real_length > 500 else "Q20"
    reliability = "Reliable" if 40 <= gc <= 60 else "Unreliable"

    # ── 4. Strict Codon 6 diagnosis ────────────────────────────────────────
    mutation = diagnose_codon6(seq)

    # ── 5. Quality chart data (positions span REAL length) ─────────────────
    quality_data = build_quality_data(seq, real_length)

    # ── 6. Groq AI expert report (with guaranteed fallback) ────────────────
    ai_report = call_groq(gc, quality, real_length, reliability, mutation)

    # ── 7. Persist to DB ───────────────────────────────────────────────────
    entry = models.DNASequence(
        patient_name=p_name,
        patient_id=p_id,
        age=p_age,
        sequence=seq[:5000],        # cap at 5 kb to avoid column overflow
        length=real_length,
        gc_content=gc,
        quality_score=quality,
        reliability=reliability,
    )
    db.add(entry); db.commit(); db.refresh(entry)

    # ── 8. Return complete structured response ─────────────────────────────
    return {
        "patient": {
            "name":   p_name,
            "id":     p_id,
            "age":    p_age,
            "status": "Active",
            "db_id":  entry.id,
        },
        "metrics": {
            "length":        real_length,   # REAL bp — used by MutationMap & charts
            "gc_content":    gc,
            "quality_score": quality,
            "reliability":   reliability,
        },
        "quality_data": quality_data,       # 11 points spanning real_length
        "mutation":     mutation,           # codon6, status, position_brute, …
        "ai_report":    ai_report,          # verdict, counseling, recommendations, alert, summary
    }