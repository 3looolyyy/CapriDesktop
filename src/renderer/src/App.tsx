import React, { useState, useEffect } from 'react'
import { CompanionView } from './companion/CompanionView'
import { DevDeckView } from './deck/DevDeckView'
import { ScannerView } from './scanner/ScannerView'
import { OnboardingView } from './onboarding/OnboardingView'

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<'companion' | 'deck' | 'scanner' | 'onboarding'>(() => {
    const hash = window.location.hash.toLowerCase()
    if (hash.includes('onboarding')) return 'onboarding'
    if (hash.includes('scanner')) return 'scanner'
    if (hash.includes('companion')) return 'companion'
    return 'deck'
  })

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase()
      if (hash.includes('onboarding')) {
        setCurrentRoute('onboarding')
      } else if (hash.includes('scanner')) {
        setCurrentRoute('scanner')
      } else if (hash.includes('companion')) {
        setCurrentRoute('companion')
      } else {
        setCurrentRoute('deck')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (currentRoute === 'onboarding') {
    return <OnboardingView />
  }

  if (currentRoute === 'scanner') {
    return <ScannerView />
  }

  if (currentRoute === 'companion') {
    return <CompanionView />
  }

  return <DevDeckView />
}

export default App
