import urllib.request
import urllib.error
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://veltrix-backend-wc8b.onrender.com/api/auth/signup"
data = json.dumps({"name": "Test", "email": "test@test.com", "password": "password"}).encode('utf-8')
req = urllib.request.Request(url, data=data, method="POST")
req.add_header("Origin", "https://frontend-jade-six-67.vercel.app")
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req, context=ctx) as res:
        print("Status:", res.status)
        print("Headers:", res.headers)
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Headers:", e.headers)
    print("Body:", e.read().decode())
