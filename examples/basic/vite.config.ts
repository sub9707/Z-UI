import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import {zuiPlugin} from "@z-ui/core/vite"

export default defineConfig({
  plugins: [react(), zuiPlugin()],
  resolve: {
    alias: {
      // dist 빌드 없이 core 소스를 직접 참조
      "@z-ui/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
