import { useRouter } from "next/router";
import { useEffect } from "react";

/** Old address for the forgot-password page — kept so existing links still work. */
export default function ForgotPasswordRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/forgot-password");
  }, [router]);
  return null;
}
