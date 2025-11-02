# Unsiloed AI Integration — README (for our AI Grading Platform)

This doc shows **how we use Unsiloed AI** for grading: OCR/parse student PDFs, **schema-guided extraction** of rubric fields, and **table parsing**. It includes **Python** and **Node** client stubs and an end-to-end grading flow.

---

## What we use from Unsiloed

* **Extract Data** (`POST /cite`) → JSON-Schema–guided field extraction with **values + confidence + bboxes + page_no** (great for “Q1 final answer”, “units”, IDs). ([docs.unsiloed.ai][1])
* **Parse Document** (`POST /parse` + `GET /parse/{job_id}`) → full OCR/layout chunks with bboxes/markdown/html (good for inline feedback/anchors). ([docs.unsiloed.ai][2])
* **Extract Tables** (`POST /tables`) → structured tables with headers/rows/bboxes (truth tables, matrices, grading grids). ([docs.unsiloed.ai][3])
* **Jobs** (`GET /jobs/{job_id}`, `GET /jobs/{job_id}/result`) → status/results for generic async jobs (extraction/tables). ([docs.unsiloed.ai][4])

> **Base URL:** `https://prod.visionapi.unsiloed.ai` (all endpoints).
> **Auth headers:** Some pages show `api-key`, others `X-API-Key`. We support **both** in our client. ([docs.unsiloed.ai][1])

---

## Environment

Create an `.env`:

```bash
UNSILOED_API_KEY=your-api-key
UNSILOED_BASE_URL=https://prod.visionapi.unsiloed.ai
```

---

## Python client (stubs)

