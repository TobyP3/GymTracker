const addBtn = document.getElementById("add-exercise-btn");
const viewBtn = document.getElementById("view-workouts-btn");

viewBtn.addEventListener("click", viewWorkouts);

addBtn.addEventListener("click", () => {
    const name = document.getElementById("exercise-name").value;
    const date = document.getElementById("exercise-date").value;

    fetch(`http://127.0.0.1:8000/add_exercise/${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sets: [] })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(`Exercise added: ${data.exercise.name}`);
            viewWorkouts();
        }
    })
    .catch(err => console.error(err));
});

function viewWorkouts() {
    const date = document.getElementById("view-date").value;
    const displayDiv = document.getElementById("workouts-display");
    displayDiv.innerHTML = ""; 

    fetch(`http://127.0.0.1:8000/workouts/${date}`)
        .then(response => response.json())
        .then(data => {
            if (!data.exercises || data.exercises.length === 0) {
                displayDiv.textContent = "No exercises found for this date.";
                return;
            }

            data.exercises.forEach(exercise => {
                const exerciseDiv = document.createElement("div");
                exerciseDiv.innerHTML = `
                <h3 style="display: inline-block; margin-right: 10px;">${exercise.name}</h3>
                <button class="delete-btn">Delete</button>
                `;
                const deleteBtn = exerciseDiv.querySelector(".delete-btn");
                deleteBtn.textContent = "Delete Exercise";
                exerciseDiv.appendChild(deleteBtn);

                deleteBtn.addEventListener("click", () => {
                    fetch(`http://127.0.0.1:8000/delete_exercise/${date}/${exercise.name}`, {
                        method: "DELETE",
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            alert(data.error);
                        } else {
                            alert(data.message);
                            viewWorkouts();
                        }
                    })
                    .catch(error => console.error("Error:", error));
                });

                const setForm = document.createElement("form");
                setForm.innerHTML = `
                <input type="number" name="weight" placeholder="Weight" required>
                <input type="number" step="0.1" name="reps" placeholder="Reps" required>
                <button type="submit">Add Set</button>
                `;
                setForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const reps = e.target.reps.value;
                    const weight = e.target.weight.value;

                    fetch(`http://127.0.0.1:8000/add_set/${date}/${exercise.name}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            reps: reps,
                            weight: weight
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            alert(data.error);
                        } else {
                            viewWorkouts(); // <-- reload display so delete buttons appear
                        }
                    })
                    .catch(error => console.error("Error:", error));
                });

                

                exercise.sets.forEach((set, index) => {
                    const setContainer = document.createElement("div");
                    setContainer.style.display = "flex";
                    setContainer.style.alignItems = "center";
                    setContainer.style.gap = "10px"; // space between text and button

                    const setText = document.createElement("span");
                    setText.textContent = `Set ${index + 1}: ${set.reps} reps, ${set.weight} kg`;

                    const deleteSetBtn = document.createElement("button");
                    deleteSetBtn.textContent = "Delete Set";

                    deleteSetBtn.addEventListener("click", () => {
                        fetch(`http://127.0.0.1:8000/delete_set/${date}/${exercise.name}/${index}`, {
                            method: "DELETE",
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                alert(data.error);
                            } else {
                                viewWorkouts();
                            }
                        })
                        .catch(error => console.error("Error:", error));
                    });

                    setContainer.appendChild(setText);
                    setContainer.appendChild(deleteSetBtn);
                    exerciseDiv.appendChild(setContainer);
                });

                exerciseDiv.appendChild(setForm);

                displayDiv.appendChild(exerciseDiv);
            });
        })
        .catch(error => console.error("Error:", error));
};


