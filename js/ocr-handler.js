const documentUpload = document.getElementById("documentUpload");
const ocrBtn = document.getElementById("ocrBtn");
const ocrStatus = document.getElementById("ocrStatus");

const nameInput = document.getElementById("name");
const icInput = document.getElementById("ic_number");
const addressInput = document.getElementById("address");
const pwdInput = document.getElementById("pwd_card_number");

ocrBtn.addEventListener("click", async () => {
    const file = documentUpload.files[0];

    if (!file) {
        showStatus("Please upload a document first.", "red");
        return;
    }

    showStatus("Scanning document... Please wait.", "blue");

    try {
        const result = await Tesseract.recognize(file, "eng+msa", {
            logger: (m) => {
                if (m.status === "recognizing text") {
                    const progress = Math.round(m.progress * 100);
                    showStatus(`OCR processing... ${progress}%`, "blue");
                }
            }
        });

        const text = result.data.text;
        console.log("OCR Result:", text);

        const extracted = extractDocumentData(text);

        if (extracted.ic_number) icInput.value = extracted.ic_number;
        if (extracted.name) nameInput.value = extracted.name;
        if (extracted.address) addressInput.value = extracted.address;
        if (extracted.pwd_card_number) pwdInput.value = extracted.pwd_card_number;

        showStatus("OCR completed. Please verify and correct the extracted information.", "green");

    } catch (error) {
        console.error(error);
        showStatus("OCR failed. Please try a clearer image.", "red");
    }
});

function showStatus(text, color) {
    ocrStatus.textContent = text;
    ocrStatus.style.color = color;
}

function extractDocumentData(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => cleanLine(line))
        .filter(line => line.length > 1);

    return {
        ic_number: extractIC(text),
        name: extractName(lines),
        address: extractAddress(lines),
        pwd_card_number: extractPWDCard(text)
    };
}

function cleanLine(line) {
    return line
        .replace(/[|_~`^]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function extractIC(text) {
    const normalized = text.replace(/[^\d]/g, "");
    const match = normalized.match(/\d{12}/);
    return match ? match[0] : "";
}

function extractName(lines) {
    const blacklist = [
        "MALAYSIA",
        "KAD PENGENALAN",
        "IDENTITY CARD",
        "MYKAD",
        "WARGANEGARA",
        "KAD OKU",
        "JABATAN KEBAJIKAN",
        "MASYARAKAT",
        "LELAKI",
        "PEREMPUAN",
        "ISLAM",
        "NO",
        "ALAMAT",
        "TARIKH",
        "LAHIR"
    ];

    const candidates = lines.filter(line => {
        const upper = line.toUpperCase();

        return (
            upper.length >= 6 &&
            upper.length <= 60 &&
            /^[A-Z\s'@.-]+$/.test(upper) &&
            !/\d/.test(upper) &&
            !blacklist.some(word => upper.includes(word))
        );
    });

    return candidates.length ? candidates[0].toUpperCase() : "";
}

function extractAddress(lines) {
    const addressKeywords = [
        "NO ",
        "JALAN",
        "LORONG",
        "TAMAN",
        "KAMPUNG",
        "KG ",
        "BANDAR",
        "PERSIARAN",
        "LOT",
        "BATU",
        "FELDA",
        "JLN"
    ];

    const stateKeywords = [
        "SELANGOR",
        "PERAK",
        "PAHANG",
        "JOHOR",
        "KEDAH",
        "KELANTAN",
        "MELAKA",
        "NEGERI SEMBILAN",
        "PULAU PINANG",
        "PERLIS",
        "SABAH",
        "SARAWAK",
        "TERENGGANU",
        "KUALA LUMPUR",
        "PUTRAJAYA",
        "LABUAN"
    ];

    const startIndex = lines.findIndex(line => {
        const upper = line.toUpperCase();
        return addressKeywords.some(keyword => upper.includes(keyword));
    });

    if (startIndex === -1) return "";

    const addressLines = [];

    for (let i = startIndex; i < Math.min(startIndex + 5, lines.length); i++) {
        const line = lines[i];

        if (line.length < 3) continue;

        addressLines.push(line);

        const upper = line.toUpperCase();
        if (stateKeywords.some(state => upper.includes(state))) {
            break;
        }
    }

    return addressLines.join(", ");
}

function extractPWDCard(text) {
    const patterns = [
        /OKU[-\s]?[A-Z0-9]{4,20}/i,
        /NO\.?\s*OKU[:\s-]*[A-Z0-9]{4,20}/i,
        /KAD\s*OKU[:\s-]*[A-Z0-9]{4,20}/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0]
                .replace(/NO\.?\s*OKU[:\s-]*/i, "")
                .replace(/KAD\s*OKU[:\s-]*/i, "")
                .toUpperCase()
                .trim();
        }
    }

    return "";
}