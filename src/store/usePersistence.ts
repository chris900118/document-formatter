import { useEffect } from 'react'
import { useProfileStore } from './profileStore'

/**
 * 持久化 Hook
 * 自动加载和保存规范到 electron-store
 */
export function usePersistence() {
  const { profiles, loadProfiles } = useProfileStore()

  // 初始加载
  useEffect(() => {
    const loadData = async () => {
      // 检查 electronAPI 是否可用
      if (!window.electronAPI) {
        console.warn('[Persistence] electronAPI not available, skipping load')
        return
      }

      try {
        const result = await window.electronAPI.loadProfiles()
        if (result.success && result.profiles && result.profiles.length > 0) {
          const normalize = (p: any) => {
            const special = p.specialRules || p.rules || {}
            return {
              ...p,
              specialRules: {
                autoTimesNewRoman: special.autoTimesNewRoman ?? true,
                resetIndentsAndSpacing: special.resetIndentsAndSpacing ?? true,
                pictureLineSpacing: special.pictureLineSpacing ?? true,
                pictureCenterAlign: special.pictureCenterAlign ?? true,
                removeManualNumberPrefixes: special.removeManualNumberPrefixes ?? false,
              },
            }
          }
          const normalized = result.profiles.map((p: any) => normalize(p))
          loadProfiles(normalized)
        }
      } catch (error) {
        console.error('Failed to load profiles:', error)
      }
    }

    loadData()
  }, [loadProfiles])

  // 自动保存
  useEffect(() => {
    const saveData = async () => {
      // 检查 electronAPI 是否可用
      if (!window.electronAPI) {
        console.warn('[Persistence] electronAPI not available, skipping save')
        return
      }

      try {
        await window.electronAPI.saveProfiles(profiles)
      } catch (error) {
        console.error('Failed to save profiles:', error)
      }
    }

    // 防抖保存
    const timeoutId = setTimeout(saveData, 500)
    return () => clearTimeout(timeoutId)
  }, [profiles])
}
