import { useState, useEffect, useRef } from 'react'
import Backdrop from './components/Backdrop'
import SidePanel from './components/SidePanel'
import './App.css'

function App() {
  const [panels, setPanels] = useState([])
  const [closingPanels, setClosingPanels] = useState(new Set())
  const closingPanelsRef = useRef(new Set())

  const openPanel = () => {
    const newPanelId = panels.length + 1
    setPanels([...panels, newPanelId])
  }

  const closePanel = (panelId) => {
    // Помечаем панель как закрывающуюся
    closingPanelsRef.current.add(panelId)
    setClosingPanels(new Set(closingPanelsRef.current))
    
    // Удаляем панель из массива после завершения анимации
    setTimeout(() => {
      setPanels((prevPanels) => {
        const newPanels = prevPanels.filter(id => id !== panelId)
        closingPanelsRef.current.delete(panelId)
        setClosingPanels(new Set(closingPanelsRef.current))
        return newPanels
      })
    }, 300) // Длительность анимации
  }

  const closeAllPanels = () => {
    // Для закрытия всех панелей сразу удаляем их без задержки
    closingPanelsRef.current.clear()
    setClosingPanels(new Set())
    setPanels([])
  }

  // Обработка нажатия клавиши Esc
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPanels((prevPanels) => {
          if (prevPanels.length > 0) {
            const topPanelId = prevPanels[prevPanels.length - 1]
            // Помечаем панель как закрывающуюся
            closingPanelsRef.current.add(topPanelId)
            setClosingPanels(new Set(closingPanelsRef.current))
            
            // Удаляем панель из массива после завершения анимации
            setTimeout(() => {
              setPanels((currentPanels) => {
                const newPanels = currentPanels.filter(id => id !== topPanelId)
                closingPanelsRef.current.delete(topPanelId)
                setClosingPanels(new Set(closingPanelsRef.current))
                return newPanels
              })
            }, 300)
            
            return prevPanels
          }
          return prevPanels
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Рендерим только последние 2 панели
  const visiblePanels = panels.slice(-2)
  const hasOpenPanels = panels.length > 0

  return (
    <div className="app">
      <div className="main-content">
        <button className="open-button" onClick={openPanel}>
          Открыть панель 1
        </button>
      </div>

      {/* Backdrop всегда один, под самой нижней панелью */}
      <Backdrop isVisible={hasOpenPanels} onClose={closeAllPanels} />

      {/* Рендерим все панели, включая закрывающиеся, для анимации */}
      {panels.map((panelId, index) => {
        const isClosing = closingPanels.has(panelId)
        // При наличии 3 панелей показываем все 3, иначе показываем последние 2
        const visibleCount = panels.length >= 3 ? 3 : 2
        const isVisible = index >= panels.length - visibleCount || isClosing
        // Проверяем, закрывается ли верхняя панель (последняя в массиве)
        const isTopPanelClosing = panels.length > 0 && closingPanels.has(panels[panels.length - 1])
        
        // Определяем состояние панелей:
        // При наличии 2 панелей:
        // - Первая (index 0): lower-panel - полупрозрачная, сдвинута левее, уменьшена
        // - Вторая (index 1, верхняя): нормальная
        // При наличии 3 панелей:
        // - Третья (index 0, самая нижняя): bottom-panel - полностью прозрачная, сдвинута левее, уменьшена
        // - Вторая (index 1): lower-panel - полупрозрачная, сдвинута левее, уменьшена
        // - Первая (index 2, верхняя): нормальная
        const isBottomPanel = panels.length >= 3 && index === panels.length - 3 && !isClosing && !isTopPanelClosing
        const isLowerPanel = (panels.length >= 2 && index === panels.length - 2 && !isClosing && !isTopPanelClosing) || 
                             (panels.length === 2 && index === 0 && !isClosing && !isTopPanelClosing)
        
        // При закрытии верхней панели нижние переходят в новые состояния
        // Третья (bottom-panel) становится lower-panel (полупрозрачной) - двигается вправо, увеличивается
        const isBecomingLowerPanel = isTopPanelClosing && panels.length >= 3 && index === panels.length - 3
        // Вторая (lower-panel) становится нормальной - двигается вправо, увеличивается, становится непрозрачной
        // При закрытии второй панели (когда всего 2 панели) первая также становится нормальной
        const isBecomingNormal = isTopPanelClosing && panels.length >= 2 && index === panels.length - 2
        
        const level = index + 1

        return (
          <SidePanel 
            key={panelId}
            isOpen={!isClosing && isVisible}
            onClose={() => closePanel(panelId)}
            level={level}
            isLowerPanel={(isLowerPanel || isBecomingLowerPanel) && !isBecomingNormal}
            isBottomPanel={isBottomPanel && !isBecomingLowerPanel}
            isBecomingNormal={isBecomingNormal}
          >
            <div className="panel-content">
              <div className="panel-header">
                <h2>Заголовок</h2>
                <button 
                  className="side-panel-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    closePanel(panelId)
                  }}
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>
              <div className="panel-body">
                <button className="panel-button" onClick={openPanel}>
                  Открыть панель
                </button>
              </div>
            </div>
          </SidePanel>
        )
      })}
    </div>
  )
}

export default App

