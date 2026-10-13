import toast from "react-hot-toast";

/**
 * react-hot-toast keys a toast by its `id`: firing one that is already on
 * screen updates it in place, while an id-less toast is always a new one. Call
 * sites rarely pass an id, so anything that reaches the same message twice —
 * two layers both reporting one failure, an effect that re-runs when the auth
 * token arrives, a double-clicked button — stacked two identical boxes on the
 * screen. Falling back to the message itself makes the second one land on the
 * first, so a message says itself once however many times it is sent.
 *
 * An explicit `id` still wins, which is what lets one message replace another
 * (the same "plan" slot carrying a different reason, say).
 */
const slot = (kind: string, message: string, id?: string) => id ?? `${kind}:${message}`;

export const success = (message: string, id?: string) => {
  return toast.success(message, {
    id: slot("success", message, id),
    style: {
      border: "1px solid #098e42",
      padding: "16px 2rem",
      color: "#098e42",
    },
    iconTheme: {
      primary: "#098e42",
      secondary: "#FFFAEE",
    },
    duration: 4000,
  });
};

export const error = (message: string, id?: string) => {
  return toast.error(message, {
    id: slot("error", message, id),
    style: {
      border: "1px solid #e30606",
      padding: "16px 2rem",
      color: "#e30606",
    },
    iconTheme: {
      primary: "#e30606",
      secondary: "#FFFAEE",
    },
  });
};

export const warning = (message: string, id?: string) => {
  return toast.success(message, {
    id: slot("warning", message, id),
    duration: 5000,
    style: {
      border: "1px solid #ff6348",
      padding: "16px 2rem",
      color: "#ff6348",
    },
    iconTheme: {
      primary: "#ff6348",
      secondary: "#FFFFFF"
    },
  });
};

export const loading = (message: string, id?: string) => {
  return toast.loading(message, {
    id: id ?? "loading",
    style: {
      border: "1px solid #0b0a36",
      padding: "16px 2rem",
      color: "#0b0a36",
    },
    iconTheme: {
      primary: "#0b0a36",
      secondary: "#FFFAEE",
    },
  });
};

export const dismissLoader = (message: string, id?: string) => {
  return toast.dismiss("loading");
};
