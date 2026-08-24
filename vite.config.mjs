import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

const MODULE_ID = "sadness-chan";

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },
  build: {
    outDir: path.resolve(import.meta.dirname, `dist/${MODULE_ID}`),
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(import.meta.dirname, "src/module.js"),
      formats: ["es"],
      fileName: () => "module.js"
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "styles/sadness-chan.css";
          }
          return "assets/[name].[ext]";
        }
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "module.json", dest: "." },
        { src: "README.md", dest: "." },
        { src: "assets", dest: "." },
        { src: "languages", dest: "." },
        { src: "templates", dest: "." }
      ]
    })
  ]
});
