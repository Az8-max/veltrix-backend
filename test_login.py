import urllib.request
import urllib.parse
import json

url = "https://veltrix-backend-wc8b.onrender.com/api/auth/login"
data = urllib.parse.urlencode({"username": "test@test.com", "password": "password"}).encode("utf-8")
req = urllib.request.Request(url, data=data, method="POST")

try:
    with urllib.request.urlopen(req) as res:
        print("Status:", res.status)
        print("Body:", res.read().decode())
except Exception as e:
    print("Error:", e)
