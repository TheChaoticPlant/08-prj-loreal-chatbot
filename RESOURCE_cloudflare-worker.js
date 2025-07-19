// Cloudflare Worker script for secure OpenAI API calls
export default {
  async fetch(request, env) {
    // Set CORS headers so browser requests work
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Get API key from Cloudflare secret
    const apiKey = env.OPENAI_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const userInput = await request.json();

    // Prepare request for OpenAI
    const requestBody = {
      model: "gpt-4o",
      messages: userInput.messages,
      max_tokens: 300,
    };

    // Send request to OpenAI
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Return response to browser
    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};

// Get DOM elements
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

// Conversation history with system prompt for context
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
  // Only send the last 10 messages for context
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

    // Display AI's reply if available
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
