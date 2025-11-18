import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Type, ArrowRight, Info, CheckCircle } from 'lucide-react';

const StepContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
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

const RequirementsSection = styled.div`
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 0 0 2rem 0;
  text-align: center;
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  backdrop-filter: blur(10px);
  font-size: 0.9rem;
  
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
  border: 2px dashed ${props => props.active ? '#667eea' : '#ddd'};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.05)' : 'white'};
  flex: 1;
  box-sizing: border-box;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
  }
`;

const UploadIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.active ? '#667eea' : '#f0f0f0'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  transition: all 0.3s ease;
  
  svg {
    color: ${props => props.active ? 'white' : '#999'};
  }
`;

const UploadTitle = styled.h3`
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
  font-weight: 600;
`;

const UploadDescription = styled.p`
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 0.75rem;
`;

const UploadExamples = styled.div`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  text-align: left;
`;

const ExamplesTitle = styled.h4`
  color: #333;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
  font-weight: 600;
`;

const ExamplesList = styled.ul`
  color: #666;
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
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
`;

const TextInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  flex: 1;
  margin-top: auto;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const NextButton = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
`;

const OrLine = styled.div`
  width: 2px;
  height: 30px;
  background: linear-gradient(to bottom, transparent, #ddd, transparent);
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
