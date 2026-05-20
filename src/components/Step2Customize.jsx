import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import TextOverlay from './TextOverlay';

const StepContainer = styled.div`
  background: rgba(255, 255, 255, 0.14);
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
  border: 1px solid rgba(255,255,255,0.28);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.45));
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(26px) saturate(170%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 20px;
  }
`;

const StepTitle = styled.h2`
  text-align: center;
  color: #172033;
  font-size: clamp(2rem, 4vw, 3.35rem);
  margin: 0.25rem 0 0.75rem 0;
  font-weight: 700;
  letter-spacing: 0;
`;

const StepDescription = styled.p`
  text-align: center;
  color: rgba(23, 32, 51, 0.72);
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
  justify-content: flex-start;
  padding-top: 0.5rem;
`;

const PreviewTitle = styled.h3`
  color: #172033;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const PreviewContainer = styled.div`
  position: relative;
  max-width: 100%;
  max-height: 460px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(51, 214, 197, 0.10));
  border: 1px solid rgba(255,255,255,0.48);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.72), 0 24px 60px rgba(23, 32, 51, 0.12);
  overflow: auto;
`;

const CustomizationSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h3`
  color: #172033;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 1px solid rgba(23, 32, 51, 0.12);
  border-radius: 14px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  box-sizing: border-box;
  background: rgba(255,255,255,0.68);
  color: #172033;
  
  &:focus {
    outline: none;
    border-color: #33d6c5;
    box-shadow: 0 0 0 4px rgba(51, 214, 197, 0.16);
    background: rgba(255,255,255,0.92);
  }
`;

const FontSelect = styled.select`
  width: 100%;
  padding: 1rem;
  border: 1px solid rgba(23, 32, 51, 0.12);
  border-radius: 14px;
  font-size: 1rem;
  font-family: inherit;
  background: rgba(255,255,255,0.68);
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  box-sizing: border-box;
  color: #172033;
  
  &:focus {
    outline: none;
    border-color: #33d6c5;
    box-shadow: 0 0 0 4px rgba(51, 214, 197, 0.16);
    background: rgba(255,255,255,0.92);
  }
`;

const RangeControl = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.54);
  box-shadow: 0 12px 32px rgba(23, 32, 51, 0.08);

  label {
    grid-column: 1 / -1;
    color: #172033;
    font-weight: 700;
  }

  input {
    width: 100%;
    accent-color: #33d6c5;
  }

  span {
    color: rgba(23, 32, 51, 0.68);
    font-weight: 700;
    min-width: 52px;
    text-align: right;
  }
`;

const UploadCard = styled.div`
  border: 1px dashed rgba(23, 32, 51, 0.2);
  border-radius: 18px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.54);
  box-shadow: 0 16px 44px rgba(23, 32, 51, 0.08);
  
  &:hover {
    border-color: #33d6c5;
    transform: translateY(-4px);
    box-shadow: 0 24px 64px rgba(22, 69, 80, 0.16);
  }
`;

const UploadIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(51, 214, 197, 0.18), rgba(255, 184, 77, 0.22));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    color: #23404b;
  }
`;

const Instructions = styled.div`
  background: rgba(255, 255, 255, 0.52);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-left: 4px solid #33d6c5;
  box-shadow: 0 14px 40px rgba(23, 32, 51, 0.08);
`;

const InstructionsTitle = styled.h4`
  color: #172033;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
`;

const InstructionsText = styled.p`
  color: rgba(23, 32, 51, 0.68);
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
  background: ${props => props.variant === 'secondary' ? 'rgba(255,255,255,0.42)' : 'linear-gradient(135deg, #ffb84d, #ff5c75)'};
  color: ${props => props.variant === 'secondary' ? '#172033' : 'white'};
  border: 1px solid ${props => props.variant === 'secondary' ? 'rgba(23, 32, 51, 0.14)' : 'rgba(255, 255, 255, 0.12)'};
  padding: 1rem 2rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease, background 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  box-shadow: ${props => props.variant === 'secondary' ? '0 12px 30px rgba(23, 32, 51, 0.08)' : '0 18px 42px rgba(255, 92, 117, 0.28)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.variant === 'secondary' ? '0 18px 42px rgba(23, 32, 51, 0.12)' : '0 24px 56px rgba(255, 92, 117, 0.34)'};
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
  const [isGenerating] = useState(false);

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

            <ControlPanel>
              <TextInput
                type="text"
                placeholder="Enter your custom text..."
                value={data.customText}
                onChange={(e) => {
                  onUpdate({ customText: e.target.value });
                }}
                style={{
                  transition: 'all 0.3s ease',
                  borderColor: data.customText ? '#33d6c5' : 'rgba(23, 32, 51, 0.12)',
                  boxShadow: data.customText ? '0 0 0 4px rgba(51, 214, 197, 0.14)' : 'none'
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

              <RangeControl>
                <label htmlFor="font-size">Engraving Size</label>
                <input
                  id="font-size"
                  type="range"
                  min="12"
                  max="72"
                  value={data.fontSize}
                  onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                />
                <span>{Math.round(data.fontSize)}px</span>
              </RangeControl>
            </ControlPanel>

            <UploadCard>
              <UploadIcon>
                <Upload size={24} />
              </UploadIcon>
              <p>Upload custom image or logo</p>
            </UploadCard>

            <Instructions>
              <InstructionsTitle>💡 How to Use:</InstructionsTitle>
              <InstructionsText>• <strong>Drag</strong> the text overlay to position it on your object</InstructionsText>
              <InstructionsText>• <strong>Resize</strong> text with the size slider or drag the canvas handle</InstructionsText>
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
