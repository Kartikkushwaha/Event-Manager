// theme logic
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const htmlElement = document.documentElement;

// Initialize theme from local storage or default to dark
const savedTheme = localStorage.getItem("app_theme") || "dark";
htmlElement.setAttribute("data-theme", savedTheme);
updateThemeIcon(savedTheme);

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = htmlElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  htmlElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("app_theme", newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
}

// ==========================================
// 2. AI INVITATION GENERATOR LOGIC
// ==========================================
const API_URL = "http://localhost:8000/api/generate";

const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("promptInput");
const imagePreview = document.getElementById("imagePreview");
const placeholderText = document.getElementById("placeholderText");
const statusText = document.getElementById("statusText");
const actionBar = document.getElementById("actionBar");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("hiddenCanvas");
const ctx = canvas.getContext("2d");

generateBtn.addEventListener("click", async () => {
  const userPrompt = promptInput.value.trim();

  if (!userPrompt) {
    alert("Please enter details about your event first!");
    return;
  }

  // Reset UI State
  generateBtn.disabled = true;
  generateBtn.querySelector("span").textContent = "Generating Image...";
  statusText.textContent = "Analyzing layout & formatting text...";
  placeholderText.style.display = "flex";
  placeholderText.querySelector("p").textContent = "Creating your Invitation Card, Please Wait...";
  imagePreview.style.display = "none";
  actionBar.style.display = "none";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userPrompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to communicate with API.");
    }

    const data = await response.json();
    const designData = data.designData;

    // ==========================================
    // 3. PAINTING THE PNG IMAGE (HTML5 CANVAS)
    // ==========================================
    statusText.textContent = "Rendering high-resolution PNG...";

    // Explicitly set high-resolution canvas dimensions so text isn't pushed off-screen!
    canvas.width = 800;
    canvas.height = 1100;

    // Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, designData.bgColor1 || "#D4AF37");
    gradient.addColorStop(1, designData.bgColor2 || "#C0C0C0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Decorative Border
    ctx.strokeStyle = designData.textColor || "#FFFFFF";
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Inner border frame
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

    // Configure Text Rendering
    ctx.fillStyle = designData.textColor || "#2C2A29";
    ctx.textAlign = "center";

    // Draw Main Heading
    ctx.font = "bold 46px Georgia";
    wrapText(ctx, (designData.heading || "YOU'RE INVITED").toUpperCase(), canvas.width / 2, 220, canvas.width - 160, 55);

    // Draw Decorative Divider Line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 100, 340);
    ctx.lineTo(canvas.width / 2 + 100, 340);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Subheading / Name
    ctx.font = "italic bold 40px Georgia";
    wrapText(ctx, designData.subheading || "", canvas.width / 2, 430, canvas.width - 160, 50);

    // Draw Details List
    ctx.font = "28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let currentY = 560;
    if (designData.details && Array.isArray(designData.details)) {
      designData.details.forEach(line => {
        currentY = wrapText(ctx, line, canvas.width / 2, currentY, canvas.width - 180, 42);
        currentY += 20; 
      });
    }

    // Convert to PNG & Display
    const pngUrl = canvas.toDataURL("image/png");
    imagePreview.src = pngUrl;
    imagePreview.style.display = "block";
    placeholderText.style.display = "none";

    downloadBtn.href = pngUrl;
    actionBar.style.display = "block";
    statusText.textContent = "Your Invitation card generated successfully! ";

  } catch (error) {
    console.error("Error generating image:", error);
    placeholderText.style.display = "flex";
    placeholderText.querySelector("p").style.color = "#EF4444";
    placeholderText.querySelector("p").textContent = `Error: ${error.message}`;
    statusText.textContent = "Failed to generate image.";
  } finally {
    generateBtn.disabled = false;
    generateBtn.querySelector("span").textContent = "Generate My Invitation";
  }
});

// Helper function to auto-wrap long text lines neatly within the image canvas
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, y);
  return y + lineHeight;
}