window.D360 = window.D360 || {};

const defaultAccessibilitySettings = {
    size: 100,
    contrast: false,
    reading: false
};

document.addEventListener("DOMContentLoaded", () => {
    applyAccessibilitySettings();
    mountAccessibilityPanel();
});

function getAccessibilitySettings() {
    try {
        const savedSettings = JSON.parse(
            localStorage.getItem("d360_a11y")
        );

        return {
            ...defaultAccessibilitySettings,
            ...savedSettings
        };
    } catch (error) {
        return { ...defaultAccessibilitySettings };
    }
}

function saveAccessibilitySettings(settings) {
    localStorage.setItem(
        "d360_a11y",
        JSON.stringify(settings)
    );

    applyAccessibilitySettings();
}

function applyAccessibilitySettings() {
    const settings = getAccessibilitySettings();

    document.documentElement.style.fontSize =
        (settings.size / 100 * 18) + "px";

    document.documentElement.classList.toggle(
        "high-contrast",
        settings.contrast
    );

    document.documentElement.classList.toggle(
        "reading-mode",
        settings.reading
    );
}

function mountAccessibilityPanel() {
    const slot = document.getElementById("a11y-panel-slot");

    if (!slot) return;

    const settings = getAccessibilitySettings();

    slot.innerHTML = `
        <div id="a11y-panel" class="a11y-panel" role="dialog" aria-label="Mod Kebolehcapaian">
            <h3>♿ Mod Kebolehcapaian</h3>

            <div>
                <label><strong>Saiz Teks Dinamik</strong></label>

                <div class="size-buttons" id="a11y-size">
                    ${[100, 125, 150, 175, 200].map(size => `
                        <button 
                            type="button"
                            data-size="${size}" 
                            class="${settings.size === size ? "active" : ""}">
                            ${size}%
                        </button>
                    `).join("")}
                </div>
            </div>

            <div class="a11y-row">
                <span><strong>Kontras Warna Tinggi</strong></span>

                <button 
                    type="button"
                    class="switch ${settings.contrast ? "on" : ""}" 
                    id="a11y-contrast"
                    role="switch"
                    aria-checked="${settings.contrast}">
                </button>
            </div>

            <div class="a11y-row">
                <span><strong>Mod Bacaan Mudah</strong></span>

                <button 
                    type="button"
                    class="switch ${settings.reading ? "on" : ""}" 
                    id="a11y-reading"
                    role="switch"
                    aria-checked="${settings.reading}">
                </button>
            </div>

            <button 
                type="button"
                class="btn btn-secondary btn-sm btn-block" 
                id="a11y-reset">
                Set Semula
            </button>
        </div>
    `;

    const toggleButton = document.getElementById("a11y-toggle");
    const panel = document.getElementById("a11y-panel");

    if (toggleButton) {
        toggleButton.addEventListener("click", (event) => {
            event.stopPropagation();
            panel.classList.toggle("open");
        });
    }

    document.addEventListener("click", (event) => {
        if (
            panel.classList.contains("open") &&
            !panel.contains(event.target) &&
            event.target.id !== "a11y-toggle"
        ) {
            panel.classList.remove("open");
        }
    });

    setupTextSizeButtons();
    setupContrastButton();
    setupReadingButton();
    setupResetButton();
}

function setupTextSizeButtons() {
    const sizeButtons = document.querySelectorAll("#a11y-size button");

    sizeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const settings = getAccessibilitySettings();

            settings.size = Number(button.dataset.size);

            saveAccessibilitySettings(settings);
            updateActiveSizeButton(settings.size);
        });
    });
}

function updateActiveSizeButton(selectedSize) {
    const sizeButtons = document.querySelectorAll("#a11y-size button");

    sizeButtons.forEach((button) => {
        button.classList.toggle(
            "active",
            Number(button.dataset.size) === selectedSize
        );
    });
}

function setupContrastButton() {
    const contrastButton = document.getElementById("a11y-contrast");

    if (!contrastButton) return;

    contrastButton.addEventListener("click", () => {
        const settings = getAccessibilitySettings();

        settings.contrast = !settings.contrast;

        saveAccessibilitySettings(settings);

        contrastButton.classList.toggle("on", settings.contrast);
        contrastButton.setAttribute("aria-checked", settings.contrast);
    });
}

function setupReadingButton() {
    const readingButton = document.getElementById("a11y-reading");

    if (!readingButton) return;

    readingButton.addEventListener("click", () => {
        const settings = getAccessibilitySettings();

        settings.reading = !settings.reading;

        saveAccessibilitySettings(settings);

        readingButton.classList.toggle("on", settings.reading);
        readingButton.setAttribute("aria-checked", settings.reading);
    });
}

function setupResetButton() {
    const resetButton = document.getElementById("a11y-reset");

    if (!resetButton) return;

    resetButton.addEventListener("click", () => {
        const defaultSettings = {
            size: 100,
            contrast: false,
            reading: false
        };

        saveAccessibilitySettings(defaultSettings);

        updateActiveSizeButton(100);

        const contrastButton = document.getElementById("a11y-contrast");
        const readingButton = document.getElementById("a11y-reading");

        if (contrastButton) {
            contrastButton.classList.remove("on");
            contrastButton.setAttribute("aria-checked", "false");
        }

        if (readingButton) {
            readingButton.classList.remove("on");
            readingButton.setAttribute("aria-checked", "false");
        }
    });
}