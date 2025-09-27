import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";
import "animate.css";
import "./index.css";
import App from "./App.tsx";
import { initChain } from "./utils/tool.ts";
import { Toaster } from '@worldcoin/mini-apps-ui-kit-react';

initChain();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
        <Toaster />
    </StrictMode>,
);
