window.D360 = window.D360 || {};

const documentUpload = document.getElementById("documentUpload");
const ocrBtn = document.getElementById("ocrBtn");
const ocrStatus = document.getElementById("ocrStatus");

function setStatus(message, color = "black") {
    if (!ocrStatus) return;
    ocrStatus.textContent = message;
    ocrStatus.style.color = color;
}

function setValue(id, value) {
    const input = document.getElementById(id);
    if (input && value) input.value = value;
}

function normalizeText(text) {
    return (text || "")
        .replace(/\r/g, "\n")
        .replace(/[|]/g, "I")
        .replace(/[‘’]/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeLine(line) {
    return line
        .replace(/[^A-Za-z0-9@'\/\-\s.,]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function titleCase(text) {
    return text
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}

function parseOcrText(rawText) {
    const originalText = rawText || "";

    const lines = originalText
        .split("\n")
        .map(line =>
            line
                .replace(/[^A-Za-z0-9@'\/\-\s.,]/g, "")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(Boolean);

    const fullText = lines.join(" ");
    const upper = fullText.toUpperCase();

    // 1. Detect IC number
    let ic_number = "";
    const icMatch = fullText.match(/\b(\d{6})[-\s]?(\d{2})[-\s]?(\d{4})\b/);

    if (icMatch) {
        ic_number = `${icMatch[1]}${icMatch[2]}${icMatch[3]}`;
    }

    // 2. Detect name
    let name = "";

    const skipNameWords =
        /MALAYSIA|MYKAD|KAD PENGENALAN|IDENTITY|CARD|WARGANEGARA|LELAKI|PEREMPUAN|ISLAM|ALAMAT|NO\.?|OKU|JABATAN|KEBAJIKAN|CHEMOR|PERAK/i;

    for (const line of lines) {
        const clean = line
            .replace(/[^A-Za-z@'\/\-\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (clean.length < 8) continue;
        if (skipNameWords.test(clean)) continue;

        const wordCount = clean.split(" ").length;

        if (
            wordCount >= 2 &&
            /^[A-Z@'\/\-\s]+$/.test(clean)
        ) {
            name = clean;
            break;
        }
    }

    // 3. Detect address
    let address = "";

    const addressKeywords =
        /\b(NO|N0|LOT|KG|KAMPUNG|TAMAN|JALAN|JLN|LORONG|PERSIARAN|BANDAR|BT|BATU|SEKSYEN|FELDA|APARTMENT|BLOK)\b/i;

    const stopAddressWords =
        /WARGANEGARA|LELAKI|PEREMPUAN|ISLAM|MYKAD|MALAYSIA|KAD PENGENALAN|IDENTITY|CARD|KATEGORI|KETIDAKUPAYAAN|PENDAFTARAN|NO\.?\s*PENDAFTARAN|FIZIKAL|MENTAL|PENDENGARAN|PENGLIHATAN|PERTUTURAN|PEMBELAJARAN|PELBAGAI/i;

    const stateWords =
        /JOHOR|KEDAH|KELANTAN|MELAKA|NEGERI SEMBILAN|PAHANG|PERAK|PERLIS|PULAU PINANG|SABAH|SARAWAK|SELANGOR|TERENGGANU|KUALA LUMPUR|PUTRAJAYA|LABUAN/i;

    let addressStart = lines.findIndex(line => addressKeywords.test(line));
    let postcodeIndex = lines.findIndex(line => /\b\d{5}\b/.test(line));

    if (addressStart !== -1) {
        const addressLines = [];

        for (let i = addressStart; i < lines.length; i++) {
            let line = lines[i];

            // Remove OKU/MyKad extra text if OCR combines them in same line
            line = line
                .replace(/WARGANEGARA.*/i, "")
                .replace(/LELAKI.*/i, "")
                .replace(/PEREMPUAN.*/i, "")
                .replace(/ISLAM.*/i, "")
                .replace(/KATEGORI.*/i, "")
                .replace(/KETIDAKUPAYAAN.*/i, "")
                .replace(/NO\.?\s*PENDAFTARAN.*/i, "")
                .replace(/PE\s*DAFTARAN.*/i, "")
                .replace(/FIZIKAL.*/i, "")
                .replace(/MENTAL.*/i, "")
                .replace(/PENDENGARAN.*/i, "")
                .replace(/PENGLIHATAN.*/i, "")
                .replace(/PERTUTURAN.*/i, "")
                .replace(/PEMBELAJARAN.*/i, "")
                .replace(/PELBAGAI.*/i, "")
                .trim();

            if (!line) break;
            if (stopAddressWords.test(line)) break;

            addressLines.push(line);

            // Stop when state is found
            if (stateWords.test(line)) break;

            // Safety limit
            if (addressLines.length >= 5) break;
        }

        address = addressLines
            .join(", ")
            .replace(/\bNARGANEGARA\b/gi, "")
            .replace(/\bNX\b/gi, "")
            .replace(/\bEL\s*\d+\b/gi, "")
            .replace(/\s+/g, " ")
            .replace(/\s+,/g, ",")
            .replace(/,\s*,/g, ",")
            .trim();

    } else if (postcodeIndex !== -1) {
        const addressLines = [];

        for (let i = Math.max(0, postcodeIndex - 3); i < lines.length; i++) {
            let line = lines[i];

            line = line
                .replace(/WARGANEGARA.*/i, "")
                .replace(/LELAKI.*/i, "")
                .replace(/PEREMPUAN.*/i, "")
                .replace(/ISLAM.*/i, "")
                .replace(/KATEGORI.*/i, "")
                .replace(/KETIDAKUPAYAAN.*/i, "")
                .replace(/NO\.?\s*PENDAFTARAN.*/i, "")
                .replace(/PE\s*DAFTARAN.*/i, "")
                .replace(/FIZIKAL.*/i, "")
                .replace(/MENTAL.*/i, "")
                .replace(/PENDENGARAN.*/i, "")
                .replace(/PENGLIHATAN.*/i, "")
                .replace(/PERTUTURAN.*/i, "")
                .replace(/PEMBELAJARAN.*/i, "")
                .replace(/PELBAGAI.*/i, "")
                .trim();

            if (!line) break;
            if (stopAddressWords.test(line)) break;

            addressLines.push(line);

            if (stateWords.test(line)) break;
            if (addressLines.length >= 5) break;
        }

        address = addressLines
            .join(", ")
            .replace(/\bNARGANEGARA\b/gi, "")
            .replace(/\bNX\b/gi, "")
            .replace(/\bEL\s*\d+\b/gi, "")
            .replace(/\s+/g, " ")
            .replace(/\s+,/g, ",")
            .replace(/,\s*,/g, ",")
            .trim();
    }
    /// 4. OKU Card Number / No. Pendaftaran
    let pwd_card_number = "";

    const categoryPrefix = {
        FIZIKAL: "PH",
        PENDENGARAN: "DE",
        PENGLIHATAN: "BL",
        PEMBELAJARAN: "LD",
        MENTAL: "ME",
        PERTUTURAN: "SD",
        PELBAGAI: "FM"
    };

    let detectedPrefix = "";

    for (const key in categoryPrefix) {
        if (upper.includes(key)) {
            detectedPrefix = categoryPrefix[key];
            break;
        }
    }

    // Strong search: PH020912001138
    const compactText = fullText
        .toUpperCase()
        .replace(/O/g, "0")
        .replace(/I/g, "1")
        .replace(/L/g, "1")
        .replace(/\s+/g, "")
        .replace(/[^A-Z0-9]/g, "");

    let okuMatch = compactText.match(/(PH|DE|BL|LD|ME|SD|FM)[0-9]{10,16}/);

    if (okuMatch) {
        pwd_card_number = okuMatch[0];
    }

    // Fallback: find long number near "Pendaftaran"
    if (!pwd_card_number) {
        const daftarIndex = lines.findIndex(line =>
            /PENDAFTARAN|PENDAFTARAN/i.test(line)
        );

        if (daftarIndex !== -1) {
            const nearbyText = lines
                .slice(daftarIndex, daftarIndex + 4)
                .join(" ")
                .toUpperCase()
                .replace(/O/g, "0")
                .replace(/I/g, "1")
                .replace(/L/g, "1")
                .replace(/\s+/g, "")
                .replace(/[^A-Z0-9]/g, "");

            okuMatch = nearbyText.match(/(PH|DE|BL|LD|ME|SD|FM)[0-9]{10,16}/);

            if (okuMatch) {
                pwd_card_number = okuMatch[0];
            } else {
                const numberOnlyMatch = nearbyText.match(/[0-9]{10,16}/);

                if (numberOnlyMatch && detectedPrefix) {
                    pwd_card_number = detectedPrefix + numberOnlyMatch[0];
                }
            }
        }
    }

    // Final fallback: if OCR detects 020912001138 without PH
    if (!pwd_card_number && detectedPrefix) {
        const numberOnlyMatch = compactText.match(/[0-9]{10,16}/);

        if (numberOnlyMatch) {
            pwd_card_number = detectedPrefix + numberOnlyMatch[0];
        }
    }

    // 5. Detect disability category
    let disability_category = "";

    const categoryMatch = upper.match(
        /\b(FIZIKAL|PENDENGARAN|PENGLIHATAN|PERTUTURAN|MENTAL|PEMBELAJARAN|PELBAGAI)\b/
    );

    if (categoryMatch) {
        disability_category =
            categoryMatch[1].charAt(0) +
            categoryMatch[1].slice(1).toLowerCase();
    }

    return {
        name,
        ic_number,
        address,
        pwd_card_number,
        disability_category,
        rawText: fullText
    };

}

function autoFillRegisterForm(data) {
    setValue("name", data.name);
    setValue("ic_number", data.ic_number);
    setValue("address", data.address);
    setValue("pwd_card_number", data.pwd_card_number);
    setValue("disability_category", data.disability_category);
}

async function runOCR(file) {
    if (!window.Tesseract) {
        throw new Error("Tesseract.js is not loaded.");
    }

    const result = await Tesseract.recognize(file, "eng", {
        logger: progress => {
            if (progress.status === "recognizing text") {
                const percent = Math.round(progress.progress * 100);
                setStatus(`Extracting text... ${percent}%`, "blue");
            }
        }
    });

    return parseOcrText(result.data.text);
}

if (ocrBtn && documentUpload) {
    ocrBtn.addEventListener("click", async () => {
        const file = documentUpload.files[0];

        if (!file) {
            setStatus("Please upload MyKad, Kad OKU, or NGO document first.", "red");
            return;
        }

        if (!file.type.startsWith("image/")) {
            setStatus("Please upload a valid image file.", "red");
            return;
        }

        ocrBtn.disabled = true;
        ocrBtn.textContent = "Extracting...";

        setStatus("Preparing OCR...", "blue");

        try {
            const data = await runOCR(file);

            console.log("OCR raw result:", data.rawText);
            console.log("Parsed OCR data:", data);

            if (!data.ic_number && !data.name && !data.address && !data.pwd_card_number) {
                setStatus("OCR could not read the document clearly. Please upload a clearer image.", "red");
                return;
            }

            autoFillRegisterForm(data);

            setStatus("Information extracted successfully. Please review before registering.", "green");

        } catch (error) {
            console.error("OCR Error:", error);
            setStatus("OCR failed. Please try again with a clearer image.", "red");
        } finally {
            ocrBtn.disabled = false;
            ocrBtn.textContent = "Extract with OCR";
        }
    });
}