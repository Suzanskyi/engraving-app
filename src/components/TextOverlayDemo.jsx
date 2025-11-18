import React, { useState } from 'react';
import TextOverlay from './TextOverlay.jsx';

/**
 * Demo component to showcase TextOverlay functionality
 * This demonstrates the canvas-based text overlay with real-time interaction
 */
const TextOverlayDemo = () => {
  const [text, setText] = useState('Sample Text');
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [fontSize, setFontSize] = useState(24);
  const [font, setFont] = useState('arial');
  const [color, setColor] = useState('#333');
  const [imageUrl, setImageUrl] = useState('');
  const [imageDescription, setImageDescription] = useState('A coffee mug');

  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
  };

  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImageDescription(''); // Clear description when image is uploaded
    }
  };

  const fonts = [
    { name: 'Arial', value: 'arial' },
    { name: 'Helvetica', value: 'helvetica' },
    { name: 'Times New Roman', value: 'timesnewroman' },
    { name: 'Georgia', value: 'georgia' },
    { name: 'Verdana', value: 'verdana' },
    { name: 'Courier New', value: 'couriernew' }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>TextOverlay Component Demo</h1>
      <p>This demo shows the canvas-based text overlay with real-time interaction.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Canvas Preview */}
        <div>
          <h3>Interactive Canvas Preview</h3>
          <TextOverlay
            imageUrl={imageUrl}
            imageDescription={imageDescription}
            text={text}
            position={position}
            font={font}
            fontSize={fontSize}
            color={color}
            onPositionChange={handlePositionChange}
            onFontSizeChange={handleFontSizeChange}
            width={600}
            height={400}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            • Drag the text to move it<br/>
            • Drag the blue handle to resize<br/>
            • Hover to see interactive elements
          </p>
        </div>

        {/* Controls */}
        <div>
          <h3>Controls</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Text Content:
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Font Family:
            </label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              {fonts.map(f => (
                <option key={f.value} value={f.value}>{f.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Text Color:
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Upload Image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Or Object Description:
            </label>
            <input
              type="text"
              value={imageDescription}
              onChange={(e) => {
                setImageDescription(e.target.value);
                setImageUrl(''); // Clear image when description is set
              }}
              placeholder="Describe the object to engrave..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Position:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px' }}>X: {position.x.toFixed(1)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.x}
                  onChange={(e) => setPosition({ ...position, x: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px' }}>Y: {position.y.toFixed(1)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.y}
                  onChange={(e) => setPosition({ ...position, y: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li><strong>Canvas-based rendering:</strong> Direct canvas rendering instead of DOM overlays</li>
          <li><strong>Real-time interaction:</strong> Immediate visual feedback during drag and resize</li>
          <li><strong>Mouse event handling:</strong> Drag to move, resize handle for font size</li>
          <li><strong>Unified positioning:</strong> Percentage-based coordinates that work across image sizes</li>
          <li><strong>Visual feedback:</strong> Hover states, drag cursors, and interactive handles</li>
          <li><strong>Boundary constraints:</strong> Text stays within image bounds</li>
          <li><strong>Font size limits:</strong> Constrained between 12px and 72px</li>
          <li><strong>Image support:</strong> Works with uploaded images or text descriptions</li>
        </ul>
      </div>
    </div>
  );
};

export default TextOverlayDemo;