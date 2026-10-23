import type { ThemeId } from './types'
import { syncBarIcons } from './native'

export type ThemeMode = 'dark' | 'light'

export interface ThemeDef {
  id: ThemeId
  /** 展示名，2 个字，方便在设置页并排放下 */
  name: string
  /** 明暗标签 */
  tag: string
  mode: ThemeMode
  /** 浏览器 / PWA 状态栏颜色 */
  themeColor: string
  /** 设置页预览卡片用色：背景 + 两条品牌色 */
  preview: { bg: string; c1: string; c2: string }
}

/**
 * 7 套主题：4 浅 3 深，默认「青芽」。
 * 所有颜色以 CSS 变量落在 src/index.css 的 [data-theme] 块里，
 * 这里只保留切换主题必需的信息，避免两处维护同一份色值。
 */
export const THEMES: ThemeDef[] = [
  {
    id: 'forest',
    name: '青芽',
    tag: '浅色',
    mode: 'light',
    themeColor: '#F1FAF3',
    preview: { bg: '#F1FAF3', c1: '#047857', c2: '#84CC16' }
  },
  {
    id: 'dark',
    name: '极夜',
    tag: '深色',
    mode: 'dark',
    themeColor: '#070B18',
    preview: { bg: '#070B18', c1: '#6D5DF6', c2: '#EC4899' }
  },
  {
    id: 'aurora',
    name: '极光',
    tag: '深色',
    mode: 'dark',
    themeColor: '#04120F',
    preview: { bg: '#04120F', c1: '#2DD4BF', c2: '#818CF8' }
  },
  {
    id: 'sunset',
    name: '熔金',
    tag: '深色',
    mode: 'dark',
    themeColor: '#140A06',
    preview: { bg: '#140A06', c1: '#F97316', c2: '#F43F5E' }
  },
  {
    id: 'light',
    name: '晨雾',
    tag: '浅色',
    mode: 'light',
    themeColor: '#F3F4FC',
    preview: { bg: '#F3F4FC', c1: '#5B5BF0', c2: '#EC4899' }
  },
  {
    id: 'sakura',
    name: '樱粉',
    tag: '浅色',
    mode: 'light',
    themeColor: '#FFF5F8',
    preview: { bg: '#FFF5F8', c1: '#F472B6', c2: '#A855F7' }
  },
  {
    id: 'ocean',
    name: '海盐',
    tag: '浅色',
    mode: 'light',
    themeColor: '#F1F8FA',
    preview: { bg: '#F1F8FA', c1: '#06B6D4', c2: '#1D4ED8' }
  }
]

export function themeById(id: ThemeId): ThemeDef {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]
}

export function themeMode(id: ThemeId): ThemeMode {
  return themeById(id).mode
}

/**
 * 把主题应用到一个文档根节点：
 * - data-theme 决定 CSS 变量组（颜色、玻璃质感、阴影）
 * - dark class 保留给 Tailwind 的 dark: 变体和浏览器原生控件
 * - color-scheme 让滚动条、输入框跟随明暗
 */
export function applyTheme(id: ThemeId, root: HTMLElement = document.documentElement): void {
  const theme = themeById(id)
  root.setAttribute('data-theme', theme.id)
  root.classList.toggle('dark', theme.mode === 'dark')
  root.style.colorScheme = theme.mode
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.themeColor)
  // 安卓壳：状态栏图标要跟着主题明暗走，否则浅色主题上是白图标（看不见）
  syncBarIcons(theme.mode)
}
