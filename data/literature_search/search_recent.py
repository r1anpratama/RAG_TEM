import subprocess
import json

SEARCH_SCRIPT = r"C:\Users\user\.gemini\config\plugins\science\skills\literature_search_arxiv\scripts\search_arxiv.py"

queries = [
    'all:"agentic RAG" OR all:"agentic retrieval"',
    'all:"Graph RAG" AND all:knowledge',
    'all:"decision support" AND all:"emergency response" AND all:agent',
    'all:"seismic risk" AND all:"damage assessment"',
]

results = []
for q in queries:
    print(f"Searching: {q}")
    cmd = ["uv", "run", SEARCH_SCRIPT, "--query", q, "--max_results", "5", "--sort_by", "submittedDate", "--sort_order", "descending"]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    raw = proc.stdout.strip()
    decoder = json.JSONDecoder()
    pos = 0
    last_obj = None
    while pos < len(raw):
        try:
            while pos < len(raw) and raw[pos].isspace():
                pos += 1
            if pos >= len(raw):
                break
            obj, end_pos = decoder.raw_decode(raw, pos)
            last_obj = obj
            pos = end_pos
        except Exception:
            pos += 1
    if last_obj and "papers" in last_obj:
        results.extend(last_obj["papers"])
        print(f"  -> Got {len(last_obj['papers'])} papers")

print(f"Retrieved {len(results)} additional recent papers.")
with open("scratch/recent_agentic_papers.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
