import { FC, useState, useEffect } from 'react'

const NetworkErrorBoundary: FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isVisible, setIsVisible] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-hide the banner after 3 seconds when connection is restored
      setTimeout(() => setIsVisible(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verify current status just in case (sometimes it fires late)
    if (navigator.onLine !== isOnline) {
      if (navigator.onLine) handleOnline()
      else handleOffline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!isVisible && isOnline) return null

  return (
    <div 
      className={`position-fixed w-100 d-flex justify-content-center p-4 z-index-3`} 
      style={{ 
        top: 0, 
        left: 0, 
        zIndex: 1055, 
        transition: 'all 0.3s ease-in-out',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        className={`alert shadow-lg d-flex align-items-center p-5 mb-0 border-0 ${isOnline ? 'bg-success text-white' : 'bg-danger text-white'}`}
        style={{ borderRadius: '12px', minWidth: '350px', maxWidth: '90%' }}
      >
        {isOnline ? (
          <>
            <i className='ki-duotone ki-wifi-home fs-2x text-white me-4'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /></i>
            <div className='d-flex flex-column'>
              <h4 className='mb-1 text-white fw-bold'>Back Online</h4>
              <span className='fs-7'>Your internet connection was restored.</span>
            </div>
            <button type='button' className='btn btn-icon btn-sm btn-active-light btn-color-white ms-auto' onClick={() => setIsVisible(false)}>
              <i className='ki-duotone ki-cross fs-2'><span className='path1' /><span className='path2' /></i>
            </button>
          </>
        ) : (
          <>
            <i className='ki-duotone ki-wifi-slash fs-2x text-white me-4'><span className='path1' /><span className='path2' /><span className='path3' /><span className='path4' /></i>
            <div className='d-flex flex-column pe-0 pe-sm-10'>
              <h4 className='mb-1 text-white fw-bold'>Network Error</h4>
              <span className='fs-7'>Please check your internet connection.</span>
            </div>
            <button type='button' className='btn btn-light-danger bg-white text-danger fw-bold ms-auto btn-sm' onClick={handleRefresh}>
              <i className='ki-duotone ki-arrows-circle fs-3 me-2 text-danger'><span className='path1' /><span className='path2' /></i>
              Refresh
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export { NetworkErrorBoundary }
