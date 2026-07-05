const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

if (!SpeechRecognition) {
    if (voiceBtn) voiceBtn.style.display = "none";
    console.warn("Speech Recognition is not supported in this browser.");
} else {
    const recognition = new SpeechRecognition();

    recognition.lang = "ms-MY";
    recognition.continuous = false;
    recognition.interimResults = false;

    if (voiceBtn) {
        voiceBtn.addEventListener("click", () => {
            voiceBtn.classList.add("listening");
            showVoiceStatus("🎤 Sedang mendengar...");
            recognition.start();
        });
    }

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();

        showVoiceStatus("Anda sebut: " + command);

        setTimeout(() => {
            runVoiceCommand(command);
        }, 700);
    };

    recognition.onerror = () => {
        if (voiceBtn) voiceBtn.classList.remove("listening");
        showVoiceStatus("Tidak dapat mengenal suara. Cuba sekali lagi.");
        hideVoiceStatusLater();
    };

    recognition.onend = () => {
        if (voiceBtn) voiceBtn.classList.remove("listening");
    };
}

function runVoiceCommand(command) {
    if (has(command, ["laman utama", "home", "utama"])) {
        goTo("index.html", "Membuka laman utama...");
    }

    else if (has(command, ["kempen", "campaign", "senarai kempen", "lihat kempen"])) {
        goTo("campaign.html", "Membuka senarai kempen...");
    }

    else if (has(command, ["log masuk", "login", "masuk akaun"])) {
        goTo("login.html", "Membuka halaman log masuk...");
    }

    else if (has(command, ["daftar", "register", "cipta akaun"])) {
        goTo("register.html", "Membuka halaman daftar...");
    }

    else if (has(command, ["dashboard", "papan pemuka"])) {
        goTo("choose-mode.html", "Membuka papan pemuka...");
    }

    else if (has(command, ["profil", "profile", "akaun saya"])) {
        goTo("profile.html", "Membuka profil...");
    }

    else if (has(command, ["sejarah", "history", "sejarah sumbangan"])) {
        goTo("history.html", "Membuka sejarah sumbangan...");
    }

    else if (has(command, ["cipta kempen", "mohon bantuan", "buat kempen", "create campaign"])) {
        goTo("create-campaign.html", "Membuka borang kempen...");
    }

    else if (has(command, ["kempen saya", "my campaign", "my campaigns"])) {
        goTo("my-campaigns.html", "Membuka kempen saya...");
    }

    else if (has(command, ["admin", "pentadbir"])) {
        goTo("admin-dashboard.html", "Membuka dashboard pentadbir...");
    }

    else if (has(command, ["kembali", "back"])) {
        showVoiceStatus("Kembali ke halaman sebelumnya...");
        history.back();
    }

    else if (has(command, ["muat semula", "refresh", "reload"])) {
        showVoiceStatus("Memuat semula halaman...");
        location.reload();
    }

    else {
        showVoiceStatus("Arahan tidak dikenali. Cuba sebut: Kempen, Profil, Daftar, atau Laman Utama.");
        hideVoiceStatusLater();
    }
}

function has(command, keywords) {
    return keywords.some(keyword => command.includes(keyword));
}

function goTo(url, message) {
    showVoiceStatus(message);

    setTimeout(() => {
        window.location.href = url;
    }, 600);
}

function showVoiceStatus(message) {
    if (!voiceStatus) return;

    voiceStatus.textContent = message;
    voiceStatus.style.display = "block";
}

function hideVoiceStatusLater() {
    setTimeout(() => {
        if (voiceStatus) {
            voiceStatus.style.display = "none";
        }
    }, 2500);
}