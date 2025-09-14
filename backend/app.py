from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],   
)

workouts = {}

class Set(BaseModel):
    reps: int
    weight: float

class Exercise(BaseModel):
    name: str
    sets: List[Set] = []


@app.post("/add_exercise/{date}")
def add_exercise(date: str,exercise: Exercise):
    if date not in workouts:
        workouts[date] = []
    for ex in workouts[date]:
        if ex.name == exercise.name:
            return {"error": f"Exercise '{exercise.name}' already exists for {date}"}
    
    workouts[date].append(exercise)
    return {"message": f"Exercise added for {date}", "exercise": exercise}

@app.post("/add_set/{date}/{exercise_name}")
def add_set(date: str, exercise_name: str, new_set: Set):
    if date not in workouts:
        return {"error": "No exercises found for this date."}
    for exercise in workouts[date]:
        if exercise.name == exercise_name:
            exercise.sets.append(new_set)
            return {"message": f"Set added to {exercise_name} on {date}", "set": new_set}

    return {"error": "Exercise not found for this date."}

@app.get("/workouts/{date}")
def get_workouts(date: str):
    if date not in workouts:
        return {"message": "No workouts found for this date."}
    return {"date": date, "exercises": workouts[date]}

@app.delete("/delete_exercise/{date}/{exercise_name}")
def delete_exercise(date: str, exercise_name: str):
    if date not in workouts:
        return {"error": "No workouts found for this date."}
    for i, exercise in enumerate(workouts[date]):
        if exercise.name == exercise_name:
            workouts[date].pop(i)
            return {"message": f"Exercise '{exercise_name}' deleted from {date}"}

    return {"error": "Exercise not found for this date."}

@app.delete("/delete_set/{date}/{exercise_name}/{set_index}")
def delete_set(date: str, exercise_name: str, set_index: int):
    if date not in workouts:
        return {"error": "No exercises found for this date."}
    for exercise in workouts[date]:
        if exercise.name == exercise_name:
            if 0 <= set_index < len(exercise.sets):
                exercise.sets.pop(set_index)
                return {"message": f"Set {set_index+1} deleted from {exercise_name} on {date}"}
            else:
                return {"error": "Set index out of range."}
    return {"error": "Exercise not found."}
    