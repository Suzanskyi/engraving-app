import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Type, ArrowRight, Info, CheckCircle } from 'lucide-react';

const StepContainer = styled.div`
  background: rgba(255, 255, 255, 0.14);
  width: 100%;
  min-height: calc(100vh - 200px);
  padding: 2rem;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
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
  margin-bottom: 1.5rem;
  line-height: 1.6;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const RequirementsSection = styled.div`
  background: linear-gradient(135deg, rgba(28, 154, 138, 0.92), rgba(255, 184, 77, 0.82));
  color: white;
  border-radius: 18px;
  padding: 1.5rem;
  margin: 0 0 2rem 0;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.34);
  box-shadow: 0 18px 50px rgba(31, 94, 92, 0.24);
`;

const RequirementsTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const RequirementsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  text-align: left;
`;

const RequirementItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  font-size: 0.9rem;
  border: 1px solid rgba(255,255,255,0.16);
  
  svg {
    color: #ffffff;
    flex-shrink: 0;
  }
`;

const UploadSection = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex: 1;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const UploadCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  border: 1px solid ${props => props.active ? 'rgba(255, 92, 117, 0.68)' : 'rgba(255,255,255,0.42)'};
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(255, 238, 222, 0.68))' : 'rgba(255, 255, 255, 0.58)'};
  flex: 1;
  box-sizing: border-box;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-shadow: ${props => props.active ? '0 24px 60px rgba(255, 92, 117, 0.16)' : '0 16px 48px rgba(23, 32, 51, 0.10)'};
  backdrop-filter: blur(20px) saturate(150%);
  
  &:hover {
    border-color: rgba(51, 214, 197, 0.8);
    transform: translateY(-4px);
    box-shadow: 0 24px 70px rgba(22, 69, 80, 0.18);
  }
`;

const UploadIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.active ? 'linear-gradient(135deg, #ffb84d, #ff5c75)' : 'rgba(23, 32, 51, 0.08)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  transition: all 0.3s ease;
  
  svg {
    color: ${props => props.active ? 'white' : 'rgba(23, 32, 51, 0.58)'};
  }
`;

const UploadTitle = styled.h3`
  color: #172033;
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
  font-weight: 600;
`;

const UploadDescription = styled.p`
  color: rgba(23, 32, 51, 0.68);
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 0.75rem;
`;

const UploadExamples = styled.div`
  background: rgba(255, 255, 255, 0.42);
  border-radius: 12px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  text-align: left;
`;

const ExamplesTitle = styled.h4`
  color: #172033;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
  font-weight: 600;
`;

const ExamplesList = styled.ul`
  color: rgba(23, 32, 51, 0.68);
  font-size: 0.75rem;
  margin: 0;
  padding-left: 1rem;
  line-height: 1.3;
`;

const ImagePreview = styled.div`
  margin-top: 1rem;
  
  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 16px;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.16);
  }
`;

const TextInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid rgba(23, 32, 51, 0.12);
  border-radius: 14px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  box-sizing: border-box;
  flex: 1;
  margin-top: auto;
  
  background: rgba(255,255,255,0.66);
  color: #172033;

  &:focus {
    outline: none;
    border-color: #33d6c5;
    box-shadow: 0 0 0 4px rgba(51, 214, 197, 0.16);
    background: rgba(255,255,255,0.9);
  }
`;

const NextButton = styled.button`
  background: linear-gradient(135deg, #ffb84d, #ff5c75);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto 1rem;
  
  box-shadow: 0 18px 42px rgba(255, 92, 117, 0.28);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 24px 56px rgba(255, 92, 117, 0.34);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const OrDivider = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  font-weight: 600;
  font-size: 1.2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const OrCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #33d6c5, #ffb84d);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 12px 34px rgba(23, 32, 51, 0.18);
`;

const OrLine = styled.div`
  width: 2px;
  height: 30px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.65), transparent);
  margin: 0.5rem 0;
`;

