import { useEffect, useState } from 'react'
import { ANIMATION_DURATION_MS } from '../config'
import './SidePanel.css'

export default function SidePanel({ isOpen, onClose, children, level = 1, width = 640, isLowerPanel = false, isBottomPanel = false, isBecomingNormal = false, isInert = false }) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isAnimating, setIsAnimating] = useState(false)
  const zIndex = 10 + level * 10 // level 1 -> z-index 20, level 2 -> z-index 30

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Сбрасываем анимацию перед запуском новой
      setIsAnimating(false)
      // Небольшая задержка для запуска анимации открытия
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      // Когда isOpen становится false, запускаем анимацию закрытия
      if (shouldRender) {
        setIsAnimating(false)
        // Задержка перед удалением для завершения анимации закрытия
        const timer = setTimeout(() => {
          setShouldRender(false)
        }, ANIMATION_DURATION_MS) // Длительность анимации
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, shouldRender])

  if (!shouldRender) return null

  return (
    <div 
      className={`side-panel-container ${isAnimating ? 'open' : ''}`}
      style={{ zIndex }}
      inert={isInert ? '' : undefined}
      onClick={(e) => {
        // Предотвращаем закрытие при клике внутри панели
        e.stopPropagation()
      }}
    >
      {/* Область отступов - блокируем события мыши */}
      <div 
        className="side-panel-margin-top"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div 
        className="side-panel-margin-right"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div 
        className="side-panel-margin-bottom"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Сама панель */}
      <div 
        className={`side-panel ${isLowerPanel ? 'lower-panel' : ''} ${isBottomPanel ? 'bottom-panel' : ''} ${isBecomingNormal ? 'becoming-normal' : ''}`}
        style={{ width: `${width}px` }}
      >
        {children}
      </div>
    </div>
  )
}