```python
# unsiloed_client.py
import os, time, requests
BASE = os.getenv("UNSILOED_BASE_URL", "https://prod.visionapi.unsiloed.ai")
API_KEY = os.getenv("UNSILOED_API_KEY")

def _headers(prefer="api-key"):
    # Prefer 'api-key' (works on /parse, /cite, /tables, /parse/{id}) and
    # fall back to 'X-API-Key' for generic /jobs endpoints per docs.
    # We'll include both to be safe.
    return {
        "api-key": API_KEY,
        "X-API-Key": API_KEY,
        "accept": "application/json",
    }

def parse_document(pdf_path, use_high_resolution=True,
                   segmentation_method="smart_layout_detection",
                   ocr_mode="auto_ocr", ocr_engine="UnsiloedHawk"):
    # POST /parse → returns job_id
    # Options per docs: segmentation, OCR mode, engine. :contentReference[oaicite:5]{index=5}
    url = f"{BASE}/parse"
    files = {"file": ("document.pdf", open(pdf_path, "rb"), "application/pdf")}
    data = {
        "use_high_resolution": str(use_high_resolution).lower(),
        "segmentation_method": segmentation_method,
        "ocr_mode": ocr_mode,
        "ocr_engine": ocr_engine,
    }
    r = requests.post(url, headers=_headers(), files=files, data=data)
    r.raise_for_status()
    return r.json()  # contains job_id, status, message, quota_remaining, etc.

def get_parse_results(job_id, poll_interval=5, timeout=600):
    # GET /parse/{job_id} → status; when Succeeded, includes chunks. :contentReference[oaicite:6]{index=6}
    url = f"{BASE}/parse/{job_id}"
    headers = _headers()
    t0 = time.time()
    while True:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        body = r.json()
        status = body.get("status")
        if status == "Succeeded":
            return body
        if status == "Failed":
            raise RuntimeError(f"Parse job failed: {body}")
        if time.time() - t0 > timeout:
            raise TimeoutError("parse job timed out")
        time.sleep(poll_interval)

def extract_data(pdf_path, schema_json_str):
    # POST /cite → returns job_id (use /jobs/{id} + /jobs/{id}/result). :contentReference[oaicite:7]{index=7}
    url = f"{BASE}/cite"
    files = {"pdf_file": ("document.pdf", open(pdf_path, "rb"), "application/pdf")}
    data = {"schema_data": schema_json_str}
    r = requests.post(url, headers=_headers(), files=files, data=data)
    r.raise_for_status()
    return r.json()["job_id"]

def extract_tables(pdf_path):
    # POST /tables → returns job_id. :contentReference[oaicite:8]{index=8}
    url = f"{BASE}/tables"
    files = {"pdf_file": ("document.pdf", open(pdf_path, "rb"), "application/pdf")}
    r = requests.post(url, headers=_headers(), files=files)
    r.raise_for_status()
    return r.json()["job_id"]

def get_job_status(job_id):
    # GET /jobs/{job_id} (generic) → status, type, created_at... :contentReference[oaicite:9]{index=9}
    url = f"{BASE}/jobs/{job_id}"
    r = requests.get(url, headers=_headers())
    r.raise_for_status()
    return r.json()

def get_job_result(job_id):
    # GET /jobs/{job_id}/result → extraction/tables final JSON. :contentReference[oaicite:10]{index=10}
    url = f"{BASE}/jobs/{job_id}/result"
    r = requests.get(url, headers=_headers())
    r.raise_for_status()
    return r.json()

# Example rubric schema (JSON string). Keep additionalProperties false. :contentReference[oaicite:11]{index=11}
RUBRIC_Q1_SCHEMA = """
{
  "type": "object",
  "properties": {
    "q1_final_value": {"type": "string", "description": "Final numeric answer for Q1"},
    "q1_units": {"type": "string", "description": "Units for Q1"}
  },
  "required": ["q1_final_value"],
  "additionalProperties": false
}
"""

def grade_one_pdf(pdf_path, tolerance=1e-3, confidence_cutoff=0.85):
    # 1) parse (for inline anchors/feedback)
    parse_job = parse_document(pdf_path)
    parse_res = get_parse_results(parse_job["job_id"])

    # 2) schema extraction for rubric fields
    cite_job_id = extract_data(pdf_path, RUBRIC_Q1_SCHEMA)
    # poll generic jobs:
    while True:
        st = get_job_status(cite_job_id)
        if st.get("status", "").lower() in ["completed", "failed"]:
            break
        time.sleep(5)
    if st.get("status", "").lower() == "failed":
        raise RuntimeError(f"Extraction failed: {st}")

    cite_res = get_job_result(cite_job_id)
    data = cite_res.get("data", cite_res)  # some payloads nest under "data"
    q1 = data.get("q1_final_value", {})
    units = data.get("q1_units", {})
    score = q1.get("score", 0.0)

    # Example grading logic
    points = 0
    notes = []

    # Check numeric answer vs solution (example: 3.142)
    SOL = 3.142
    try:
        val = float(q1.get("value", "").strip())
        if abs(val - SOL) <= tolerance:
            points += 5
        else:
            notes.append("Q1 value off target.")
    except Exception:
        notes.append("Q1 value not numeric.")

    # Units check
    if units.get("value"):
        points += 1
    else:
        notes.append("Missing units for Q1.")

    # Low-confidence flag
    if score < confidence_cutoff:
        notes.append("Low OCR confidence on Q1; please review manually.")

    # Use bboxes/page_no (if present) for inline annotations in UI/PDF renderer. :contentReference[oaicite:12]{index=12}
    anchors = {"q1": {"page": q1.get("page_no"), "bboxes": q1.get("bboxes", [])}}

    return {"points": points, "notes": notes, "anchors": anchors, "parse": parse_res}
```

---

## Node (TypeScript) client (stubs)

```ts
// unsiloedClient.ts
import * as fs from "node:fs";
import fetch, { FormData, File } from "node-fetch";

const BASE = process.env.UNSILOED_BASE_URL ?? "https://prod.visionapi.unsiloed.ai";
const API_KEY = process.env.UNSILOED_API_KEY!;

function headers() {
  // Send both header variants for compatibility across endpoints. :contentReference[oaicite:13]{index=13}
  return { "api-key": API_KEY, "X-API-Key": API_KEY, accept: "application/json" };
}

export async function parseDocument(pdfPath: string) {
  const form = new FormData();
  form.set("file", new File([fs.readFileSync(pdfPath)], "document.pdf", { type: "application/pdf" }));
  form.set("use_high_resolution", "true");
  form.set("segmentation_method", "smart_layout_detection");
  form.set("ocr_mode", "auto_ocr");
  form.set("ocr_engine", "UnsiloedHawk"); // accuracy focus. :contentReference[oaicite:14]{index=14}

  const res = await fetch(`${BASE}/parse`, { method: "POST", headers: headers() as any, body: form as any });
  if (!res.ok) throw new Error(`parse failed: ${res.status} ${await res.text()}`);
  return res.json(); // contains job_id, etc.
}

export async function getParseResults(jobId: string, pollMs = 5000, timeoutMs = 600000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE}/parse/${jobId}`, { headers: headers() as any });
    if (!res.ok) throw new Error(`parse status failed: ${res.status} ${await res.text()}`);
    const body = await res.json();
    if (body.status === "Succeeded") return body; // includes chunks/bboxes/etc. :contentReference[oaicite:15]{index=15}
    if (body.status === "Failed") throw new Error(`parse job failed: ${JSON.stringify(body)}`);
    await new Promise(r => setTimeout(r, pollMs));
  }
  throw new Error("parse job timed out");
}

