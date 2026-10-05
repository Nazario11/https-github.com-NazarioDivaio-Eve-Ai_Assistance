// =========================================
// EVE AI — COMPLETE APP.JS
// =========================================

// -----------------------------
// DOM ELEMENTS
// -----------------------------

const chatContainer =
    document.getElementById("chatContainer");

const chatForm =
    document.getElementById("chatForm");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const modeSelect =
    document.getElementById("modeSelect");

const currentMode =
    document.getElementById("currentMode");

const modeDescription =
    document.getElementById("modeDescription");

const newChatButton =
    document.getElementById("newChatButton");

const clearButton =
    document.getElementById("clearButton");

const statusDot =
    document.getElementById("statusDot");

const statusText =
    document.getElementById("statusText");

const modelText =
    document.getElementById("modelText");

const topStatusDot =
    document.getElementById("topStatusDot");


// -----------------------------
// STATE
// -----------------------------

let previousResponseId =
    localStorage.getItem("eve_previous_response_id") || null;

let isLoading = false;


// -----------------------------
// MODE DESCRIPTIONS
// -----------------------------

const modeDescriptions = {

    "Default Eve":
        "General AI assistant for conversation and problem solving.",

    "Tracking":
        "Collect, verify, correlate, build a timeline, assess, and report.",

    "OSINT":
        "Analyze lawful public information while separating facts from inference.",

    "Technical Tracking":
        "Analyze public technical information such as websites, domains, DNS, and infrastructure.",

    "Study / Lecturer":
        "Beginner-friendly teaching with explanations, examples, and step-by-step reasoning.",

    "Critical / Strategic":
        "Challenge assumptions, identify blind spots, risks, and opportunity costs.",

    "Planning":
        "Create realistic plans based on goals, constraints, priorities, and available time.",

    "Writing":
        "Improve grammar, clarity, tone, structure, and naturalness.",

    "Research":
        "Question, evidence, cross-checking, synthesis, and uncertainty.",

    "Safety":
        "Focus on privacy, risk identification, protection, and safer alternatives."

};


// -----------------------------
// STARTUP
// -----------------------------

document.addEventListener("DOMContentLoaded", () => {

    loadSavedMode();

    updateModeUI();

    setupSuggestionButtons();

    setupInputBehavior();

    setupModeListener();

    setupChatForm();

    setupNewChat();

    setupClearConversation();

    checkBackend();

});


// =========================================
// SERVER / BACKEND CHECK
// =========================================

