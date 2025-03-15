document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D scene
    const threeScene = initializeScene(); 

    // UI State Management
    const state = {
        activeTool: null,
        turboMode: false,
        activeModel: 'deepseek-local',
        renderLoop: true
    };

    // Initialize Components
    const chatInterface = {
        window: document.getElementById('chatWindow'),
        input: document.getElementById('chatInput'),
        sendButton: document.getElementById('sendMessage'),
        modelSelect: document.getElementById('model-dropdown'),
        turboToggle: document.getElementById('turbo-status')
    };

    // Tools Management
    const toolsContainer = document.querySelector('.tools-grid');
    const toolMenu = document.querySelector('.tool-menu');

    toolMenu.addEventListener('click', (e) => {
        const tool = e.target.closest('.menu-item');
        if (tool) {
            const toolType = tool.dataset.tool;
            createToolWindow(toolType);
        }
    });

    function createToolWindow(type) {
        const window = document.createElement('div');
        window.className = 'tool-window';
        window.dataset.type = type;
        window.innerHTML = `
            <div class="window-header">
                <span>${type.toUpperCase()}</span>
                <button class="close-btn">×</button>
            </div>
            <div class="window-content"></div>
        `;

        makeDraggable(window);
        toolsContainer.appendChild(window);

        window.querySelector('.close-btn').onclick = () => window.remove();
        
        // Initialize tool content
        initializeToolContent(window, type);
    }

    function initializeToolContent(window, type) {
        const content = window.querySelector('.window-content');
        switch(type) {
            case 'ai':
                content.innerHTML = `
                    <div class="ai-dashboard">
                        <div class="model-status">Active Model: ${state.activeModel}</div>
                        <div class="performance-metrics">Processing Speed: 0ms</div>
                    </div>
                `;
                break;
            case 'tasks':
                content.innerHTML = `
                    <div class="task-list">
                        <button class="pixel-button add-task">New Task</button>
                        <div class="tasks-container"></div>
                    </div>
                `;
                break;
            case 'ar':
                content.innerHTML = `
                    <div class="ar-preview">
                        <canvas id="ar-canvas"></canvas>
                        <button class="pixel-button start-ar">Launch AR</button>
                    </div>
                `;
                initializeAR(content.querySelector('#ar-canvas'));
                break;
        }
    }

    // Chat System Enhancement
    async function handleChat(message) {
        if (!message.trim()) return;

        try {
            appendMessage('user', message);
            disableChat(true);

            // Add request timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    model: state.activeModel,
                    turboMode: state.turboMode
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            appendMessage('ai', data.response);
            updateMetrics(data.metrics);
            
            if (data.modelUpdate) {
                updateModelStatus(data.modelUpdate);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                appendMessage('error', 'Request timed out. Please try again.');
            } else {
                appendMessage('error', `Error: ${error.message}`);
            }
            console.error('Chat error:', error);
        } finally {
            disableChat(false);
        }
    }

    function disableChat(disabled) {
        const input = document.getElementById('chatInput');
        const button = document.getElementById('sendMessage');
        input.disabled = disabled;
        button.disabled = disabled;
    }

    // Event Listeners
    chatInterface.modelSelect.addEventListener('change', (e) => {
        state.activeModel = e.target.value;
        updateModelStatus();
    });

    chatInterface.turboToggle.addEventListener('click', () => {
        state.turboMode = !state.turboMode;
        chatInterface.turboToggle.textContent = state.turboMode ? 'On' : 'Off';
    });

    // Initialize
    updateModelStatus();
    appendMessage('ai', 'Digital Double initialized. How can I assist you?');

    function initializeScene() {
        const canvas = document.getElementById('3d-scene');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.z = 5;

        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        scene.add(ambientLight);
        scene.add(directionalLight);

        // Animation loop
        const perfMetrics = {
            lastUpdate: performance.now(),
            frames: 0,
            fps: 0,
            memoryUsage: 0
        };

        function updateMetrics() {
            const now = performance.now();
            const delta = now - perfMetrics.lastUpdate;
            
            if (delta >= 1000) {
                perfMetrics.fps = Math.round((perfMetrics.frames * 1000) / delta);
                perfMetrics.frames = 0;
                perfMetrics.lastUpdate = now;
                perfMetrics.memoryUsage = window.performance?.memory?.usedJSHeapSize || 0;

                updateDashboard({
                    fps: perfMetrics.fps,
                    memoryUsage: perfMetrics.memoryUsage,
                    ...metrics
                });
            }
            perfMetrics.frames++;
        }

        function animate() {
            if (!state.renderLoop) return;
            try {
                requestAnimationFrame(animate);
                updateMetrics();
                renderer.render(scene, camera);
            } catch (error) {
                console.error('Render error:', error);
                state.renderLoop = false;
            }
        }
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        return { scene, camera, renderer };
    }

    function initializeChatSystem() {
        const chatInterface = {
            window: document.getElementById('chatWindow'),
            input: document.getElementById('chatInput'),
            sendButton: document.getElementById('sendMessage'),
            modelSelect: document.getElementById('model-dropdown')
        };

        // Handle chat messages
        async function handleChat(message) {
            appendMessage('user', message);
            
            const executionMode = getTurboMode();
            const response = await processWithAI(message, executionMode);
            
            appendMessage('ai', response);
        }

        // ...existing chat event listeners...
    }

    // Drag-and-drop functionality for tool windows
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = draggable.querySelector('.tool-window');
        
        header && header.addEventListener('mousedown', e => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.addEventListener('mouseup', closeDragElement);
            document.addEventListener('mousemove', elementDrag);
        });

        function elementDrag(e) {
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            draggable.style.top = (draggable.offsetTop - pos2) + 'px';
            draggable.style.left = (draggable.offsetLeft - pos1) + 'px';
        }

        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
        }
    });

    // Radial menu interactions
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const position = item.style.backgroundPosition;
            switch(position) {
                case '-0px -0px':
                    openTool('browser');
                    break;
                case '-64px -0px':
                    openTool('calendar');
                    break;
                case '-128px -0px':
                    openTool('notes');
                    break;
                case '-192px -0px':
                    toggleSettings();
                    break;
            }
        });
    });

    // Parallax effect
    document.addEventListener('mousemove', (e) => {
        const layer1 = document.querySelector('.layer-1');
        const layer2 = document.querySelector('.layer-2');
        const layer3 = document.querySelector('.layer-3');
        
        layer1.style.transform = `translate(${e.clientX * 0.01}px, ${e.clientY * 0.01}px)`;
        layer2.style.transform = `translate(${e.clientX * 0.02}px, ${e.clientY * 0.02}px)`;
        layer3.style.transform = `translate(${e.clientX * 0.03}px, ${e.clientY * 0.03}px)`;
    });

    // Example tool functions
    function openTool(toolType) {
        const toolWindow = document.createElement('div');
        toolWindow.className = 'tool-window active';
        toolWindow.textContent = `${toolType.charAt(0).toUpperCase()+toolType.slice(1)} Tool`;
        document.getElementById('tool-layout').appendChild(toolWindow);
        toolWindow.focus();
    }

    function toggleSettings() {
        const settingsElement = document.querySelector('.glitch');
        settingsElement.classList.toggle('active');
        // Add more settings logic here
    }

    // Initialize main UI components
    const toolWindows = {
        browser: createToolWindow('Browser', 'web'),
        calendar: createToolWindow('Calendar', 'time'),
        notes: createToolWindow('Notes', 'edit')
    };

    // Tool window management
    function createToolWindow(title, type) {
        const window = document.createElement('div');
        window.className = 'tool-window';
        window.setAttribute('draggable', 'true');
        window.innerHTML = `
            <div class="window-header">
                <span>${title}</span>
                <button class="close-btn">×</button>
            </div>
            <div class="window-content"></div>
        `;
        
        // Make window draggable
        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('dragend', handleDragEnd);
        return window;
    }

    // Chat functionality
    async function handleChat(message) {
        if (!message.trim()) return;

        // Add user message
        appendChatMessage('user', message);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    model: chatInterface.modelSelect.value
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            appendChatMessage('ai', data.response);
        } catch (error) {
            appendChatMessage('error', `Error: ${error.message}`);
        }
    }

    function appendChatMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message pixel-text`;
        messageDiv.textContent = content;
        chatInterface.window.appendChild(messageDiv);
        chatInterface.window.scrollTop = chatInterface.window.scrollHeight;
    }

    // Event listeners
    chatInterface.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChat(chatInterface.input.value);
            chatInterface.input.value = '';
        }
    });

    chatInterface.sendButton.addEventListener('click', () => {
        handleChat(chatInterface.input.value);
        chatInterface.input.value = '';
    });

    // Initialize with welcome message
    appendChatMessage('ai', 'Welcome to Digital Double! How can I assist you today?');
});

// Helper Functions
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.querySelector('.window-header').onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function updateMetrics(metrics) {
    const aiTool = document.querySelector('.tool-window[data-type="ai"]');
    if (!aiTool) return;

    const dashboard = aiTool.querySelector('.ai-dashboard');
    if (!dashboard) return;

    const statusClass = metrics.status || (metrics.memoryUsage > 400 * 1024 * 1024 ? 'warning' : 'normal');
    const formattedMemory = formatBytes(metrics.memoryUsage);
    
    dashboard.innerHTML = `
        <div class="model-status ${statusClass}">
            Active Model: ${state.activeModel}
            ${metrics.status === 'error' ? '<span class="error-badge">!</span>' : ''}
        </div>
        <div class="performance-metrics">
            <div class="metric ${metrics.fps < 30 ? 'warning' : ''}">
                FPS: ${metrics.fps || 0}
            </div>
            <div class="metric ${metrics.memoryUsage > 400 * 1024 * 1024 ? 'warning' : ''}">
                Memory: ${formattedMemory}
            </div>
            <div class="metric">
                Processing: ${metrics.processingTime || 0}ms
            </div>
            ${metrics.confidenceScore ? 
              `<div class="metric">Confidence: ${Math.round(metrics.confidenceScore)}%</div>` : 
              ''}
        </div>
    `;
}

// Add error recovery
window.addEventListener('error', async (event) => {
    console.error('Global error:', event.error);
    try {
        await withErrorBoundary(async () => {
            state.renderLoop = false;
            await new Promise(resolve => setTimeout(resolve, 1000));
            state.renderLoop = true;
            initializeScene();
        });
    } catch (error) {
        console.error('Recovery failed:', error);
    }
});

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
    if (!aiTool) return;

    const dashboard = aiTool.querySelector('.ai-dashboard');
    if (!dashboard) return;

    dashboard.innerHTML = `
        <div class="model-status">Active Model: ${state.activeModel}</div>
        <div class="performance-metrics">
            FPS: ${metrics.fps || 0}
            <br>Memory: ${formatBytes(metrics.memoryUsage)}
            <br>Processing: ${metrics.processingTime || 0}ms
            ${metrics.confidenceScore ? `<br>Confidence: ${metrics.confidenceScore}%` : ''}
        </div>
    `;
}, 100);

function formatBytes(bytes) {
    return bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '0 MB';
}

// Debounce helper
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
