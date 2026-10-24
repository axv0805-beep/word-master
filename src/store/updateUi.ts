import { create } from 'zustand'
import type { UpdateInfo } from '../components/ui/UpdateProgress'

/**
 * 更新弹窗的显隐状态。
 * 启动时自动弹出、首页「有新版本」提示点开，都走同一份状态，
 * 这样无论从哪个入口进来，看到的都是同一张卡片和同一份下载进度。
 */
interface UpdateUiState {
  info: UpdateInfo | null
  open: boolean
  openSheet: (info: UpdateInfo) => void
  closeSheet: () => void
}

export const useUpdateUi = create<UpdateUiState>((set) => ({
  info: null,
  open: false,
  openSheet: (info) => set({ info, open: true }),
  closeSheet: () => set({ open: false })
}))
