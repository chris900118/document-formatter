import { create } from 'zustand'

interface ToolsState {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

export const useToolsStore = create<ToolsState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
