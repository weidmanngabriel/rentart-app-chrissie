/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

type GoogleCredentialResponse = {
  credential: string
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }) => void
  renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void
  disableAutoSelect: () => void
}

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
}

type GoogleTokenClient = {
  requestAccessToken: (config?: { prompt?: string }) => void
}

type GoogleAccountsOAuth2 = {
  initTokenClient: (config: {
    client_id: string
    scope: string
    hint?: string
    callback: (response: GoogleTokenResponse) => void
    error_callback?: (error: { type?: string }) => void
  }) => GoogleTokenClient
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId
      oauth2?: GoogleAccountsOAuth2
    }
  }
}
