import requests

job_id = "07596ae3-2fae-4c8a-a646-77be100f8895"
base = f"http://localhost:8000/analysis/{job_id}"
endpoints = [
    ("curve", "json"),
    ("heatmap", "json"),
    ("optimal-path", "json"),
    ("report", "json"),
]

for endpoint, resp_type in endpoints:
    url = f"{base}/{endpoint}"
    print(f"Testing {url} ...")
    try:
        resp = requests.get(url)
        print("Status:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            if endpoint == "heatmap":
                print("heatmap_png_base64 length:", len(data.get("heatmap_png_base64", "")))
            elif endpoint == "optimal-path":
                print("path_png_base64 length:", len(data.get("path_png_base64", "")))
            elif endpoint == "curve":
                print("rewards length:", len(data.get("rewards", [])), "steps length:", len(data.get("steps", [])))
            elif endpoint == "report":
                print("report content preview:", str(data.get("content", ""))[:200])
        else:
            print("Error:", resp.text)
    except Exception as e:
        print("Exception:", e)
    print("-" * 40) 