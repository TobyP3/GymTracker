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
const mainContent = document.querySelector(".container"); 

function saveToken(token) {
    localStorage.setItem("token", token);
}

function getToken() {
    return localStorage.getItem("token");
}

async function authFetch(url, options = {}) {
    const token = getToken(); 
    if (!token) {
        alert("You are not logged in!");
        return Promise.reject("No token found");
    }

    // Ensure headers exist
    options.headers = options.headers || {};
    options.headers["Authorization"] = `Bearer ${token}`;

    return fetch(url, options);
}

async function checkExistingLogin() {
    const token = getToken();
    if (!token) {
        return;
    }

    try {
        const res = await authFetch("http://127.0.0.1:8000/templates");
        if (res.ok) {
            showMainContent(); // This will now set date and load data
        } else {
            localStorage.removeItem("token");
        }
    } catch (err) {
        localStorage.removeItem("token");
        console.log("Invalid token, please log in again");
    }
}

// Call this when the page loads
window.addEventListener("load", checkExistingLogin);


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
    
    // Initialize the page when main content is shown
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("global-date").value = today;
    
    // Load initial data
    loadTemplates();
    viewWorkouts();
}

mainContent.style.display = "none";

viewBtn.addEventListener("click", viewWorkouts);
window.addEventListener('load', loadTemplates);

addBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const name = document.getElementById("exercise-name").value;
    const date = document.getElementById("global-date").value;
    if (!name) return alert("Please enter an exercise name");

    try {
        const res = await authFetch(`http://127.0.0.1:8000/add_exercise/${date}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, sets: [] })
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else {
            document.getElementById("exercise-name").value = "";
            viewWorkouts();
        }
    } catch (err) { console.error(err); }
});


applyTemplateBtn.addEventListener("click", async () => {
    const date = document.getElementById("global-date").value;
    const templateName = templateSelect.value;

    try {
        const res = await authFetch(`http://127.0.0.1:8000/apply_template/${date}/${templateName}`, {
            method: "POST"
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else viewWorkouts();
    } catch (err) { console.error(err); }
});

createTemplateBtn.addEventListener("click", async () => {
    const name = document.getElementById("new-template-name").value;
    const exercises = document.getElementById("new-template-exercises").value
        .split(",").map(e => e.trim()).filter(e => e);
    if (!name) return alert("Please enter a template name");

    try {
        const res = await authFetch("http://127.0.0.1:8000/add_template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, exercises })
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else {
            document.getElementById("new-template-name").value = "";
            document.getElementById("new-template-exercises").value = "";
            loadTemplates();
        }
    } catch (err) { console.error(err); }
});



async function loadTemplates() {
    try {
        const res = await authFetch("http://127.0.0.1:8000/templates");
        const data = await res.json();
        const templates = data.templates;
        templateSelect.innerHTML = "";
        templateListDiv.innerHTML = "";

        Object.keys(templates).forEach(templateName => {
            const option = document.createElement("option");
            option.value = templateName;
            option.textContent = templateName;
            templateSelect.appendChild(option);

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

            saveBtn.addEventListener("click", async () => {
                const updatedExercises = exercisesInput.value.split(",").map(e => e.trim()).filter(e => e);
                try {
                    const res = await authFetch(`http://127.0.0.1:8000/edit_template/${templateName}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ exercises: updatedExercises })
                    });
                    const data = await res.json();
                    if (data.error) alert(data.error);
                    else loadTemplates();
                } catch (err) { console.error(err); }
            });

            deleteBtn.addEventListener("click", async () => {
                try {
                    const res = await authFetch(`http://127.0.0.1:8000/delete_template/${templateName}`, {
                        method: "DELETE"
                    });
                    const data = await res.json();
                    if (data.error) alert(data.error);
                    else loadTemplates();
                } catch (err) { console.error(err); }
            });

            templateListDiv.appendChild(templateDiv);
        });
    } catch (err) { console.error(err); }
}


async function viewWorkouts() {
    const date = document.getElementById("global-date").value;
    const displayDiv = document.getElementById("workouts-display");
    const currentScrollY = window.scrollY; // Store current position
    
    displayDiv.innerHTML = "";
    const data = await fetchWorkouts(date);
    if (!data.exercises || data.exercises.length === 0) {
        displayDiv.textContent = "No exercises found for this date.";
        return;
    }
    renderWorkouts(data.exercises, date, displayDiv);
    
    // Restore scroll position after rendering
    window.scrollTo(0, currentScrollY);
}

