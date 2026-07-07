from sqlmodel import SQLModel, create_engine, Session
from backend.models import User, Collection, Environment, SavedRequest, History
import sqlite3

sqlite_file_name = "postwoman.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    
    # Seed default user if not exists
    with Session(engine) as session:
        user = session.query(User).filter(User.username == "default").first()
        if not user:
            user = User(username="default")
            session.add(user)
            session.commit()
            session.refresh(user)
            
            # Seed default collection
            collection = Collection(name="Sample API", user_id=user.id)
            session.add(collection)
            session.commit()
            session.refresh(collection)
            
            # Seed default request
            req = SavedRequest(
                name="Get Httpbin",
                method="GET",
                url="https://httpbin.org/get",
                collection_id=collection.id
            )
            session.add(req)
            
            # Seed environment
            env = Environment(
                name="Production",
                user_id=user.id,
                variables='[{"key": "base_url", "value": "https://httpbin.org", "enabled": true}]'
            )
            session.add(env)
            session.commit()

def get_session():
    with Session(engine) as session:
        yield session
