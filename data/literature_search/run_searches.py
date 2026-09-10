"""Helper script to run multiple arXiv searches and collect unique relevant papers."""

import subprocess
import json
import sys

SEARCH_SCRIPT = r"C:\Users\user\.gemini\config\plugins\science\skills\literature_search_arxiv\scripts\search_arxiv.py"

queries = [
    'all:earthquake AND (all:"retrieval-augmented" OR all:"RAG" OR all:"agentic")',
    'all:"disaster management" AND (all:"large language model" OR all:"agentic RAG")',
    'all:"Graph RAG" AND (all:spatial OR all:geospatial OR all:hazard OR all:infrastructure)',
    'all:"physics-informed" AND (all:"retrieval augmented" OR all:"RAG" OR all:"large language model") AND all:seismic',
    'all:"earthquake early warning" AND (all:"transformer" OR all:"deep learning" OR all:"decision support")',
]

all_papers = {}

for q in queries:
    print(f"Running query: {q}")
    cmd = ["uv", "run", SEARCH_SCRIPT, "--query", q, "--max_results", "6"]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if proc.returncode != 0:
        print(f"Error for query {q}: {proc.stderr[:200]}")
        continue
    
    # search_arxiv outputs multiple JSON blocks. Find the last complete JSON block
    raw = proc.stdout.strip()
    # Split by closing brace followed by newline and opening brace
    # Or find all JSON objects
    decoder = json.JSONDecoder()
    pos = 0
    last_obj = None
    while pos < len(raw):
        try:
            # strip leading whitespace
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
        for p in last_obj["papers"]:
            pid = p.get("id")
            if pid and pid not in all_papers:
                all_papers[pid] = p
        print(f"  -> Added papers, total unique so far: {len(all_papers)}")

print(f"\nSuccessfully collected {len(all_papers)} unique papers.")
with open("scratch/collected_papers.json", "w", encoding="utf-8") as out:
    json.dump(list(all_papers.values()), out, indent=2)
print("Saved to scratch/collected_papers.json")
