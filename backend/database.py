from sqlmodel import SQLModel, Field, Relationship, create_engine
from typing import Optional, List

DATABASE_URL = "sqlite:///./gymtracker.db"
engine = create_engine(DATABASE_URL, echo=True)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str

    workouts: List["Workout"] = Relationship(back_populates="user")
    templates: List["Template"] = Relationship(back_populates="user")

class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: str
    exercise_name: str
    reps: Optional[int]
    weight: Optional[float]

    user: Optional[User] = Relationship(back_populates="workouts")

class Template(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    exercises: str  

    user: Optional[User] = Relationship(back_populates="templates")
    
class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: str
    name: str

def init_db():
    SQLModel.metadata.create_all(engine)
