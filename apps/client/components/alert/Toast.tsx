import toast from "react-hot-toast";

export const success = (message: string, id?: string) => {
  return toast.success(message, {
    id,
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
    id,
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
    id,
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
