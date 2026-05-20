import React, { useState } from 'react';
import styled from 'styled-components';
import Step1Upload from './components/Step1Upload';
import Step2Customize from './components/Step2Customize';
import Step3Submit from './components/Step3Submit';
import RequestManager from './components/RequestManager';
import Header from './components/Header';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 184, 77, 0.36), transparent 26%),
    radial-gradient(circle at 88% 14%, rgba(51, 214, 197, 0.32), transparent 30%),
    radial-gradient(circle at 68% 88%, rgba(255, 92, 117, 0.24), transparent 28%),
    linear-gradient(135deg, #151a2e 0%, #23404b 46%, #20263d 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;

  &::before,
  &::after {
    content: '';
    position: fixed;
    inset: -20%;
    z-index: -2;
    pointer-events: none;
  }

  &::before {
    background:
      linear-gradient(115deg, transparent 0 22%, rgba(255, 255, 255, 0.12) 22% 24%, transparent 24% 52%, rgba(51, 214, 197, 0.14) 52% 54%, transparent 54%),
      repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 92px);
    opacity: 0.65;
    animation: driftPanels 24s ease-in-out infinite alternate;
  }

  &::after {
    z-index: -1;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.08), transparent 35%),
      repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.10) 0 1px, transparent 1px 28px);
    mix-blend-mode: screen;
    opacity: 0.32;
    animation: shimmerField 18s linear infinite;
  }

  @keyframes driftPanels {
    from { transform: translate3d(-2%, -1%, 0) rotate(-2deg); }
    to { transform: translate3d(2%, 1%, 0) rotate(2deg); }
  }

  @keyframes shimmerField {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(4%, -3%, 0); }
  }
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin: 1.25rem auto 0;
  gap: 0.75rem;
  padding: 0 2rem;
  width: 100%;
  max-width: 1200px;

  @media (max-width: 720px) {
    padding: 0 1rem;
    gap: 0.45rem;
    overflow-x: auto;
    justify-content: flex-start;
  }
`;

const Step = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.62rem 1rem;
  border-radius: 999px;
  border: 1px solid ${props => props.active ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.22)'};
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.12)'};
  color: ${props => props.active ? '#172033' : 'rgba(255,255,255,0.86)'};
  font-weight: ${props => props.active ? '600' : '400'};
  font-size: 0.9rem;
  white-space: nowrap;
  box-shadow: ${props => props.active ? '0 16px 42px rgba(0,0,0,0.18)' : 'none'};
  backdrop-filter: blur(22px) saturate(160%);
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const StepNumber = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.active ? 'linear-gradient(135deg, #ffb84d, #ff5c75)' : 'rgba(255, 255, 255, 0.24)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
`;

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'requests'
  const [engravingData, setEngravingData] = useState({
    originalImage: null,
    originalText: '',
    customText: '',
    customImage: null,
    comments: '',
    textPosition: { x: 50, y: 50 },
    font: 'arial',
    fontSize: 24,
    style: 'engraved',
    customerInfo: {
      name: '',
      email: '',
      phone: ''
    }
  });



  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateEngravingData = (newData) => {
    setEngravingData(prev => ({ ...prev, ...newData }));
  };

  const navigateToRequests = () => {
    setCurrentView('requests');
  };

  const navigateToMain = () => {
    setCurrentView('main');
    setCurrentStep(1);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Upload 
            data={engravingData}
            onUpdate={updateEngravingData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <Step2Customize 
            data={engravingData}
            onUpdate={updateEngravingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <Step3Submit 
            data={engravingData}
            onUpdate={updateEngravingData}
            onPrev={prevStep}
            onNavigateToRequests={navigateToRequests}
          />
        );
      default:
        return null;
    }
  };

  if (currentView === 'requests') {
    return (
      <AppContainer>
        <Header onNavigateToRequests={navigateToRequests} />
        <MainContent>
          <RequestManager onNavigateToMain={navigateToMain} />
        </MainContent>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header onNavigateToRequests={navigateToRequests} />
      <MainContent>
        <StepIndicator>
          <Step active={currentStep >= 1}>
            <StepNumber active={currentStep >= 1}>1</StepNumber>
            Upload Object
          </Step>
          <Step active={currentStep >= 2}>
            <StepNumber active={currentStep >= 2}>2</StepNumber>
            Customize Design
          </Step>
          <Step active={currentStep >= 3}>
            <StepNumber active={currentStep >= 3}>3</StepNumber>
            Submit Request
          </Step>
        </StepIndicator>
        
        {renderCurrentStep()}
      </MainContent>
    </AppContainer>
  );
}

export default App;
