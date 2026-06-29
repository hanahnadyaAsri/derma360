import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");
const ocrBtn = document.getElementById("ocrBtn");
const ocrStatus = document.getElementById("ocrStatus");
const documentUpload = document.getElementById("documentUpload");

// Show / Hide Password
document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (input.type === "password") {
            input.type = "text";
            button.textContent = "🙈";
        } else {
            input.type = "password";
            button.textContent = "👁️";
        }
    });
});

// OCR Function
ocrBtn.addEventListener("click", async () => {
    const file = documentUpload.files[0];

    if (!file) {
        ocrStatus.textContent = "Please upload a document first.";
        ocrStatus.style.color = "red";
        return;
    }

    ocrStatus.textContent = "Scanning document... Please wait.";
    ocrStatus.style.color = "blue";

    try {
        const result = await Tesseract.recognize(file, "eng");
        const text = result.data.text;

        console.log(text);

        // Extract IC number - 12 digits
        const icMatch = text.match(/\b\d{12}\b/);
        if (icMatch) {
            document.getElementById("ic_number").value = icMatch[0];
        }

        // Basic name guess: first long uppercase line
        const lines = text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 3);

        const nameLine = lines.find(line =>
            /^[A-Z\s]+$/.test(line) &&
            line.length > 5 &&
            !line.includes("MALAYSIA") &&
            !line.includes("IDENTITY")
        );

        if (nameLine) {
            document.getElementById("name").value = nameLine;
        }

        document.getElementById("address").value = text;

        ocrStatus.textContent = "OCR completed. Please verify the extracted information.";
        ocrStatus.style.color = "green";

    } catch (error) {
        ocrStatus.textContent = "OCR failed. Please try another image.";
        ocrStatus.style.color = "red";
        console.error(error);
    }
});

// Register User
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const ic_number = document.getElementById("ic_number").value.trim();
    const address = document.getElementById("address").value.trim();
    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const phone = document.getElementById("phone").value.trim();
    const pwd_card_number = document.getElementById("pwd_card_number").value.trim();
    const disability_category = document.getElementById("disability_category").value.trim();

    message.textContent = "";

    if (password.length < 8) {
        message.textContent = "Password must be at least 8 characters.";
        message.style.color = "red";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.style.color = "red";
        return;
    }

    if (!/^\d{12}$/.test(ic_number)) {
        message.textContent = "IC Number must contain exactly 12 digits without dash.";
        message.style.color = "red";
        return;
    }

    if (!/^01\d{8,9}$/.test(phone)) {
        message.textContent = "Please enter a valid Malaysian phone number without dash.";
        message.style.color = "red";
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            role: "User",
            selectedRole: false,
            ic_number,
            address,
            phone,
            pwd_card_number,
            disability_category,

            accountStatus: "Active",
            isVerified: false,
            profileImage: "",

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        message.textContent = "Registration successful! Redirecting to login...";
        message.style.color = "green";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);

    } catch (error) {
        switch (error.code) {
            case "auth/email-already-in-use":
                message.textContent = "This email is already registered.";
                break;
            case "auth/weak-password":
                message.textContent = "Password is too weak.";
                break;
            case "auth/invalid-email":
                message.textContent = "Invalid email address.";
                break;
            default:
                message.textContent = error.message;
        }

        message.style.color = "red";
    }
});