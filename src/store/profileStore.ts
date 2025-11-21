import { create } from 'zustand'
import { FormatProfile, DEFAULT_PROFILE, FileInfo, ProcessStatus } from '../types/profile'

interface ProfileStore {
  // 规范列表
  profiles: FormatProfile[]
  selectedProfileId: string | null
  
  // 文件状态
  currentFile: FileInfo | null
  processStatus: ProcessStatus
  processMessage: string
  outputPath: string | null
  
  // 规范操作
  addProfile: (profile: Omit<FormatProfile, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProfile: (id: string, profile: Partial<FormatProfile>) => void
  deleteProfile: (id: string) => void
  selectProfile: (id: string) => void
  getProfileById: (id: string) => FormatProfile | undefined
  
  // 文件操作
  setCurrentFile: (file: FileInfo | null) => void
  setProcessStatus: (status: ProcessStatus, message?: string) => void
  setOutputPath: (path: string | null) => void
  
  // 初始化
  loadProfiles: (profiles: FormatProfile[]) => void
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // 初始状态
  profiles: [DEFAULT_PROFILE],
  selectedProfileId: DEFAULT_PROFILE.id,
  currentFile: null,
  processStatus: ProcessStatus.IDLE,
  processMessage: '',
  outputPath: null,
  
  // 规范操作
  addProfile: (profileData) => {
    const newProfile: FormatProfile = {
      ...profileData,
      id: `profile_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    }
    set((state) => ({
      profiles: [...state.profiles, newProfile],
    }))
  },
  
  updateProfile: (id, updates) => {
    set((state) => ({
      profiles: state.profiles.map((profile) =>
        profile.id === id
          ? { ...profile, ...updates, updatedAt: new Date().toISOString() }
          : profile
      ),
    }))
  },
  
  deleteProfile: (id) => {
    const state = get()
    if (state.profiles.find((p) => p.id === id)?.isDefault) {
      console.warn('Cannot delete default profile')
      return
    }
    set((state) => ({
      profiles: state.profiles.filter((profile) => profile.id !== id),
      selectedProfileId:
        state.selectedProfileId === id ? DEFAULT_PROFILE.id : state.selectedProfileId,
    }))
  },
  
  selectProfile: (id) => {
    set({ selectedProfileId: id })
  },
  
  getProfileById: (id) => {
    return get().profiles.find((profile) => profile.id === id)
  },
  
  // 文件操作
  setCurrentFile: (file) => {
    set({ currentFile: file, outputPath: null })
  },
  
  setProcessStatus: (status, message = '') => {
    set({ processStatus: status, processMessage: message })
  },
  
  setOutputPath: (path) => {
    set({ outputPath: path })
  },
  
  // 初始化
  loadProfiles: (profiles) => {
    set({ profiles })
  },
}))
