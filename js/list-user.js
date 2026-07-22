import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const userList = document.getElementById("userList");
const editModal = document.getElementById("editModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const editUserForm = document.getElementById("editUserForm");
const searchInput = document.getElementById("searchInput");

const editUserId = document.getElementById("editUserId");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editPhone = document.getElementById("editPhone");
const editStatus = document.getElementById("editStatus");
const editProfileImg = document.getElementById("editProfileImg");

let allUsersData = [];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadUsers();
});

async function loadUsers() {
    if (!userList) return;
    userList.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--muted);">Sedang memuatkan pengguna...</td></tr>`;

    try {
        const snapshot = await getDocs(collection(db, "users"));
        allUsersData = [];

        snapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            const role = (userData.role || "").toLowerCase();

            // Sembunyikan akaun admin dari senarai pengguna biasa
            if (role === "admin") {
                return;
            }

            allUsersData.push({
                id: docSnap.id,
                ...userData
            });
        });

        renderTable(allUsersData);

    } catch (error) {
        console.error("Ralat memuatkan pengguna:", error);
        userList.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Gagal memuatkan senarai pengguna.</td></tr>`;
    }
}

function renderTable(users) {
    if (!userList) return;
    userList.innerHTML = "";

    if (users.length === 0) {
        userList.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--muted);">Tiada pengguna dijumpai.</td></tr>`;
        return;
    }

    users.forEach((userData) => {
        const userId = userData.id;
        const statusText = userData.status || "Aktif";
        const isAktif = statusText.toLowerCase() === "aktif";
        const statusBg = isAktif ? "rgba(46, 125, 50, 0.15)" : "rgba(211, 47, 47, 0.15)";
        const statusColor = isAktif ? "#2e7d32" : "#d32f2f";

        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid var(--border)";

        row.innerHTML = `
            <td style="padding: 12px;">
                <span class="clickable-name" data-id="${userId}">${userData.name || "Tanpa Nama"}</span>
            </td>
            <td style="padding: 12px;">${userData.email || "-"}</td>
            <td style="padding: 12px;">${userData.phone || "-"}</td>
            <td style="padding: 12px;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; background: ${statusBg}; color: ${statusColor}; font-weight: bold;">
                    ${statusText}
                </span>
            </td>
            <td style="padding: 12px; text-align: center;">
                <button class="btn-delete" data-id="${userId}">Padam</button>
            </td>
        `;

        userList.appendChild(row);
    });

    // Tambah Event Listener untuk klik nama (Buka Modal Edit)
    document.querySelectorAll(".clickable-name").forEach((nameEl) => {
        nameEl.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            await openEditModal(id);
        });
    });

    // Tambah Event Listener untuk butang padam
    document.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            await deleteUser(id);
        });
    });
}

// Fungsi Carian Masa Nyata (Real-time Search)
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        const filteredUsers = allUsersData.filter((user) => {
            const name = (user.name || "").toLowerCase();
            const email = (user.email || "").toLowerCase();
            return name.includes(keyword) || email.includes(keyword);
        });
        renderTable(filteredUsers);
    });
}

async function openEditModal(userId) {
    const targetUser = allUsersData.find((u) => u.id === userId);

    if (targetUser) {
        editUserId.value = userId;
        editName.value = targetUser.name || "";
        editEmail.value = targetUser.email || "";
        editPhone.value = targetUser.phone || "";
        editStatus.value = targetUser.status || "Aktif";

        const profilePic = targetUser.profileImage || targetUser.photoURL || targetUser.imageUrl;
        if (editProfileImg) {
            editProfileImg.src = profilePic ? profilePic : "https://via.placeholder.com/100?text=Tiada+Gambar";
        }

        editModal.style.display = "flex";
    }
}

// Tutup modal
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        editModal.style.display = "none";
    });
}

// Simpan perubahan ke Firebase Firestore
if (editUserForm) {
    editUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userId = editUserId.value;

        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                name: editName.value,
                phone: editPhone.value,
                status: editStatus.value
            });

            alert("Maklumat pengguna berjaya dikemas kini!");
            editModal.style.display = "none";
            loadUsers();
        } catch (error) {
            console.error("Ralat mengemas kini pengguna:", error);
            alert("Gagal mengemas kini pengguna. Sila cuba lagi.");
        }
    });
}

// Fungsi Padam Pengguna
async function deleteUser(userId) {
    if (confirm("Adakah anda pasti mahu memadam pengguna ini?")) {
        try {
            await deleteDoc(doc(db, "users", userId));
            alert("Pengguna berjaya dipadam!");
            loadUsers();
        } catch (error) {
            console.error("Ralat memadam pengguna:", error);
            alert("Gagal memadam pengguna.");
        }
    }
}