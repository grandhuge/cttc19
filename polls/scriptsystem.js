
        // Data storage
        let polls = [];
        let userVotes = {};
        let currentView = 'user';
        let isLoggedIn = false;
        let isAdmin = false;
        let charts = {};
        let isLoading = false;

        // Google Apps Script API URL
        const API_URL = 'https://script.google.com/macros/s/AKfycbxZ_gBCJ9T43SXfdFHn1Co7Ma6F0lXwv-e4HH-8Ly6EHFurRbNwJGBezSuVEuyrbt5-/exec';

        // DOM elements
        const loginModal = document.getElementById('loginModal');
        const loginForm = document.getElementById('loginForm');
        const guestBtn = document.getElementById('guestBtn');
        const adminBtn = document.getElementById('adminBtn');
        const voteBtn = document.getElementById('voteBtn');
        const resultsBtn = document.getElementById('resultsBtn');
        const loginAdminBtn = document.getElementById('loginAdminBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminPanel = document.getElementById('adminPanel');
        const votePanel = document.getElementById('votePanel');
        const resultsPanel = document.getElementById('resultsPanel');
        const createPollForm = document.getElementById('createPollForm');
        const votePollsContainer = document.getElementById('votePollsContainer');
        const resultsPollsContainer = document.getElementById('resultsPollsContainer');
        const userStatus = document.getElementById('userStatus');

        // Loading progress variables
        let loadingProgress = 0;
        let loadingInterval;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Start real loading sequence with data
            startRealLoadingSequence();
        });

        // Real loading functions that actually load data
        async function startRealLoadingSequence() {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const loadingStatus = document.getElementById('loadingStatus');
            
            try {
                // Step 1: Initialize system (10%)
                updateLoadingProgress(10, 'เริ่มต้นระบบ...');
                await delay(300);
                
                // Step 2: Check connection (25%)
                updateLoadingProgress(25, 'ตรวจสอบการเชื่อมต่อ...');
                await checkConnection();
                
                // Step 3: Load poll data (50%)
                updateLoadingProgress(50, 'โหลดข้อมูลโพล...');
                await loadInitialData();
                
                // Step 4: Process user data (70%)
                updateLoadingProgress(70, 'ประมวลผลข้อมูลผู้ใช้...');
                await loadUserData();
                
                // Step 5: Initialize UI components (85%)
                updateLoadingProgress(85, 'เตรียมส่วนติดต่อผู้ใช้...');
                await initializeUIComponents();
                
                // Step 6: Final system check (95%)
                updateLoadingProgress(95, 'ตรวจสอบระบบ...');
                await finalSystemCheck();
                
                // Step 7: Complete (100%)
                updateLoadingProgress(100, 'เสร็จสิ้น! เข้าสู่ระบบ...');
                await delay(500);
                
                // Loading complete
                completeLoading();
                
            } catch (error) {
                console.error('Loading error:', error);
                updateLoadingProgress(100, 'เกิดข้อผิดพลาด กำลังเข้าสู่โหมดออฟไลน์...');
                await delay(1000);
                completeLoadingWithError();
            }
        }

        // Helper function to update loading progress
        function updateLoadingProgress(progress, status) {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const loadingStatus = document.getElementById('loadingStatus');
            
            animateProgress(loadingProgress, progress, 300);
            loadingProgress = progress;
            loadingStatus.textContent = status;
        }

        // Real loading steps
        async function checkConnection() {
            // Try to ping the API to check connection
            return new Promise((resolve) => {
                const script = document.createElement('script');
                const callbackName = 'connectionCheck_' + Date.now();
                const timeout = setTimeout(() => {
                    // Connection timeout - continue anyway
                    document.head.removeChild(script);
                    delete window[callbackName];
                    resolve(false);
                }, 3000);
                
                window[callbackName] = function(data) {
                    clearTimeout(timeout);
                    document.head.removeChild(script);
                    delete window[callbackName];
                    resolve(true);
                };
                
                script.src = `${API_URL}?action=ping&callback=${callbackName}`;
                document.head.appendChild(script);
            });
        }

        async function loadInitialData() {
            // Actually load poll data from database
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'initialLoad_' + Date.now();
                const timeout = setTimeout(() => {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    reject(new Error('Data loading timeout'));
                }, 10000);
                
                window[callbackName] = function(data) {
                    clearTimeout(timeout);
                    try {
                        if (data.success) {
                            polls = data.polls || [];
                            resolve(data);
                        } else {
                            throw new Error(data.error || 'Failed to load data');
                        }
                    } catch (error) {
                        reject(error);
                    }
                    
                    document.head.removeChild(script);
                    delete window[callbackName];
                };
                
                script.src = `${API_URL}?action=getPolls&callback=${callbackName}`;
                document.head.appendChild(script);
            });
        }

        async function loadUserData() {
            // Load user votes from localStorage
            await delay(200);
            userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
            
            // Simulate processing user preferences
            await delay(300);
        }

        async function initializeUIComponents() {
            // Pre-render components
            await delay(200);
            
            // Initialize charts if needed
            if (typeof Chart !== 'undefined') {
                await delay(300);
            }
            
            // Setup event listeners
            setupEventListeners();
            await delay(200);
        }

        async function finalSystemCheck() {
            // Validate data integrity
            await delay(200);
            
            // Check if polls are valid
            polls.forEach(poll => {
                if (!poll.options || !Array.isArray(poll.votes)) {
                    console.warn('Invalid poll data detected:', poll);
                }
            });
            
            // Final UI preparation
            await delay(300);
        }

        function setupEventListeners() {
            // Setup all event listeners that weren't set up yet
            // This is called during loading to ensure everything is ready
        }

        function animateProgress(from, to, duration) {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const startTime = Date.now();
            
            function animate() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = from + (to - from) * easeOutCubic(progress);
                
                progressFill.style.width = currentValue + '%';
                progressText.textContent = Math.round(currentValue) + '%';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }
            
            animate();
        }

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        // Utility function for delays
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function completeLoading() {
            const loadingScreen = document.getElementById('loadingScreen');
            const body = document.body;
            
            // Hide loading screen
            loadingScreen.classList.add('hidden');
            body.classList.remove('loading');
            
            // Initialize app
            setTimeout(() => {
                initializeApp();
            }, 500);
        }

        function completeLoadingWithError() {
            const loadingScreen = document.getElementById('loadingScreen');
            const body = document.body;
            
            // Hide loading screen
            loadingScreen.classList.add('hidden');
            body.classList.remove('loading');
            
            // Initialize app in offline mode
            setTimeout(() => {
                initializeAppOffline();
            }, 500);
        }

        function initializeApp() {
            // Start as regular user without showing login modal
            isLoggedIn = true;
            isAdmin = false;
            userStatus.textContent = '👥 ผู้ใช้ทั่วไป';
            loginModal.classList.add('hidden');
            
            // Data already loaded during loading sequence
            renderPolls();
            updateStats();
            switchView('vote');
            
            showNotification('ระบบพร้อมใช้งาน! 🎉', 'success');
        }

        function initializeAppOffline() {
            // Start as regular user in offline mode
            isLoggedIn = true;
            isAdmin = false;
            userStatus.textContent = '👥 ผู้ใช้ทั่วไป (โหมดออฟไลน์)';
            loginModal.classList.add('hidden');
            
            // Load from localStorage if available
            const savedPolls = localStorage.getItem('cachedPolls');
            if (savedPolls) {
                polls = JSON.parse(savedPolls);
            }
            
            renderPolls();
            updateStats();
            switchView('vote');
            
            showNotification('เข้าสู่โหมดออฟไลน์ 📱', 'info');
        }

        // Database functions
        function loadDataFromDatabase() {
            if (isLoading) return;
            
            isLoading = true;
            showLoadingMessage('กำลังโหลดข้อมูล...');
            
            // Create JSONP request
            const script = document.createElement('script');
            const callbackName = 'jsonpCallback_' + Date.now();
            
            window[callbackName] = function(data) {
                try {
                    if (data.success) {
                        polls = data.polls || [];
                        userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
                        
                        // Cache data for offline use
                        localStorage.setItem('cachedPolls', JSON.stringify(polls));
                        localStorage.setItem('lastDataUpdate', new Date().toISOString());
                        
                        renderPolls();
                        updateStats();
                        if (isAdmin && currentView === 'admin') {
                            updateCharts();
                        }
                        
                        hideLoadingMessage();
                        showNotification('โหลดข้อมูลสำเร็จ! 📊', 'success');
                    } else {
                        throw new Error(data.error || 'Unknown error');
                    }
                } catch (error) {
                    console.error('Error loading data:', error);
                    hideLoadingMessage();
                    showNotification('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่ ⚠️', 'error');
                }
                
                // Cleanup
                document.head.removeChild(script);
                delete window[callbackName];
                isLoading = false;
            };
            
            script.src = `${API_URL}?action=getPolls&callback=${callbackName}`;
            document.head.appendChild(script);
        }

        function savePollToDatabase(poll) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'jsonpCallback_' + Date.now();
                
                window[callbackName] = function(data) {
                    try {
                        if (data.success) {
                            resolve(data);
                        } else {
                            throw new Error(data.error || 'Failed to save poll');
                        }
                    } catch (error) {
                        reject(error);
                    }
                    
                    // Cleanup
                    document.head.removeChild(script);
                    delete window[callbackName];
                };
                
                const params = new URLSearchParams({
                    action: 'createPoll',
                    callback: callbackName,
                    title: poll.title,
                    options: JSON.stringify(poll.options)
                });
                
                script.src = `${API_URL}?${params}`;
                document.head.appendChild(script);
            });
        }

        function saveVoteToDatabase(pollId, optionIndex) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'jsonpCallback_' + Date.now();
                
                window[callbackName] = function(data) {
                    try {
                        if (data.success) {
                            resolve(data);
                        } else {
                            throw new Error(data.error || 'Failed to save vote');
                        }
                    } catch (error) {
                        reject(error);
                    }
                    
                    // Cleanup
                    document.head.removeChild(script);
                    delete window[callbackName];
                };
                
                const params = new URLSearchParams({
                    action: 'vote',
                    callback: callbackName,
                    pollId: pollId,
                    optionIndex: optionIndex
                });
                
                script.src = `${API_URL}?${params}`;
                document.head.appendChild(script);
            });
        }

        function deletePollFromDatabase(pollId) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'jsonpCallback_' + Date.now();
                
                window[callbackName] = function(data) {
                    try {
                        if (data.success) {
                            resolve(data);
                        } else {
                            throw new Error(data.error || 'Failed to delete poll');
                        }
                    } catch (error) {
                        reject(error);
                    }
                    
                    // Cleanup
                    document.head.removeChild(script);
                    delete window[callbackName];
                };
                
                const params = new URLSearchParams({
                    action: 'deletePoll',
                    callback: callbackName,
                    pollId: pollId
                });
                
                script.src = `${API_URL}?${params}`;
                document.head.appendChild(script);
            });
        }

        function showLoadingMessage(message) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loadingMessage';
            loadingDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium z-50';
            loadingDiv.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(loadingDiv);
        }

        function hideLoadingMessage() {
            const loadingDiv = document.getElementById('loadingMessage');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }

        // Login system
        function showLoginModal() {
            loginModal.classList.remove('hidden');
        }

        function hideLoginModal() {
            loginModal.classList.add('hidden');
        }

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username === 'admin' && password === 'Tle019') {
                isLoggedIn = true;
                isAdmin = true;
                userStatus.textContent = '👨‍💼 ผู้ดูแลระบบ';
                adminBtn.classList.remove('hidden');
                loginAdminBtn.classList.add('hidden');
                logoutBtn.classList.remove('hidden');
                hideLoginModal();
                switchView('admin');
                showNotification('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับผู้ดูแลระบบ 🎉', 'success');
            } else {
                showNotification('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง ❌', 'error');
            }
        });

        guestBtn.addEventListener('click', function() {
            isLoggedIn = true;
            isAdmin = false;
            userStatus.textContent = '👥 ผู้ใช้ทั่วไป';
            hideLoginModal();
            switchView('vote');
            showNotification('เข้าใช้งานในฐานะผู้ใช้ทั่วไป 👋', 'info');
        });

        loginAdminBtn.addEventListener('click', function() {
            showLoginModal();
        });

        logoutBtn.addEventListener('click', function() {
            if (confirm('คุณแน่ใจหรือไม่ที่จะออกจากระบบ?')) {
                isLoggedIn = false;
                isAdmin = false;
                userStatus.textContent = '👥 ผู้ใช้ทั่วไป';
                adminBtn.classList.add('hidden');
                loginAdminBtn.classList.remove('hidden');
                logoutBtn.classList.add('hidden');
                switchView('vote');
                showNotification('ออกจากระบบเรียบร้อย 👋', 'info');
            }
        });

        // View switching
        adminBtn.addEventListener('click', () => switchView('admin'));
        voteBtn.addEventListener('click', () => switchView('vote'));
        resultsBtn.addEventListener('click', () => switchView('results'));

        function switchView(view) {
            if (view === 'admin' && !isAdmin) {
                showNotification('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ ⛔', 'error');
                return;
            }
            
            currentView = view;
            updateView();
        }

        function updateView() {
            // Hide all panels
            adminPanel.classList.add('hidden');
            votePanel.classList.add('hidden');
            resultsPanel.classList.add('hidden');
            
            // Reset button styles
            adminBtn.classList.remove('bg-blue-700');
            adminBtn.classList.add('bg-blue-600');
            voteBtn.classList.remove('bg-green-700');
            voteBtn.classList.add('bg-green-600');
            resultsBtn.classList.remove('bg-purple-700');
            resultsBtn.classList.add('bg-purple-600');
            
            // Show appropriate panel and highlight button
            if (currentView === 'admin' && isAdmin) {
                adminPanel.classList.remove('hidden');
                adminBtn.classList.add('bg-blue-700');
                adminBtn.classList.remove('bg-blue-600');
                updateCharts();
            } else if (currentView === 'vote') {
                votePanel.classList.remove('hidden');
                voteBtn.classList.add('bg-green-700');
                voteBtn.classList.remove('bg-green-600');
            } else if (currentView === 'results') {
                resultsPanel.classList.remove('hidden');
                resultsBtn.classList.add('bg-purple-700');
                resultsBtn.classList.remove('bg-purple-600');
            }
            
            renderPolls();
            updateStats();
        }

        // Create poll
        createPollForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('pollTitle').value.trim();
            const optionsText = document.getElementById('pollOptions').value.trim();
            
            if (!title || !optionsText) return;
            
            const options = optionsText.split('\n').map(opt => opt.trim()).filter(opt => opt);
            
            if (options.length < 2) {
                alert('กรุณาใส่ตัวเลือกอย่างน้อย 2 ตัวเลือก');
                return;
            }
            
            const newPoll = {
                id: Date.now(),
                title: title,
                options: options,
                votes: new Array(options.length).fill(0),
                totalVotes: 0,
                createdAt: new Date(),
                isVisible: true
            };
            
            try {
                showLoadingMessage('กำลังสร้างโพล...');
                await savePollToDatabase(newPoll);
                
                // Reset form
                document.getElementById('pollTitle').value = '';
                document.getElementById('pollOptions').value = '';
                
                // Reload data from database
                await loadDataFromDatabase();
                
                hideLoadingMessage();
                showNotification('สร้างโพลสำเร็จ! 🎉', 'success');
            } catch (error) {
                console.error('Error creating poll:', error);
                hideLoadingMessage();
                showNotification('เกิดข้อผิดพลาดในการสร้างโพล ⚠️', 'error');
            }
        });

        // Charts functions
        function updateCharts() {
            if (!isAdmin) return;
            
            setTimeout(() => {
                createOverallChart();
                createComparisonChart();
                createIndividualCharts();
            }, 100);
        }

        function createOverallChart() {
            const ctx = document.getElementById('overallChart');
            if (!ctx) return;
            
            if (charts.overall) {
                charts.overall.destroy();
            }
            
            const totalPolls = polls.length;
            const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
            const avgVotesPerPoll = totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0;
            
            charts.overall = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['โพลทั้งหมด', 'คะแนนโหวตรวม', 'เฉลี่ยต่อโพล'],
                    datasets: [{
                        data: [totalPolls, totalVotes, avgVotesPerPoll],
                        backgroundColor: [
                            '#3B82F6',
                            '#10B981',
                            '#F59E0B'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    family: 'Kanit'
                                }
                            }
                        }
                    }
                }
            });
        }

        function createComparisonChart() {
            const ctx = document.getElementById('comparisonChart');
            if (!ctx) return;
            
            if (charts.comparison) {
                charts.comparison.destroy();
            }
            
            const pollNames = polls.map(poll => poll.title.substring(0, 20) + '...');
            const pollVotes = polls.map(poll => poll.totalVotes);
            
            charts.comparison = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: pollNames,
                    datasets: [{
                        label: 'จำนวนผู้โหวต',
                        data: pollVotes,
                        backgroundColor: '#3B82F6',
                        borderColor: '#1D4ED8',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    family: 'Kanit'
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    family: 'Kanit'
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    family: 'Kanit'
                                }
                            }
                        }
                    }
                }
            });
        }

        function createIndividualCharts() {
            const container = document.getElementById('pollChartsContainer');
            if (!container) return;
            
            // Clear existing charts
            Object.keys(charts).forEach(key => {
                if (key.startsWith('poll_')) {
                    charts[key].destroy();
                    delete charts[key];
                }
            });
            
            container.innerHTML = '';
            
            polls.forEach(poll => {
                const chartDiv = document.createElement('div');
                chartDiv.className = 'bg-gray-50 rounded-lg p-4';
                chartDiv.innerHTML = `
                    <h5 class="font-semibold text-gray-700 mb-3">${poll.title}</h5>
                    <div class="chart-container" style="height: 250px;">
                        <canvas id="poll_${poll.id}"></canvas>
                    </div>
                `;
                container.appendChild(chartDiv);
                
                setTimeout(() => {
                    const ctx = document.getElementById(`poll_${poll.id}`);
                    if (ctx) {
                        charts[`poll_${poll.id}`] = new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: poll.options,
                                datasets: [{
                                    data: poll.votes,
                                    backgroundColor: [
                                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                                        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
                                    ],
                                    borderWidth: 2,
                                    borderColor: '#ffffff'
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            font: {
                                                family: 'Kanit',
                                                size: 12
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }, 100);
            });
        }

        // Render polls
        function renderPolls() {
            if (currentView === 'vote') {
                renderVotePolls();
            } else if (currentView === 'results') {
                renderResultsPolls();
            } else if (currentView === 'admin') {
                renderAdminPolls();
            }
        }

        function renderVotePolls() {
            const visiblePolls = polls.filter(poll => poll.isVisible);
            
            if (visiblePolls.length === 0) {
                votePollsContainer.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">📝</div>
                        <p class="text-gray-500 text-lg">ยังไม่มีโพลที่เปิดให้โหวต</p>
                        <p class="text-gray-400">ผู้ดูแลระบบสามารถเปิดโพลให้โหวตได้</p>
                    </div>
                `;
                return;
            }

            votePollsContainer.innerHTML = visiblePolls.map(poll => `
                <div class="poll-card bg-white rounded-xl shadow-lg p-6 fade-in">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">${poll.title}</h3>
                    <div class="space-y-4">
                        ${poll.options.map((option, index) => {
                            const isVoted = userVotes[poll.id] === index;
                            const hasVoted = userVotes[poll.id] !== undefined;
                            return `
                                <div class="relative">
                                    <button 
                                        onclick="vote(${poll.id}, ${index})" 
                                        class="w-full text-left p-4 rounded-lg border-2 transition-all ${
                                            isVoted 
                                                ? 'border-green-500 bg-green-50 text-green-700' 
                                                : hasVoted
                                                ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                        }"
                                        ${hasVoted ? 'disabled' : ''}
                                    >
                                        <div class="flex justify-between items-center">
                                            <span class="font-medium">${option}</span>
                                            ${isVoted ? '<span class="text-green-500 text-xl">✓</span>' : ''}
                                        </div>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <div class="text-center text-sm text-gray-600">
                            ${userVotes[poll.id] !== undefined 
                                ? '<span class="text-green-600 font-medium">✅ คุณได้โหวตแล้ว</span>' 
                                : '<span class="text-blue-600 font-medium">🗳️ คลิกเพื่อโหวต</span>'
                            }
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function renderResultsPolls() {
            const visiblePolls = polls.filter(poll => poll.isVisible);
            
            if (visiblePolls.length === 0) {
                resultsPollsContainer.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">📊</div>
                        <p class="text-gray-500 text-lg">ยังไม่มีผลโหวตที่แสดงได้</p>
                        <p class="text-gray-400">ผู้ดูแลระบบสามารถเปิดแสดงผลโพลได้</p>
                    </div>
                `;
                return;
            }

            resultsPollsContainer.innerHTML = visiblePolls.map(poll => `
                <div class="poll-card bg-white rounded-xl shadow-lg p-6 fade-in">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">${poll.title}</h3>
                    <div class="space-y-4">
                        ${poll.options.map((option, index) => {
                            const percentage = poll.totalVotes > 0 ? Math.round((poll.votes[index] / poll.totalVotes) * 100) : 0;
                            const isWinner = poll.votes[index] === Math.max(...poll.votes) && poll.totalVotes > 0;
                            return `
                                <div class="relative">
                                    <div class="p-4 rounded-lg border-2 ${isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}">
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="font-medium ${isWinner ? 'text-yellow-800' : 'text-gray-700'}">${option}</span>
                                            <div class="flex items-center space-x-2">
                                                ${isWinner ? '<span class="text-yellow-500 text-lg">👑</span>' : ''}
                                                <span class="text-sm text-gray-600">${poll.votes[index]} คะแนน</span>
                                                <span class="text-lg font-bold ${isWinner ? 'text-yellow-600' : 'text-blue-600'}">${percentage}%</span>
                                            </div>
                                        </div>
                                        <div class="bg-gray-200 rounded-full h-3">
                                            <div class="progress-bar ${isWinner ? 'bg-yellow-500' : 'bg-blue-500'} h-3 rounded-full" style="width: ${percentage}%"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <div class="text-center text-sm text-gray-600">
                            <span>ผู้โหวตทั้งหมด: <strong class="text-lg text-blue-600">${poll.totalVotes}</strong> คน</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function renderAdminPolls() {
            renderPollManagement();
        }

        function renderPollManagement() {
            const container = document.getElementById('pollManagementContainer');
            if (!container) return;

            if (polls.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">📝</div>
                        <h3 class="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีโพลในระบบ</h3>
                        <p class="text-gray-500">เริ่มต้นสร้างโพลแรกของคุณได้เลย</p>
                        <button onclick="document.getElementById('pollTitle').focus()" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            ✨ สร้างโพลแรก
                        </button>
                    </div>
                `;
                return;
            }

            // Sort polls by creation date (newest first)
            const sortedPolls = [...polls].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            container.innerHTML = `
                <!-- Poll Management Header -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold mb-2">📋 จัดการโพลทั้งหมด</h3>
                            <p class="text-blue-100">มีโพลทั้งหมด ${polls.length} โพล | แสดงผล ${polls.filter(p => p.isVisible).length} โพล</p>
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="toggleAllPollsVisibility(true)" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-colors">
                                👁️ แสดงทั้งหมด
                            </button>
                            <button onclick="toggleAllPollsVisibility(false)" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-colors">
                                🙈 ซ่อนทั้งหมด
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Polls Grid -->
                <div class="grid gap-6">
                    ${sortedPolls.map((poll, index) => {
                        const winnerIndex = poll.votes.indexOf(Math.max(...poll.votes));
                        const winnerOption = poll.totalVotes > 0 ? poll.options[winnerIndex] : null;
                        const winnerPercentage = poll.totalVotes > 0 ? Math.round((poll.votes[winnerIndex] / poll.totalVotes) * 100) : 0;
                        
                        return `
                            <div class="admin-card bg-white rounded-xl shadow-lg border-2 ${poll.isVisible ? 'border-green-200 shadow-green-100' : 'border-red-200 shadow-red-100'} hover:shadow-xl transition-all duration-300">
                                <!-- Poll Header -->
                                <div class="p-6 border-b border-gray-100">
                                    <div class="flex justify-between items-start mb-4">
                                        <div class="flex-1">
                                            <div class="flex items-center mb-2">
                                                <span class="text-2xl mr-3">${index === 0 ? '🆕' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}</span>
                                                <h4 class="text-xl font-bold text-gray-800">${poll.title}</h4>
                                            </div>
                                            
                                            <!-- Status Badge -->
                                            <div class="flex items-center space-x-3 mb-3">
                                                <span class="px-3 py-1 rounded-full text-sm font-medium ${
                                                    poll.isVisible 
                                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                                        : 'bg-red-100 text-red-800 border border-red-200'
                                                }">
                                                    ${poll.isVisible ? '🟢 เปิดใช้งาน' : '🔴 ปิดใช้งาน'}
                                                </span>
                                                <span class="text-sm text-gray-500">
                                                    📅 ${new Date(poll.createdAt).toLocaleDateString('th-TH', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>

                                            <!-- Quick Stats -->
                                            <div class="grid grid-cols-3 gap-4 mb-4">
                                                <div class="text-center p-3 bg-blue-50 rounded-lg">
                                                    <div class="text-2xl font-bold text-blue-600">${poll.totalVotes}</div>
                                                    <div class="text-xs text-blue-500">คะแนนโหวต</div>
                                                </div>
                                                <div class="text-center p-3 bg-purple-50 rounded-lg">
                                                    <div class="text-2xl font-bold text-purple-600">${poll.options.length}</div>
                                                    <div class="text-xs text-purple-500">ตัวเลือก</div>
                                                </div>
                                                <div class="text-center p-3 ${poll.totalVotes > 0 ? 'bg-yellow-50' : 'bg-gray-50'} rounded-lg">
                                                    <div class="text-lg font-bold ${poll.totalVotes > 0 ? 'text-yellow-600' : 'text-gray-400'}">
                                                        ${poll.totalVotes > 0 ? `${winnerPercentage}%` : '-'}
                                                    </div>
                                                    <div class="text-xs ${poll.totalVotes > 0 ? 'text-yellow-500' : 'text-gray-400'}">
                                                        ${poll.totalVotes > 0 ? 'ตัวเลือกยอดนิยม' : 'ยังไม่มีโหวต'}
                                                    </div>
                                                </div>
                                            </div>

                                            ${poll.totalVotes > 0 && winnerOption ? `
                                                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                                    <div class="flex items-center">
                                                        <span class="text-yellow-500 text-lg mr-2">👑</span>
                                                        <span class="text-sm text-yellow-700">
                                                            <strong>ตัวเลือกยอดนิยม:</strong> ${winnerOption} (${winnerPercentage}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>

                                        <!-- Action Buttons -->
                                        <div class="flex flex-col space-y-2 ml-6">
                                            <button 
                                                onclick="togglePollVisibility(${poll.id})" 
                                                class="px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                    poll.isVisible 
                                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-yellow-200' 
                                                        : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-200'
                                                }"
                                                title="${poll.isVisible ? 'ซ่อนโพล' : 'แสดงโพล'}"
                                            >
                                                ${poll.isVisible ? '🙈 ซ่อน' : '👁️ แสดง'}
                                            </button>
                                            <button 
                                                onclick="editPoll(${poll.id})" 
                                                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-blue-200"
                                                title="แก้ไขโพล"
                                            >
                                                ✏️ แก้ไข
                                            </button>
                                            <button 
                                                onclick="duplicatePoll(${poll.id})" 
                                                class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-200"
                                                title="ทำสำเนาโพล"
                                            >
                                                📋 คัดลอก
                                            </button>
                                            <button 
                                                onclick="deletePoll(${poll.id})" 
                                                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-red-200"
                                                title="ลบโพล"
                                            >
                                                🗑️ ลบ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Poll Options and Results -->
                                <div class="p-6">
                                    <h5 class="text-lg font-semibold text-gray-700 mb-4">📊 ผลโหวตแต่ละตัวเลือก</h5>
                                    <div class="space-y-3">
                                        ${poll.options.map((option, index) => {
                                            const votes = poll.votes[index] || 0;
                                            const percentage = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                                            const isWinner = votes === Math.max(...poll.votes) && poll.totalVotes > 0;
                                            
                                            return `
                                                <div class="relative">
                                                    <div class="flex justify-between items-center mb-2">
                                                        <div class="flex items-center">
                                                            ${isWinner ? '<span class="text-yellow-500 text-lg mr-2">👑</span>' : '<span class="text-gray-400 text-lg mr-2">•</span>'}
                                                            <span class="font-medium ${isWinner ? 'text-yellow-800' : 'text-gray-700'}">${option}</span>
                                                        </div>
                                                        <div class="flex items-center space-x-2">
                                                            <span class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">${votes} คะแนน</span>
                                                            <span class="text-lg font-bold ${isWinner ? 'text-yellow-600' : 'text-blue-600'}">${percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
                                                        <div class="progress-bar h-full rounded-full transition-all duration-1000 ${
                                                            isWinner ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'
                                                        }" style="width: ${percentage}%"></div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>

                                    ${poll.totalVotes === 0 ? `
                                        <div class="text-center py-6 bg-gray-50 rounded-lg mt-4">
                                            <div class="text-3xl mb-2">🤔</div>
                                            <p class="text-gray-500">ยังไม่มีใครโหวตโพลนี้</p>
                                            <p class="text-sm text-gray-400">แชร์โพลนี้เพื่อให้คนอื่นมาโหวตกัน</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Vote function
        async function vote(pollId, optionIndex) {
            if (userVotes[pollId] !== undefined) return;
            
            const poll = polls.find(p => p.id == pollId);
            if (!poll) return;
            
            try {
                showLoadingMessage('กำลังบันทึกการโหวต...');
                await saveVoteToDatabase(pollId, optionIndex);
                
                // Save user vote locally
                userVotes[pollId] = optionIndex;
                localStorage.setItem('userVotes', JSON.stringify(userVotes));
                
                // Reload data from database
                await loadDataFromDatabase();
                
                hideLoadingMessage();
                showNotification('โหวตสำเร็จ! ขอบคุณสำหรับความคิดเห็น 👍', 'success');
            } catch (error) {
                console.error('Error voting:', error);
                hideLoadingMessage();
                showNotification('เกิดข้อผิดพลาดในการโหวต ⚠️', 'error');
            }
        }

        // Delete poll
        async function deletePoll(pollId) {
            if (confirm('คุณแน่ใจหรือไม่ที่จะลบโพลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
                try {
                    showLoadingMessage('กำลังลบโพล...');
                    await deletePollFromDatabase(pollId);
                    
                    // Remove user votes for this poll
                    delete userVotes[pollId];
                    localStorage.setItem('userVotes', JSON.stringify(userVotes));
                    
                    // Reload data from database
                    await loadDataFromDatabase();
                    
                    hideLoadingMessage();
                    showNotification('ลบโพลสำเร็จ 🗑️', 'info');
                } catch (error) {
                    console.error('Error deleting poll:', error);
                    hideLoadingMessage();
                    showNotification('เกิดข้อผิดพลาดในการลบโพล ⚠️', 'error');
                }
            }
        }

        // Toggle all polls visibility
        async function toggleAllPollsVisibility(isVisible) {
            if (polls.length === 0) return;
            
            const action = isVisible ? 'แสดง' : 'ซ่อน';
            if (!confirm(`คุณแน่ใจหรือไม่ที่จะ${action}โพลทั้งหมด ${polls.length} โพล?`)) return;
            
            try {
                showLoadingMessage(`กำลัง${action}โพลทั้งหมด...`);
                
                // Update all polls
                for (const poll of polls) {
                    if (poll.isVisible !== isVisible) {
                        await updatePollVisibilityInDatabase(poll.id, isVisible);
                    }
                }
                
                // Reload data from database
                loadDataFromDatabase();
                
                hideLoadingMessage();
                showNotification(`${action}โพลทั้งหมดเรียบร้อย! ${isVisible ? '👁️' : '🙈'}`, 'success');
            } catch (error) {
                console.error('Error toggling all polls visibility:', error);
                hideLoadingMessage();
                showNotification('เกิดข้อผิดพลาดในการอัปเดต ⚠️', 'error');
            }
        }

        // Duplicate poll
        async function duplicatePoll(pollId) {
            const poll = polls.find(p => p.id == pollId);
            if (!poll) return;
            
            if (!confirm(`คุณต้องการทำสำเนาโพล "${poll.title}" หรือไม่?`)) return;
            
            try {
                showLoadingMessage('กำลังทำสำเนาโพล...');
                
                const duplicatedPoll = {
                    id: Date.now(),
                    title: `${poll.title} (สำเนา)`,
                    options: [...poll.options],
                    votes: new Array(poll.options.length).fill(0),
                    totalVotes: 0,
                    createdAt: new Date(),
                    isVisible: false // Start as hidden
                };
                
                await savePollToDatabase(duplicatedPoll);
                
                // Reload data from database
                loadDataFromDatabase();
                
                hideLoadingMessage();
                showNotification('ทำสำเนาโพลสำเร็จ! 📋', 'success');
            } catch (error) {
                console.error('Error duplicating poll:', error);
                hideLoadingMessage();
                showNotification('เกิดข้อผิดพลาดในการทำสำเนา ⚠️', 'error');
            }
        }

        // Update statistics
        function updateStats() {
            const totalPolls = polls.length;
            const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
            const popularPoll = polls.length > 0 
                ? polls.reduce((max, poll) => poll.totalVotes > max.totalVotes ? poll : max, polls[0])
                : null;
            
            // Calculate participation rate (assuming 1000 potential users)
            const participationRate = totalVotes > 0 ? Math.min(Math.round((totalVotes / 1000) * 100), 100) : 0;

            document.getElementById('totalPolls').textContent = totalPolls;
            document.getElementById('totalVotes').textContent = totalVotes;
            document.getElementById('popularPoll').textContent = popularPoll 
                ? popularPoll.title.substring(0, 30) + (popularPoll.title.length > 30 ? '...' : '')
                : '-';
            
            const participationElement = document.getElementById('participationRate');
            if (participationElement) {
                participationElement.textContent = participationRate + '%';
            }
        }

        // Poll management functions
        async function togglePollVisibility(pollId) {
            const poll = polls.find(p => p.id == pollId);
            if (!poll) return;
            
            try {
                showLoadingMessage('กำลังอัปเดตการแสดงผล...');
                await updatePollVisibilityInDatabase(pollId, !poll.isVisible);
                
                // Reload data from database
                loadDataFromDatabase();
                
                hideLoadingMessage();
                showNotification(
                    poll.isVisible ? 'ซ่อนโพลแล้ว 🙈' : 'เปิดแสดงโพลแล้ว 👁️', 
                    'success'
                );
            } catch (error) {
                console.error('Error toggling poll visibility:', error);
                hideLoadingMessage();
                showNotification('เกิดข้อผิดพลาดในการอัปเดต ⚠️', 'error');
            }
        }

        function updatePollVisibilityInDatabase(pollId, isVisible) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'jsonpCallback_' + Date.now();
                
                window[callbackName] = function(data) {
                    try {
                        if (data.success) {
                            resolve(data);
                        } else {
                            throw new Error(data.error || 'Failed to update poll visibility');
                        }
                    } catch (error) {
                        reject(error);
                    }
                    
                    // Cleanup
                    document.head.removeChild(script);
                    delete window[callbackName];
                };
                
                const params = new URLSearchParams({
                    action: 'updatePollVisibility',
                    callback: callbackName,
                    pollId: pollId,
                    isVisible: isVisible
                });
                
                script.src = `${API_URL}?${params}`;
                document.head.appendChild(script);
            });
        }

        function updatePollInDatabase(pollId, title, options) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'jsonpCallback_' + Date.now();
                
                window[callbackName] = function(data) {
                    try {
                        if (data.success) {
                            resolve(data);
                        } else {
                            throw new Error(data.error || 'Failed to update poll');
                        }
                    } catch (error) {
                        reject(error);
                    }
                    
                    // Cleanup
                    document.head.removeChild(script);
                    delete window[callbackName];
                };
                
                const params = new URLSearchParams({
                    action: 'updatePoll',
                    callback: callbackName,
                    pollId: pollId,
                    title: title,
                    options: JSON.stringify(options)
                });
                
                script.src = `${API_URL}?${params}`;
                document.head.appendChild(script);
            });
        }

        function editPoll(pollId) {
            const poll = polls.find(p => p.id == pollId);
            if (!poll) return;
            
            // Fill edit form
            document.getElementById('editPollId').value = poll.id;
            document.getElementById('editPollTitle').value = poll.title;
            
            // Clear and populate options
            const container = document.getElementById('editOptionsContainer');
            container.innerHTML = '';
            
            poll.options.forEach((option, index) => {
                addEditOption(option, index);
            });
            
            // Show modal
            document.getElementById('editPollModal').classList.remove('hidden');
        }

        function addEditOption(value = '', index = null) {
            const container = document.getElementById('editOptionsContainer');
            const optionDiv = document.createElement('div');
            optionDiv.className = 'flex items-center space-x-2';
            optionDiv.innerHTML = `
                <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="ตัวเลือก" value="${value}" required>
                <button type="button" onclick="this.parentElement.remove()" 
                        class="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                    ❌
                </button>
            `;
            container.appendChild(optionDiv);
        }

        // Show notification
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 ${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Edit poll form handlers
        document.getElementById('addOptionBtn').addEventListener('click', () => addEditOption());
        
        document.getElementById('cancelEditBtn').addEventListener('click', function() {
            document.getElementById('editPollModal').classList.add('hidden');
        });

        document.getElementById('editPollForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const pollId = parseInt(document.getElementById('editPollId').value);
            const title = document.getElementById('editPollTitle').value.trim();
            const optionInputs = document.querySelectorAll('#editOptionsContainer input');
            const options = Array.from(optionInputs).map(input => input.value.trim()).filter(opt => opt);
            
            if (!title || options.length < 2) {
                alert('กรุณาใส่หัวข้อและตัวเลือกอย่างน้อย 2 ตัวเลือก');
                return;
            }
            
            const poll = polls.find(p => p.id == pollId);
            if (!poll) return;
            
            try {
                showLoadingMessage('กำลังบันทึกการแก้ไข...');
                await updatePollInDatabase(pollId, title, options);
                
                // Hide modal and reload data
                document.getElementById('editPollModal').classList.add('hidden');
                loadDataFromDatabase();
                
                hideLoadingMessage();
                showNotification('แก้ไขโพลสำเร็จ! ✏️', 'success');
            } catch (error) {
                console.error('Error updating poll:', error);
                hideLoadingMessage();
                showNotification('เกิดข้อผิดพลาดในการแก้ไข ⚠️', 'error');
            }
        });