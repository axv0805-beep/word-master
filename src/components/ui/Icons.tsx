export type IconName =
  | 'home'
  | 'book'
  | 'alert'
  | 'chart'
  | 'sliders'
  | 'speaker'
  | 'keyboard'
  | 'check'
  | 'close'
  | 'chevronRight'
  | 'chevronLeft'
  | 'play'
  | 'trash'
  | 'download'
  | 'upload'
  | 'flame'
  | 'target'
  | 'plus'
  | 'refresh'
  | 'bulb'
  | 'clock'
  | 'sparkle'
  | 'shuffle'
  | 'sortAz'

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.7V20a1 1 0 0 0 1 1H10v-5.6h4V21h3.5a1 1 0 0 0 1-1V9.7',
  book: 'M4 4.6A1.6 1.6 0 0 1 5.6 3H19v18H5.6A1.6 1.6 0 0 1 4 19.4zM8.5 3v18',
  alert: 'M12 7.5v5.6M12 16.7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  chart: 'M4 4v16h16M7.5 16.5V12M12 16.5V7.8M16.5 16.5v-6.2',
  sliders: 'M4 7h8M16 7h4M4 17h4M12 17h8M14 4.5v5M8 14.5v5',
  speaker: 'M11 5 6.5 9H4v6h2.5L11 19zM15.5 8.6a5 5 0 0 1 0 6.8M18.4 6a8.6 8.6 0 0 1 0 12',
  keyboard:
    'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM7.2 10h.01M11 10h.01M14.8 10h.01M8 14h8',
  check: 'm5 13 4.5 4.5L19 7',
  close: 'M6 6l12 12M18 6 6 18',
  chevronRight: 'm9 5 7 7-7 7',
  chevronLeft: 'm15 5-7 7 7 7',
  play: 'M8 5.4v13.2L19 12z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M5 20h14',
  upload: 'M12 20V9m0 0 4 4m-4-4-4 4M5 4h14',
  flame: 'M12 22a6 6 0 0 0 6-6c0-4-3-6.5-4.5-9C13 5 12.5 3 12 2c-.5 2-2 4-3.5 6C7 10 6 12 6 16a6 6 0 0 0 6 6z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4.2h-4.2',
  bulb: 'M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8V15h7.2v-1.2A6 6 0 0 0 12 3z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13.5V12l3 2',
  sparkle:
    'M12 3.2 13.7 8l4.8 1.7-4.8 1.7L12 16.2l-1.7-4.8L5.5 9.7 10.3 8zM18.4 15.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  shuffle: 'M17 4h4v4M21 4l-6.5 6.5M7 20H3v-4M3 20l6.5-6.5M17 20h4v-4M21 20l-6-6M3 4h4l6 6',
  sortAz: 'M4 7h10M4 12h7M4 17h4M17 8v9m0 0 3-3m-3 3-3-3'
}

export interface IconProps {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
