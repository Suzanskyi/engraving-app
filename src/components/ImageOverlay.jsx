import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';

/**
 * Canvas-based ImageOverlay component for positioning custom images on the base image
 */
const ImageOverlay = ({
    baseImageUrl,
    baseImageDescription,
    overlayImageUrl = null,
    position = { x: 50, y: 50 },
    scale = 1,
    onPositionChange,
    onScaleChange,
    width = 600,
    height = 400,
    className,
    style
}) => {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });
    const [isHovering, setIsHovering] = useState(false);
    const [baseImageLoaded, setBaseImageLoaded] = useState(false);
    const [overlayImageLoaded, setOverlayImageLoaded] = useState(false);
    const [animationFrame, setAnimationFrame] = useState(null);

    // Animation state for smooth transitions
    const [animatedPosition, setAnimatedPosition] = useState(position);
    const [animatedScale, setAnimatedScale] = useState(scale);
    const [fadeOpacity, setFadeOpacity] = useState(1);

    // Smooth animation utilities
    const lerp = (start, end, factor) => start + (end - start) * factor;

    // Cached base image
    const cachedBaseImage = useMemo(() => {
        if (!baseImageUrl) return null;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setBaseImageLoaded(true);
            setFadeOpacity(0);
            setTimeout(() => setFadeOpacity(1), 50);
        };
        img.onerror = () => {
            setBaseImageLoaded(false);
        };
        img.src = baseImageUrl;
        return img;
    }, [baseImageUrl]);

    // Cached overlay image
    const cachedOverlayImage = useMemo(() => {
        if (!overlayImageUrl) return null;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setOverlayImageLoaded(true);
        };
        img.onerror = () => {
            setOverlayImageLoaded(false);
        };
        img.src = overlayImageUrl;
        return img;
    }, [overlayImageUrl]);

    // Helper function to get base image scaling information
    const getBaseImageScaling = useCallback(() => {
        if (!baseImageUrl || !cachedBaseImage || !baseImageLoaded) {
            return {
                drawWidth: width,
                drawHeight: height,
                offsetX: 0,
                offsetY: 0,
                isImage: false
            };
        }

        const imgAspectRatio = cachedBaseImage.height / cachedBaseImage.width;
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
    }, [baseImageUrl, cachedBaseImage, baseImageLoaded, width, height]);

    // Helper function to convert percentage position to pixel coordinates
    const getPixelPosition = useCallback((position) => {
        const scaling = getBaseImageScaling();

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
    }, [getBaseImageScaling, width, height]);

    // Helper function to convert mouse coordinates to percentage position
    const getPercentageFromMouse = useCallback((mouseX, mouseY) => {
        const scaling = getBaseImageScaling();

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
    }, [getBaseImageScaling, width, height]);

    // Animate position and scale changes
    useEffect(() => {
        const animateChanges = () => {
            const positionDiff = Math.abs(animatedPosition.x - position.x) + Math.abs(animatedPosition.y - position.y);
            const scaleDiff = Math.abs(animatedScale - scale);

            if (positionDiff > 0.1 || scaleDiff > 0.01) {
                setAnimatedPosition(prev => ({
                    x: lerp(prev.x, position.x, 0.15),
                    y: lerp(prev.y, position.y, 0.15)
                }));
                setAnimatedScale(prev => lerp(prev, scale, 0.15));

                const frame = requestAnimationFrame(animateChanges);
                setAnimationFrame(frame);
            } else {
                setAnimatedPosition(position);
                setAnimatedScale(scale);
                setAnimationFrame(null);
            }
        };

        if (!isDragging && !isResizing) {
            animateChanges();
        } else {
            // Immediate updates during interaction
            setAnimatedPosition(position);
            setAnimatedScale(scale);
        }

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [position, scale, isDragging, isResizing, animatedPosition, animatedScale, animationFrame]);

    // Optimized render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.globalAlpha = fadeOpacity;
        ctx.clearRect(0, 0, width, height);

        // Render base image
        if (baseImageUrl && cachedBaseImage && baseImageLoaded) {
            const imgAspectRatio = cachedBaseImage.height / cachedBaseImage.width;
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

            ctx.drawImage(cachedBaseImage, offsetX, offsetY, drawWidth, drawHeight);
        } else if (baseImageDescription) {
            renderPreview();
        } else {
            renderPlaceholder();
        }

        // Render overlay image
        if (overlayImageUrl && cachedOverlayImage && overlayImageLoaded) {
            renderOverlayImage();
        }

        ctx.globalAlpha = 1;

        function renderPlaceholder() {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, width, height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Upload an image or provide a description', width / 2, height / 2);
        }

        function renderPreview() {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#f8f9fa');
            gradient.addColorStop(1, '#e9ecef');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Simple object representation
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6);
        }

        function renderOverlayImage() {
            if (!cachedOverlayImage) return;

            const { x: pixelX, y: pixelY } = getPixelPosition(animatedPosition);

            // Calculate overlay image dimensions based on scale
            const baseSize = 100; // Base size in pixels
            const overlayWidth = baseSize * animatedScale;
            const overlayHeight = (cachedOverlayImage.height / cachedOverlayImage.width) * overlayWidth;

            const imgX = pixelX - overlayWidth / 2;
            const imgY = pixelY - overlayHeight / 2;

            // Draw overlay image
            ctx.save();

            // Add shadow for better visibility
            if (isDragging || isHovering) {
                ctx.shadowColor = 'rgba(102, 126, 234, 0.4)';
                ctx.shadowBlur = 10;
            }

            ctx.drawImage(cachedOverlayImage, imgX, imgY, overlayWidth, overlayHeight);
            ctx.restore();

            // Draw border around overlay when hovering or dragging
            if (isHovering || isDragging) {
                ctx.strokeStyle = isDragging ? '#667eea' : '#667eea';
                ctx.lineWidth = isDragging ? 3 : 2;
                ctx.strokeRect(imgX, imgY, overlayWidth, overlayHeight);
            }

            // Draw resize handle
            if (isHovering || isResizing) {
                const handleX = imgX + overlayWidth - 8;
                const handleY = imgY + overlayHeight - 8;
                const handleSize = 16;

                const pulseScale = isResizing ? 1.2 : (1 + Math.sin(Date.now() * 0.005) * 0.1);
                const actualSize = handleSize * pulseScale;

                ctx.save();
                ctx.shadowColor = 'rgba(102, 126, 234, 0.4)';
                ctx.shadowBlur = 6;

                ctx.fillStyle = isResizing ? '#5a6fd8' : '#667eea';
                ctx.beginPath();
                ctx.arc(handleX, handleY, actualSize / 2, 0, 2 * Math.PI);
                ctx.fill();

                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                // Resize arrows
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
    }, [baseImageUrl, baseImageDescription, overlayImageUrl, animatedPosition, animatedScale, width, height, isDragging, isResizing, isHovering, cachedBaseImage, cachedOverlayImage, baseImageLoaded, overlayImageLoaded, fadeOpacity, getPixelPosition]);

    // Get overlay image bounds for hit testing
    const getOverlayBounds = useCallback(() => {
        if (!overlayImageUrl || !cachedOverlayImage || !overlayImageLoaded) return null;

        const { x: pixelX, y: pixelY } = getPixelPosition(animatedPosition);

        const baseSize = 100;
        const overlayWidth = baseSize * animatedScale;
        const overlayHeight = (cachedOverlayImage.height / cachedOverlayImage.width) * overlayWidth;

        const imgX = pixelX - overlayWidth / 2;
        const imgY = pixelY - overlayHeight / 2;

        return {
            image: { x: imgX, y: imgY, width: overlayWidth, height: overlayHeight },
            resize: {
                x: imgX + overlayWidth - 16,
                y: imgY + overlayHeight - 16,
                width: 16,
                height: 16
            }
        };
    }, [overlayImageUrl, cachedOverlayImage, overlayImageLoaded, animatedPosition, animatedScale, getPixelPosition]);

    // Mouse event handlers
    const handleMouseDown = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas || !overlayImageUrl) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const bounds = getOverlayBounds();
        if (!bounds) return;

        // Check if clicking on resize handle
        if (x >= bounds.resize.x && x <= bounds.resize.x + bounds.resize.width &&
            y >= bounds.resize.y && y <= bounds.resize.y + bounds.resize.height) {
            setIsResizing(true);
            setResizeStart({ x: e.clientX, y: e.clientY, scale });
            e.preventDefault();
            return;
        }

        // Check if clicking on overlay image
        if (x >= bounds.image.x && x <= bounds.image.x + bounds.image.width &&
            y >= bounds.image.y && y <= bounds.image.y + bounds.image.height) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    }, [overlayImageUrl, getOverlayBounds, scale]);

    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas || !overlayImageUrl) return;

        if (isDragging) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            const rect = canvas.getBoundingClientRect();
            const mouseX = (dragStart.x - rect.left + deltaX);
            const mouseY = (dragStart.y - rect.top + deltaY);

            const { x: newX, y: newY } = getPercentageFromMouse(mouseX, mouseY);

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

            const newScale = Math.max(0.5, Math.min(3, resizeStart.scale + delta / 100));

            if (onScaleChange) {
                onScaleChange(newScale);
            }
            return;
        }

        // Handle hover detection
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const bounds = getOverlayBounds();
        if (!bounds) {
            setIsHovering(false);
            canvas.style.cursor = 'default';
            return;
        }

        const overImage = x >= bounds.image.x && x <= bounds.image.x + bounds.image.width &&
            y >= bounds.image.y && y <= bounds.image.y + bounds.image.height;
        const overResize = x >= bounds.resize.x && x <= bounds.resize.x + bounds.resize.width &&
            y >= bounds.resize.y && y <= bounds.resize.y + bounds.resize.height;

        if (overResize) {
            setIsHovering(true);
            canvas.style.cursor = 'nw-resize';
        } else if (overImage) {
            setIsHovering(true);
            canvas.style.cursor = 'move';
        } else {
            setIsHovering(false);
            canvas.style.cursor = 'default';
        }
    }, [isDragging, isResizing, dragStart, resizeStart, overlayImageUrl, getOverlayBounds, onPositionChange, onScaleChange, getPercentageFromMouse]);

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

    // Debounced rendering
    useEffect(() => {
        let renderTimeout;

        const debouncedRender = () => {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                render();
            }, 16);
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

    // Global mouse up listener
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
                border: `2px solid ${isHovering || isDragging || isResizing ? '#667eea' : '#e0e0e0'}`,
                borderRadius: '12px',
                background: 'white',
                transition: 'all 0.3s ease',
                boxShadow: isHovering || isDragging || isResizing
                    ? '0 8px 25px rgba(102, 126, 234, 0.15)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1)',
                transform: isDragging || isResizing ? 'scale(1.02)' : 'scale(1)',
                ...style
            }}
        />
    );
};

export default ImageOverlay;
