//LZ.setValue("mainContent", "Default content");

const mainContentInput = document.getElementById("main-content-input");

function updateMainContent() {
    LZ.setValue("mainContent", mainContentInput.value);
}