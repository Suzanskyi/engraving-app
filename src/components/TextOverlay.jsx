import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';

/**
 * Simplified Canvas-based TextOverlay component
 */
const TextOverlay = ({
    imageUrl,
    imageDescription,
    text = '',
    position = { x: 50, y: 50 },
    font = 'Arial',
    fontSize = 24,
    color = '#333',
    onPositionChange,
    onFontSizeChange,
    width = 600,
    height = 400,
    className,
    style
}) => {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, fontSize: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [animationFrame, setAnimationFrame] = useState(null);
    
    // Animation state for smooth transitions
    const [animatedPosition, setAnimatedPosition] = useState(position);
    const [animatedFontSize, setAnimatedFontSize] = useState(fontSize);
    const [fadeOpacity, setFadeOpacity] = useState(1);

    // Smooth animation utilities
    const lerp = (start, end, factor) => start + (end - start) * factor;

    // Cached image for smooth rendering
    const cachedImage = useMemo(() => {
        if (!imageUrl) return null;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImageLoaded(true);
            // Trigger a smooth fade-in
            setFadeOpacity(0);
            setTimeout(() => setFadeOpacity(1), 50);
        };
        img.onerror = () => {
            setImageLoaded(false);
        };
        img.src = imageUrl;
        return img;
    }, [imageUrl]);
    
    // Helper function to get image scaling information
    const getImageScaling = useCallback(() => {
        if (!imageUrl || !cachedImage || !imageLoaded) {
            return {
                drawWidth: width,
                drawHeight: height,
                offsetX: 0,
                offsetY: 0,
                isImage: false
            };
        }

        const imgAspectRatio = cachedImage.height / cachedImage.width;
        const canvasAspectRatio = height / width;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspectRatio > canvasAspectRatio) {
            drawHeight = height;
            drawWidth = drawHeight / imgAspectRatio;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = width;
            drawHeight = drawWidth * imgAspectRatio;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
        }

        return {
            drawWidth,
            drawHeight,
            offsetX,
            offsetY,
            isImage: true
        };
    }, [imageUrl, cachedImage, imageLoaded, width, height]);

    // Helper function to convert percentage position to pixel coordinates
    const getPixelPosition = useCallback((position) => {
        const scaling = getImageScaling();
        
        if (scaling.isImage) {
            return {
                x: scaling.offsetX + (position.x / 100) * scaling.drawWidth,
                y: scaling.offsetY + (position.y / 100) * scaling.drawHeight
            };
        } else {
            return {
                x: (position.x / 100) * width,
                y: (position.y / 100) * height
            };
        }
    }, [getImageScaling, width, height]);

    // Helper function to convert mouse coordinates to percentage position
    const getPercentageFromMouse = useCallback((mouseX, mouseY) => {
        const scaling = getImageScaling();
        
        if (scaling.isImage) {
            return {
                x: ((mouseX - scaling.offsetX) / scaling.drawWidth) * 100,
                y: ((mouseY - scaling.offsetY) / scaling.drawHeight) * 100
            };
        } else {
            return {
                x: (mouseX / width) * 100,
                y: (mouseY / height) * 100
            };
        }
    }, [getImageScaling, width, height]);
    
    // Animate position and font size changes
    useEffect(() => {
        const animateChanges = () => {
            const positionDiff = Math.abs(animatedPosition.x - position.x) + Math.abs(animatedPosition.y - position.y);
            const fontSizeDiff = Math.abs(animatedFontSize - fontSize);
            
            if (positionDiff > 0.1 || fontSizeDiff > 0.1) {
                setAnimatedPosition(prev => ({
                    x: lerp(prev.x, position.x, 0.15),
                    y: lerp(prev.y, position.y, 0.15)
                }));
                setAnimatedFontSize(prev => lerp(prev, fontSize, 0.15));
                
                const frame = requestAnimationFrame(animateChanges);
                setAnimationFrame(frame);
            } else {
                setAnimatedPosition(position);
                setAnimatedFontSize(fontSize);
                setAnimationFrame(null);
            }
        };
        
        if (!isDragging && !isResizing) {
            animateChanges();
        } else {
            // Immediate updates during interaction
            setAnimatedPosition(position);
            setAnimatedFontSize(fontSize);
        }
        
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [position, fontSize, isDragging, isResizing, animatedPosition, animatedFontSize, animationFrame]);

    // Optimized render function with smooth animations
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas with smooth fade
        ctx.globalAlpha = fadeOpacity;
        ctx.clearRect(0, 0, width, height);
        renderCanvasBase();

        // Render background
        if (imageUrl && cachedImage && imageLoaded) {
            // Calculate dimensions to fit image
            const imgAspectRatio = cachedImage.height / cachedImage.width;
            const canvasAspectRatio = height / width;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgAspectRatio > canvasAspectRatio) {
                drawHeight = height;
                drawWidth = drawHeight / imgAspectRatio;
                offsetX = (width - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = width;
                drawHeight = drawWidth * imgAspectRatio;
                offsetX = 0;
                offsetY = (height - drawHeight) / 2;
            }

            ctx.drawImage(cachedImage, offsetX, offsetY, drawWidth, drawHeight);
        } else if (imageDescription) {
            renderPreview();
        } else {
            renderPlaceholder();
        }
        
        // Always render text
        renderText();
        
        ctx.globalAlpha = 1;

        function renderCanvasBase() {
            const baseGradient = ctx.createLinearGradient(0, 0, width, height);
            baseGradient.addColorStop(0, 'rgba(238, 244, 243, 0.72)');
            baseGradient.addColorStop(1, 'rgba(51, 214, 197, 0.16)');
            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, width, height);
        }

        function renderPlaceholder() {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#62727c';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Upload an image or provide a description', width / 2, height / 2);
        }

        function renderPreview() {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#eef4f3');
            gradient.addColorStop(1, '#f6e9d7');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Simple object representation
            ctx.strokeStyle = '#172033';
            ctx.lineWidth = 2;
            ctx.strokeRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6);
        }

        function renderText() {
            if (!text || !text.trim()) return;

            // Use helper function to get consistent pixel position
            const { x: pixelX, y: pixelY } = getPixelPosition(animatedPosition);

            // Draw text background with animated font size
            ctx.font = `${animatedFontSize}px ${font}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;
            const textHeight = animatedFontSize;

            const padding = 10;
            const bgX = pixelX - textWidth / 2 - padding;
            const bgY = pixelY - textHeight / 2 - padding;
            const bgWidth = textWidth + padding * 2;
            const bgHeight = textHeight + padding * 2;

            // Smooth background color transitions
            let bgColor = 'rgba(255, 255, 255, 0.78)';
            let borderColor = 'rgba(23, 32, 51, 0.18)';
            let borderWidth = 2;
            
            if (isDragging) {
                bgColor = 'rgba(51, 214, 197, 0.28)';
                borderColor = '#33d6c5';
                borderWidth = 3;
            } else if (isHovering) {
                bgColor = 'rgba(255, 255, 255, 0.92)';
                borderColor = '#ff5c75';
                borderWidth = 2.5;
            }

            // Smooth border animation
            ctx.save();
            ctx.shadowColor = 'rgba(23, 32, 51, 0.18)';
            ctx.shadowBlur = isHovering || isDragging ? 8 : 0;
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
            ctx.restore();

            // Draw text with enhanced shadow for better visibility
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillStyle = color;
            ctx.fillText(text, pixelX, pixelY);
            ctx.restore();

            // Animated resize handle when hovering or resizing
            if (isHovering || isResizing) {
                const handleX = bgX + bgWidth - 8;
                const handleY = bgY + bgHeight - 8;
                const handleSize = 16;
                
                // Pulsing animation for resize handle
                const pulseScale = isResizing ? 1.2 : (1 + Math.sin(Date.now() * 0.005) * 0.1);
                const actualSize = handleSize * pulseScale;

                ctx.save();
                ctx.shadowColor = 'rgba(255, 92, 117, 0.36)';
                ctx.shadowBlur = 6;
                
                ctx.fillStyle = isResizing ? '#ff5c75' : '#33d6c5';
                ctx.beginPath();
                ctx.arc(handleX, handleY, actualSize / 2, 0, 2 * Math.PI);
                ctx.fill();

                // Handle border with glow
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                // Animated resize arrows
                ctx.save();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                
                const arrowOffset = actualSize * 0.25;
                ctx.beginPath();
                ctx.moveTo(handleX - arrowOffset, handleY - arrowOffset * 0.5);
                ctx.lineTo(handleX - arrowOffset * 0.5, handleY - arrowOffset);
                ctx.moveTo(handleX - arrowOffset, handleY + arrowOffset * 0.5);
                ctx.lineTo(handleX - arrowOffset * 0.5, handleY + arrowOffset);
                ctx.moveTo(handleX + arrowOffset * 0.5, handleY - arrowOffset);
                ctx.lineTo(handleX + arrowOffset, handleY - arrowOffset * 0.5);
                ctx.moveTo(handleX + arrowOffset * 0.5, handleY + arrowOffset);
                ctx.lineTo(handleX + arrowOffset, handleY + arrowOffset * 0.5);
                ctx.stroke();
                ctx.restore();
            }
        }
    }, [imageUrl, imageDescription, text, animatedPosition, font, animatedFontSize, color, width, height, isDragging, isResizing, isHovering, cachedImage, imageLoaded, fadeOpacity, getPixelPosition]);

    // Get text bounds for hit testing (use animated values for smooth interaction)
    const getTextBounds = useCallback(() => {
        if (!text || !text.trim()) return null;

        // Use helper function to get consistent pixel position
        const { x: pixelX, y: pixelY } = getPixelPosition(animatedPosition);

        const metrics = document.createElement('canvas').getContext('2d');
        metrics.font = `${animatedFontSize}px ${font}`;
        const textMetrics = metrics.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = animatedFontSize;

        const padding = 10;
        const bgX = pixelX - textWidth / 2 - padding;
        const bgY = pixelY - textHeight / 2 - padding;
        const bgWidth = textWidth + padding * 2;
        const bgHeight = textHeight + padding * 2;

        return {
            text: { x: bgX, y: bgY, width: bgWidth, height: bgHeight },
            resize: {
                x: bgX + bgWidth - 16,
                y: bgY + bgHeight - 16,
                width: 16,
                height: 16
            }
        };
    }, [text, animatedPosition, font, animatedFontSize, getPixelPosition]);

    // Mouse event handlers
    const handleMouseDown = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas || !text) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const bounds = getTextBounds();
        if (!bounds) return;

        // Check if clicking on resize handle
        if (x >= bounds.resize.x && x <= bounds.resize.x + bounds.resize.width &&
            y >= bounds.resize.y && y <= bounds.resize.y + bounds.resize.height) {
            setIsResizing(true);
            setResizeStart({ x: e.clientX, y: e.clientY, fontSize });
            e.preventDefault();
            return;
        }

        // Check if clicking on text area
        if (x >= bounds.text.x && x <= bounds.text.x + bounds.text.width &&
            y >= bounds.text.y && y <= bounds.text.y + bounds.text.height) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    }, [text, getTextBounds, fontSize]);

    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas || !text) return;

        if (isDragging) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            const rect = canvas.getBoundingClientRect();
            const mouseX = (dragStart.x - rect.left + deltaX);
            const mouseY = (dragStart.y - rect.top + deltaY);

            // Use helper function to convert mouse coordinates to percentage
            const { x: newX, y: newY } = getPercentageFromMouse(mouseX, mouseY);

            // Constrain to bounds
            const constrainedX = Math.max(10, Math.min(90, newX));
            const constrainedY = Math.max(10, Math.min(90, newY));

            if (onPositionChange) {
                onPositionChange({ x: constrainedX, y: constrainedY });
            }
            return;
        }

        if (isResizing) {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;
            const delta = Math.max(deltaX, deltaY);

            const newSize = Math.max(12, Math.min(72, resizeStart.fontSize + delta / 2));

            if (onFontSizeChange) {
                onFontSizeChange(newSize);
            }
            return;
        }

        // Handle hover detection
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const bounds = getTextBounds();
        if (!bounds) {
            setIsHovering(false);
            canvas.style.cursor = 'default';
            return;
        }

        // Check if hovering over text or resize handle
        const overText = x >= bounds.text.x && x <= bounds.text.x + bounds.text.width &&
                        y >= bounds.text.y && y <= bounds.text.y + bounds.text.height;
        const overResize = x >= bounds.resize.x && x <= bounds.resize.x + bounds.resize.width &&
                          y >= bounds.resize.y && y <= bounds.resize.y + bounds.resize.height;

        if (overResize) {
            setIsHovering(true);
            canvas.style.cursor = 'nw-resize';
            canvas.style.transition = 'all 0.2s ease';
        } else if (overText) {
            setIsHovering(true);
            canvas.style.cursor = 'move';
            canvas.style.transition = 'all 0.2s ease';
        } else {
            setIsHovering(false);
            canvas.style.cursor = 'default';
            canvas.style.transition = 'all 0.2s ease';
        }
    }, [isDragging, isResizing, dragStart, resizeStart, text, getTextBounds, onPositionChange, onFontSizeChange, getPercentageFromMouse]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'default';
        }
    }, []);

    // Setup canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(devicePixelRatio, devicePixelRatio);

        render();
    }, [render, width, height]);

    // Debounced rendering to prevent excessive re-renders
    useEffect(() => {
        let renderTimeout;
        
        const debouncedRender = () => {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                render();
            }, 16); // ~60fps
        };
        
        debouncedRender();
        
        return () => clearTimeout(renderTimeout);
    }, [render]);
    
    // Immediate render for interactions
    useEffect(() => {
        if (isDragging || isResizing || isHovering) {
            render();
        }
    }, [isDragging, isResizing, isHovering, render]);

    // Setup event listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

    // Global mouse up listener for drag operations
    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mouseup', handleMouseUp);
            return () => document.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging, isResizing, handleMouseUp]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                border: `1px solid ${isHovering || isDragging || isResizing ? '#33d6c5' : 'rgba(255,255,255,0.58)'}`,
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(238, 244, 243, 0.56), rgba(51, 214, 197, 0.12))',
                transition: 'all 0.3s ease',
                boxShadow: isHovering || isDragging || isResizing 
                    ? '0 22px 58px rgba(51, 214, 197, 0.18)' 
                    : '0 18px 48px rgba(23, 32, 51, 0.12)',
                transform: isDragging || isResizing ? 'scale(1.02)' : 'scale(1)',
                ...style
            }}
        />
    );
};

export default TextOverlay;
