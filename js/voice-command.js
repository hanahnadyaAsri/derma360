const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

const pages = [
    {
        url: "index.html",
        keywords: ["laman utama", "home", "utama", "index"]
    },
    {
        url: "campaign.html",
        keywords: ["kempen", "campaign", "senarai kempen", "lihat kempen"]
    },
    {
        url: "choose-mode.html",
        keywords: ["pilih mod", "choose mode", "mode", "pilihan"]
    },
    {
        url: "login.html",
        keywords: ["log masuk", "login", "masuk akaun"]
    },
    {
        url: "register.html",
        keywords: ["daftar", "register", "cipta akaun"]
    },
    {
        url: "forgot-password.html",
        keywords: ["lupa kata laluan", "forgot password", "reset password"]
    },
    {
        url: "profile.html",
        keywords: ["profil", "profile", "akaun saya"]
    },
    {
        url: "donation.html",
        keywords: ["sumbangan", "donation", "derma"]
    },
    {
        url: "receipt.html",
        keywords: ["resit", "receipt"]
    },
    {
        url: "history.html",
        keywords: ["sejarah", "history", "sejarah sumbangan"]
    },
    {
        url: "success.html",
        keywords: ["berjaya", "success"]
    },
    {
        url: "create-campaign.html",
        keywords: ["cipta kempen", "mohon bantuan", "buat kempen", "create campaign"]
    },
    {
        url: "edit-campaign.html",
        keywords: ["edit kempen", "ubah kempen", "kemaskini kempen"]
    },
    {
        url: "my-campaign.html",
        keywords: ["kempen saya", "my campaign", "kempen sendiri"]
    },
    {
        url: "list-campaign.html",
        keywords: ["senarai campaign", "senarai semua kempen", "list campaign"]
    },
    {
        url: "list-approval.html",
        keywords: ["senarai kelulusan", "approval", "list approval", "kelulusan"]
    },
    {
        url: "list-report.html",
        keywords: ["senarai laporan", "laporan", "report", "list report"]
    },
    {
        url: "list-user.html",
        keywords: ["senarai pengguna", "pengguna", "user", "list user"]
    },
    {
        url: "admin-dashboard.html",
        keywords: ["admin", "pentadbir", "dashboard admin"]
    },
    {
        url: "applicant-dashboard.html",
        keywords: ["dashboard pemohon", "pemohon", "applicant dashboard"]
    },
    {
        url: "donor-dashboard.html",
        keywords: ["dashboard penderma", "penderma", "donor dashboard"]
    },
    {
        url: "404.html",
        keywords: ["error", "halaman tidak dijumpai", "404"]
    }
];

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
    if (has(command, ["kembali", "back"])) {
        showVoiceStatus("Kembali ke halaman sebelumnya...");
        setTimeout(() => {
            history.back();
        }, 600);
        return;
    }

    if (has(command, ["muat semula", "refresh", "reload"])) {
        showVoiceStatus("Memuat semula halaman...");
        setTimeout(() => {
            location.reload();
        }, 600);
        return;
    }

    const matchedPage = pages.find(page => has(command, page.keywords));

    if (matchedPage) {
        goTo(matchedPage.url, "Membuka " + matchedPage.url + "...");
    } else {
        showVoiceStatus(
            "Arahan tidak dikenali. Cuba sebut: Laman Utama, Kempen, Profil, Daftar, Admin, atau Dashboard."
        );
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