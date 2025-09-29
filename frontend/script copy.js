const addBtn = document.getElementById("add-exercise-btn");
const viewBtn = document.getElementById("view-workouts-btn");
const templateSelect = document.getElementById("template-select");
const applyTemplateBtn = document.getElementById("apply-template-btn");
const createTemplateBtn = document.getElementById("create-template-btn");
const templateListDiv = document.getElementById("template-list");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const authMessage = document.getElementById("auth-message");
const loginSection = document.getElementById("login");
const mainContent = document.querySelector(".container"); // Assuming workouts/templates are inside container

function saveToken(token) {
    localStorage.setItem("token", token);
}

function getToken() {
    return localStorage.getItem("token");
}

loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        authMessage.textContent = "Enter both username and password";
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            saveToken(data.access_token);
            authMessage.textContent = "Login successful!";
            showMainContent();
        } else {
            authMessage.textContent = data.detail || "Login failed";
        }
    } catch (err) {
        console.error(err);
        authMessage.textContent = "Error connecting to server";
    }
});

registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        authMessage.textContent = "Enter both username and password";
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:8000/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            authMessage.textContent = "Registration successful! You can now log in.";
        } else {
            authMessage.textContent = data.detail || "Registration failed";
        }
    } catch (err) {
        console.error(err);
        authMessage.textContent = "Error connecting to server";
    }
});

function showMainContent() {
    loginSection.style.display = "none";
    mainContent.style.display = "block";
}

//mainContent.style.display = "none";

viewBtn.addEventListener("click", viewWorkouts);
window.addEventListener('load', loadTemplates);
window.addEventListener("load", () => {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("global-date").value = today;
    viewWorkouts();
});

addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const name = document.getElementById("exercise-name").value;
    const date = document.getElementById("global-date").value;

    if (!name) {
        alert("Please enter an exercise name");
        return; 
    }

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
            document.getElementById("exercise-name").value = "";
            setTimeout(() => viewWorkouts(), 100);
        }
    })
    .catch(err => console.error(err));
});

applyTemplateBtn.addEventListener("click", () => {
    const date = document.getElementById("global-date").value;
    const templateName = templateSelect.value;

    fetch(`http://127.0.0.1:8000/apply_template/${date}/${templateName}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                //alert(data.message);
                setTimeout(() => viewWorkouts(), 100);
            }
        })
        .catch(err => console.error("Error applying template:", err));
});

createTemplateBtn.addEventListener("click", () => {
    const name = document.getElementById("new-template-name").value;
    const exercises = document.getElementById("new-template-exercises").value
        .split(",")
        .map(e => e.trim())
        .filter(e => e);

    if (!name) {
        alert("Please enter a template name");
        return;
    }
    fetch("http://127.0.0.1:8000/add_template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, exercises })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById("new-template-name").value = "";
                document.getElementById("new-template-exercises").value = "";
                loadTemplates();
            }
        })
        .catch(err => console.error("Error creating template:", err));
});


function loadTemplates() {
    fetch("http://127.0.0.1:8000/templates")
        .then(res => res.json())
        .then(data => {
            const templates = data.templates;
            templateSelect.innerHTML = "";
            templateListDiv.innerHTML = "";

            Object.keys(templates).forEach(templateName => {
                // Populate dropdown
                const option = document.createElement("option");
                option.value = templateName;
                option.textContent = templateName;
                templateSelect.appendChild(option);

                // Create editable template UI
                const templateDiv = document.createElement("div");
                templateDiv.classList.add("template-item");
                templateDiv.style.marginBottom = "10px";

                const nameHeading = document.createElement("h4");
                nameHeading.textContent = templateName;
                templateDiv.appendChild(nameHeading);

                const exercisesInput = document.createElement("input");
                exercisesInput.type = "text";
                exercisesInput.value = templates[templateName].join(", ");
                exercisesInput.style.width = "70%";
                templateDiv.appendChild(exercisesInput);

                const saveBtn = document.createElement("button");
                saveBtn.textContent = "Save";
                templateDiv.appendChild(saveBtn);

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.style.backgroundColor = "red";
                deleteBtn.style.color = "white";
                templateDiv.appendChild(deleteBtn);

                // Save edited template
                saveBtn.addEventListener("click", () => {
                    const updatedExercises = exercisesInput.value
                        .split(",")
                        .map(e => e.trim())
                        .filter(e => e);
                    fetch(`http://127.0.0.1:8000/edit_template/${templateName}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ exercises: updatedExercises })
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.error) {
                                alert(data.error);
                            } else {
                                alert("Template updated!");
                                loadTemplates();
                            }
                        });
                });

                // Delete template
                deleteBtn.addEventListener("click", () => {
                    fetch(`http://127.0.0.1:8000/delete_template/${templateName}`, {
                        method: "DELETE"
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.error) {
                                alert(data.error);
                            } else {
                                loadTemplates();
                            }
                        });
                });

                templateListDiv.appendChild(templateDiv);
            });
        });
}

