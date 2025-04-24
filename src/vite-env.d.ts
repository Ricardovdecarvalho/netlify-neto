/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_SPORTS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}