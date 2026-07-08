import requests

payload = {
    "method": "POST",
    "url": "https://httpbin.org/post",
    "headers": {},
    "params": {},
    "body_type": "raw",
    "body": "{\"my_var\": \"hello_world\"}"
}

res = requests.post("http://127.0.0.1:8000/api/proxy", json=payload)
print(res.status_code)
print(res.text)
