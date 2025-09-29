from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from database import init_db
from auth import router as auth_router


app = FastAPI()
init_db()

app.include_router(auth_router, prefix="/auth")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],   
)


WORKOUT_FILE = "workouts.json"
TEMPLATE_FILE = "templates.json"

workouts = {}
templates = {}

class Set(BaseModel):
    reps: int
    weight: float

class Exercise(BaseModel):
    name: str
    sets: List[Set] = []

class Template(BaseModel):
    name: str
    exercises: List[str] = []

if os.path.exists(WORKOUT_FILE):
    with open(WORKOUT_FILE, "r") as f:
        workouts = json.load(f)
else:
    workouts = {}

if os.path.exists(TEMPLATE_FILE):
    with open(TEMPLATE_FILE, "r") as f:
        templates = json.load(f)
else:
    templates = {}

# Save helpers
def save_workouts():
    with open(WORKOUT_FILE, "w") as f:
        json.dump(workouts, f, indent=2)

def save_templates():
    with open(TEMPLATE_FILE, "w") as f:
        json.dump(templates, f, indent=2)

# -----------------------------
# WORKOUT ENDPOINTS
# -----------------------------

@app.post("/add_exercise/{date}")
def add_exercise(date: str, exercise: Exercise):
    if date not in workouts:
        workouts[date] = []
    # Prevent duplicates
    for ex in workouts[date]:
        if ex['name'] == exercise.name:
            return {"error": f"Exercise '{exercise.name}' already exists for {date}"}
    workouts[date].append(exercise.dict())
    save_workouts()
    return {"message": f"Exercise added for {date}", "exercise": exercise}

@app.post("/add_set/{date}/{exercise_name}")
def add_set(date: str, exercise_name: str, new_set: Set):
    if date not in workouts:
        return {"error": "No exercises found for this date."}
    for exercise in workouts[date]:
        if exercise['name'] == exercise_name:
            exercise['sets'].append(new_set.dict())
            save_workouts()
            return {"message": f"Set added to {exercise_name} on {date}","set": new_set.dict()}
    return {"error": "Exercise not found for this date."}

@app.get("/workouts/{date}")
def get_workouts(date: str):
    if date not in workouts:
        return {"date": date, "exercises": []}
    return {"date": date, "exercises": workouts[date]}

@app.delete("/delete_exercise/{date}/{exercise_name}")
def delete_exercise(date: str, exercise_name: str):
    if date not in workouts:
        return {"error": "No workouts found for this date."}
    for i, exercise in enumerate(workouts[date]):
        if exercise['name'] == exercise_name:
            workouts[date].pop(i)
            save_workouts()
            return {"message": f"Exercise '{exercise_name}' deleted from {date}"}
    return {"error": "Exercise not found for this date."}

@app.delete("/delete_set/{date}/{exercise_name}/{set_index}")
def delete_set(date: str, exercise_name: str, set_index: int):
    if date not in workouts:
        return {"error": "No exercises found for this date."}
    for exercise in workouts[date]:
        if exercise['name'] == exercise_name:
            if 0 <= set_index < len(exercise['sets']):
                exercise['sets'].pop(set_index)
                save_workouts()
                return {"message": f"Set {set_index+1} deleted from {exercise_name} on {date}"}
            else:
                return {"error": "Set index out of range."}
    return {"error": "Exercise not found."}

# -----------------------------
# TEMPLATE ENDPOINTS
# -----------------------------

@app.post("/add_template")
def add_template(template: Template):
    if template.name in templates:
        return {"error": f"Template '{template.name}' already exists."}
    templates[template.name] = template.exercises
    save_templates()
    return {"message": f"Template '{template.name}' added.", "template": template}

@app.get("/templates")
def get_templates():
    return {"templates": templates}

@app.post("/apply_template/{date}/{template_name}")
def apply_template(date: str, template_name: str):
    if template_name not in templates:
        return {"error": "Template not found"}
    if date not in workouts:
        workouts[date] = []
    for ex_name in templates[template_name]:
        if not any(ex['name'] == ex_name for ex in workouts[date]):
            workouts[date].append({"name": ex_name, "sets": []})
    save_workouts()
    return {"message": f"Template '{template_name}' applied to {date}", "workout": workouts[date]}

@app.put("/edit_template/{template_name}")
def edit_template(template_name: str, updated: Template):
    if template_name not in templates:
        return {"error": "Template not found."}
    templates[template_name] = updated.exercises
    save_templates()
    return {"message": f"Template '{template_name}' updated."}

@app.delete("/delete_template/{template_name}")
def delete_template(template_name: str):
    if template_name not in templates:
        return {"error": "Template not found."}
    templates.pop(template_name)
    save_templates()
    return {"message": f"Template '{template_name}' deleted."}




app.include_router(auth_router, prefix="/auth", tags=["auth"])
