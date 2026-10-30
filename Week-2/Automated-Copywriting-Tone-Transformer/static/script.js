const copyForm = document.getElementById("copyForm");

const productName = document.getElementById("productName");
const description = document.getElementById("description");
const platform = document.getElementById("platform");
const tone = document.getElementById("tone");

const temperature = document.getElementById("temperature");
const topP = document.getElementById("topP");

const temperatureValue = document.getElementById("temperatureValue");
const topPValue = document.getElementById("topPValue");

const generateBtn = document.getElementById("generateBtn");
const buttonText = document.getElementById("buttonText");

const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const resultContainer = document.getElementById("resultContainer");

const resultMeta = document.getElementById("resultMeta");
const generatedCopy = document.getElementById("generatedCopy");

const errorMessage = document.getElementById("errorMessage");

const copyBtn = document.getElementById("copyBtn");
const regenerateBtn = document.getElementById("regenerateBtn");

let lastGeneratedSettings = null;

// Update the displayed slider values.
temperature.addEventListener("input", () => {
    temperatureValue.textContent = Number(temperature.value).toFixed(1);
});

topP.addEventListener("input", () => {
    topPValue.textContent = Number(topP.value).toFixed(2).replace(/0$/, "");
});

// Collect the current form values.
function collectSettings() {
    return {
        product_name: productName.value.trim(),
        description: description.value.trim(),
        platform: platform.value,
        tone: tone.value,
        temperature: Number(temperature.value),
        top_p: Number(topP.value)
    };
}

// Hide all output states before displaying a new one.
function hideOutputStates() {
    emptyState.classList.add("hidden");
    loadingState.classList.add("hidden");
    resultContainer.classList.add("hidden");
    errorMessage.classList.add("hidden");
}

// Display an error message.
function showError(message) {
    hideOutputStates();
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

// Generate the marketing copy using the Flask backend.
async function generateCopy(settings = collectSettings()) {
    if (!settings.product_name || !settings.description) {
        showError("Please enter both the product name and description.");
        return;
    }

    lastGeneratedSettings = { ...settings };

    hideOutputStates();
    loadingState.classList.remove("hidden");

    generateBtn.disabled = true;
    buttonText.textContent = "Generating your copy...";

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(settings)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to generate content.");
        }

        generatedCopy.textContent = data.generated_copy;
        resultMeta.textContent =
            `${settings.platform} · ${settings.tone} tone`;

        loadingState.classList.add("hidden");
        resultContainer.classList.remove("hidden");

    } catch (error) {
        showError(
            error.message ||
            "Something went wrong. Please check your connection and try again."
        );
    } finally {
        generateBtn.disabled = false;
        buttonText.textContent = "Generate marketing copy";
    }
}

// Generate content when the form is submitted.
copyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateCopy();
});

// Copy the generated content to the clipboard.
copyBtn.addEventListener("click", async () => {
    const text = generatedCopy.textContent;

    if (!text.trim()) {
        return;
    }

    try {
        await navigator.clipboard.writeText(text);

        copyBtn.textContent = "Copied! ✓";

        setTimeout(() => {
            copyBtn.textContent = "Copy text";
        }, 1800);

    } catch (error) {
        showError("Clipboard access failed. Please select and copy the text manually.");
    }
});

// Regenerate content with the same settings.
regenerateBtn.addEventListener("click", () => {
    if (lastGeneratedSettings) {
        generateCopy(lastGeneratedSettings);
    }
});