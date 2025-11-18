import React, { useState, useEffect } from 'react';
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  gap: 0.75rem;
  padding: 0 2rem;
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const Step = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.active ? '#333' : 'white'};
  font-weight: ${props => props.active ? '600' : '400'};
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
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
  background: ${props => props.active ? '#667eea' : 'rgba(255, 255, 255, 0.3)'};
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
