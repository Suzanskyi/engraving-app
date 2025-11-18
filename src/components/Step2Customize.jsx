import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import TextOverlay from './TextOverlay';

const StepContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  width: 100%;
  min-height: calc(100vh - 200px);
  padding: 2rem;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const StepTitle = styled.h2`
  text-align: center;
  color: #333;
  font-size: 2.5rem;
  margin: 1rem 0 2rem 0;
  font-weight: 700;
`;

const StepDescription = styled.p`
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  flex: 1;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ImagePreviewSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const PreviewTitle = styled.h3`
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const PreviewContainer = styled.div`
  position: relative;
  max-width: 100%;
  max-height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CustomizationSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const FontSelect = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const UploadCard = styled.div`
  border: 2px dashed #ddd;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
  }
`;

const UploadIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    color: #999;
  }
`;

const Instructions = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #667eea;
`;

const InstructionsTitle = styled.h4`
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
`;

const InstructionsText = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

const Button = styled.button`
  background: ${props => props.variant === 'secondary' ? 'transparent' : 'linear-gradient(135deg, #667eea, #764ba2)'};
  color: ${props => props.variant === 'secondary' ? '#667eea' : 'white'};
  border: 2px solid #667eea;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;



const Step2Customize = ({ data, onUpdate, onNext, onPrev }) => {
  // Simplified state - no complex dragging/resizing state needed
  const [composedImage, setComposedImage] = useState(data.composedImage || null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fonts = [
    { name: 'Arial', value: 'arial' },
    { name: 'Helvetica', value: 'helvetica' },
    { name: 'Times New Roman', value: 'timesnewroman' },
    { name: 'Georgia', value: 'georgia' },
    { name: 'Verdana', value: 'verdana' },
    { name: 'Courier New', value: 'couriernew' },
    { name: 'Impact', value: 'impact' },
    { name: 'Comic Sans MS', value: 'comicsansms' },
    { name: 'Tahoma', value: 'tahoma' },
    { name: 'Trebuchet MS', value: 'trebuchetms' },
    { name: 'Lucida Sans', value: 'lucidasans' },
    { name: 'Palatino', value: 'palatino' }
  ];

  // Simplified event handlers - TextOverlay handles all interaction internally
  const handlePositionChange = useCallback((newPosition) => {
    onUpdate({ textPosition: newPosition });
  }, [onUpdate]);

  const handleFontSizeChange = useCallback((newFontSize) => {
    onUpdate({ fontSize: newFontSize });
  }, [onUpdate]);



  // Capture canvas image for final preview - no ImageComposer needed
  useEffect(() => {
    let captureTimeout;
    
    const captureCanvasImage = () => {
      clearTimeout(captureTimeout);
      captureTimeout = setTimeout(() => {
        // Find the TextOverlay canvas and capture it
        const canvas = document.querySelector('canvas');
        if (canvas && data.customText && data.customText.trim()) {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            setComposedImage(dataUrl);
            onUpdate({ composedImage: dataUrl });
          } catch (error) {
            console.error('Failed to capture canvas:', error);
          }
        } else if (!data.customText || !data.customText.trim()) {
          // Clear composed image when text is empty
          if (composedImage) {
            setComposedImage(null);
            onUpdate({ composedImage: null });
          }
        }
      }, 500); // 500ms delay to ensure canvas is rendered
    };
    
    captureCanvasImage();
    
    return () => clearTimeout(captureTimeout);
  }, [data.customText, data.textPosition, data.font, data.fontSize, composedImage, onUpdate]);

  const canProceed = () => {
    return data.customText.trim() || data.customImage;
  };

  return (
    <StepContainer>
      <ContentWrapper>
        <StepTitle>Customize Your Design</StepTitle>
        <StepDescription>
          Add custom text, choose fonts, and position everything perfectly on your object.
        </StepDescription>

        <MainContent>
          <ImagePreviewSection>
            <PreviewTitle>
              Interactive Preview
              {isGenerating && (
                <span style={{ 
                  marginLeft: '10px', 
                  fontSize: '0.8em', 
                  color: '#667eea',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}>
                  ✨ Updating...
                </span>
              )}
            </PreviewTitle>
            <PreviewContainer>
              <TextOverlay
                imageUrl={data.originalImage}
                imageDescription={data.originalText}
                text={data.customText || ''}
                position={data.textPosition}
                font={data.font}
                fontSize={data.fontSize}
                color="#333"
                onPositionChange={handlePositionChange}
                onFontSizeChange={handleFontSizeChange}
                width={600}
                height={400}
                style={{
                  opacity: isGenerating ? 0.8 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </PreviewContainer>
          </ImagePreviewSection>

          <CustomizationSection>
            <SectionTitle>Text Customization</SectionTitle>

            <TextInput
              type="text"
              placeholder="Enter your custom text..."
              value={data.customText}
              onChange={(e) => {
                onUpdate({ customText: e.target.value });
              }}
              style={{
                transition: 'all 0.3s ease',
                borderColor: data.customText ? '#667eea' : '#e0e0e0',
                boxShadow: data.customText ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none'
              }}
            />

            <FontSelect
              value={data.font}
              onChange={(e) => {
                onUpdate({ font: e.target.value });
              }}
            >
              {fonts.map(font => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.name }}>
                  {font.name}
                </option>
              ))}
            </FontSelect>

            <UploadCard>
              <UploadIcon>
                <Upload size={24} />
              </UploadIcon>
              <p>Upload custom image or logo</p>
            </UploadCard>

            <Instructions>
              <InstructionsTitle>💡 How to Use:</InstructionsTitle>
              <InstructionsText>• <strong>Drag</strong> the text overlay to position it on your object</InstructionsText>
              <InstructionsText>• <strong>Resize</strong> text by dragging the blue resize handle</InstructionsText>
              <InstructionsText>• <strong>Choose fonts</strong> from the dropdown menu</InstructionsText>
              <InstructionsText>• <strong>Real-time preview</strong> shows exactly how your text will appear</InstructionsText>
            </Instructions>
          </CustomizationSection>
        </MainContent>

        <ButtonContainer>
          <Button variant="secondary" onClick={onPrev}>
            <ArrowLeft size={20} />
            Back
          </Button>
          <Button onClick={onNext} disabled={!canProceed()}>
            Continue to Review
            <ArrowRight size={20} />
          </Button>
        </ButtonContainer>
      </ContentWrapper>
    </StepContainer>
  );
};

export default Step2Customize;
