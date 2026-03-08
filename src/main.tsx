/**
 * main.tsx — React DOM entry point.
 * Mounts the root <App /> component into the #root element defined in index.html.
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
