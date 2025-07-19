// Beginner-friendly L’Oréal chatbot using OpenAI's gpt-4o model

// Get DOM elements
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

// System prompt: guides the bot to only answer L’Oréal-related questions
const systemPrompt =
  "You are a helpful assistant for L’Oréal. Only answer questions about L’Oréal products, beauty routines, recommendations, or beauty-related topics. If the question is unrelated, politely reply: 'Sorry, I can only answer questions about L’Oréal products, routines, or beauty topics.'";

// Store the conversation history for context awareness
let conversation = [{ role: "system", content: systemPrompt }];

// Function to add a message to the chat window
function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg", sender);
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Show initial greeting
addMessage("👋 Hello! How can I help you today?", "ai");

// Handle form submission
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Add user's message to chat and conversation history
  addMessage(message, "user");
  conversation.push({ role: "user", content: message });
  userInput.value = "";

  // Show loading message
  addMessage("Thinking...", "ai");

  // Get AI response from OpenAI via Cloudflare Worker
  const aiReply = await getAIResponse();

  // Remove loading message
  const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
  if (loadingMsg && loadingMsg.textContent === "Thinking...") {
    chatWindow.removeChild(loadingMsg);
  }

  // Add AI reply to chat and conversation history
  addMessage(aiReply, "ai");
  conversation.push({ role: "assistant", content: aiReply });
});

// Function to get AI response from Cloudflare Worker
async function getAIResponse() {
  // Only send the last 10 messages for context (including system prompt)
  const messagesToSend = conversation.slice(-11);

  // Prepare request body for OpenAI Chat Completions API
  const body = JSON.stringify({
    model: "gpt-4o",
    messages: messagesToSend,
    max_tokens: 200,
  });

  try {
    // Send request to Cloudflare Worker (which securely calls OpenAI)
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
    });
    const data = await response.json();

    // Return the AI's reply
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else if (data.reply) {
      return data.reply.trim();
    } else {
      return "Sorry, I couldn't understand that. Please try again!";
    }
  } catch (error) {
    console.log(error);
    return "Sorry, there was a problem connecting to the AI.";
  }
}
