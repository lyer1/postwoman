import asyncio
import httpx
import json

async def run():
    payload = {
        "method": "POST",
        "url": "https://httpbin.org/post",
        "headers": {},
        "params": {},
        "body_type": "formdata",
        "body": {"form_var": "hello_world"},
        "environment_id": 9
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.post("http://127.0.0.1:8000/api/proxy", json=payload)
        print(res.status_code)
        print(res.text)

asyncio.run(run())
