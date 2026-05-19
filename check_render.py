import urllib.request
import urllib.error
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request("https://veltrix-backend-wc8b.onrender.com/api/auth/login", method="OPTIONS")
req.add_header("Origin", "https://frontend-jade-six-67.vercel.app")
req.add_header("Access-Control-Request-Method", "POST")

try:
    with urllib.request.urlopen(req, context=ctx) as res:
        print("Status:", res.status)
        print("Headers:", res.headers)
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Headers:", e.headers)
except Exception as e:
    print("Error:", e)
