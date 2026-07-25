
    const GEMINI_API_KEY = "AQ.Ab8RN6JGqqHw8filNvgiZJA3sNNfwfENa6-Yccp83CJEJmhl7w"; 
// this API key not functioning due to overused
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

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
      generateBtn.textContent = "Generating Image...";
      statusText.textContent = "Analyzing layout & formatting text...";
      placeholderText.style.display = "block";
      placeholderText.textContent = "Painting your PNG card...";
      imagePreview.style.display = "none";
      actionBar.style.display = "none";

      // Instruct AI to give structured JSON so we can paint a clean, pixel-perfect image
      const systemInstruction = `You are a layout designer. Analyze the user's invitation prompt and extract the content into a strict JSON format so it can be painted onto an image canvas.
      Return ONLY a JSON object with this exact structure (no markdown, no backticks, just raw JSON):
      {
        "bgColor1": "#HexCode (primary background color requested, e.g. #D4AF37 for gold or #1a237e for navy)",
        "bgColor2": "#HexCode (secondary gradient color, e.g. #C0C0C0 for silver or #000000)",
        "textColor": "#HexCode (best contrasting color for text, e.g. #FFFFFF or #2C2A29)",
        "heading": "The main invitation title (e.g. INVITING YOU TO BIRTHDAY)",
        "subheading": "Name or primary highlight (e.g. Kartik Kumar)",
        "details": ["Line 1 of details", "Line 2 of details", "Line 3 of details"]
      }
      User Prompt: ${userPrompt}`;

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemInstruction }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to communicate with API.");
        }

        const data = await response.json();
        let rawJson = data.candidates[0].content.parts[0].text;
        
        // Clean out any unexpected formatting
        rawJson = rawJson.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const designData = JSON.parse(rawJson);

        // ==========================================
        // 2. PAINTING THE PNG IMAGE (HTML5 CANVAS)
        // ==========================================
        statusText.textContent = "Rendering high-resolution PNG...";

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
        ctx.font = "28px sans-serif";
        let currentY = 560;
        if (designData.details && Array.isArray(designData.details)) {
          designData.details.forEach(line => {
            currentY = wrapText(ctx, line, canvas.width / 2, currentY, canvas.width - 180, 42);
            currentY += 20; // Extra spacing between sections
          });
        }

        // ==========================================
        // 3. CONVERT TO REAL PNG & DISPLAY
        // ==========================================
        const pngUrl = canvas.toDataURL("image/png");

        // Display directly in standard <img> tag
        imagePreview.src = pngUrl;
        imagePreview.style.display = "block";
        placeholderText.style.display = "none";

        // Connect download button directly to PNG data
        downloadBtn.href = pngUrl;
        actionBar.style.display = "grid";

        statusText.textContent = "PNG Image card generated successfully! 🎉";

      } catch (error) {
        console.error("Error generating image:", error);
        placeholderText.style.display = "block";
        placeholderText.style.color = "#D32F2F";
        placeholderText.textContent = `Error: ${error.message}`;
        statusText.textContent = "Failed to generate image.";
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate PNG Image";
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
