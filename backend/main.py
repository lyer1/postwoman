from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import time
import json

from backend.database import engine, create_db_and_tables, get_session
from backend.models import User, Collection, SavedRequest, Environment, History

app = FastAPI(title="Postwoman API Proxy", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a local tool, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Postwoman backend is running"}


# --- Proxy Endpoint ---

class ProxyRequest(BaseModel):
    method: str
    url: str
    headers: Dict[str, str] = {}
    params: Dict[str, str] = {}
    body: Any = None
    body_type: str = "none" # "none", "raw", "formdata", "urlencoded"

@app.post("/api/proxy")
async def proxy_request(req: ProxyRequest, session: Session = Depends(get_session)):
    # Prepare the request
    start_time = time.time()
    
    # Process headers
    req_headers = httpx.Headers(req.headers)
    
    # Prepare content
    content = None
    data = None
    if req.body_type == "raw" and isinstance(req.body, str):
        content = req.body
    elif req.body_type == "urlencoded" and isinstance(req.body, dict):
        data = req.body
    elif req.body_type == "json" and req.body:
        content = json.dumps(req.body)
        req_headers["Content-Type"] = "application/json"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=req.method,
                url=req.url,
                headers=req_headers,
                params=req.params,
                content=content,
                data=data,
                timeout=10.0
            )
            
        end_time = time.time()
        elapsed_ms = int((end_time - start_time) * 1000)
        
        # Save to history
        history = History(
            method=req.method,
            url=str(response.url),
            status_code=response.status_code,
            response_time=elapsed_ms,
            response_size=len(response.content),
            request_data=json.dumps(req.dict())
        )
        session.add(history)
        session.commit()
        
        try:
            res_body = response.json()
        except json.JSONDecodeError:
            res_body = response.text
            
        return {
            "status": response.status_code,
            "time": elapsed_ms,
            "size": len(response.content),
            "headers": dict(response.headers),
            "body": res_body,
            "history_id": history.id
        }
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")


# --- Collections ---

@app.get("/api/collections")
def get_collections(session: Session = Depends(get_session)):
    collections = session.exec(select(Collection)).all()
    return collections

@app.post("/api/collections")
def create_collection(collection: Collection, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == "default")).first()
    collection.user_id = user.id
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return collection

@app.delete("/api/collections/{collection_id}")
def delete_collection(collection_id: int, session: Session = Depends(get_session)):
    collection = session.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    session.delete(collection)
    session.commit()
    return {"ok": True}


# --- Saved Requests ---

@app.get("/api/requests")
def get_requests(collection_id: int = None, session: Session = Depends(get_session)):
    query = select(SavedRequest)
    if collection_id:
        query = query.where(SavedRequest.collection_id == collection_id)
    return session.exec(query).all()

@app.post("/api/requests")
def create_request(req: SavedRequest, session: Session = Depends(get_session)):
    session.add(req)
    session.commit()
    session.refresh(req)
    return req

@app.delete("/api/requests/{request_id}")
def delete_request(request_id: int, session: Session = Depends(get_session)):
    req = session.get(SavedRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    session.delete(req)
    session.commit()
    return {"ok": True}


# --- Environments ---

@app.get("/api/environments")
def get_environments(session: Session = Depends(get_session)):
    envs = session.exec(select(Environment)).all()
    return envs

@app.post("/api/environments")
def create_environment(env: Environment, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == "default")).first()
    env.user_id = user.id
    session.add(env)
    session.commit()
    session.refresh(env)
    return env

@app.delete("/api/environments/{env_id}")
def delete_environment(env_id: int, session: Session = Depends(get_session)):
    env = session.get(Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    session.delete(env)
    session.commit()
    return {"ok": True}


# --- History ---

@app.get("/api/history")
def get_history(session: Session = Depends(get_session)):
    history = session.exec(select(History).order_by(History.sent_at.desc()).limit(50)).all()
    return history
