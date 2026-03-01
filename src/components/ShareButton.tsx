import ShareIcon from './icons/ShareIcon'

type Props = {
  onClick: () => void
}

export default function ShareButton({ onClick }: Props) {
  return (
    <button className="shareButton" onClick={onClick}>
      <ShareIcon size={18} />
      共有
    </button>
  )
}