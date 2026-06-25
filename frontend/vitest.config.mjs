import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

/**
 * Vitest config for the frontend.
 *
 * jsdom environment for component tests; only files under __tests__ run so the
 * Next build is untouched. Setup file wires @testing-library/jest-dom matchers.
 */
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.js"],
        include: ["app/**/__tests__/**/*.{test,spec}.{js,jsx}"],
    },
})
