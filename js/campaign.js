import { auth, db, storage } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const campaignForm = document.getElementById("campaignForm");
const message = document.getElementById("message");

const campaignPoster = document.getElementById("campaignPoster");
const posterPreview = document.getElementById("posterPreview");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;
});

campaignPoster.addEventListener("change", () => {
    const file = campaignPoster.files[0];

    if (!file) return;

    if (file.type.startsWith("image/")) {
        posterPreview.src = URL.createObjectURL(file);
        posterPreview.style.display = "block";
    } else {
        posterPreview.src = "https://placehold.co/500x280?text=Video+Uploaded";
    }
});

async function uploadFile(file, folderName) {
    const filePath = `${folderName}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);

    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}

campaignForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
        message.textContent = "Please login first.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Submitting campaign... Please wait.";
    message.style.color = "blue";

    const campaignTitle = document.getElementById("campaignTitle").value.trim();
    const campaignCategory = document.getElementById("campaignCategory").value;
    const targetAmount = Number(document.getElementById("targetAmount").value);
    const endDate = document.getElementById("endDate").value;
    const beneficiaryName = document.getElementById("beneficiaryName").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();

    try {
        const mediaFile = campaignPoster.files[0];

        if (!mediaFile) {
            message.textContent = "Please upload campaign media.";
            message.style.color = "red";
            return;
        }

        const mediaUrl = await uploadFile(mediaFile, "campaign-media");

        const supportingDocs = document.getElementById("supportingDocs");
        const supportingDocumentUrls = [];

        for (const file of supportingDocs.files) {
            const url = await uploadFile(file, "campaign-supporting-documents");
            supportingDocumentUrls.push(url);
        }

        await addDoc(collection(db, "campaigns"), {
            applicantId: currentUser.uid,

            campaignTitle,
            campaignCategory,
            targetAmount,
            currentAmount: 0,

            beneficiaryName,
            location,
            description,

            startDate: null,
            endDate,

            campaignStatus: "Pending Verification",
            status_kempen: "Perlu Disahkan",

            mediaUrl,
            supportingDocumentUrls,
            proofOfDistributionUrl: "",
            verificationRemarks: "",

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        message.textContent = "Campaign submitted successfully. Waiting for admin verification.";
        message.style.color = "green";

        campaignForm.reset();
        posterPreview.src = "https://placehold.co/500x280?text=Campaign+Media";

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});