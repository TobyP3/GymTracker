from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from sqlmodel import Session, select, SQLModel
from database import init_db, engine, User, Workout, Template, Exercise
from auth import router as auth_router, get_current_user
import json
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()
init_db()

app.include_router(auth_router, prefix="/auth", tags=["auth"])

origins = [
    "http://127.0.0.1:8080",  
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Set(BaseModel):
    reps: int
    weight: float

class ExerciseRequest(BaseModel):
    name: str
    sets: List[Set] = []

class TemplateCreate(BaseModel):
    name: str
    exercises: List[str] = []

def get_session():
    with Session(engine) as session:
        yield session


@app.post("/add_exercise/{date}")
def add_exercise(
    date: str,
    exercise: ExerciseRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Check if exercise already exists
    existing = session.exec(
        select(Exercise).where(
            Exercise.user_id == current_user.id,
            Exercise.date == date,
            Exercise.name == exercise.name
        )
    ).first()
    
    if existing:
        return {"error": f"Exercise '{exercise.name}' already exists for {date}"}
    
    # Create exercise entry without sets
    new_exercise = Exercise(
        user_id=current_user.id,
        date=date,
        name=exercise.name
    )
    session.add(new_exercise)
    session.commit()
    return {"message": f"Exercise '{exercise.name}' added for {date}"}

@app.post("/add_set/{date}/{exercise_name}")
def add_set(
    date: str,
    exercise_name: str,
    new_set: Set,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Check if the exercise exists (not workouts)
    exercise = session.exec(
        select(Exercise).where(
            Exercise.user_id == current_user.id,
            Exercise.date == date,
            Exercise.name == exercise_name
        )
    ).first()
    
    if not exercise:
        return {"error": "Exercise not found for this date."}
    
    # Create the workout record (set)
    w = Workout(
        user_id=current_user.id,
        date=date,
        exercise_name=exercise_name,
        reps=new_set.reps,
        weight=new_set.weight
    )
    session.add(w)
    session.commit()
    return {"message": f"Set added to {exercise_name} on {date}"}

@app.get("/workouts/{date}")
def get_workouts(
    date: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Get exercises for this date
    exercises = session.exec(
        select(Exercise).where(
            Exercise.user_id == current_user.id,
            Exercise.date == date
        )
    ).all()
    
    result = []
    for exercise in exercises:
        # Get sets for each exercise
        workouts = session.exec(
            select(Workout).where(
                Workout.user_id == current_user.id,
                Workout.date == date,
                Workout.exercise_name == exercise.name
            )
        ).all()
        
        sets = [{"reps": w.reps, "weight": w.weight} for w in workouts]
        result.append({"name": exercise.name, "sets": sets})
    
    return {"date": date, "exercises": result}

@app.delete("/delete_exercise/{date}/{exercise_name}")
def delete_exercise(
    date: str,
    exercise_name: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Find the exercise record
    exercise = session.exec(
        select(Exercise).where(
            Exercise.user_id == current_user.id,
            Exercise.date == date,
            Exercise.name == exercise_name
        )
    ).first()
    
    if not exercise:
        return {"error": "Exercise not found for this date."}
    
    # Delete all associated workout records (sets)
    workouts = session.exec(
        select(Workout).where(
            Workout.user_id == current_user.id,
            Workout.date == date,
            Workout.exercise_name == exercise_name
        )
    ).all()
    
    for w in workouts:
        session.delete(w)
    
    # Delete the exercise record itself
    session.delete(exercise)
    session.commit()
    return {"message": f"Exercise '{exercise_name}' deleted from {date}"}

@app.delete("/delete_set/{date}/{exercise_name}/{set_index}")
def delete_set(
    date: str,
    exercise_name: str,
    set_index: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    workouts = session.exec(
        select(Workout).where(
            Workout.user_id == current_user.id,
            Workout.date == date,
            Workout.exercise_name == exercise_name
        )
    ).all()
    if not workouts or set_index >= len(workouts):
        return {"error": "Set not found."}
    session.delete(workouts[set_index])
    session.commit()
    return {"message": f"Set {set_index + 1} deleted from {exercise_name} on {date}"}



@app.post("/add_template")
def add_template(
    template: TemplateCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(Template).where(
            Template.user_id == current_user.id,
            Template.name == template.name
        )
    ).first()
    if existing:
        return {"error": f"Template '{template.name}' already exists."}
    t = Template(
        user_id=current_user.id,
        name=template.name,
        exercises=json.dumps(template.exercises)
    )
    session.add(t)
    session.commit()
    return {"message": f"Template '{template.name}' added."}

@app.get("/templates")
def get_templates(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    templates = session.exec(
        select(Template).where(Template.user_id == current_user.id)
    ).all()
    result = {t.name: json.loads(t.exercises) for t in templates}
    return {"templates": result}

@app.post("/apply_template/{date}/{template_name}")
def apply_template(
    date: str,
    template_name: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    t = session.exec(
        select(Template).where(
            Template.user_id == current_user.id,
            Template.name == template_name
        )
    ).first()
    if not t:
        return {"error": "Template not found."}

    exercises = json.loads(t.exercises)
    
    # Actually create the Exercise records in the database
    for exercise_name in exercises:
        # Check if exercise already exists for this date
        existing = session.exec(
            select(Exercise).where(
                Exercise.user_id == current_user.id,
                Exercise.date == date,
                Exercise.name == exercise_name
            )
        ).first()
        
        # Only create if it doesn't exist
        if not existing:
            new_exercise = Exercise(
                user_id=current_user.id,
                date=date,
                name=exercise_name
            )
            session.add(new_exercise)
    
    session.commit()
    return {"message": f"Template '{template_name}' applied to {date}"}


@app.put("/edit_template/{template_name}")
def edit_template(
    template_name: str,
    updated: TemplateCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    t = session.exec(
        select(Template).where(
            Template.user_id == current_user.id,
            Template.name == template_name
        )
    ).first()
    if not t:
        return {"error": "Template not found."}
    t.exercises = json.dumps(updated.exercises)
    session.add(t)
    session.commit()
    return {"message": f"Template '{template_name}' updated."}

@app.delete("/delete_template/{template_name}")
def delete_template(
    template_name: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    t = session.exec(
        select(Template).where(
            Template.user_id == current_user.id,
            Template.name == template_name
        )
    ).first()
    if not t:
        return {"error": "Template not found."}
    session.delete(t)
    session.commit()
    return {"message": f"Template '{template_name}' deleted."}
