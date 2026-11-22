"use strict";

const copyButton = document.querySelector("[data-copy-text]");
const copyStatus = document.querySelector(".copy-status");

async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();

    if (!copied) {
        throw new Error("Copy command was not available.");
    }
}

if (copyButton && copyStatus) {
    copyButton.addEventListener("click", async () => {
        try {
            await copyText(copyButton.dataset.copyText);
            copyStatus.textContent = "Fax number copied.";
        } catch (error) {
            copyStatus.textContent = "Copy was unavailable. Please select 07 4567 2288 manually.";
        }
    });
}

const bookingForm = document.querySelector(".booking-form");

function dateToInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getAppointmentTimeError(dateValue, timeValue) {
    if (!timeValue) {
        return "Please choose a preferred time.";
    }

    if (!dateValue) {
        return "Choose a date first so we can check the clinic hours.";
    }

    const selectedDate = new Date(`${dateValue}T12:00:00`);
    const day = selectedDate.getDay();

    if (day === 0) {
        return "Vcare Opticals is closed on Sundays. Please choose another date.";
    }

    const closingTime = day === 6 ? "14:00" : "18:00";
    if (timeValue < "09:00" || timeValue > closingTime) {
        return day === 6
            ? "Saturday appointments are available from 9:00am to 2:00pm."
            : "Weekday appointments are available from 9:00am to 6:00pm.";
    }

    return "";
}

if (bookingForm) {
    const fields = {
        name: document.querySelector("#booking-name"),
        phone: document.querySelector("#booking-phone"),
        email: document.querySelector("#booking-email"),
        service: document.querySelector("#booking-service"),
        date: document.querySelector("#booking-date"),
        time: document.querySelector("#booking-time")
    };
    const feedback = bookingForm.querySelector(".form-feedback");

    fields.date.min = dateToInputValue(new Date());

    function showFieldError(field, message) {
        const wrapper = field.closest(".form-field");
        const messageElement = document.querySelector(`#${field.id}-error`);
        const isInvalid = Boolean(message);

        wrapper.classList.toggle("is-invalid", isInvalid);
        field.setAttribute("aria-invalid", String(isInvalid));
        messageElement.textContent = message;
        return isInvalid;
    }

    function validateField(fieldName) {
        const field = fields[fieldName];
        const value = field.value.trim();
        let message = "";

        if (fieldName === "name" && value.length < 2) {
            message = "Enter your full name so reception knows who to contact.";
        }

        if (fieldName === "phone") {
            const digits = value.replace(/\D/g, "");
            if (!/^(?:0\d{9}|61\d{9})$/.test(digits)) {
                message = "Enter a valid Australian phone number, for example 07 5111 4488.";
            }
        }

        if (fieldName === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            message = "Enter a valid email address, for example name@example.com.";
        }

        if (fieldName === "service" && !value) {
            message = "Choose the type of appointment you need.";
        }

        if (fieldName === "date") {
            if (!value) {
                message = "Choose a preferred appointment date.";
            } else if (value < fields.date.min) {
                message = "Choose today or a future date.";
            }
        }

        if (fieldName === "time") {
            message = getAppointmentTimeError(fields.date.value, value);
        }

        return showFieldError(field, message);
    }

    Object.entries(fields).forEach(([fieldName, field]) => {
        field.addEventListener("blur", () => validateField(fieldName));
        field.addEventListener("input", () => {
            validateField(fieldName);
            if (fieldName === "date") {
                validateField("time");
            }
        });
        field.addEventListener("change", () => {
            validateField(fieldName);
            if (fieldName === "date") {
                validateField("time");
            }
        });
    });

    bookingForm.addEventListener("submit", (event) => {
        const invalidFieldNames = Object.keys(fields).filter(validateField);

        if (invalidFieldNames.length > 0) {
            event.preventDefault();
            feedback.textContent = "Please correct the highlighted fields before sending your booking request.";
            fields[invalidFieldNames[0]].focus();
            return;
        }

        feedback.textContent = "Your booking request is ready to send using your email program.";
    });
}
