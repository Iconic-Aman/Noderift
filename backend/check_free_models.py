import requests
import json

res = requests.get("https://openrouter.ai/api/v1/models")
data = res.json().get("data", [])

free_models = []
for m in data:
    pricing = m.get("pricing", {})
    if pricing.get("prompt") == "0" and pricing.get("completion") == "0":
        free_models.append(m.get("id"))

print("FOUND FREE MODELS ON OPENROUTER:")
for fm in free_models[:15]:
    print(f" - {fm}")
