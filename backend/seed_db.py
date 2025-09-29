# seed_db.py
from sqlmodel import Session, select
from database import init_db, engine, User, Workout, Template
from auth import hash_password  # use your hashing function

def seed():
    # Initialize tables
    init_db()

    with Session(engine) as session:
        # Create a test user
        test_user = User(username="testuser", hashed_password=hash_password("password123"))
        session.add(test_user)
        session.commit()
        session.refresh(test_user)

        # Add workouts for the test user
        workout1 = Workout(user_id=test_user.id, date="2025-09-28", exercise_name="Bench Press", reps=10, weight=60.0)
        workout2 = Workout(user_id=test_user.id, date="2025-09-28", exercise_name="Squat", reps=8, weight=80.0)
        session.add_all([workout1, workout2])

        # Add a template for the test user
        template = Template(user_id=test_user.id, name="Push Day", exercises="Bench Press,Overhead Press,Dips")
        session.add(template)

        session.commit()

        # Query everything back
        users = session.exec(select(User)).all()
        workouts = session.exec(select(Workout)).all()
        templates = session.exec(select(Template)).all()

        print("\nUsers in DB:")
        for u in users:
            print(u)

        print("\nWorkouts in DB:")
        for w in workouts:
            print(w)

        print("\nTemplates in DB:")
        for t in templates:
            print(t)

if __name__ == "__main__":
    seed()
