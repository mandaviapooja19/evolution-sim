const canvas = document.getElementById('mothCanvas');
const ctx = canvas.getContext('2d');
const bgSlider = document.getElementById('bgSlider');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const predatorBtn = document.getElementById('predatorBtn');
const timerDisplay = document.getElementById('timer');

let predatorMode = false;
let history = []; // Stores light/dark population counts over time
let timeLeft = 10; // ⬅️ was 30, now 10 seconds
let repositionInterval;
let countdownInterval;
let moths = [];

// Generate 20 moths with random positions and random colors
/* const moths = Array.from({ length: 20 }, () => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    color: Math.random() < 0.5 ? 'light' : 'dark', // 50/50 chance
  };
}); */


// Generate moths with random position and color
function generateMoths() {
  moths = Array.from({ length: 20 }, () => {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      color: Math.random() < 0.5 ? 'light' : 'dark',
    };
  });
}

function getMothBrightness(type) {
  return type === 'light' ? 220 : 70;
}

// Simulate predation based on contrast
function filterSurvivors() {
  const bgValue = parseInt(bgSlider.value);
  const survivors = moths.filter(moth => {
    const contrast = Math.abs(getMothBrightness(moth.color) - bgValue);
    return contrast < 100; // Survivors are all camouflaged
  });
  return survivors;
}

// Create next generation based on survivors
function reproduce(survivors) {
  const newGeneration = [];

  // If no survivors, restart population randomly
  if (survivors.length === 0) {
    generateMoths(); // fallback
    drawScene();
    drawGraph();
    return;
  }

  for (let i = 0; i < 20; i++) {
    const parent = survivors[Math.floor(Math.random() * survivors.length)];
    let color = parent.color;

    // Mutation: 10% chance to switch color
    if (Math.random() < 0.1) {
      color = color === 'light' ? 'dark' : 'light';
    }
    newGeneration.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      color: color, // inherit parent's color
    });
  }

  moths = newGeneration;

  // Add current counts to history
  const lightCount = newGeneration.filter(m => m.color === 'light').length;
  const darkCount = newGeneration.length - lightCount;
  history.push({ light: lightCount, dark: darkCount });

  // Showing the last 30 entries
  if (history.length > 30) history.shift();
  drawScene();
  drawGraph(); // Update graph
}

// Function to get RGB value from slider
function getBackgroundColor(value) {
  return `rgb(${value}, ${value}, ${value})`;
}

// Function to get moth color
function getMothColor(type) {
  return type === 'light' ? '#D9CAB3' : '#4B3F3F';
}

// Draw the entire scene
function drawScene() {
  const bgValue = parseInt(bgSlider.value);
  const bgColor = getBackgroundColor(bgValue);

  // Draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each moth
  moths.forEach(moth => {
    ctx.beginPath();
    ctx.arc(moth.x, moth.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = getMothColor(moth.color);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();
  });
}

// Update moth positions every 2 seconds
function repositionMoths() {
  console.log("repositionMoths")
  moths.forEach(moth => {
    moth.x = Math.random() * canvas.width;
    moth.y = Math.random() * canvas.height;
  });
  drawScene();
}

// Update the scene whenever the slider changes
bgSlider.addEventListener('input', drawScene);

// Initialize simulation
generateMoths();
drawScene();
setInterval(repositionMoths, 2000); // Change position every 2 seconds
resetBtn.addEventListener('click', resetSimulation);
predatorBtn.addEventListener('click', () => {
  predatorMode = !predatorMode;
  predatorBtn.textContent = ` Toggle Predator Mode: ${predatorMode ? 'ON' : 'OFF'}`;
});

// Start repositioning every 2 seconds
repositionInterval = setInterval(repositionMoths, 2000);

// Start countdown timer
countdownInterval = setInterval(() => {
  runTimer();
}, 1000);

function runTimer() {
  timeLeft--;
  timerDisplay.textContent = `Time Left: ${timeLeft}s`;

  if (timeLeft <= 0) {
    clearInterval(repositionInterval);
    clearInterval(countdownInterval);
    timerDisplay.textContent = 'Time’s up! Evaluating...';

    const survivors = filterSurvivors();
    reproduce(survivors);

    setTimeout(() => {
      timeLeft = 10;
      timerDisplay.textContent = `Time Left: ${timeLeft}s`;
      repositionInterval = setInterval(repositionMoths, 2000);
      countdownInterval = setInterval(runTimer, 1000);
    }, 3000);
  }
}

function drawGraph() {
  const width = graphCanvas.width;
  const height = graphCanvas.height;
  const maxGenerations = 30;
  
  // Clear graph
  graphCtx.clearRect(0, 0, width, height);

  // Axes
  graphCtx.beginPath();
  graphCtx.moveTo(30, 10);
  graphCtx.lineTo(30, height - 20);
  graphCtx.lineTo(width - 10, height - 20);
  graphCtx.strokeStyle = '#444';
  graphCtx.stroke();

  // Labels
  graphCtx.fillStyle = '#000';
  graphCtx.fillText("Moth Count", 5, 20);
  graphCtx.fillText("Generations →", width - 100, height - 5);

  // Plot values
  history.forEach((entry, i) => {
    const x = 30 + (i * (width - 40) / maxGenerations);
    const lightY = height - 20 - (entry.light * 6); // scale: 20 moths max
    const darkY = height - 20 - (entry.dark * 6);

    // Light moths – tan
    graphCtx.beginPath();
    graphCtx.arc(x, lightY, 3, 0, Math.PI * 2);
    graphCtx.fillStyle = '#D9CAB3';
    graphCtx.fill();

    // Dark moths – dark brown
    graphCtx.beginPath();
    graphCtx.arc(x, darkY, 3, 0, Math.PI * 2);
    graphCtx.fillStyle = '#4B3F3F';
    graphCtx.fill();
  });
}

function resetSimulation() {
  clearInterval(repositionInterval);
  clearInterval(countdownInterval);

  // Reset everything
  history = [];
  timeLeft = 30;
  timerDisplay.textContent = `Time Left: ${timeLeft}s`;

  generateMoths();
  drawScene();
  drawGraph();

  repositionInterval = setInterval(repositionMoths, 2000);
  countdownInterval = setInterval(runTimer, 1000);
}

// Click detection on Canvas
canvas.addEventListener('click', function (e) {
  if (!predatorMode) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Loop through moths and remove one if clicked
  for (let i = 0; i < moths.length; i++) {
    const moth = moths[i];
    const dx = mouseX - moth.x;
    const dy = mouseY - moth.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      moths.splice(i, 1); // Remove the moth
      drawScene(); // Redraw without it
      break;
    }
  }
});