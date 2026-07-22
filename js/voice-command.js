const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

const pages = [

    // 1. Letakkan halaman spesifik / bertindih di atas
    {
        url: "create-campaign.html",
        keywords: [
            "cipta kempen",
            "buat kempen",
            "mohon bantuan",
            "permohonan bantuan",
            "permohonan kempen",
            "create campaign"
        ]
    },

    {
        url: "edit-campaign.html",
        keywords: [
            "edit kempen",
            "ubah kempen",
            "kemaskini kempen",
            "update kempen"
        ]
    },

    {
        url: "my-campaign.html",
        keywords: [
            "kempen saya",
            "kempen milik saya",
            "my campaign"
        ]
    },
    

    {
        url: "campaign-admin.html",
        keywords: [
            "kempen pentadbir",
            "campaign admin",
            "list admin"
        ]
    },

    {
        url: "campaign.html",
        keywords: [
            "kempen",
            "senarai kempen",
            "lihat kempen",
            "buka kempen",
            "halaman kempen",
            "campaign"
        ]
    },

    // 2. Senarai halaman lain kekal di bawah atau disusun mengikut keperluan
    {
        url: "index.html",
        keywords: [
            "laman utama",
            "utama",
            "home",
            "halaman utama",
            "pergi laman utama",
            "buka laman utama"
        ]
    },

    {
        url: "choose-mode.html",
        keywords: [
            "pilih mod",
            "pilihan mod",
            "choose mode",
            "mode",
            "pilih peranan"
        ]
    },

    {
        url: "login.html",
        keywords: [
            "log masuk",
            "login",
            "masuk",
            "masuk akaun",
            "halaman log masuk"
        ]
    },

    {
        url: "register.html",
        keywords: [
            "daftar",
            "register",
            "cipta akaun",
            "pendaftaran",
            "halaman daftar"
        ]
    },

    {
        url: "forgot-password.html",
        keywords: [
            "lupa kata laluan",
            "reset kata laluan",
            "lupa password",
            "forgot password"
        ]
    },

    {
        url: "profile.html",
        keywords: [
            "profil",
            "profil saya",
            "akaun saya",
            "profile"
        ]
    },

    {
        url: "donation.html",
        keywords: [
            "sumbangan",
            "buat sumbangan",
            "derma",
            "donation",
            "halaman sumbangan"
        ]
    },

    {
        url: "history.html",
        keywords: [
            "sejarah",
            "rekod",
            "history"
        ]
    },

    {
        url: "list-approval.html",
        keywords: [
            "kelulusan",
            "pengesahan",
            "senarai kelulusan",
            "approval"
        ]
    },

    {
        url: "list-report.html",
        keywords: [
            "laporan",
            "senarai laporan",
            "report"
        ]
    },

    {
        url: "list-user.html",
        keywords: [
            "pengguna",
            "senarai pengguna",
            "user"
        ]
    },

    {
        url: "admin-dashboard.html",
        keywords: [
            "dashboard pentadbir",
            "dashboard admin",
            "admin",
            "pentadbir",
            "papan pemuka pentadbir"
        ]
    },

    {
        url: "applicant-dashboard.html",
        keywords: [
            "dashboard pemohon",
            "pemohon",
            "papan pemuka pemohon",
            "dashboard bantuan"
        ]
    },

    {
        url: "donor-dashboard.html",
        keywords: [
            "dashboard penderma",
            "dashboard penyumbang",
            "penderma",
            "penyumbang",
            "papan pemuka penderma"
        ]
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
    if (has(command, ["log keluar","logout","keluar akaun","sign out"])) {

        showVoiceStatus("Sedang log keluar...");

        setTimeout(() => {

            const logoutBtn = document.getElementById("logoutBtn");

            if (logoutBtn) {
                logoutBtn.click();
            } else {
                showVoiceStatus("Butang log keluar tidak ditemui.");
            }

        }, 600);

        return;
    }

    const matchedPage = pages.find(page =>
        page.keywords.some(keyword => command.includes(keyword))
    );

    if (matchedPage) {

        const pageName = matchedPage.keywords[0];

        goTo(
            matchedPage.url,
            "Membuka " + pageName + "..."
        );

    } else {

        showVoiceStatus(
            "Arahan tidak dikenali. Cuba sebut: Laman Utama, Kempen, Profil, Daftar, Dashboard atau Sejarah."
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