export async function extractData(pdfPath: string, schemaJson: string) {
  const form = new FormData();
  form.set("pdf_file", new File([fs.readFileSync(pdfPath)], "document.pdf", { type: "application/pdf" }));
  form.set("schema_data", schemaJson);
  const res = await fetch(`${BASE}/cite`, { method: "POST", headers: headers() as any, body: form as any });
  if (!res.ok) throw new Error(`cite failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return body.job_id as string; // poll via /jobs endpoints. :contentReference[oaicite:16]{index=16}
}

export async function extractTables(pdfPath: string) {
  const form = new FormData();
  form.set("pdf_file", new File([fs.readFileSync(pdfPath)], "document.pdf", { type: "application/pdf" }));
  const res = await fetch(`${BASE}/tables`, { method: "POST", headers: headers() as any, body: form as any });
  if (!res.ok) throw new Error(`tables failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return body.job_id as string; // poll via /jobs endpoints. :contentReference[oaicite:17]{index=17}
}

export async function getJobStatus(jobId: string) {
  const res = await fetch(`${BASE}/jobs/${jobId}`, { headers: headers() as any });
  if (!res.ok) throw new Error(`job status failed: ${res.status} ${await res.text()}`);
  return res.json(); // queued/PROCESSING/COMPLETED/FAILED, etc. :contentReference[oaicite:18]{index=18}
}

export async function getJobResult(jobId: string) {
  const res = await fetch(`${BASE}/jobs/${jobId}/result`, { headers: headers() as any });
  if (!res.ok) throw new Error(`job result failed: ${res.status} ${await res.text()}`);
  return res.json(); // includes field values+bboxes or tables JSON. :contentReference[oaicite:19]{index=19}
}
```

---

## End-to-end grading flow (example)

1. **Parse** for anchors + OCR:

```python
job = parse_document("submission.pdf")
full = get_parse_results(job["job_id"])  # contains segments with bbox/page/etc. :contentReference[oaicite:20]{index=20}
```

2. **Extract rubric fields** (strict JSON Schema):

```python
cite_job = extract_data("submission.pdf", RUBRIC_Q1_SCHEMA)
while get_job_status(cite_job).get("status") not in ["COMPLETED", "FAILED"]:
    time.sleep(5)
data = get_job_result(cite_job)  # includes field.value, field.score, field.bboxes, field.page_no. :contentReference[oaicite:21]{index=21}
```

3. **(Optional) Tables**:

```python
tables_job = extract_tables("submission.pdf")
# ...poll and fetch...
tables = get_job_result(tables_job)  # structured tables, bbox, confidence. :contentReference[oaicite:22]{index=22}
```

4. **Rubric logic**

   * Compare `q1_final_value.value` against solution within tolerance.
   * Deduct if `q1_units.value` missing.
   * If `score < 0.85` → send to TA review.
   * Use `page_no`/`bboxes` to **pin** inline comments in our PDF viewer/renderer. ([docs.unsiloed.ai][1])

---

## Notes, limits, and error handling

* **Max PDF size:** 100 MB for `/cite` and `/tables`; `/parse` shows size validation in examples. Handle HTTP 413. ([docs.unsiloed.ai][1])
* **Polling cadence:** 5–10 s, add timeouts/backoff (429). Parse status values: **Starting → Processing → Succeeded/Failed**. Generic jobs: **queued/PROCESSING/COMPLETED/FAILED**. ([docs.unsiloed.ai][5])
* **Auth:** Prefer server-side calls; never expose the API key in the browser. Some endpoints use `api-key`, others show `X-API-Key`; we send **both**. ([docs.unsiloed.ai][1])

---

## Payload shapes (what we rely on)

* **Extract Data result fields** (after `GET /jobs/{id}/result`):

  ```json
  {
    "data": {
      "q1_final_value": {
        "score": 0.98,
        "value": "3.142",
        "bboxes": [{"bbox": [72,100,160,120]}],
        "page_no": 1
      },
      "min_confidence_score": 0.96
    }
  }
  ```

  (Representative structure shown in docs; actual examples vary.) ([docs.unsiloed.ai][6])

* **Parse results** (from `GET /parse/{job_id}` when Succeeded): include `chunks[ ].segments[ ]` with `segment_type`, `content`, `page_number`, `confidence`, `bbox`, `html`, `markdown`, `ocr` details. ([docs.unsiloed.ai][5])

* **Tables results**: list of tables with `headers`, `rows`, `structured_data`, `bbox`, `page_number`, `confidence`. ([docs.unsiloed.ai][3])

---

## Why this maps well to grading

* **Accuracy + anchors:** `/cite` gives **value+confidence+bboxes** so we can both auto-grade and draw precise inline annotations. ([docs.unsiloed.ai][1])
* **Handwritten/scanned PDFs:** `/parse` with `ocr_mode=full_ocr` or `auto_ocr` and the **Hawk** engine yields better recall for math/diagrams; we default to Hawk in grading contexts. ([docs.unsiloed.ai][2])
* **Tables:** Direct numeric comparison (with tolerances) on extracted tables (truth tables, matrices). ([docs.unsiloed.ai][3])

---

## Quick test script (Python)

```python
if __name__ == "__main__":
    from unsiloed_client import (
        parse_document, get_parse_results,
        extract_data, get_job_status, get_job_result,
        extract_tables, RUBRIC_Q1_SCHEMA
    )
    pdf = "submission.pdf"

    # Parse
    parse_job = parse_document(pdf)
    parse_out = get_parse_results(parse_job["job_id"])
    print("Parsed chunks:", parse_out.get("total_chunks"))

    # Extract fields
    job_id = extract_data(pdf, RUBRIC_Q1_SCHEMA)
    while get_job_status(job_id).get("status") not in ["COMPLETED", "FAILED"]:
        time.sleep(5)
    fields = get_job_result(job_id)
    print("Extraction:", fields)

    # Tables (optional)
    t_job = extract_tables(pdf)
    while get_job_status(t_job).get("status") not in ["COMPLETED", "FAILED"]:
        time.sleep(5)
    tables = get_job_result(t_job)
    print("Tables:", tables.get("results", {}).get("tables", []))
```

---

## Source pages (for engineers)

* **Extract Data (`/cite`)** — schema, request/response, examples. ([docs.unsiloed.ai][1])
* **Parse Document (`/parse`)** — OCR/segmentation/engines and status polling. ([docs.unsiloed.ai][2])
* **Get Parse Job Status (`/parse/{job_id}`)** — status → results in the same response. ([docs.unsiloed.ai][5])
* **Extract Tables (`/tables`)** — request/response and example results. ([docs.unsiloed.ai][3])
* **Jobs: status & result** (`/jobs/{id}`, `/jobs/{id}/result`). ([docs.unsiloed.ai][4])

If you want, I can also drop this into your repo as `docs/unsiloed.md` and add a tiny UI demo that draws bbox highlights on a PDF viewer.

[1]: https://docs.unsiloed.ai/api-reference/extraction "Extract Data - Unsiloed AI"
[2]: https://docs.unsiloed.ai/api-reference/parsing "Parse Document - Unsiloed AI"
[3]: https://docs.unsiloed.ai/api-reference/tables "Extract Tables - Unsiloed AI"
[4]: https://docs.unsiloed.ai/api-reference/jobs/status "Get Job Status - Unsiloed AI"
[5]: https://docs.unsiloed.ai/api-reference/jobs/parse-status "Get Parse Job Status - Unsiloed AI"
[6]: https://docs.unsiloed.ai/api-reference/jobs/results "Get Job Results - Unsiloed AI"

