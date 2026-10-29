import Swal from "sweetalert2";

/*
============================================================
Pop-up messages for the whole site.

A pop-up always appears above everything else, including
open forms, so a message is never hidden behind a modal.
============================================================
*/

const TEAL = "#0f766e";

// Messages that ask the person to fix something they typed
const isValidationMessage = (text) =>
  /^please\b/i.test(text) || /\b(required|cannot be empty)\b/i.test(text);

export function showError(text) {
  if (!text) return;

  const validation = isValidationMessage(String(text));

  Swal.fire({
    icon: validation ? "warning" : "error",
    title: validation ? "Please check" : "Something went wrong",
    text: String(text),
    confirmButtonColor: TEAL,
  });
}

export function showSuccess(text) {
  if (!text) return;

  Swal.fire({
    icon: "success",
    title: String(text),
    timer: 2200,
    showConfirmButton: false,
  });
}