function viewWorkouts() {
    const date = document.getElementById("global-date").value;
    const displayDiv = document.getElementById("workouts-display");
    const currentScrollY = window.scrollY;
    // Clear previous content

    
    displayDiv.innerHTML = "";
    
    fetchWorkouts(date)
        .then(data => {
            if (!data.exercises || data.exercises.length === 0) {
                displayDiv.textContent = "No exercises found for this date.";
                return;
            }
            
            renderWorkouts(data.exercises, date, displayDiv);
            window.scrollTo(0, currentScrollY);
        })
        .catch(error => {
            console.error("Error:", error);
            displayDiv.textContent = "Error loading workouts.";
            window.scrollTo(0, currentScrollY);
        });
}

function fetchWorkouts(date) {
    return fetch(`http://127.0.0.1:8000/workouts/${date}`)
        .then(response => response.json());
}

function renderWorkouts(exercises, date, container) {
    exercises.forEach(exercise => {
        const exerciseElement = createExerciseElement(exercise, date);
        container.appendChild(exerciseElement);
    });
    
}

function createExerciseElement(exercise, date) {
    const exerciseDiv = document.createElement("div");
    exerciseDiv.style.marginBottom = "20px";
    exerciseDiv.style.padding = "15px";
    exerciseDiv.style.border = "1px solid #ccc";
    exerciseDiv.style.borderRadius = "5px";
    
    const header = createExerciseHeader(exercise, date);
    exerciseDiv.appendChild(header);
    
    const setsContainer = document.createElement("div");
    setsContainer.style.marginBottom = "10px";
    
    exercise.sets.forEach((set, index) => {
        const setDisplay = createSetDisplay(set, index, date, exercise.name);
        setsContainer.appendChild(setDisplay);
    });
    
    exerciseDiv.appendChild(setsContainer);
    
    
    const setForm = createSetForm(date, exercise.name);
    exerciseDiv.appendChild(setForm);
    
    return exerciseDiv;
}

function createExerciseHeader(exercise, date) {
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.marginBottom = "10px";
    
    const title = document.createElement("h3");
    title.textContent = exercise.name;
    title.style.marginRight = "10px";
    title.style.margin = "0";
    
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button"; 
    deleteBtn.textContent = "Delete Exercise";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteExercise(date, exercise.name);
});
    
    header.appendChild(title);
    header.appendChild(deleteBtn);
    return header;
}

function createSetDisplay(set, index, date, exerciseName) {
    const setContainer = document.createElement("div");
    setContainer.style.display = "flex";
    setContainer.style.alignItems = "center";
    setContainer.style.gap = "10px";
    setContainer.style.marginBottom = "5px";

    const setText = document.createElement("span");
    setText.textContent = `Set ${index + 1}: ${set.reps} reps, ${set.weight} kg`;

    const deleteSetBtn = document.createElement("button");
    deleteSetBtn.type = "button";
    deleteSetBtn.textContent = "Delete Set";
    deleteSetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSet(date, exerciseName, index);
});

    setContainer.appendChild(setText);
    setContainer.appendChild(deleteSetBtn);
    return setContainer;
}

