        // Global variables
        let video, canvas, editCanvas, ctx, editCtx;
        let currentStream = null;
        let facingMode = 'user';
        let stickers = [];
        let textElements = [];
        let selectedElement = null;
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let originalImageData = null;
        let textBold = false;
        let textItalic = false;
        let textShadow = false;
        let textStroke = false;
        let textBackground = false;
        let textGradient = false;
        let galleryPhotos = [];
        let currentSlide = 0;
        let slideshowInterval = null;
        let isPlaying = true;
        let isRandomMode = true;
        let shuffledIndices = [];
        let shuffleIndex = 0;
        let autoRefreshInterval = null;

        // Google Apps Script URL
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzx40_02whrwmtoofZduihJFzikDHJ6aP9q18G21I3oohVJ-k-hrNWk8rf7Hq8uh3Xp/exec';

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            initializeElements();
            setupEventListeners();
            loadGallery();
        });

        function initializeElements() {
            video = document.getElementById('video');
            canvas = document.getElementById('canvas');
            editCanvas = document.getElementById('editCanvas');
            ctx = canvas.getContext('2d');
            editCtx = editCanvas.getContext('2d');
        }

        function setupEventListeners() {
            // Navigation
            document.getElementById('cameraBtn').addEventListener('click', () => showSection('camera'));
            document.getElementById('galleryBtn').addEventListener('click', () => showSection('gallery'));

            // Camera controls
            document.getElementById('startCamera').addEventListener('click', startCamera);
            document.getElementById('captureBtn').addEventListener('click', capturePhoto);
            document.getElementById('switchCamera').addEventListener('click', switchCamera);

            // Edit tools
            document.querySelectorAll('.emoji-item').forEach(item => {
                item.addEventListener('click', () => addEmoji(item.dataset.emoji));
            });

            document.getElementById('addText').addEventListener('click', addText);
            document.getElementById('clearAll').addEventListener('click', clearAll);
            document.getElementById('savePhoto').addEventListener('click', savePhoto);
            document.getElementById('uploadPhoto').addEventListener('click', uploadPhoto);

            // Text formatting
            document.getElementById('textBold').addEventListener('click', toggleBold);
            document.getElementById('textItalic').addEventListener('click', toggleItalic);
            document.getElementById('textShadow').addEventListener('click', toggleShadow);
            document.getElementById('textStroke').addEventListener('click', toggleStroke);
            document.getElementById('textBackground').addEventListener('click', toggleBackground);
            document.getElementById('textGradient').addEventListener('click', toggleGradient);

            // Object controls
            document.getElementById('objectSize').addEventListener('input', updateObjectSize);
            document.getElementById('objectRotation').addEventListener('input', updateObjectRotation);
            document.getElementById('objectOpacity').addEventListener('input', updateObjectOpacity);
            document.getElementById('duplicateObject').addEventListener('click', duplicateObject);
            document.getElementById('deleteObject').addEventListener('click', deleteSelectedObject);

            // Text edit controls
            document.getElementById('editTextBold').addEventListener('click', toggleEditBold);
            document.getElementById('editTextItalic').addEventListener('click', toggleEditItalic);
            document.getElementById('editTextShadow').addEventListener('click', toggleEditShadow);
            document.getElementById('editTextStroke').addEventListener('click', toggleEditStroke);
            document.getElementById('editTextBackground').addEventListener('click', toggleEditBackground);
            document.getElementById('editTextGradient').addEventListener('click', toggleEditGradient);
            document.getElementById('applyTextChanges').addEventListener('click', applyTextChanges);

            // Emoji size control
            document.getElementById('emojiSize').addEventListener('input', updateEmojiSize);



            // Gallery
            document.getElementById('refreshGallery').addEventListener('click', loadGallery);
            document.getElementById('playPause').addEventListener('click', toggleSlideshow);
            document.getElementById('randomBtn').addEventListener('click', toggleRandomMode);
            document.getElementById('fullscreenBtn').addEventListener('click', openFullscreen);
            
            // Fullscreen controls
            document.getElementById('closeFullscreen').addEventListener('click', closeFullscreen);
            document.getElementById('fullscreenPrev').addEventListener('click', () => changeFullscreenSlide(-1));
            document.getElementById('fullscreenNext').addEventListener('click', () => changeFullscreenSlide(1));

            // Canvas events
            editCanvas.addEventListener('mousedown', handleMouseDown);
            editCanvas.addEventListener('mousemove', handleMouseMove);
            editCanvas.addEventListener('mouseup', handleMouseUp);
            editCanvas.addEventListener('click', handleCanvasClick);

            // Touch events for mobile
            editCanvas.addEventListener('touchstart', handleTouchStart);
            editCanvas.addEventListener('touchmove', handleTouchMove);
            editCanvas.addEventListener('touchend', handleTouchEnd);

            // Keyboard events
            document.addEventListener('keydown', handleKeyDown);
            
            // Fullscreen keyboard events
            document.addEventListener('keydown', handleFullscreenKeyDown);
        }

        function showSection(section) {
            document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
            document.querySelectorAll('button[id$="Btn"]').forEach(btn => {
                btn.classList.remove('active-tab', 'bg-white', 'text-purple-600');
                btn.classList.add('text-white');
            });

            if (section === 'camera') {
                document.getElementById('cameraSection').style.display = 'block';
                document.getElementById('cameraBtn').classList.add('active-tab', 'bg-white', 'text-purple-600');
                document.getElementById('cameraBtn').classList.remove('text-white');
            } else if (section === 'gallery') {
                document.getElementById('gallerySection').style.display = 'block';
                document.getElementById('galleryBtn').classList.add('active-tab', 'bg-white', 'text-purple-600');
                document.getElementById('galleryBtn').classList.remove('text-white');
                loadGallery();
            }
        }

        async function startCamera() {
            try {
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }

                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                };

                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                video.srcObject = currentStream;
                
                video.style.display = 'block';
                canvas.style.display = 'none';
                document.getElementById('photoContainer').style.display = 'none';
                document.getElementById('editTools').style.display = 'none';

                document.getElementById('captureBtn').disabled = false;
                document.getElementById('switchCamera').disabled = false;
                document.getElementById('startCamera').textContent = '🔄 รีสตาร์ทกล้อง';
            } catch (error) {
                console.error('Error accessing camera:', error);
                alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
            }
        }

        function switchCamera() {
            facingMode = facingMode === 'user' ? 'environment' : 'user';
            startCamera();
        }

        async function capturePhoto() {
            // Disable capture button during countdown
            document.getElementById('captureBtn').disabled = true;
            
            // Show countdown overlay
            showCountdown();
            
            // Wait for countdown to finish
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Take the photo
            ctx.drawImage(video, 0, 0, 640, 480);
            
            // Copy to edit canvas
            editCtx.drawImage(canvas, 0, 0);
            originalImageData = editCtx.getImageData(0, 0, 640, 480);

            video.style.display = 'none';
            document.getElementById('photoContainer').style.display = 'block';
            document.getElementById('editTools').style.display = 'block';

            // Clear previous decorations
            stickers = [];
            textElements = [];
            selectedElement = null;
            
            // Re-enable capture button
            document.getElementById('captureBtn').disabled = false;
        }

        function showCountdown() {
            // Create countdown overlay
            const overlay = document.createElement('div');
            overlay.id = 'countdownOverlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                border-radius: 20px;
            `;
            
            const countdownText = document.createElement('div');
            countdownText.id = 'countdownText';
            countdownText.style.cssText = `
                font-size: 120px;
                font-weight: bold;
                color: white;
                text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
                animation: pulse 1s ease-in-out infinite;
            `;
            
            overlay.appendChild(countdownText);
            document.querySelector('.canvas-container').appendChild(overlay);
            
            // Add pulse animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            // Countdown from 3 to 1
            let count = 3;
            countdownText.textContent = count;
            
            const countdownInterval = setInterval(() => {
                count--;
                if (count > 0) {
                    countdownText.textContent = count;
                } else {
                    countdownText.textContent = '📸';
                    countdownText.style.fontSize = '80px';
                    setTimeout(() => {
                        overlay.remove();
                        style.remove();
                    }, 500);
                    clearInterval(countdownInterval);
                }
            }, 1000);
        }

        function addEmoji(emoji) {
            const defaultSize = parseInt(document.getElementById('emojiSize').value);
            const sticker = {
                id: Date.now(),
                type: 'emoji',
                content: emoji,
                x: Math.random() * 500 + 50,
                y: Math.random() * 350 + 50,
                size: defaultSize,
                rotation: 0,
                opacity: 1
            };
            stickers.push(sticker);
            redrawCanvas();
        }

        function addText() {
            const text = document.getElementById('textInput').value.trim();
            if (!text) return;

            const textElement = {
                id: Date.now(),
                type: 'text',
                content: text,
                x: Math.random() * 400 + 50,
                y: Math.random() * 300 + 100,
                font: document.getElementById('fontSelect').value,
                size: parseInt(document.getElementById('fontSize').value),
                color: document.getElementById('textColor').value,
                bgColor: document.getElementById('textBgColor').value,
                shadowColor: document.getElementById('textShadowColor').value,
                strokeColor: document.getElementById('textStrokeColor').value,
                shadowIntensity: parseInt(document.getElementById('shadowIntensity').value),
                strokeWidth: parseInt(document.getElementById('strokeWidth').value),
                bgOpacity: parseInt(document.getElementById('bgOpacity').value) / 100,
                bold: textBold,
                italic: textItalic,
                shadow: textShadow,
                stroke: textStroke,
                background: textBackground,
                gradient: textGradient,
                rotation: 0,
                opacity: 1
            };
            textElements.push(textElement);
            document.getElementById('textInput').value = '';
            redrawCanvas();
        }

        function redrawCanvas() {
            // Clear canvas
            editCtx.clearRect(0, 0, 640, 480);
            
            // Draw original image
            if (originalImageData) {
                editCtx.putImageData(originalImageData, 0, 0);
            }

            // Draw stickers
            stickers.forEach(sticker => {
                editCtx.save();
                editCtx.globalAlpha = sticker.opacity || 1;
                editCtx.translate(sticker.x + sticker.size/2, sticker.y - sticker.size/2);
                editCtx.rotate((sticker.rotation || 0) * Math.PI / 180);
                editCtx.font = `${sticker.size}px Arial`;
                editCtx.fillText(sticker.content, -sticker.size/2, sticker.size/2);
                editCtx.restore();
                
                if (selectedElement && selectedElement.id === sticker.id) {
                    drawSelection(sticker.x - 10, sticker.y - sticker.size, sticker.size + 20, sticker.size + 10);
                }
            });

            // Draw text elements
            textElements.forEach(element => {
                editCtx.save();
                editCtx.globalAlpha = element.opacity || 1;
                
                // Set font with bold/italic
                let fontStyle = '';
                if (element.italic) fontStyle += 'italic ';
                if (element.bold) fontStyle += 'bold ';
                editCtx.font = `${fontStyle}${element.size}px ${element.font}`;
                
                // Apply rotation
                const metrics = editCtx.measureText(element.content);
                editCtx.translate(element.x + metrics.width/2, element.y - element.size/2);
                editCtx.rotate((element.rotation || 0) * Math.PI / 180);
                
                // Draw background if enabled
                if (element.background) {
                    editCtx.save();
                    editCtx.globalAlpha = element.bgOpacity || 0.8;
                    editCtx.fillStyle = element.bgColor || '#ffffff';
                    const padding = 8;
                    editCtx.fillRect(-metrics.width/2 - padding, -element.size + padding, 
                                   metrics.width + padding * 2, element.size + padding);
                    editCtx.restore();
                }
                
                // Set text color (gradient or solid)
                if (element.gradient) {
                    const gradient = editCtx.createLinearGradient(-metrics.width/2, -element.size/2, 
                                                                metrics.width/2, element.size/2);
                    gradient.addColorStop(0, element.color);
                    gradient.addColorStop(0.5, '#ff6b6b');
                    gradient.addColorStop(1, '#4ecdc4');
                    editCtx.fillStyle = gradient;
                } else {
                    editCtx.fillStyle = element.color;
                }
                
                // Draw shadow if enabled
                if (element.shadow) {
                    editCtx.save();
                    editCtx.shadowColor = element.shadowColor || '#808080';
                    editCtx.shadowBlur = element.shadowIntensity || 3;
                    editCtx.shadowOffsetX = element.shadowIntensity || 3;
                    editCtx.shadowOffsetY = element.shadowIntensity || 3;
                    editCtx.fillText(element.content, -metrics.width/2, element.size/2);
                    editCtx.restore();
                } else {
                    editCtx.fillText(element.content, -metrics.width/2, element.size/2);
                }
                
                // Draw stroke if enabled
                if (element.stroke) {
                    editCtx.strokeStyle = element.strokeColor || '#000000';
                    editCtx.lineWidth = element.strokeWidth || 1;
                    editCtx.strokeText(element.content, -metrics.width/2, element.size/2);
                }
                
                editCtx.restore();
                
                if (selectedElement && selectedElement.id === element.id) {
                    const metrics2 = editCtx.measureText(element.content);
                    drawSelection(element.x - 5, element.y - element.size, metrics2.width + 10, element.size + 10);
                }
            });
            
            // Update object controls if element is selected
            updateObjectControls();
        }

        function drawSelection(x, y, width, height) {
            editCtx.strokeStyle = '#3b82f6';
            editCtx.lineWidth = 2;
            editCtx.setLineDash([5, 5]);
            editCtx.strokeRect(x, y, width, height);
            editCtx.setLineDash([]);
        }



        function handleMouseDown(e) {
            const rect = editCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            selectedElement = getElementAt(x, y);
            if (selectedElement) {
                isDragging = true;
                dragOffset.x = x - selectedElement.x;
                dragOffset.y = y - selectedElement.y;
                redrawCanvas();
            }
        }

        function handleMouseMove(e) {
            if (!isDragging || !selectedElement) return;

            const rect = editCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            selectedElement.x = x - dragOffset.x;
            selectedElement.y = y - dragOffset.y;
            redrawCanvas();
        }

        function handleMouseUp() {
            isDragging = false;
        }

        function handleCanvasClick(e) {
            if (!isDragging) {
                const rect = editCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                selectedElement = getElementAt(x, y);
                redrawCanvas();
            }
        }

        // Touch events
        function handleTouchStart(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            editCanvas.dispatchEvent(mouseEvent);
        }

        function handleTouchMove(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            editCanvas.dispatchEvent(mouseEvent);
        }

        function handleTouchEnd(e) {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            editCanvas.dispatchEvent(mouseEvent);
        }

        function handleKeyDown(e) {
            if (e.key === 'Delete' && selectedElement) {
                if (selectedElement.type === 'emoji') {
                    stickers = stickers.filter(s => s.id !== selectedElement.id);
                } else if (selectedElement.type === 'text') {
                    textElements = textElements.filter(t => t.id !== selectedElement.id);
                }
                selectedElement = null;
                redrawCanvas();
            }
        }

        function getElementAt(x, y) {
            // Check text elements first (they're on top)
            for (let i = textElements.length - 1; i >= 0; i--) {
                const element = textElements[i];
                editCtx.font = `${element.size}px ${element.font}`;
                const metrics = editCtx.measureText(element.content);
                
                if (x >= element.x && x <= element.x + metrics.width &&
                    y >= element.y - element.size && y <= element.y) {
                    return element;
                }
            }

            // Check stickers
            for (let i = stickers.length - 1; i >= 0; i--) {
                const sticker = stickers[i];
                if (x >= sticker.x && x <= sticker.x + sticker.size &&
                    y >= sticker.y - sticker.size && y <= sticker.y) {
                    return sticker;
                }
            }

            return null;
        }

        function clearAll() {
            stickers = [];
            textElements = [];
            selectedElement = null;
            redrawCanvas();
        }

        function savePhoto() {
            const link = document.createElement('a');
            link.download = `photo-booth-${Date.now()}.png`;
            link.href = editCanvas.toDataURL();
            link.click();
        }

        async function uploadPhoto() {
            try {
                showUploadModal(true);
                
                const dataURL = editCanvas.toDataURL('image/png');
                const base64Data = dataURL.split(',')[1];
                
                const formData = new FormData();
                formData.append('file', base64Data);
                formData.append('action', 'upload');
                formData.append('filename', `photo-booth-${Date.now()}.png`);

                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    showUploadStatus('สำเร็จ!', 'อัปโหลดรูปภาพเรียบร้อยแล้ว', 'success');
                    setTimeout(() => {
                        showUploadModal(false);
                        loadGallery();
                    }, 2000);
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                showUploadStatus('เกิดข้อผิดพลาด', 'ไม่สามารถอัปโหลดได้ กรุณาลองใหม่', 'error');
                setTimeout(() => showUploadModal(false), 3000);
            }
        }

        function dataURLToBlob(dataURL) {
            const arr = dataURL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        }

        function showUploadModal(show) {
            document.getElementById('uploadModal').style.display = show ? 'flex' : 'none';
        }

        function showUploadStatus(title, message, type) {
            const statusDiv = document.getElementById('uploadStatus');
            const icon = type === 'success' ? '✅' : '❌';
            statusDiv.innerHTML = `
                <div class="text-4xl mb-4">${icon}</div>
                <p class="text-lg font-medium mb-2">${title}</p>
                <p class="text-gray-600">${message}</p>
            `;
        }

        async function loadGallery() {
            try {
                document.getElementById('loadingGallery').style.display = 'block';
                document.getElementById('slideshowContainer').style.display = 'none';
                document.getElementById('slideControls').style.display = 'none';
                document.getElementById('noPhotos').style.display = 'none';

                const response = await fetch(`${SCRIPT_URL}?action=list`);
                const result = await response.json();

                if (result.success && result.files && result.files.length > 0) {
                    galleryPhotos = result.files;
                    displaySlideshow();
                } else {
                    document.getElementById('loadingGallery').style.display = 'none';
                    document.getElementById('noPhotos').style.display = 'block';
                }
            } catch (error) {
                console.error('Error loading gallery:', error);
                document.getElementById('loadingGallery').style.display = 'none';
                document.getElementById('noPhotos').style.display = 'block';
            }
        }

        function displaySlideshow() {
            const slidesContainer = document.getElementById('slides');
            slidesContainer.innerHTML = '';

            galleryPhotos.forEach((photo, index) => {
                const slide = document.createElement('div');
                slide.className = 'slide';
                if (index === 0) slide.classList.add('active');

                // Use direct Google Drive image URL with proper format
                const imageUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w640-h480`;
                
                slide.innerHTML = `
                    <img src="${imageUrl}" alt="Photo ${index + 1}" loading="lazy" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDY0MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iNDgwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im0zMjAgMjQwIDgwLTgwdjE2MGwtODAtODB6bS04MCA4MCA4MC04MHYxNjBsLTgwLTgweiIgZmlsbD0iIzlmYTJhNyIvPgo8dGV4dCB4PSIzMjAiIHk9IjI2MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3Mjg0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7guYTguKHguYjguKrguLLguKHguLLguKPguJbguYLguKvguKXguJTguYTguJTguYk8L3RleHQ+Cjwvc3ZnPgo='; this.alt='ไม่สามารถโหลดรูปภาพได้';">
                    <div class="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg">
                        ${photo.name}
                    </div>
                `;
                slidesContainer.appendChild(slide);
            });

            document.getElementById('loadingGallery').style.display = 'none';
            document.getElementById('slideshowContainer').style.display = 'block';
            document.getElementById('slideControls').style.display = 'block';

            currentSlide = 0;
            generateShuffledIndices(); // Initialize random mode
            updateSlideCounter();
            startSlideshow();
            startAutoRefresh(); // Start auto-refresh for new photos
        }

        function changeSlide(direction) {
            const slides = document.querySelectorAll('.slide');
            slides[currentSlide].classList.remove('active');

            currentSlide += direction;
            if (currentSlide >= slides.length) currentSlide = 0;
            if (currentSlide < 0) currentSlide = slides.length - 1;

            slides[currentSlide].classList.add('active');
            updateSlideCounter();
        }

        function updateSlideCounter() {
            document.getElementById('slideCounter').textContent = 
                `${currentSlide + 1} / ${galleryPhotos.length}`;
        }

        function startSlideshow() {
            if (slideshowInterval) clearInterval(slideshowInterval);
            if (isPlaying && galleryPhotos.length > 1) {
                slideshowInterval = setInterval(() => {
                    if (isRandomMode) {
                        changeToRandomSlide();
                    } else {
                        changeSlide(1);
                    }
                }, 3000);
            }
        }

        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        function generateShuffledIndices() {
            const indices = Array.from({ length: galleryPhotos.length }, (_, i) => i);
            shuffledIndices = shuffleArray(indices);
            shuffleIndex = 0;
        }

        function changeToRandomSlide() {
            if (shuffledIndices.length === 0 || shuffleIndex >= shuffledIndices.length) {
                generateShuffledIndices();
            }
            
            const slides = document.querySelectorAll('.slide');
            slides[currentSlide].classList.remove('active');
            
            currentSlide = shuffledIndices[shuffleIndex];
            shuffleIndex++;
            
            slides[currentSlide].classList.add('active');
            updateSlideCounter();
        }

        function toggleRandomMode() {
            isRandomMode = !isRandomMode;
            const button = document.getElementById('randomBtn');
            
            if (isRandomMode) {
                button.innerHTML = '🎲 สุ่ม';
                button.classList.remove('bg-gray-500', 'hover:bg-gray-600');
                button.classList.add('bg-green-500', 'hover:bg-green-600');
                generateShuffledIndices();
            } else {
                button.innerHTML = '📋 เรียง';
                button.classList.remove('bg-green-500', 'hover:bg-green-600');
                button.classList.add('bg-gray-500', 'hover:bg-gray-600');
            }
            
            // Restart slideshow with new mode
            if (isPlaying) {
                startSlideshow();
            }
        }

        function startAutoRefresh() {
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            autoRefreshInterval = setInterval(async () => {
                const currentLength = galleryPhotos.length;
                await loadGalleryQuietly();
                
                // If new photos were added, update the shuffle indices
                if (galleryPhotos.length > currentLength && isRandomMode) {
                    generateShuffledIndices();
                }
            }, 30000); // Check for new photos every 30 seconds
        }

        async function loadGalleryQuietly() {
            try {
                const response = await fetch(`${SCRIPT_URL}?action=list`);
                const result = await response.json();

                if (result.success && result.files && result.files.length > 0) {
                    const oldLength = galleryPhotos.length;
                    galleryPhotos = result.files;
                    
                    // If new photos were added, update the slideshow
                    if (galleryPhotos.length > oldLength) {
                        updateSlideshowWithNewPhotos(oldLength);
                    }
                }
            } catch (error) {
                console.error('Error quietly loading gallery:', error);
            }
        }

        function updateSlideshowWithNewPhotos(oldLength) {
            const slidesContainer = document.getElementById('slides');
            
            // Add new slides
            for (let i = oldLength; i < galleryPhotos.length; i++) {
                const photo = galleryPhotos[i];
                const slide = document.createElement('div');
                slide.className = 'slide';
                
                const imageUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w640-h480`;
                
                slide.innerHTML = `
                    <img src="${imageUrl}" alt="Photo ${i + 1}" loading="lazy" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDY0MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iNDgwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im0zMjAgMjQwIDgwLTgwdjE2MGwtODAtODB6bS04MCA4MCA4MC04MHYxNjBsLTgwLTgweiIgZmlsbD0iIzlmYTJhNyIvPgo8dGV4dCB4PSIzMjAiIHk9IjI2MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmI3Mjg0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7guYTguKHguYjguKrguLLguKHguLLguKPguJbguYLguKvguKXguJTguYTguJTguYk8L3RleHQ+Cjwvc3ZnPgo='; this.alt='ไม่สามารถโหลดรูปภาพได้';">
                    <div class="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg">
                        ${photo.name}
                    </div>
                `;
                slidesContainer.appendChild(slide);
            }
            
            updateSlideCounter();
        }

        function toggleSlideshow() {
            isPlaying = !isPlaying;
            const button = document.getElementById('playPause');
            
            if (isPlaying) {
                button.innerHTML = '⏸️ หยุด';
                startSlideshow();
            } else {
                button.innerHTML = '▶️ เล่น';
                if (slideshowInterval) {
                    clearInterval(slideshowInterval);
                    slideshowInterval = null;
                }
            }
        }

        function openFullscreen() {
            if (galleryPhotos.length === 0) return;
            
            document.getElementById('fullscreenModal').style.display = 'flex';
            updateFullscreenImage();
            
            // Don't pause slideshow when entering fullscreen
            // Keep the current playing state
        }

        function closeFullscreen() {
            document.getElementById('fullscreenModal').style.display = 'none';
        }

        function changeFullscreenSlide(direction) {
            if (isRandomMode && direction === 1) {
                // Use random mode for forward navigation
                if (shuffledIndices.length === 0 || shuffleIndex >= shuffledIndices.length) {
                    generateShuffledIndices();
                }
                currentSlide = shuffledIndices[shuffleIndex];
                shuffleIndex++;
            } else {
                // Manual navigation (backward or when not in random mode)
                currentSlide += direction;
                if (currentSlide >= galleryPhotos.length) currentSlide = 0;
                if (currentSlide < 0) currentSlide = galleryPhotos.length - 1;
            }
            
            updateFullscreenImage();
            
            // Also update the main slideshow
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => slide.classList.remove('active'));
            slides[currentSlide].classList.add('active');
            updateSlideCounter();
        }

        function updateFullscreenImage() {
            if (galleryPhotos.length === 0) return;
            
            const photo = galleryPhotos[currentSlide];
            const imageUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w1920-h1080`;
            
            document.getElementById('fullscreenImage').src = imageUrl;
            document.getElementById('fullscreenImageName').textContent = photo.name;
            document.getElementById('fullscreenCounter').textContent = `${currentSlide + 1} / ${galleryPhotos.length}`;
        }

        function handleFullscreenKeyDown(e) {
            const fullscreenModal = document.getElementById('fullscreenModal');
            if (fullscreenModal.style.display === 'none') return;
            
            switch(e.key) {
                case 'Escape':
                    closeFullscreen();
                    break;
                case 'ArrowLeft':
                    changeFullscreenSlide(-1);
                    break;
                case 'ArrowRight':
                    changeFullscreenSlide(1);
                    break;
            }
        }

        // New functions for advanced editing
        function toggleBold() {
            textBold = !textBold;
            const btn = document.getElementById('textBold');
            if (textBold) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            }
        }

        function toggleItalic() {
            textItalic = !textItalic;
            const btn = document.getElementById('textItalic');
            if (textItalic) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            }
        }

        function toggleShadow() {
            textShadow = !textShadow;
            const btn = document.getElementById('textShadow');
            if (textShadow) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            }
        }

        function toggleStroke() {
            textStroke = !textStroke;
            const btn = document.getElementById('textStroke');
            if (textStroke) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            }
        }

        function toggleBackground() {
            textBackground = !textBackground;
            const btn = document.getElementById('textBackground');
            if (textBackground) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            }
        }

        function toggleGradient() {
            textGradient = !textGradient;
            const btn = document.getElementById('textGradient');
            if (textGradient) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            }
        }

        function updateObjectControls() {
            if (selectedElement) {
                document.getElementById('objectControls').style.display = 'block';
                document.getElementById('noObjectSelected').style.display = 'none';
                
                // Show/hide text edit controls based on element type
                if (selectedElement.type === 'text') {
                    document.getElementById('textEditControls').style.display = 'block';
                    populateTextEditControls();
                } else {
                    document.getElementById('textEditControls').style.display = 'none';
                }
                
                // Update control values
                document.getElementById('objectSize').value = selectedElement.size || 40;
                document.getElementById('objectRotation').value = selectedElement.rotation || 0;
                document.getElementById('objectOpacity').value = (selectedElement.opacity || 1) * 100;
                
                // Update display values
                document.getElementById('sizeValue').textContent = selectedElement.size || 40;
                document.getElementById('rotationValue').textContent = `${selectedElement.rotation || 0}°`;
                document.getElementById('opacityValue').textContent = `${Math.round((selectedElement.opacity || 1) * 100)}%`;
                
                // Update object name
                const name = selectedElement.type === 'emoji' ? 
                    `อีโมจิ: ${selectedElement.content}` : 
                    `ข้อความ: ${selectedElement.content.substring(0, 10)}${selectedElement.content.length > 10 ? '...' : ''}`;
                document.getElementById('selectedObjectName').textContent = name;
            } else {
                document.getElementById('objectControls').style.display = 'none';
                document.getElementById('noObjectSelected').style.display = 'block';
            }
        }

        function updateObjectSize() {
            if (!selectedElement) return;
            selectedElement.size = parseInt(document.getElementById('objectSize').value);
            document.getElementById('sizeValue').textContent = selectedElement.size;
            redrawCanvas();
        }

        function updateObjectRotation() {
            if (!selectedElement) return;
            selectedElement.rotation = parseInt(document.getElementById('objectRotation').value);
            document.getElementById('rotationValue').textContent = `${selectedElement.rotation}°`;
            redrawCanvas();
        }

        function updateObjectOpacity() {
            if (!selectedElement) return;
            selectedElement.opacity = parseInt(document.getElementById('objectOpacity').value) / 100;
            document.getElementById('opacityValue').textContent = `${Math.round(selectedElement.opacity * 100)}%`;
            redrawCanvas();
        }

        function updateEmojiSize() {
            // This updates the default size for new emojis
            // Existing emojis are updated through object controls
        }

        function duplicateObject() {
            if (!selectedElement) return;
            
            const newElement = { ...selectedElement };
            newElement.id = Date.now();
            newElement.x += 20;
            newElement.y += 20;
            
            if (selectedElement.type === 'emoji') {
                stickers.push(newElement);
            } else {
                textElements.push(newElement);
            }
            
            selectedElement = newElement;
            redrawCanvas();
        }

        function deleteSelectedObject() {
            if (!selectedElement) return;
            
            if (selectedElement.type === 'emoji') {
                stickers = stickers.filter(s => s.id !== selectedElement.id);
            } else {
                textElements = textElements.filter(t => t.id !== selectedElement.id);
            }
            
            selectedElement = null;
            redrawCanvas();
        }



        // Text editing functions
        function populateTextEditControls() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            
            // Populate form fields with current text element properties
            document.getElementById('editTextContent').value = selectedElement.content || '';
            document.getElementById('editFontSelect').value = selectedElement.font || 'Kanit';
            document.getElementById('editFontSize').value = selectedElement.size || 24;
            document.getElementById('editTextColor').value = selectedElement.color || '#000000';
            document.getElementById('editTextBgColor').value = selectedElement.bgColor || '#ffffff';
            document.getElementById('editTextShadowColor').value = selectedElement.shadowColor || '#808080';
            document.getElementById('editTextStrokeColor').value = selectedElement.strokeColor || '#000000';
            document.getElementById('editShadowIntensity').value = selectedElement.shadowIntensity || 3;
            document.getElementById('editStrokeWidth').value = selectedElement.strokeWidth || 1;
            document.getElementById('editBgOpacity').value = (selectedElement.bgOpacity || 0.8) * 100;
            
            // Update button states
            updateEditButton('editTextBold', selectedElement.bold);
            updateEditButton('editTextItalic', selectedElement.italic);
            updateEditButton('editTextShadow', selectedElement.shadow);
            updateEditButton('editTextStroke', selectedElement.stroke);
            updateEditButton('editTextBackground', selectedElement.background);
            updateEditButton('editTextGradient', selectedElement.gradient);
        }

        function updateEditButton(buttonId, isActive) {
            const btn = document.getElementById(buttonId);
            if (isActive) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200');
            }
        }

        function toggleEditBold() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            selectedElement.bold = !selectedElement.bold;
            updateEditButton('editTextBold', selectedElement.bold);
        }

        function toggleEditItalic() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            selectedElement.italic = !selectedElement.italic;
            updateEditButton('editTextItalic', selectedElement.italic);
        }

        function toggleEditShadow() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            selectedElement.shadow = !selectedElement.shadow;
            updateEditButton('editTextShadow', selectedElement.shadow);
        }

        function toggleEditStroke() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            selectedElement.stroke = !selectedElement.stroke;
            updateEditButton('editTextStroke', selectedElement.stroke);
        }

        function toggleEditBackground() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            selectedElement.background = !selectedElement.background;
            updateEditButton('editTextBackground', selectedElement.background);
        }

        function toggleEditGradient() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            selectedElement.gradient = !selectedElement.gradient;
            updateEditButton('editTextGradient', selectedElement.gradient);
        }

        function applyTextChanges() {
            if (!selectedElement || selectedElement.type !== 'text') return;
            
            // Apply all changes from the edit form
            selectedElement.content = document.getElementById('editTextContent').value || selectedElement.content;
            selectedElement.font = document.getElementById('editFontSelect').value;
            selectedElement.size = parseInt(document.getElementById('editFontSize').value) || selectedElement.size;
            selectedElement.color = document.getElementById('editTextColor').value;
            selectedElement.bgColor = document.getElementById('editTextBgColor').value;
            selectedElement.shadowColor = document.getElementById('editTextShadowColor').value;
            selectedElement.strokeColor = document.getElementById('editTextStrokeColor').value;
            selectedElement.shadowIntensity = parseInt(document.getElementById('editShadowIntensity').value);
            selectedElement.strokeWidth = parseInt(document.getElementById('editStrokeWidth').value);
            selectedElement.bgOpacity = parseInt(document.getElementById('editBgOpacity').value) / 100;
            
            // Update object name display
            const name = `ข้อความ: ${selectedElement.content.substring(0, 10)}${selectedElement.content.length > 10 ? '...' : ''}`;
            document.getElementById('selectedObjectName').textContent = name;
            
            // Redraw canvas with updated text
            redrawCanvas();
        }

        // Global function for navigation buttons
        window.changeSlide = changeSlide;
