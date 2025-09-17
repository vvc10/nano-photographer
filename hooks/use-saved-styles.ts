// Compatibility shim: some files import from `hooks/use-saved-styles` while the implementation file is `use-saved-pins.ts`.
// Re-export the named hook so both import paths work.
export { useSavedstyles } from './use-saved-pins'