const Step1Upload = ({ data, onUpdate, onNext }) => {
  const [uploadType, setUploadType] = useState(null);

  const onImageDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({ originalImage: reader.result });
        setUploadType('image');
      };
      reader.readAsDataURL(file);
    }
  }, [onUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  });

  const handleTextChange = (e) => {
    onUpdate({ originalText: e.target.value });
    setUploadType('text');
  };

  const canProceed = () => {
    return (data.originalImage && uploadType === 'image') ||
      (data.originalText.trim() && uploadType === 'text');
  };

  return (
    <StepContainer>
      <ContentWrapper>
        <StepTitle>Upload Your Object</StepTitle>
        <StepDescription>
          Start by uploading an image of the object you want engraved, or describe it in detail below.
        </StepDescription>

        <RequirementsSection>
          <RequirementsTitle>
            ✨ What We Can Do For You
          </RequirementsTitle>
          <RequirementsList>
            <RequirementItem>
              🎨 <span><strong>Custom Engraving:</strong> Personalize any object with your text or design</span>
            </RequirementItem>
            <RequirementItem>
              🔥 <span><strong>Professional Quality:</strong> Precise laser engraving on various materials</span>
            </RequirementItem>
            <RequirementItem>
              🎭 <span><strong>Creative Freedom:</strong> Choose from multiple fonts, sizes, and styles</span>
            </RequirementItem>
            <RequirementItem>
              🎯 <span><strong>Perfect Positioning:</strong> Place your design exactly where you want it</span>
            </RequirementItem>
          </RequirementsList>
        </RequirementsSection>

        <UploadSection>
          <UploadCard
            {...getRootProps()}
            active={isDragActive || (uploadType === 'image')}
          >
            <input {...getInputProps()} />
            <UploadIcon active={isDragActive || (uploadType === 'image')}>
              <Image size={28} />
            </UploadIcon>
            <UploadTitle>Upload Image</UploadTitle>
            <UploadDescription>
              Drag & drop an image here, or click to browse
            </UploadDescription>
            <UploadExamples>
              <ExamplesTitle>📸 Good Examples:</ExamplesTitle>
              <ExamplesList>
                <li>Clear, well-lit photos</li>
                <li>Show the entire object</li>
                <li>Highlight the engraving area</li>
                <li>Include size reference if possible</li>
              </ExamplesList>
            </UploadExamples>
            {data.originalImage && (
              <ImagePreview>
                <img src={data.originalImage} alt="Preview" />
              </ImagePreview>
            )}
          </UploadCard>

          <OrDivider>
            <OrLine />
            <OrCircle>OR</OrCircle>
            <OrLine />
          </OrDivider>

          <UploadCard
            active={uploadType === 'text'}
            onClick={() => setUploadType('text')}
          >
            <UploadIcon active={uploadType === 'text'}>
              <Type size={28} />
            </UploadIcon>
            <UploadTitle>Describe Object</UploadTitle>
            <UploadDescription>
              Write a detailed description of what you want engraved
            </UploadDescription>
            <UploadExamples>
              <ExamplesTitle>✍️ Include These Details:</ExamplesTitle>
              <ExamplesList>
                <li>Object type and material</li>
                <li>Dimensions and weight</li>
                <li>Surface texture and color</li>
                <li>Specific engraving location</li>
              </ExamplesList>
            </UploadExamples>
            <TextInput
              placeholder="Describe the object, material, size, and any specific details..."
              value={data.originalText}
              onChange={handleTextChange}
              onClick={() => setUploadType('text')}
            />
          </UploadCard>
        </UploadSection>

        <NextButton
          onClick={onNext}
          disabled={!canProceed()}
        >
          Continue to Customization
          <ArrowRight size={20} />
        </NextButton>
      </ContentWrapper>
    </StepContainer>
  );
};

export default Step1Upload;
