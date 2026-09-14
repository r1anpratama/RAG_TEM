import json
import requests

queries = [
    ("Scenario A", "Buatkan potongan XML source model OpenQuake untuk Sesar Shanchiao (ID 1-1) dengan model rupture tunggal dan rupture gabungan sesuai TEM PSHA2025."),
    ("Scenario B", "GMM apa saja yang dipakai untuk shallow crustal di Taiwan beserta bobotnya, dan apa dasar pemilihannya?"),
    ("Scenario C", "Mengapa estimasi hazard PGA 475 tahun di wilayah Hsinchu dan Miaoli mengalami kenaikan dibanding versi TEM PSHA2020?")
]

for label, q in queries:
    resp = requests.post("http://127.0.0.1:8000/api/chat", json={"query": q}, stream=True)
    tokens = []
    cites = []
    for line in resp.iter_lines():
        if line:
            s = line.decode("utf-8")
            if s.startswith("data: "):
                d = json.loads(s[6:])
                if d.get("event") == "token":
                    tokens.append(d.get("token", ""))
                elif d.get("event") == "citations":
                    cites.extend(d.get("citations", []))
    ans = "".join(tokens)
    first_line = ans.splitlines()[0] if ans else "EMPTY"
    print(f"{label} -> {first_line} | Chars: {len(ans)} | Citations: {len(cites)}")
