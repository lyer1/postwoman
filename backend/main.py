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

from typing import List, Dict, Any, Optional

class ProxyRequest(BaseModel):
    method: str
    url: str
    headers: Dict[str, str] = {}
    params: Dict[str, str] = {}
    body: Any = None
    body_type: str = "none" # "none", "raw", "formdata", "urlencoded"
    environment_id: Optional[int] = None

@app.post("/api/proxy")
async def proxy_request(req: ProxyRequest, session: Session = Depends(get_session)):
    # Fetch environment if provided
    env_vars = {}
    if req.environment_id:
        env = session.get(Environment, req.environment_id)
        if env:
            try:
                variables = json.loads(env.variables)
                for v in variables:
                    if v.get("enabled", True):
                        env_vars[v["key"]] = v["value"]
            except Exception:
                pass

    def interpolate(text: str) -> str:
        if not isinstance(text, str):
            return text
        for k, v in env_vars.items():
            text = text.replace(f"{{{{{k}}}}}", str(v))
        return text

    # Prepare the request
    start_time = time.time()
    
    # Process url
    url = interpolate(req.url)

    # Process headers
    req_headers = httpx.Headers({k: interpolate(v) for k, v in req.headers.items()})
    
    # Prepare content
    content = None
    data = None
    if req.body_type == "raw" and isinstance(req.body, str):
        content = interpolate(req.body)
    elif req.body_type in ("urlencoded", "formdata") and isinstance(req.body, dict):
        data = {k: interpolate(v) for k, v in req.body.items()}
    elif req.body_type == "json" and req.body:
        if isinstance(req.body, str):
            content = interpolate(req.body)
        else:
            body_str = interpolate(json.dumps(req.body))
            content = body_str
        req_headers["Content-Type"] = "application/json"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=req.method,
                url=url,
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

class CollectionResponse(BaseModel):
    id: int
    name: str
    user_id: int
    parent_id: Optional[int] = None
    requests: List[Any] = []

@app.get("/api/collections", response_model=List[CollectionResponse])
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

@app.put("/api/collections/{collection_id}")
def update_collection(collection_id: int, col_data: Collection, session: Session = Depends(get_session)):
    collection = session.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    collection.name = col_data.name
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return collection


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

@app.put("/api/requests/{request_id}")
def update_request(request_id: int, req_data: SavedRequest, session: Session = Depends(get_session)):
    req = session.get(SavedRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.name = req_data.name
    req.method = req_data.method
    req.url = req_data.url
    req.collection_id = req_data.collection_id
    req.headers = req_data.headers
    req.query_params = req_data.query_params
    req.body_type = req_data.body_type
    req.body = req_data.body
    req.auth_type = req_data.auth_type
    req.auth_data = req_data.auth_data
    session.add(req)
    session.commit()
    session.refresh(req)
    return req


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

@app.put("/api/environments/{env_id}")
def update_environment(env_id: int, env_data: Environment, session: Session = Depends(get_session)):
    env = session.get(Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    env.name = env_data.name
    env.variables = env_data.variables
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