async function checkBackend() {

    setServerStatus("checking");

    try {

        const response = await fetch("/api/health", {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                `Server returned HTTP ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Eve backend connected:", data);

        setServerStatus(
            "online",
            data.model
        );

    } catch (error) {

        console.error(
            "Eve backend connection failed:",
            error
        );

        setServerStatus("offline");

    }

}


// -----------------------------
// SERVER STATUS UI
// -----------------------------

function setServerStatus(
    status,
    model = null
) {

    if (status === "online") {

        if (statusDot) {
            statusDot.style.background = "#55b879";
        }

        if (topStatusDot) {
            topStatusDot.style.background = "#55b879";
        }

        if (statusText) {
            statusText.textContent = "Server online";
        }

        if (modelText) {
            modelText.textContent =
                model
                    ? `Model: ${model}`
                    : "Connected";
        }

        return;
    }


    if (status === "checking") {

        if (statusDot) {
            statusDot.style.background = "#e6a41d";
        }

        if (topStatusDot) {
            topStatusDot.style.background = "#e6a41d";
        }

        if (statusText) {
            statusText.textContent = "Checking server...";
        }

        if (modelText) {
            modelText.textContent = "Connecting";
        }

        return;
    }


    if (status === "offline") {

        if (statusDot) {
            statusDot.style.background = "#d64545";
        }

        if (topStatusDot) {
            topStatusDot.style.background = "#d64545";
        }

        if (statusText) {
            statusText.textContent = "Server offline";
        }

        if (modelText) {
            modelText.textContent = "Connection failed";
        }

    }

}


// =========================================
// MODE MANAGEMENT
// =========================================

function loadSavedMode() {

    const savedMode =
        localStorage.getItem("eve_mode");

    if (
        savedMode &&
        modeSelect &&
        [...modeSelect.options].some(
            option => option.value === savedMode
        )
    ) {
        modeSelect.value = savedMode;
    }

}


function setupModeListener() {

    if (!modeSelect) {
        return;
    }

    modeSelect.addEventListener(
        "change",
        updateModeUI
    );

}


function updateModeUI() {

    if (!modeSelect) {
        return;
    }

    const mode =
        modeSelect.value;

    localStorage.setItem(
        "eve_mode",
        mode
    );


    if (currentMode) {

        currentMode.textContent =
            mode;

    }


    if (modeDescription) {

        modeDescription.textContent =
            modeDescriptions[mode] ||
            "Eve operating mode.";

    }

}


// =========================================
// CHAT FORM
// =========================================

function setupChatForm() {

    if (!chatForm) {
        return;
    }

    chatForm.addEventListener(
        "submit",
        handleChatSubmit
    );

}


async function handleChatSubmit(event) {

    event.preventDefault();

    if (isLoading) {
        return;
    }


    const message =
        messageInput.value.trim();


    if (!message) {

        messageInput.focus();

        return;

    }


    // Show user's message
    addMessage(
        "user",
        message
    );


    // Clear input
    messageInput.value = "";

    autoResize();

    setLoading(true);


    // Show typing indicator
    const loadingMessage =
        addLoadingMessage();


    try {

        console.log("Sending message to Eve...");


        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message:
                            message,

                        mode:
                            modeSelect
                                ? modeSelect.value
                                : "Default Eve",

                        previousResponseId:
                            previousResponseId

                    })
                }
            );


        // Try to parse response
        let data;

        try {

            data = await response.json();

        } catch {

            throw new Error(
                `Server returned HTTP ${response.status}`
            );

        }


        // Remove typing indicator
        loadingMessage.remove();


        // Handle backend error
        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server error: HTTP ${response.status}`
            );

        }


        // Save conversation continuation ID
        if (data.responseId) {

            previousResponseId =
                data.responseId;

            localStorage.setItem(
                "eve_previous_response_id",
                previousResponseId
            );

        }


        // Show Eve response
        addMessage(
            "assistant",
            data.reply ||
            "Eve did not return a response."
        );


    } catch (error) {

        console.error(
            "Chat request failed:",
            error
        );


        loadingMessage.remove();


        addMessage(
            "assistant",
            `Unable to connect to Eve.\n\n${error.message}`
        );

    } finally {

        setLoading(false);

        messageInput.focus();

    }

}


// =========================================
// ADD MESSAGE
// =========================================

function addMessage(
    role,
    text
) {

    const welcome =
        document.getElementById("welcome");


    if (welcome) {

        welcome.remove();

    }


    const row =
        document.createElement("div");

    row.className =
        `message-row ${role}`;


    const messageBox =
        document.createElement("div");

    messageBox.className =
        "message";


    const label =
        document.createElement("div");

    label.className =
        "message-label";

    label.textContent =
        role === "user"
            ? "You"
            : "Eve";


    const content =
        document.createElement("div");

    // textContent prevents injected HTML
    content.textContent =
        text;


    messageBox.appendChild(
        label
    );

    messageBox.appendChild(
        content
    );

    row.appendChild(
        messageBox
    );

    chatContainer.appendChild(
        row
    );


    scrollToBottom();

}


// =========================================
// TYPING INDICATOR
// =========================================

function addLoadingMessage() {

    const row =
        document.createElement("div");

    row.className =
        "message-row assistant";


    const messageBox =
        document.createElement("div");

    messageBox.className =
        "message";


    const label =
        document.createElement("div");

    label.className =
        "message-label";

    label.textContent =
        "Eve";


    const typing =
        document.createElement("div");

    typing.className =
        "typing";


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const dot =
            document.createElement("span");

        typing.appendChild(
            dot
        );

    }


    messageBox.appendChild(
        label
    );

    messageBox.appendChild(
        typing
    );

    row.appendChild(
        messageBox
    );

    chatContainer.appendChild(
        row
    );


    scrollToBottom();


    return row;

}


// =========================================
// LOADING STATE
// =========================================

function setLoading(
    loading
) {

    isLoading =
        loading;


    if (sendButton) {

        sendButton.disabled =
            loading;

        sendButton.innerHTML =
            loading
                ? `<span>...</span>`
                : `<span>→</span>`;

    }


    if (messageInput) {

        messageInput.disabled =
            loading;

    }

}


// =========================================
// NEW CHAT
// =========================================

function setupNewChat() {

    if (!newChatButton) {
        return;
    }


    newChatButton.addEventListener(
        "click",
        startNewChat
    );

}


