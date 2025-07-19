// Beginner-friendly L’Oréal chatbot using OpenAI's gpt-4o model

// Get DOM elements
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

// System prompt for L'Oréal relevance
const systemPrompt =
  "You are a helpful assistant for L’Oréal. Only answer questions about L’Oréal products, beauty routines, or recommendations. If the question is unrelated, politely reply that you can only answer questions about L’Oréal.";

// Conversation history
let conversation = [{ role: "system", content: systemPrompt }];

// Add message to chat window
function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg", sender);
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Initial greeting
addMessage("👋 Hello! How can I help you today?", "ai");

// Handle form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  conversation.push({ role: "user", content: message });
  userInput.value = "";

  addMessage("Thinking...", "ai");

  const aiReply = await getAIResponse();

  // Remove loading message
  const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
  if (loadingMsg && loadingMsg.textContent === "Thinking...") {
    chatWindow.removeChild(loadingMsg);
  }

  addMessage(aiReply, "ai");
  conversation.push({ role: "assistant", content: aiReply });
});

// Fetch AI response from Worker
async function getAIResponse() {
  // Send last 10 messages for context
  const messagesToSend = conversation.slice(-11);

  const body = JSON.stringify({
    messages: messagesToSend,
  });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    });
    const data = await response.json();

    // OpenAI's response format
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      return "Sorry, I couldn't understand that. Please try again!";
    }
  } catch (error) {
    console.log("Fetch error:", error);
    return "Sorry, there was a problem connecting to the AI.";
  }
}
