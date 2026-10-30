const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");
const typing = document.getElementById("typing");
const sendButton = document.getElementById("sendButton");

function addMessage(text, sender) {
    const message = document.createElement("div");
    message.className = `message ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = sender === "user" ? "YOU" : "AI";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    // Use textContent to display text safely.
    bubble.textContent = text;

    message.appendChild(avatar);
    message.appendChild(bubble);
    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) return;

    addMessage(message, "user");
    messageInput.value = "";
    messageInput.focus();

    typing.classList.remove("hidden");
    sendButton.disabled = true;

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        addMessage(data.reply, "assistant");
    } catch (error) {
        addMessage(
            `Sorry, I couldn't get a response. ${error.message}`,
            "assistant"
        );
    } finally {
        typing.classList.add("hidden");
        sendButton.disabled = false;
        messageInput.focus();
    }
});