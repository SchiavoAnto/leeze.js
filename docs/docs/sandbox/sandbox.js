let timeout = setTimeout(refreshPreview, 500);
/**
 * @type {Element}
 */
let autoPreviewCb;
/**
 * @type {Element}
 */
let codeArea;
/**
 * @type {Element}
 */
let toastsOverlay;
/**
 * @type {number}
 */
let toastsIndex = 0;

function refreshPreview() {
    clearTimeout(timeout);
    const pValue = codeArea.value;
    document.getElementById("sandbox-preview").srcdoc = "<script src='../../vendor/leeze.js'></script>" + pValue;
}

function codeChanged() {
    if (!autoPreviewCb.checked) return;
    clearTimeout(timeout);
    timeout = setTimeout(refreshPreview, 500);
}

function stringToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte),
    ).join("");
    return btoa(binString);
}

function base64ToString(base64) {
    base64 = base64.replace(" ", "+");
    const binString = atob(base64);
    const arr = Uint8Array.from(binString, (m) => m.codePointAt(0));
    return new TextDecoder().decode(arr);
}

function saveSandboxURL() {
    const code = codeArea.value;
    const url = new URL(document.location.href);
    url.searchParams.set("code", stringToBase64(code));
    const final = url.toString();
    
    navigator.clipboard.writeText(final).catch((_a, _b) => {
        showToastNotification("Clipboard error", "An error occurred while trying to copy the URL to the clipboard.");
    });
}

function loadSandboxURL(code) {
    try {
        codeArea.value = base64ToString(code);
    } catch (_) {
        showToastNotification("Code loading error", "An error occurred while trying to load this sandbox URL.");
    }
}

function showToastNotification(title, message) {
    const toast = document.createElement("div");
    toast.id = `toast-${toastsIndex}`;
    toast.classList.add("toast-notification");
    toast.innerHTML = `
    <div class="toast-notification-content">
        <p>${title}</p>
        <p>${message}</p>
    </div>
    <button onclick="closeToastNotification(${toastsIndex})">Close</button>
    `;
    toastsOverlay.appendChild(toast);
    //setTimeout(closeToastNotification, 5000, toastsIndex);
    toastsIndex++;
}

function closeToastNotification(index) {
    const toast = document.getElementById(`toast-${index}`);
    toast.remove();
}

window.onload = () => {
    autoPreviewCb = document.getElementById("auto-preview-cb");
    codeArea = document.getElementById("code-area");
    toastsOverlay = document.getElementById("toasts-overlay");

    const params = new URL(document.location.href).searchParams;
    if (params.has("code")) {
        loadSandboxURL(params.get("code"));
    }

    autoPreviewCb.addEventListener("change", () => {
        if (autoPreviewCb.checked) {
            refreshPreview();
        }
    });
    codeArea.addEventListener("keydown", (event) => {
        let start = codeArea.selectionStart;
        let end = codeArea.selectionEnd;
        switch (event.code) {
            case "Tab":
                event.preventDefault();
                codeArea.value = codeArea.value.substring(0, start) + "    " + codeArea.value.substring(end);
                codeArea.selectionStart = codeArea.selectionEnd = end + 4;
                break;
            case "Enter":
                event.preventDefault();
                const lastLineStartIndex = codeArea.value.lastIndexOf("\n");
                const lastLine = codeArea.value.substring(lastLineStartIndex);
                let lastLineStartingSpaces = 0;
                for (char of lastLine) {
                    if (char !== " ") break;
                    lastLineStartingSpaces++;
                }
                codeArea.value = codeArea.value.substring(0, start) + "\n" + " ".repeat(lastLineStartingSpaces) + codeArea.value.substring(end);
                codeArea.selectionStart = codeArea.selectionEnd = start + lastLineStartingSpaces + 1;
                break;
        }
    });
};