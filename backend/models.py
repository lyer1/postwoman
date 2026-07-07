from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import json


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    collections: List["Collection"] = Relationship(back_populates="user")
    environments: List["Environment"] = Relationship(back_populates="user")


class Collection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="collections")
    requests: List["SavedRequest"] = Relationship(back_populates="collection")


class SavedRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    method: str
    url: str
    collection_id: Optional[int] = Field(default=None, foreign_key="collection.id")
    
    # Store headers, query params, and body as JSON strings
    headers: str = Field(default="[]")  # JSON array of {key, value, enabled}
    query_params: str = Field(default="[]")
    body_type: str = Field(default="none") # none, raw, formdata, urlencoded
    body: str = Field(default="")
    auth_type: str = Field(default="none")
    auth_data: str = Field(default="{}")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    collection: Optional[Collection] = Relationship(back_populates="requests")


class Environment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    variables: str = Field(default="[]")  # JSON array of {key, value, enabled}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="environments")


class History(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    method: str
    url: str
    status_code: int
    response_time: int # in ms
    response_size: int # in bytes
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Request data used to re-populate
    request_data: str = Field(default="{}") 
