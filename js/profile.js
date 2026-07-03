import { auth, db, storage } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const profileForm = document.getElementById("profileForm");
const message = document.getElementById("message");

const profileImage = document.getElementById("profileImage");
const profilePreview = document.getElementById("profilePreview");

let currentUser = null;
let existingProfileImage = "";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    await loadProfile(user.uid);
});

async function loadProfile(uid) {
    const userSnap = await getDoc(doc(db, "users", uid));

    if (!userSnap.exists()) {
        message.textContent = "Profile not found.";
        message.style.color = "red";
        return;
    }

    const data = userSnap.data();

    document.getElementById("name").value = data.name || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("phone").value = data.phone || "";
    document.getElementById("ic_number").value = data.ic_number || "";
    document.getElementById("address").value = data.address || "";
    document.getElementById("pwd_card_number").value = data.pwd_card_number || "";
    document.getElementById("disability_category").value = data.disability_category || "";

    existingProfileImage = data.profileImage || "";

    if (existingProfileImage) {
        profilePreview.src = existingProfileImage;
    }
}

profileImage.addEventListener("change", () => {
    const file = profileImage.files[0];

    if (file) {
        profilePreview.src = URL.createObjectURL(file);
    }
});

async function uploadProfileImage(file) {
    const filePath = `profile-images/${currentUser.uid}_${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);

    await uploadBytes(fileRef, file);

    return await getDownloadURL(fileRef);
}

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
        message.textContent = "Please login again.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Updating profile...";
    message.style.color = "blue";

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const ic_number = document.getElementById("ic_number").value.trim();
    const address = document.getElementById("address").value.trim();
    const pwd_card_number = document.getElementById("pwd_card_number").value.trim();
    const disability_category = document.getElementById("disability_category").value.trim();

    try {
        let profileImageUrl = existingProfileImage;

        const selectedFile = profileImage.files[0];

        if (selectedFile) {
            profileImageUrl = await uploadProfileImage(selectedFile);
        }

        await updateDoc(doc(db, "users", currentUser.uid), {
            name,
            phone,
            ic_number,
            address,
            pwd_card_number,
            disability_category,
            profileImage: profileImageUrl,
            updatedAt: serverTimestamp()
        });

        message.textContent = "Profile updated successfully.";
        message.style.color = "green";

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});