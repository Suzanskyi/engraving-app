import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ArrowLeft, Send, Eye, Copy, CheckCircle } from 'lucide-react';
import { RequestStorage, ImageComposer } from '../services/index.js';

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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const Section = styled.div`
  background: #f8f9fa;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e0e0e0;
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
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

const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SummaryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SummaryItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const SummaryValue = styled.span`
  color: #333;
  font-weight: 600;
`;

const FinalPreviewSection = styled.div`
  margin-bottom: 2rem;
  background: #f8f9fa;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e0e0e0;
`;

const PreviewTitle = styled.h3`
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PreviewContainer = styled.div`
  position: relative;
  max-width: 100%;
  max-height: 500px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  margin: 0 auto;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 500px;
  display: block;
  width: auto;
  height: auto;
`;



const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: auto;
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

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
`;

const RequestIdContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: center;
`;

const RequestIdLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const RequestIdValue = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  margin-bottom: 1rem;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const RequestDetails = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: left;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: white;
  font-weight: 600;
`;

const Step3Submit = ({ data, onUpdate, onPrev, onNavigateToRequests }) => {
  const [formData, setFormData] = useState({
    name: data.customerInfo.name || '',
    email: data.customerInfo.email || '',
    phone: data.customerInfo.phone || '',
    comments: data.comments || ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalPreviewImage, setFinalPreviewImage] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Use the composed image from Step2 directly - no regeneration needed
  useEffect(() => {
    setFinalPreviewImage(data.composedImage || data.originalImage);
    setIsGeneratingPreview(false);
  }, [data.composedImage, data.originalImage]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate({
      customerInfo: { ...data.customerInfo, [field]: value },
      comments: field === 'comments' ? value : data.comments
    });
  };

  const copyRequestId = async () => {
    if (submissionResult?.id) {
      try {
        await navigator.clipboard.writeText(submissionResult.id);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy request ID:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Prepare request data for storage
      const requestData = {
        originalImage: data.originalImage || null,
        originalText: data.originalText || null,
        composedImage: finalPreviewImage || data.composedImage,
        customText: data.customText,
        textPosition: data.textPosition,
        font: data.font,
        fontSize: data.fontSize,
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        comments: formData.comments
      };

      // Store the request using RequestStorage
      const storedRequest = await RequestStorage.storeRequest(requestData);
      
      setSubmissionResult(storedRequest);
      setIsSubmitted(true);
      
      console.log('Order submitted and stored:', storedRequest);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSummaryValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }
    if (typeof value === 'object' && value.x !== undefined && value.y !== undefined) {
      return `X: ${Math.round(value.x)}, Y: ${Math.round(value.y)}`;
    }
    return value.toString();
  };

  const summaryItems = [
    { label: 'Original Image', value: data.originalImage ? 'Uploaded' : 'Not uploaded' },
    { label: 'Original Text', value: data.originalText || 'Not provided' },
    { label: 'Custom Text', value: data.customText || 'Not provided' },
    { label: 'Font', value: data.font || 'Not specified' },
    { label: 'Font Size', value: data.fontSize ? `${data.fontSize}px` : 'Not specified' },
    { label: 'Text Position', value: data.textPosition || 'Not specified' },
    { label: 'Custom Image', value: data.customImage ? 'Uploaded' : 'Not uploaded' },
    { label: 'Comments', value: data.comments || 'None' }
  ];

  if (isSubmitted && submissionResult && !submissionError) {
    return (
      <StepContainer>
        <ContentWrapper>
          <StepTitle>Thank You!</StepTitle>
          <StepDescription>
            Your engraving request has been submitted successfully. We'll get back to you soon!
          </StepDescription>

          <SuccessMessage>
            <CheckCircle size={24} style={{ marginRight: '0.5rem' }} />
            Order submitted successfully! We'll contact you within 24 hours.
          </SuccessMessage>

          <RequestIdContainer>
            <RequestIdLabel>Your Request ID</RequestIdLabel>
            <RequestIdValue>{submissionResult?.id}</RequestIdValue>
            <CopyButton onClick={copyRequestId}>
              <Copy size={16} />
              Copy Request ID
            </CopyButton>
          </RequestIdContainer>

          <RequestDetails>
            <DetailRow>
              <DetailLabel>Submitted:</DetailLabel>
              <DetailValue>{submissionResult?.timestamp?.toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Status:</DetailLabel>
              <DetailValue style={{ textTransform: 'capitalize' }}>{submissionResult?.status}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Customer:</DetailLabel>
              <DetailValue>{submissionResult?.customerInfo?.name}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Email:</DetailLabel>
              <DetailValue>{submissionResult?.customerInfo?.email}</DetailValue>
            </DetailRow>
          </RequestDetails>

          <ButtonContainer>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Start New Order
            </Button>
            <Button onClick={onNavigateToRequests}>
              View My Requests
            </Button>
          </ButtonContainer>
        </ContentWrapper>
      </StepContainer>
    );
  }

  return (
    <StepContainer>
      <ContentWrapper>
        <StepTitle>Review & Submit</StepTitle>
        <StepDescription>
          Review your order details and provide your contact information to complete the request.
        </StepDescription>

        {submissionError && (
          <ErrorMessage>
            ❌ {submissionError}
          </ErrorMessage>
        )}

        <ContentGrid>
          <Section>
            <SectionTitle>
              <Send size={24} />
              Contact Information
            </SectionTitle>

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number (optional)"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  placeholder="Any special requests or additional information..."
                />
              </FormGroup>
            </form>
          </Section>

          <Section>
            <SectionTitle>
              <Eye size={24} />
              Order Summary
            </SectionTitle>

            <SummaryList>
              {summaryItems.map((item, index) => (
                <SummaryItem key={index}>
                  <SummaryLabel>{item.label}:</SummaryLabel>
                  <SummaryValue>{formatSummaryValue(item.value)}</SummaryValue>
                </SummaryItem>
              ))}
            </SummaryList>
          </Section>
        </ContentGrid>

        {(finalPreviewImage || data.originalImage) && (
          <FinalPreviewSection>
            <PreviewTitle>
              <Eye size={24} />
              Final Design Preview
              {isGeneratingPreview && <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '0.5rem' }}>(Generating...)</span>}
            </PreviewTitle>
            <PreviewContainer>
              {finalPreviewImage ? (
                <PreviewImage src={finalPreviewImage} alt="Final composed preview" />
              ) : (
                <PreviewImage src={data.originalImage} alt="Final preview" />
              )}
            </PreviewContainer>
          </FinalPreviewSection>
        )}

        <ButtonContainer>
          <Button variant="secondary" onClick={onPrev}>
            <ArrowLeft size={20} />
            Back to Customization
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name || !formData.email || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
            <Send size={20} />
          </Button>
        </ButtonContainer>
      </ContentWrapper>
    </StepContainer>
  );
};

export default Step3Submit;
