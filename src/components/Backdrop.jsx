import './Backdrop.css'

export default function Backdrop({ isVisible, onClose }) {
  if (!isVisible) return null

  return (
    <div 
      className="backdrop" 
      onClick={onClose}
      aria-hidden="true"
    />
  )
}

