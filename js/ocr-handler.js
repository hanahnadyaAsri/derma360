window.D360 = window.D360 || {};

D360._tesseractPromise = null;

D360.loadTesseract = function () {
    if (window.Tesseract) {
        return Promise.resolve(window.Tesseract);
    }

    if (D360._tesseractPromise) {
        return D360._tesseractPromise;
    }

    D360._tesseractPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js";

        script.onload = () => resolve(window.Tesseract);

        script.onerror = () => reject(new Error("Gagal memuat pustaka OCR."));

        document.head.appendChild(script);
    });

    return D360._tesseractPromise;
};

D360.parseOcrText = function (rawText, docType) {
    const text = (rawText || "").replace(/\r/g, "");
    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    const upper = text.toUpperCase();

    let ic = "";
    const icMatch = text.match(/\b(\d{6})[-\s]?(\d{2})[-\s]?(\d{4})\b/);

    if (icMatch) {
        ic = `${icMatch[1]}${icMatch[2]}${icMatch[3]}`;
    }

    let dob = "";

    if (icMatch) {
        const yy = parseInt(icMatch[1].slice(0, 2), 10);
        const mm = icMatch[1].slice(2, 4);
        const dd = icMatch[1].slice(4, 6);

        const nowYY = new Date().getFullYear() % 100;
        const century = yy > nowYY ? "19" : "20";

        if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) {
            dob = `${century}${icMatch[1].slice(0, 2)}-${mm}-${dd}`;
        }
    }

    let gender = "";

    if (icMatch) {
        gender =
            parseInt(icMatch[3].slice(-1), 10) % 2 === 1
                ? "Lelaki"
                : "Perempuan";
    }

    const skipRe =
        /(MYKAD|KAD PENGENALAN|MALAYSIA|WARGANEGARA|LELAKI|PEREMPUAN|ISLAM|ALAMAT|NAMA|IDENTITY|CARD|OKU|ORANG KURANG UPAYA|JABATAN|KEBAJIKAN)/i;

    let name = "";

    for (const line of lines) {
        const clean = line
            .replace(/[^A-Za-z@' \-]/g, "")
            .trim();

        if (clean.length < 6) continue;
        if (skipRe.test(clean)) continue;

        if (
            clean === clean.toUpperCase() &&
            /^[A-Z][A-Z '\-]+$/.test(clean)
        ) {
            if (clean.length > name.length) {
                name = clean;
            }
        }
    }

    let address = "";

    const postcodeIndex = lines.findIndex(line =>
        /\b\d{5}\b/.test(line)
    );

    if (postcodeIndex !== -1) {
        const start = Math.max(0, postcodeIndex - 2);

        address = lines
            .slice(start, postcodeIndex + 2)
            .join(", ");
    }

    let okuCategory = "";

    const okuKeys = [
        "PENDENGARAN",
        "PENGLIHATAN",
        "FIZIKAL",
        "PERTUTURAN",
        "MENTAL",
        "PEMBELAJARAN",
        "PELBAGAI"
    ];

    for (const key of okuKeys) {
        if (upper.includes(key)) {
            okuCategory =
                key.charAt(0) + key.slice(1).toLowerCase();
            break;
        }
    }

    let okuNumber = "";

    const okuMatch = text.match(/OKU[-\s]?[A-Z0-9]{4,20}/i);

    if (okuMatch) {
        okuNumber = okuMatch[0].toUpperCase().replace(/\s+/g, "");
    }

    const output = {
        docType: docType || "mykad"
    };

    if (name) output.name = name;
    if (ic) output.ic_number = ic;
    if (gender) output.gender = gender;
    if (dob) output.dob = dob;
    if (address) output.address = address;
    if (okuNumber) output.pwd_card_number = okuNumber;
    if (docType === "oku-card" && okuCategory) {
        output.disability_category = okuCategory;
    }

    output.rawText = text.slice(0, 500);

    return output;
};

D360.runOcr = async function (file, docType, onProgress) {
    const Tesseract = await D360.loadTesseract();

    let result;

    try {
        result = await Tesseract.recognize(file, "eng+msa", {
            logger: message => {
                if (
                    onProgress &&
                    message.status === "recognizing text"
                ) {
                    onProgress(
                        Math.round((message.progress || 0) * 100)
                    );
                }
            }
        });
    } catch {
        result = await Tesseract.recognize(file, "eng", {
            logger: message => {
                if (
                    onProgress &&
                    message.status === "recognizing text"
                ) {
                    onProgress(
                        Math.round((message.progress || 0) * 100)
                    );
                }
            }
        });
    }

    const parsed = D360.parseOcrText(result.data.text, docType);

    if (!parsed.ic_number && !parsed.name) {
        const error = new Error("OCR_LOW_QUALITY");
        error.rawText = result.data.text;
        throw error;
    }

    return parsed;
};

D360.attachOcrUploader = function (options) {
    const root = document.getElementById(options.containerId);

    if (!root) return;

    const docType = options.docType || "mykad";

    const label =
        docType === "oku-card"
            ? "Kad OKU"
            : docType === "ngo-doc"
                ? "Dokumen NGO"
                : "MyKad";

    root.innerHTML = `
        <div class="ocr-card">
            <label for="${options.containerId}-file">
                Muat naik foto ${label} yang jelas
            </label>

            <input
                type="file"
                accept="image/*"
                id="${options.containerId}-file"
            >

            <div id="${options.containerId}-preview"></div>

            <p id="${options.containerId}-status" class="ocr-status"></p>

            <div id="${options.containerId}-result" class="ocr-result"></div>
        </div>
    `;

    const fileInput = document.getElementById(`${options.containerId}-file`);
    const preview = document.getElementById(`${options.containerId}-preview`);
    const status = document.getElementById(`${options.containerId}-status`);
    const resultBox = document.getElementById(`${options.containerId}-result`);

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files && fileInput.files[0];

        if (!file) return;

        preview.innerHTML = `
            <img
                src="${URL.createObjectURL(file)}"
                alt="Pratonton dokumen"
                class="ocr-preview-img"
            >
        `;

        status.textContent = "Memuat enjin OCR...";
        status.style.color = "blue";

        resultBox.innerHTML = "";

        try {
            const data = await D360.runOcr(
                file,
                docType,
                progress => {
                    status.textContent =
                        `Mengimbas dokumen... ${progress}%`;
                }
            );

            status.textContent =
                "Maklumat berjaya diekstrak. Sila semak sebelum meneruskan.";
            status.style.color = "green";

            const display = { ...data };
            delete display.rawText;

            resultBox.innerHTML = `
                <div class="ocr-result-card">
                    ${Object.entries(display)
                    .map(([key, value]) => {
                        return `
                                <p>
                                    <strong>${formatOcrLabel(key)}:</strong>
                                    ${value}
                                </p>
                            `;
                    })
                    .join("")}
                </div>
            `;

            autoFillRegisterForm(data);

            if (typeof options.onExtract === "function") {
                options.onExtract(data);
            }

        } catch (error) {
            console.warn("OCR error:", error);

            status.textContent =
                "Tidak dapat mengekstrak maklumat. Sila guna imej yang lebih jelas.";
            status.style.color = "red";
        }
    });
};

function autoFillRegisterForm(data) {
    setValue("name", data.name);
    setValue("ic_number", data.ic_number);
    setValue("address", data.address);
    setValue("pwd_card_number", data.pwd_card_number);
    setValue("disability_category", data.disability_category);
}

function setValue(id, value) {
    const input = document.getElementById(id);

    if (input && value) {
        input.value = value;
    }
}

function formatOcrLabel(key) {
    const labels = {
        docType: "Jenis Dokumen",
        name: "Nama",
        ic_number: "Nombor IC",
        gender: "Jantina",
        dob: "Tarikh Lahir",
        address: "Alamat",
        pwd_card_number: "Nombor Kad OKU",
        disability_category: "Kategori Ketidakupayaan"
    };

    return labels[key] || key;
}