function createSetForm(date, exerciseName) {
    const setForm = document.createElement("form");
    setForm.style.marginTop = "10px";
    setForm.innerHTML = `
        <input type="number" name="weight" placeholder="Weight" required>
        <input type="number" step="0.1" name="reps" placeholder="Reps" required>
        <button type="submit">Add Set</button>
    `;
    
    setForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const reps = e.target.reps.value;
        const weight = e.target.weight.value;
        e.target.reset();
        addSet(date, exerciseName, reps, weight);
    });
    
    return setForm;
}

function deleteExercise(date, exerciseName) {
    fetch(`http://127.0.0.1:8000/delete_exercise/${date}/${exerciseName}`, {
        method: "DELETE",
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            console.log("About to call viewWorkouts from deleteExercise");
            console.log("Date field value:", document.getElementById("global-date").value);
            console.log("Display div exists:", !!document.getElementById("workouts-display"));

            setTimeout(() => {
                console.log("Inside setTimeout - about to call viewWorkouts");
                viewWorkouts();
            }, 100);
        }
    })
    .catch(error => console.error("Error:", error));
}

function addSet(date, exerciseName, reps, weight) {
    fetch(`http://127.0.0.1:8000/add_set/${date}/${exerciseName}`, {
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
            setTimeout(() => viewWorkouts(), 100);
        }
    })
    .catch(error => console.error("Error:", error));
}

function deleteSet(date, exerciseName, setIndex) {
    fetch(`http://127.0.0.1:8000/delete_set/${date}/${exerciseName}/${setIndex}`, {
        method: "DELETE",
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            setTimeout(() => viewWorkouts(), 100);
        }
    })
    .catch(error => console.error("Error:", error));
}



// TIMER 
let timerInterval = null;
let remainingTime = 0; 
let isRunning = false;
let lastPreset = 60; 

const miniDisplay = document.getElementById("mini-timer-display");
const miniStartBtn = document.getElementById("mini-start-pause-btn");

const mainDisplay = document.getElementById("timer-display");
const startPauseBtn = document.getElementById("start-pause-btn");
const resetBtn = document.getElementById("reset-btn");
const minus15Btn = document.getElementById("minus-15");
const plus15Btn = document.getElementById("plus-15");
const preset1minBtn = document.getElementById("preset-btn1");
const preset2minBtn = document.getElementById("preset-btn2");
const preset3minBtn = document.getElementById("preset-btn3");

function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
}

function updateDisplays() {
    mainDisplay.textContent = formatTime(remainingTime);
    miniDisplay.textContent = formatTime(remainingTime);
    miniStartBtn.textContent = isRunning ? "Pause" : "Start";
    startPauseBtn.textContent = isRunning ? "Pause" : "Start";
}

function toggleTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
    } else {
        timerInterval = setInterval(() => {
            remainingTime--;
            updateDisplays();
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                remainingTime = lastPreset;
                updateDisplays();
            }
        }, 1000);
    }
    isRunning = !isRunning;
}


startPauseBtn.addEventListener("click", toggleTimer);

miniStartBtn.addEventListener("click", toggleTimer);


resetBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    remainingTime = lastPreset;
    isRunning = false;
    updateDisplays();
});


minus15Btn.addEventListener("click", () => {
    remainingTime = Math.max(0, remainingTime - 15);
    updateDisplays();
});

plus15Btn.addEventListener("click", () => {
    remainingTime += 15;
    updateDisplays();
});

[preset1minBtn, preset2minBtn, preset3minBtn].forEach(btn => {
    btn.addEventListener("click", () => {
        const presetTime = parseInt(btn.dataset.time);
        remainingTime = presetTime;
        lastPreset = presetTime;
        updateDisplays();
    });
});


updateDisplays();





