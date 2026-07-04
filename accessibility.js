const toolbar = document.createElement("div");

toolbar.innerHTML = `
    <div class="accessibility-toolbar">
        <button id="increaseFont">A+</button>
        <button id="decreaseFont">A-</button>
        <button id="contrastToggle">Kontras</button>
        <button id="resetAccess">Reset</button>
    </div>
`;

document.body.prepend(toolbar);

let fontSize = Number(localStorage.getItem("fontSize")) || 18;
let highContrast = localStorage.getItem("highContrast") === "true";

applySettings();

document.getElementById("increaseFont").addEventListener("click", () => {
    if (fontSize < 24) {
        fontSize += 2;
        saveSettings();
    }
});

document.getElementById("decreaseFont").addEventListener("click", () => {
    if (fontSize > 16) {
        fontSize -= 2;
        saveSettings();
    }
});

document.getElementById("contrastToggle").addEventListener("click", () => {
    highContrast = !highContrast;
    saveSettings();
});

document.getElementById("resetAccess").addEventListener("click", () => {
    fontSize = 18;
    highContrast = false;
    saveSettings();
});

function saveSettings() {
    localStorage.setItem("fontSize", fontSize);
    localStorage.setItem("highContrast", highContrast);
    applySettings();
}

function applySettings() {
    document.body.style.fontSize = fontSize + "px";

    if (highContrast) {
        document.body.classList.add("high-contrast");
    } else {
        document.body.classList.remove("high-contrast");
    }
}