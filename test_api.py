import urllib.request
import json

BASE_URL = "http://localhost:8000"

def req(url, method="GET", data=None, token=None):
    headers = {}
    if data is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(data).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")
    except Exception as e:
        return 0, str(e)

# 1. Sign up
status, body = req(f"{BASE_URL}/api/auth/signup", "POST", {"name": "Test User", "email": "test@example.com", "password": "password"})
print("Signup:", status, body)
if status != 200:
    import urllib.parse
    data = urllib.parse.urlencode({"username": "test@example.com", "password": "password"}).encode("utf-8")
    req_obj = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=data, method="POST")
    try:
        with urllib.request.urlopen(req_obj) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
    print("Login:", body)

token = json.loads(body).get("access_token")

# 2. Create team
status, body = req(f"{BASE_URL}/api/teams/create?name=TestTeam", "POST", token=token)
print("Create Team:", status, body)

# 3. Get Dashboard
status, body = req(f"{BASE_URL}/api/dashboard", "GET", token=token)
print("Dashboard:", status, body)

# 4. Get Team
status, body = req(f"{BASE_URL}/api/teams/me", "GET", token=token)
print("Team:", status, body)
