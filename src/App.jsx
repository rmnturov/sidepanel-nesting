import { useState, useEffect, useRef } from 'react'
import Backdrop from './components/Backdrop'
import SidePanel from './components/SidePanel'
import { ANIMATION_DURATION_MS } from './config'
import './App.css'

function App() {
  const [panels, setPanels] = useState([])
  const [closingPanels, setClosingPanels] = useState(new Set())
  const closingPanelsRef = useRef(new Set())
  const [backdrops, setBackdrops] = useState([]) // Массив объектов { panelId, opacity, level }
  const possibleWidths = [960, 640, 400]
  const panelButtonRefs = useRef({})
  const mainOpenButtonRef = useRef(null)
  const autoFocusDelay = ANIMATION_DURATION_MS + 50

  // Прокидываем длительность анимации в CSS-переменную
  useEffect(() => {
    document.documentElement.style.setProperty('--animation-duration', `${ANIMATION_DURATION_MS}ms`)
  }, [])

  const openPanel = () => {
    const newPanelId = panels.length + 1
    // Случайно выбираем ширину из возможных вариантов
    const randomWidth = possibleWidths[Math.floor(Math.random() * possibleWidths.length)]
    setPanels([...panels, { id: newPanelId, width: randomWidth }])
  }

  const closePanel = (panelId) => {
    // Помечаем панель как закрывающуюся
    closingPanelsRef.current.add(panelId)
    setClosingPanels(new Set(closingPanelsRef.current))
    
    // Удаляем панель из массива после завершения анимации
    setTimeout(() => {
      setPanels((prevPanels) => {
        const newPanels = prevPanels.filter(panel => panel.id !== panelId)
        closingPanelsRef.current.delete(panelId)
        setClosingPanels(new Set(closingPanelsRef.current))
        // Очищаем ref для закрытой панели
        delete panelButtonRefs.current[panelId]
        return newPanels
      })
    }, ANIMATION_DURATION_MS) // Длительность анимации
  }

  const closeAllPanels = () => {
    // Для закрытия всех панелей сразу удаляем их без задержки
    closingPanelsRef.current.clear()
    setClosingPanels(new Set())
    setPanels([])
    // Удаляем все backdrop'ы сразу без анимации
    setBackdrops([])
    // Очищаем все refs
    panelButtonRefs.current = {}
  }

  // Установка фокуса на кнопку "Открыть панель" при загрузке страницы
  useEffect(() => {
    if (mainOpenButtonRef.current) {
      mainOpenButtonRef.current.focus()
    }
  }, [])

  // Установка фокуса на кнопку "Открыть панель" при открытии верхней панели
  useEffect(() => {
    if (panels.length > 0) {
      const topPanelId = panels[panels.length - 1].id
      const isTopPanelClosing = closingPanels.has(topPanelId)
      
      // Устанавливаем фокус только если верхняя панель не закрывается
      if (!isTopPanelClosing) {
        // Небольшая задержка для завершения анимации открытия
        const timer = setTimeout(() => {
          const buttonRef = panelButtonRefs.current[topPanelId]
          if (buttonRef) {
            buttonRef.focus()
          }
        }, autoFocusDelay) // Немного больше времени анимации для надежности
        
        return () => clearTimeout(timer)
      }
    }
  }, [panels, closingPanels])

  // Обработка нажатия клавиши Esc
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPanels((prevPanels) => {
          if (prevPanels.length > 0) {
            const topPanelId = prevPanels[prevPanels.length - 1].id
            // Помечаем панель как закрывающуюся
            closingPanelsRef.current.add(topPanelId)
            setClosingPanels(new Set(closingPanelsRef.current))
            
            // Удаляем панель из массива после завершения анимации
            setTimeout(() => {
              setPanels((currentPanels) => {
                const newPanels = currentPanels.filter(panel => panel.id !== topPanelId)
                closingPanelsRef.current.delete(topPanelId)
                setClosingPanels(new Set(closingPanelsRef.current))
                // Очищаем ref для закрытой панели
                delete panelButtonRefs.current[topPanelId]
                return newPanels
              })
            }, ANIMATION_DURATION_MS)
            
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
  
  // Управление backdrop'ами при изменении панелей
  useEffect(() => {
    const visibleCount = panels.length >= 3 ? 3 : 2
    
    setBackdrops((prevBackdrops) => {
      const updatedBackdrops = [...prevBackdrops]
      
      // Определяем верхнюю панель (последняя в массиве, если не закрывается)
      const topPanelIndex = panels.length > 0 ? panels.length - 1 : -1
      const topPanelId = topPanelIndex >= 0 && !closingPanels.has(panels[topPanelIndex].id) 
        ? panels[topPanelIndex].id 
        : null
      
      // Определяем видимые панели (включая закрывающиеся для анимации)
      const visiblePanels = panels
        .map((panel, index) => ({ panel, index, level: index + 1 }))
        .filter(({ index }) => {
          const isClosing = closingPanels.has(panels[index].id)
          return index >= panels.length - visibleCount || isClosing
        })
      
      // Сначала обновляем все существующие backdrop'ы синхронно
      visiblePanels.forEach(({ panel, index, level }) => {
        const panelId = panel.id
        const isClosing = closingPanels.has(panelId)
        const isTopPanel = panelId === topPanelId
        const existingBackdropIndex = updatedBackdrops.findIndex(b => b.panelId === panelId)
        
        if (existingBackdropIndex !== -1) {
          // Обновляем level для существующего backdrop
          updatedBackdrops[existingBackdropIndex].level = level
          
          // Устанавливаем opacity в зависимости от того, верхняя ли это панель
          if (isTopPanel && !isClosing) {
            // Верхняя панель - backdrop должен быть видимым
            updatedBackdrops[existingBackdropIndex].opacity = 1
          } else if (!isTopPanel && !isClosing) {
            // Не верхняя панель - backdrop должен быть скрыт
            updatedBackdrops[existingBackdropIndex].opacity = 0
          }
          
          // Если панель закрывается, анимируем backdrop до opacity 0
          if (isClosing && updatedBackdrops[existingBackdropIndex].opacity > 0) {
            updatedBackdrops[existingBackdropIndex].opacity = 0
            // Удаляем после завершения анимации
            setTimeout(() => {
              setBackdrops((currentBackdrops) => 
                currentBackdrops.filter(b => b.panelId !== panelId)
              )
            }, 300)
          }
        }
      })
      
      // Затем создаем новые backdrop'ы
      const newBackdropsToCreate = []
      visiblePanels.forEach(({ panel, index, level }) => {
        const panelId = panel.id
        const isClosing = closingPanels.has(panelId)
        const isTopPanel = panelId === topPanelId
        const existingBackdropIndex = updatedBackdrops.findIndex(b => b.panelId === panelId)
        
        if (existingBackdropIndex === -1) {
          // Новый backdrop - создаем с opacity 0
          updatedBackdrops.push({ panelId, opacity: 0, level })
          newBackdropsToCreate.push({ panelId, isTopPanel })
        }
      })
      
      // Синхронно запускаем анимации для всех backdrop'ов одновременно
      if (newBackdropsToCreate.length > 0) {
        // Используем один requestAnimationFrame для синхронизации всех анимаций
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setBackdrops((currentBackdrops) => {
              return currentBackdrops.map(b => {
                const isTopPanel = b.panelId === topPanelId
                const isNewBackdrop = newBackdropsToCreate.some(nb => nb.panelId === b.panelId)
                
                if (isNewBackdrop && isTopPanel) {
                  // Новый backdrop верхней панели - анимируем до opacity 1
                  return { ...b, opacity: 1 }
                } else if (isTopPanel && !isNewBackdrop) {
                  // Существующий backdrop верхней панели - оставляем opacity 1
                  return { ...b, opacity: 1 }
                } else if (!isTopPanel) {
                  // Не верхняя панель - скрываем
                  return { ...b, opacity: 0 }
                }
                return b
              })
            })
          })
        })
      }
      
      // Скрываем backdrop'ы для панелей, которые стали невидимыми (не закрываются)
      prevBackdrops.forEach(backdrop => {
        const shouldBeVisible = visiblePanels.some(({ panel }) => panel.id === backdrop.panelId)
        const isClosing = closingPanels.has(backdrop.panelId)
        
        if (!shouldBeVisible && !isClosing && backdrop.opacity > 0) {
          // Панель стала невидимой - анимируем backdrop до opacity 0
          const backdropIndex = updatedBackdrops.findIndex(b => b.panelId === backdrop.panelId)
          if (backdropIndex !== -1) {
            updatedBackdrops[backdropIndex].opacity = 0
            // Удаляем после завершения анимации
            setTimeout(() => {
              setBackdrops((currentBackdrops) => 
                currentBackdrops.filter(b => b.panelId !== backdrop.panelId)
              )
            }, 300)
          }
        }
      })
      
      // При закрытии панели проверяем, нужно ли показать backdrop под нижней панелью
      closingPanels.forEach(panelId => {
        const closingPanelIndex = panels.findIndex(p => p.id === panelId)
        if (closingPanelIndex > 0) {
          const panelBelow = panels[closingPanelIndex - 1]
          const panelBelowIndex = closingPanelIndex - 1
          const shouldBeVisible = panelBelowIndex >= panels.length - visibleCount
          
          if (shouldBeVisible) {
            const backdropIndex = updatedBackdrops.findIndex(b => b.panelId === panelBelow.id)
            if (backdropIndex !== -1) {
              // Панель под закрываемой становится верхней - анимируем её backdrop до opacity 1
              // Это происходит синхронно с закрытием верхней панели
              updatedBackdrops[backdropIndex].opacity = 1
            }
          }
        }
      })
      
      return updatedBackdrops
    })
  }, [panels, closingPanels])

  return (
    <div className="app">
      <div className="main-content" inert={hasOpenPanels ? '' : undefined}>
        <button 
          ref={mainOpenButtonRef}
          className="kbq-button" 
          onClick={openPanel}
        >
          Открыть панель
        </button>
      </div>

      {/* Рендерим backdrop'ы для видимых панелей */}
      {backdrops.map((backdrop) => {
        // Определяем верхнюю панель для проверки инертности backdrop
        const topPanelIndex = panels.length > 0 ? panels.length - 1 : -1
        const topPanelId = topPanelIndex >= 0 && !closingPanels.has(panels[topPanelIndex].id) 
          ? panels[topPanelIndex].id 
          : null
        // Backdrop инертен, если он не под верхней панелью
        const isBackdropInert = topPanelId !== null && backdrop.panelId !== topPanelId
        
        return (
          <Backdrop
            key={backdrop.panelId}
            opacity={backdrop.opacity}
            panelLevel={backdrop.level}
            onClose={closeAllPanels}
            isInert={isBackdropInert}
          />
        )
      })}

      {/* Рендерим все панели, включая закрывающиеся, для анимации */}
      {panels.map((panel, index) => {
        const panelId = panel.id
        const isClosing = closingPanels.has(panelId)
        // При наличии 3 панелей показываем все 3, иначе показываем последние 2
        const visibleCount = panels.length >= 3 ? 3 : 2
        const isVisible = index >= panels.length - visibleCount || isClosing
        // Проверяем, закрывается ли верхняя панель (последняя в массиве)
        const isTopPanelClosing = panels.length > 0 && closingPanels.has(panels[panels.length - 1].id)
        
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
        // Верхняя панель (последняя в массиве) должна быть активной, все остальные - инертными
        // Также закрывающиеся панели должны быть инертными
        const isTopPanel = index === panels.length - 1
        const shouldBeInert = !isTopPanel || isClosing

        return (
          <SidePanel 
            key={panelId}
            isOpen={!isClosing && isVisible}
            onClose={() => closePanel(panelId)}
            level={level}
            width={panel.width}
            isLowerPanel={(isLowerPanel || isBecomingLowerPanel) && !isBecomingNormal}
            isBottomPanel={isBottomPanel && !isBecomingLowerPanel}
            isBecomingNormal={isBecomingNormal}
            isInert={shouldBeInert}
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
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M13.441 3.694a.2.2 0 0 0 0-.284l-.85-.851a.2.2 0 0 0-.285 0L8 6.865 3.694 2.56a.2.2 0 0 0-.284 0l-.851.85a.2.2 0 0 0 0 .285L6.865 8 2.56 12.306a.2.2 0 0 0 0 .284l.85.851a.2.2 0 0 0 .285 0L8 9.135l4.306 4.306a.2.2 0 0 0 .284 0l.851-.85a.2.2 0 0 0 0-.285L9.135 8z"/>
                  </svg>
                </button>
              </div>
              <div className="panel-body">
                <button 
                  ref={(el) => {
                    panelButtonRefs.current[panelId] = el
                  }}
                  className="kbq-button" 
                  onClick={openPanel}
                >
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