function startNewChat() {

    if (isLoading) {
        return;
    }


    previousResponseId =
        null;


    localStorage.removeItem(
        "eve_previous_response_id"
    );


    chatContainer.innerHTML = `

        <div
            id="welcome"
            class="welcome"
        >

            <div class="welcome-orb">

                <div class="welcome-letter">
                    E
                </div>

            </div>

            <div class="welcome-eyebrow">
                PERSONAL AI ASSISTANT
            </div>

            <h2>
                What are we working on?
            </h2>

            <p>
                Think, study, research, plan,
                create, or just talk.
            </p>

            <div class="suggestion-grid">

                <button
                    class="suggestion"
                    data-message="Help me understand this topic from zero knowledge."
                >
                    <span class="suggestion-icon">
                        ◉
                    </span>

                    <span>
                        Learn something
                    </span>

                </button>


                <button
                    class="suggestion"
                    data-message="Help me create a realistic plan for my week."
                >
                    <span class="suggestion-icon">
                        ⌁
                    </span>

                    <span>
                        Plan my week
                    </span>

                </button>


                <button
                    class="suggestion"
                    data-message="Challenge my thinking and point out my blind spots."
                >
                    <span class="suggestion-icon">
                        ♟
                    </span>

                    <span>
                        Challenge me
                    </span>

                </button>


                <button
                    class="suggestion"
                    data-message="Help me research a topic and separate facts from assumptions."
                >
                    <span class="suggestion-icon">
                        ⌕
                    </span>

                    <span>
                        Research
                    </span>

                </button>

            </div>

        </div>

    `;


    // Reconnect suggestion buttons
    setupSuggestionButtons();


    messageInput.value = "";

    autoResize();

    messageInput.focus();

}


// =========================================
// CLEAR CONVERSATION
// =========================================

function setupClearConversation() {

    if (!clearButton) {
        return;
    }


    clearButton.addEventListener(
        "click",
        clearConversation
    );

}


function clearConversation() {

    if (isLoading) {
        return;
    }


    previousResponseId =
        null;


    localStorage.removeItem(
        "eve_previous_response_id"
    );


    chatContainer.innerHTML = `

        <div
            id="welcome"
            class="welcome"
        >

            <div class="welcome-orb">

                <div class="welcome-letter">
                    E
                </div>

            </div>

            <div class="welcome-eyebrow">
                CONVERSATION CLEARED
            </div>

            <h2>
                Fresh start.
            </h2>

            <p>
                Eve is ready for a new conversation.
            </p>

        </div>

    `;


    messageInput.value = "";

    autoResize();

    messageInput.focus();

}


// =========================================
// SUGGESTION BUTTONS
// =========================================

function setupSuggestionButtons() {

    const suggestions =
        document.querySelectorAll(
            ".suggestion"
        );


    suggestions.forEach(
        (button) => {

            // Prevent duplicate listeners
            if (
                button.dataset.eveReady === "true"
            ) {
                return;
            }


            button.dataset.eveReady =
                "true";


            button.addEventListener(
                "click",
                () => {

                    const message =
                        button.dataset.message;


                    if (!messageInput) {
                        return;
                    }


                    messageInput.value =
                        message;


                    autoResize();

                    messageInput.focus();

                }
            );

        }
    );

}


// =========================================
// INPUT BEHAVIOR
// =========================================

function setupInputBehavior() {

    if (!messageInput) {
        return;
    }


    messageInput.addEventListener(
        "input",
        autoResize
    );


    messageInput.addEventListener(
        "keydown",
        handleInputKeydown
    );


    autoResize();

}


function handleInputKeydown(event) {

    // Enter = send
    // Shift + Enter = new line

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        if (!isLoading) {

            chatForm.requestSubmit();

        }

    }

}


// =========================================
// AUTO RESIZE TEXTAREA
// =========================================

function autoResize() {

    if (!messageInput) {
        return;
    }


    messageInput.style.height =
        "auto";


    const newHeight =
        Math.min(
            messageInput.scrollHeight,
            170
        );


    messageInput.style.height =
        `${newHeight}px`;

}


// =========================================
// SCROLL
// =========================================

function scrollToBottom() {

    requestAnimationFrame(() => {

        if (chatContainer) {

            chatContainer.scrollTo({

                top:
                    chatContainer.scrollHeight,

                behavior:
                    "smooth"

            });

        }

    });

}