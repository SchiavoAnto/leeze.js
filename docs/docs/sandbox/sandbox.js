let timeout = setTimeout(refreshPreview, 500);
let autoPreviewCb;

function refreshPreview() {
    clearTimeout(timeout);
    const pValue = document.getElementById("code-area").value;
    document.getElementById("sandbox-preview").srcdoc = "<script src='../../vendor/leeze.js'></script>" + pValue;
}

function codeChanged() {
    if (!autoPreviewCb.checked) return;
    clearTimeout(timeout);
    timeout = setTimeout(refreshPreview, 500);
}

window.onload = () => {
    autoPreviewCb = document.getElementById("auto-preview-cb");
    autoPreviewCb.addEventListener("change", () => {
        if (autoPreviewCb.checked) {
            refreshPreview();
        }
    });
};