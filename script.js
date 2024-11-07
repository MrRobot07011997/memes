// Canvas setup
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 500;
canvas.height = 500;

// State management
let backgroundImage = null;
let overlayImages = [];
let texts = [];
let selectedElement = null;
let isDragging = false;
let lastTouchX = 0;
let lastTouchY = 0;

// Template URLs
const templates = {
    'drake': 'https://i.imgflip.com/30b1gx.jpg',
    'distracted': 'https://i.imgflip.com/1ur9b0.jpg',
    'buttons': 'https://i.imgflip.com/1g8my4.jpg'
};

// Helper function to load images
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.crossOrigin = 'Anonymous'; // Add this to allow cross-origin image access
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw overlay images
    overlayImages.forEach(img => {
        ctx.save();
        ctx.beginPath();

        switch (img.shape) {
            case 'circle':
                ctx.arc(img.x + img.width / 2, img.y + img.height / 2, img.width / 2, 0, Math.PI * 2);
                ctx.clip();
                break;
            case 'triangle':
                ctx.moveTo(img.x + img.width / 2, img.y);
                ctx.lineTo(img.x, img.y + img.height);
                ctx.lineTo(img.x + img.width, img.y + img.height);
                ctx.closePath();
                ctx.clip();
                break;
        }

        ctx.drawImage(img.image, img.x, img.y, img.width, img.height);
        ctx.restore();

        if (selectedElement === img) {
            ctx.strokeStyle = '#4299e1';
            ctx.lineWidth = 2;
            ctx.strokeRect(img.x, img.y, img.width, img.height);
        }
    });

    // Draw texts
    texts.forEach(text => {
        ctx.fillStyle = text.color;
        ctx.font = `${text.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(text.content, text.x, text.y);

        if (selectedElement === text) {
            const metrics = ctx.measureText(text.content);
            ctx.strokeStyle = '#4299e1';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                text.x - metrics.width / 2,
                text.y - text.size,
                metrics.width,
                text.size
            );
        }
    });
}

// Event Handlers
document.getElementById('templateSelector').addEventListener('change', async (e) => {
    const template = templates[e.target.value];
    if (template) {
        try {
            backgroundImage = await loadImage(template);
            draw();
        } catch (error) {
            console.error('Failed to load template:', error);
        }
    }
});

document.getElementById('backgroundUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                backgroundImage = await loadImage(event.target.result);
                draw();
            } catch (error) {
                console.error('Failed to load background image:', error);
            }
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('overlayUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const img = await loadImage(event.target.result);
                overlayImages.push({
                    image: img,
                    x: 50,
                    y: 50,
                    width: 100,
                    height: 100,
                    shape: 'rectangle'
                });
                draw();
            } catch (error) {
                console.error('Failed to load overlay image:', error);
            }
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('addTextBtn').addEventListener('click', () => {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    if (text) {
        texts.push({
            content: text,
            x: canvas.width / 2,
            y: canvas.height / 2,
            color: document.getElementById('textColor').value,
            size: parseInt(document.getElementById('textSize').value)
        });
        textInput.value = '';
        draw();
    }
});

// Touch and mouse event handlers
function getEventPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    return { x, y };
}

function findElementAtPosition(x, y) {
    // Check overlay images first (in reverse order to get top-most first)
    for (let i = overlayImages.length - 1; i >= 0; i--) {
        const img = overlayImages[i];
        if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
            return img;
        }
    }

    // Then check texts
    for (let i = texts.length - 1; i >= 0; i--) {
        const text = texts[i];
        const metrics = ctx.measureText(text.content);
        if (x >= text.x - metrics.width / 2 && x <= text.x + metrics.width / 2 &&
            y >= text.y - text.size && y <= text.y) {
            return text;
        }
    }

    return null;
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    const pos = getEventPosition(e);
    selectedElement = findElementAtPosition(pos.x, pos.y);
    if (selectedElement) {
        isDragging = true;
        lastTouchX = pos.x;
        lastTouchY = pos.y;
    }
    draw();
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedElement) {
        const pos = getEventPosition(e);
        const dx = pos.x - lastTouchX;
        const dy = pos.y - lastTouchY;
        
        selectedElement.x += dx;
        selectedElement.y += dy;
        
        lastTouchX = pos.x;
        lastTouchY = pos.y;
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const pos = getEventPosition(e);
    selectedElement = findElementAtPosition(pos.x, pos.y);
    if (selectedElement) {
        isDragging = true;
        lastTouchX = pos.x;
        lastTouchY = pos.y;
    }
    draw();
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDragging && selectedElement) {
        const pos = getEventPosition(e);
        const dx = pos.x - lastTouchX;
        const dy = pos.y - lastTouchY;
        
        selectedElement.x += dx;
        selectedElement.y += dy;
        
        lastTouchX = pos.x;
        lastTouchY = pos.y;
        draw();
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
});

// Control panel event handlers
document.getElementById('imageWidth').addEventListener('change', (e) => {
    if (selectedElement && 'width' in selectedElement) {
        selectedElement.width = parseInt(e.target.value);
        draw();
    }
});

document.getElementById('imageHeight').addEventListener('change', (e) => {
    if (selectedElement && 'height' in selectedElement) {
        selectedElement.height = parseInt(e.target.value);
        draw();
    }
});

document.getElementById('imageShape').addEventListener('change', (e) => {
    if (selectedElement && 'shape' in selectedElement) {
        selectedElement.shape = e.target.value;
        draw();
    }
});

document.getElementById('textColor').addEventListener('change', (e) => {
    if (selectedElement && 'content' in selectedElement) {
        selectedElement.color = e.target.value;
        draw();
    }
});

document.getElementById('textSize').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('textSizeValue').textContent = `${value}px`;
    if (selectedElement && 'content' in selectedElement) {
        selectedElement.size = parseInt(value);
        draw();
    }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    // Check if the canvas has content before downloading
    if (backgroundImage || overlayImages.length > 0 || texts.length > 0) {
        const link = document.createElement('a');
        link.download = 'meme.png';

        // Ensure the latest drawing is on the canvas
        draw();
        setTimeout(() => {
            link.href = canvas.toDataURL('image/png');
            link.click();
        }, 100);  // Delay to ensure drawing is completed
    } else {
        console.warn('No content to download.');
    }
});
