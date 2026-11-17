export const workspaceStorageKeys = (id: string) => ({
  procurementDraft: `ltpp-app:procurement-draft:${id}`,
  welcomeShortcut: `ltpp-app:welcome-shortcut-hidden:${id}`,
  legacyWelcome: `ltpp-app:welcome-dismissed:${id}`,
})
