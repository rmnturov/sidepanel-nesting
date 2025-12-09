import './Backdrop.css'

export default function Backdrop({ opacity = 1, panelLevel = 1, onClose, isInert = false }) {
  // Z-index backdrop вычисляется как (z-index панели - 1)
  // z-index панели = 10 + level * 10
  const zIndex = (10 + panelLevel * 10) - 1

  return (
    <div 
      className="backdrop" 
      onClick={onClose}
      aria-hidden="true"
      inert={isInert ? '' : undefined}
      style={{ zIndex, opacity }}
    />
  )
}

