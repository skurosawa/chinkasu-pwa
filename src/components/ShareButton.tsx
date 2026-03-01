// src/components/ShareButton.tsx
// Apple風「共有」アイコン（iOSライク / ピンク）

type Props = {
  onClick: () => void
}

export default function ShareButton({ onClick }: Props) {
  return (
    <button
      className="shareBtn"
      onClick={onClick}
      aria-label="共有"
      title="共有"
    >
      {/* Apple風 share icon */}
      <svg
        className="shareIcon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 上向き矢印 */}
        <path d="M12 3v12" />
        <path d="M7 8l5-5 5 5" />

        {/* 箱 */}
        <path d="M5 13v5a3 3 0 003 3h8a3 3 0 003-3v-5" />
      </svg>
    </button>
  )
}