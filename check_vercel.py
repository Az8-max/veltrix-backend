import urllib.request
import re

url = "https://frontend-jade-six-67.vercel.app/"
try:
    with urllib.request.urlopen(url) as response:
        html = response.read().decode('utf-8')
        # Find script tag
        match = re.search(r'src="(/assets/index-[^"]+\.js)"', html)
        if match:
            js_url = url.rstrip('/') + match.group(1)
            with urllib.request.urlopen(js_url) as js_res:
                js_code = js_res.read().decode('utf-8')
                
                # Try to find the API URL hardcoded in the JS bundle
                # It usually looks like "http://localhost:8000" or the render url
                urls = re.findall(r'https?://[a-zA-Z0-9.-]+(?:onrender\.com|localhost:8000)', js_code)
                print("Found API URLs in JS bundle:", set(urls))
        else:
            print("No JS bundle found")
except Exception as e:
    print("Error:", e)
