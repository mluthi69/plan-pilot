import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { setScriptKey } from "@progress/kendo-licensing";
import App from "./App.tsx";
import "./index.css";
import "./kendo-theme.css";

// Activate Kendo UI license (JWT injected at build time via vite define).
declare const __KENDO_UI_LICENSE__: string;
if (typeof __KENDO_UI_LICENSE__ === "string" && __KENDO_UI_LICENSE__.length > 0) {
  try {
    setScriptKey(__KENDO_UI_LICENSE__);
  } catch (e) {
    console.warn("Kendo license activation failed:", e);
  }
}

const CLERK_PUBLISHABLE_KEY = "pk_test_bmF0dXJhbC1idXp6YXJkLTQzLmNsZXJrLmFjY291bnRzLmRldiQ";

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/sign-in">
    <App />
  </ClerkProvider>
);