async function fetchWorkouts(date) {
    try {
        const res = await authFetch(`http://127.0.0.1:8000/workouts/${date}`);
        return await res.json();
    } catch (err) { console.error(err); return { exercises: [] }; }
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

async function deleteExercise(date, exerciseName) {
    try {
        const res = await authFetch(`http://127.0.0.1:8000/delete_exercise/${date}/${exerciseName}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else viewWorkouts();
    } catch (err) { console.error(err); }
}


async function addSet(date, exerciseName, reps, weight) {
    try {
        const res = await authFetch(`http://127.0.0.1:8000/add_set/${date}/${exerciseName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reps: parseInt(reps), weight: parseFloat(weight) })
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else viewWorkouts();
    } catch (err) { console.error(err); }
}


async function deleteSet(date, exerciseName, setIndex) {
    try {
        const res = await authFetch(`http://127.0.0.1:8000/delete_set/${date}/${exerciseName}/${setIndex}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else viewWorkouts();
    } catch (err) { console.error(err); }
}

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
    // Remove the token from localStorage
    localStorage.removeItem("token");
    
    // Clear any displayed data
    document.getElementById("workouts-display").innerHTML = "";
    document.getElementById("template-list").innerHTML = "";
    document.getElementById("template-select").innerHTML = "";
    
    // Clear form fields
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("exercise-name").value = "";
    document.getElementById("global-date").value = "";
    
    // Show login section and hide main content
    loginSection.style.display = "block";
    mainContent.style.display = "none";
    
    authMessage.textContent = "Logged out successfully";
});

const calendarGrid = document.getElementById("calendar-grid");
const currentMonthYear = document.getElementById("current-month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1–12

async function loadCalendar(year, month) {
    try {
        const res = await authFetch(`http://127.0.0.1:8000/analytics/calendar/${year}/${month}`);
        const data = await res.json();

        // Update header
        const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
        currentMonthYear.textContent = `${monthName} ${year}`;

        // Clear old grid
        calendarGrid.innerHTML = "";

        // Days of week header (optional)
        ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
            const headerCell = document.createElement("div");
            headerCell.textContent = d;
            headerCell.style.fontWeight = "bold";
            calendarGrid.appendChild(headerCell);
        });

        // Calculate first weekday offset
        const firstDay = new Date(year, month - 1, 1).getDay();
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-day empty";
            calendarGrid.appendChild(emptyCell);
        }

        // Fill in days
        const days = data.days;
        Object.keys(days).forEach(dateStr => {
            const isWorkout = days[dateStr];
            const day = parseInt(dateStr.split("-")[2]);

            const dayDiv = document.createElement("div");
            dayDiv.className = "calendar-day " + (isWorkout ? "workout-day" : "rest-day");
            dayDiv.textContent = day;
            dayDiv.addEventListener("click", () => {
                    document.getElementById("global-date").value = dateStr; // update global date input
                    viewWorkouts(); // load workouts for clicked day
                    window.scrollTo({ top: document.getElementById("workouts-display").offsetTop, behavior: "smooth" });
            });

            calendarGrid.appendChild(dayDiv);
        });

    } catch (err) {
        console.error("Error loading calendar:", err);
    }
}

// Event listeners for navigation
prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    loadCalendar(currentYear, currentMonth);
});

nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    loadCalendar(currentYear, currentMonth);
});

// Initialize
window.addEventListener("load", () => {
    loadCalendar(currentYear, currentMonth);
});

const loadChartBtn = document.getElementById("load-chart-btn");
let progressionChart = null; // Store chart instance so we can update it

// Define colors for different sets
const setColors = [
    '#4CAF50', // Set 1 - Green
    '#2196F3', // Set 2 - Blue  
    '#FF9800', // Set 3 - Orange
    '#9C27B0', // Set 4 - Purple
    '#F44336', // Set 5 - Red
    '#00BCD4', // Set 6 - Cyan
];

loadChartBtn.addEventListener("click", async () => {
    const exerciseName = document.getElementById("exercise-name-chart").value;
    if (!exerciseName) {
        alert("Please enter an exercise name");
        return;
    }
    
    try {
        const res = await authFetch(`http://127.0.0.1:8000/analytics/exercise_progression/${encodeURIComponent(exerciseName)}`);
        const data = await res.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }
        
        renderProgressionChart(data);
    } catch (err) {
        console.error("Error:", err);
        alert("Failed to load progression data");
    }
});

function renderProgressionChart(data) {
    const ctx = document.getElementById('progression-chart').getContext('2d');
    
    // Destroy existing chart if it exists (so we can create a new one)
    if (progressionChart) {
        progressionChart.destroy();
    }
    
    // Prepare datasets - one line per set
    const datasets = [];
    const setNumbers = Object.keys(data.set_data).sort((a, b) => parseInt(a) - parseInt(b));
    
    setNumbers.forEach((setNum, index) => {
        const setInfo = data.set_data[setNum];
        
        datasets.push({
            label: `Set ${setNum}`,
            data: setInfo.map(point => ({
                x: point.date,
                y: point.volume,
                weight: point.weight, // Store for tooltip
                reps: point.reps      // Store for tooltip
            })),
            borderColor: setColors[index % setColors.length],
            backgroundColor: setColors[index % setColors.length],
            tension: 0, // 0 = straight lines, 0.4 = curved
            pointRadius: 5,
            pointHoverRadius: 8
        });
    });
    
    // Create the chart
    progressionChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${data.exercise_name} - Volume Progression`,
                    color: '#ffffff',
                    font: { size: 18 }
                },
                legend: {
                    labels: { color: '#ffffff' }
                },
                tooltip: {
                    callbacks: {
                        // Custom tooltip to show weight and reps
                        label: function(context) {
                            const point = context.raw;
                            return `Volume: ${point.y}kg (${point.weight}kg × ${point.reps} reps)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day' },
                    title: {
                        display: true,
                        text: 'Date',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: '#444' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Volume (kg)',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: '#444' }
                }
            }
        }
    });
}

// Tab Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        navBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active to clicked
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});



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





