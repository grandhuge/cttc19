        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAMY49YYOfOq4vmgV6-0B6Nw0YMbeNDKqY",
            authDomain: "cttc19suratthani.firebaseapp.com",
            databaseURL: "https://cttc19suratthani-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "cttc19suratthani",
            storageBucket: "cttc19suratthani.firebasestorage.app",
            messagingSenderId: "400782042259",
            appId: "1:400782042259:web:e210cb760ac60bd48c9966",
            measurementId: "G-0ZHSKLB86K"
        };

        // Initialize Firebase with error handling
        let database = null;
        let firebaseInitialized = false;

        try {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            firebaseInitialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            showNotification('ไม่สามารถเชื่อมต่อ Firebase ได้: ' + error.message, 'error');
        }

        // Global State
        let currentUser = null;
        let currentRoom = null;
        let currentQuestion = null;
        let participants = [];
        let responses = {};
        let questionTimer = null;
        let timeLeft = 0;
        let participantId = null;
        let roomRef = null;
        let questionRef = null;
        let responsesRef = null;
        let participantsRef = null;
        let isFullscreen = false;

        // Connection Status
        let isConnected = false;
        
        function initializeConnectionMonitoring() {
            if (!firebaseInitialized || !database) {
                isConnected = false;
                updateConnectionStatus();
                return;
            }
            
            try {
                database.ref('.info/connected').on('value', (snapshot) => {
                    isConnected = snapshot.val();
                    updateConnectionStatus();
                    
                    if (isConnected) {
                        console.log('Connected to Firebase');
                    } else {
                        console.log('Disconnected from Firebase');
                    }
                });
            } catch (error) {
                console.error('Connection monitoring error:', error);
                isConnected = false;
                updateConnectionStatus();
            }
        }
        
        // Initialize connection monitoring after a short delay
        setTimeout(initializeConnectionMonitoring, 1000);

        function updateConnectionStatus() {
            const statusElement = document.getElementById('connectionStatus');
            const statusText = document.getElementById('statusText');
            const helpElement = document.getElementById('connectionHelp');
            
            if (isConnected && firebaseInitialized) {
                statusElement.className = 'connection-status connected';
                statusText.textContent = 'เชื่อมต่อแล้ว';
                if (helpElement) helpElement.classList.add('hidden');
            } else {
                statusElement.className = 'connection-status disconnected';
                if (!firebaseInitialized) {
                    statusText.textContent = 'Firebase ไม่ได้เริ่มต้น';
                } else {
                    statusText.textContent = 'ไม่ได้เชื่อมต่อ';
                }
                if (helpElement) helpElement.classList.remove('hidden');
            }
        }

        // Fullscreen Functions
        function enterFullscreen() {
            if (!currentQuestion) {
                showNotification('ไม่มีคำถามที่กำลังดำเนินการ', 'error');
                return;
            }

            isFullscreen = true;
            const overlay = document.getElementById('fullscreenOverlay');
            const roomCodeElement = document.getElementById('fullscreenRoomCode');
            
            roomCodeElement.textContent = `ห้อง: ${currentRoom}`;
            overlay.classList.add('active');
            
            // Copy current results to fullscreen
            updateFullscreenResults();
            
            // Hide fullscreen button
            document.getElementById('fullscreenBtn').classList.add('hidden');
        }

        function exitFullscreen() {
            isFullscreen = false;
            const overlay = document.getElementById('fullscreenOverlay');
            overlay.classList.remove('active');
            
            // Show fullscreen button if there's an active question
            if (currentQuestion) {
                document.getElementById('fullscreenBtn').classList.remove('hidden');
            }
        }

        function updateFullscreenResults() {
            if (!isFullscreen || !currentQuestion) return;
            
            const container = document.getElementById('fullscreenResultsContainer');
            
            if (currentQuestion.type === 'multiple-choice') {
                displayFullscreenMultipleChoice(container);
            } else if (currentQuestion.type === 'word-cloud') {
                displayFullscreenWordCloud(container);
            } else if (currentQuestion.type === 'rating') {
                displayFullscreenRating(container);
            } else {
                displayFullscreenOpenText(container);
            }
        }

        function displayFullscreenMultipleChoice(container) {
            const counts = new Array(currentQuestion.options.length).fill(0);
            let totalResponses = 0;
            
            Object.values(responses).forEach(response => {
                if (response.type === 'multiple-choice' && typeof response.answer === 'number') {
                    counts[response.answer]++;
                    totalResponses++;
                }
            });

            const maxCount = Math.max(...counts, 1);
            
            container.innerHTML = `
                <div class="text-center">
                    <h2 class="text-4xl font-bold text-gray-900 mb-8">${currentQuestion.text}</h2>
                    <div class="grid gap-6 max-w-4xl mx-auto">
                        ${currentQuestion.options.map((option, index) => {
                            const percentage = totalResponses > 0 ? (counts[index] / totalResponses * 100) : 0;
                            const barWidth = totalResponses > 0 ? (counts[index] / maxCount * 100) : 0;
                            return `
                                <div class="bg-gray-50 rounded-xl p-6 text-left">
                                    <div class="flex justify-between items-center mb-3">
                                        <span class="text-2xl font-semibold">${String.fromCharCode(65 + index)}. ${option}</span>
                                        <span class="text-3xl font-bold text-blue-600">${counts[index]}</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-4 mb-2">
                                        <div class="bg-blue-500 h-4 rounded-full transition-all duration-500" style="width: ${barWidth}%"></div>
                                    </div>
                                    <div class="text-right text-lg text-gray-600">${percentage.toFixed(1)}%</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="mt-8 text-2xl text-gray-600">จำนวนผู้ตอบ: ${totalResponses}</div>
                </div>
            `;
        }

        function displayFullscreenWordCloud(container) {
            const words = [];
            let totalResponses = 0;
            
            Object.values(responses).forEach(response => {
                if (response.type === 'word-cloud' && response.answer) {
                    words.push(response.answer);
                    totalResponses++;
                }
            });
            
            container.innerHTML = `
                <div class="text-center">
                    <h2 class="text-4xl font-bold text-gray-900 mb-8">${currentQuestion.text}</h2>
                    <div class="min-h-96 flex flex-wrap justify-center items-center p-8 bg-gray-50 rounded-xl">
                        ${words.length === 0 ? 
                            '<p class="text-2xl text-gray-500">รอคำตอบจากผู้เข้าร่วม...</p>' :
                            words.map(word => 
                                `<span class="word-cloud-item text-2xl m-3" style="font-size: ${Math.random() * 2 + 1.5}rem">${word}</span>`
                            ).join('')
                        }
                    </div>
                    <div class="mt-8 text-2xl text-gray-600">จำนวนผู้ตอบ: ${totalResponses}</div>
                </div>
            `;
        }

        function displayFullscreenRating(container) {
            let totalRating = 0;
            let totalResponses = 0;
            
            Object.values(responses).forEach(response => {
                if (response.type === 'rating' && typeof response.answer === 'number') {
                    totalRating += response.answer;
                    totalResponses++;
                }
            });
            
            const average = totalResponses > 0 ? (totalRating / totalResponses).toFixed(1) : '0.0';
            
            container.innerHTML = `
                <div class="text-center">
                    <h2 class="text-4xl font-bold text-gray-900 mb-8">${currentQuestion.text}</h2>
                    <div class="text-center">
                        <div class="text-9xl font-bold text-blue-500 mb-4">${average}</div>
                        <div class="text-3xl text-gray-600 mb-8">คะแนนเฉลี่ย</div>
                        <div class="flex justify-center space-x-2 mb-8">
                            ${[1,2,3,4,5].map(i => `<span class="text-6xl text-yellow-400">⭐</span>`).join('')}
                        </div>
                        <div class="text-2xl text-gray-600">จำนวนผู้ตอบ: ${totalResponses}</div>
                    </div>
                </div>
            `;
        }

        function displayFullscreenOpenText(container) {
            const textResponses = [];
            Object.values(responses).forEach(response => {
                if (response.type === 'open-text' && response.answer) {
                    textResponses.push(response.answer);
                }
            });
            
            container.innerHTML = `
                <div class="text-center">
                    <h2 class="text-4xl font-bold text-gray-900 mb-8">${currentQuestion.text}</h2>
                    <div class="space-y-6 max-h-96 overflow-y-auto">
                        ${textResponses.length === 0 ? 
                            '<p class="text-2xl text-gray-500 py-16">รอคำตอบจากผู้เข้าร่วม...</p>' :
                            textResponses.map((response, index) => `
                                <div class="bg-gray-50 p-6 rounded-xl border-l-4 border-blue-500 text-left">
                                    <p class="text-xl text-gray-800">"${response}"</p>
                                    <p class="text-lg text-gray-500 mt-3">ผู้เข้าร่วม #${index + 1}</p>
                                </div>
                            `).join('')
                        }
                    </div>
                    <div class="mt-8 text-2xl text-gray-600">จำนวนผู้ตอบ: ${textResponses.length}</div>
                </div>
            `;
        }

        // Utility Functions
        function generateRoomCode() {
            return Math.random().toString(36).substr(2, 6).toUpperCase();
        }

        function generateParticipantId() {
            return 'participant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            const notificationText = document.getElementById('notificationText');
            
            notificationText.textContent = message;
            notification.className = `notification ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg show`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        function hideAllScreens() {
            document.getElementById('homeScreen').classList.add('hidden');
            document.getElementById('presenterDashboard').classList.add('hidden');
            document.getElementById('participantInterface').classList.add('hidden');
        }

        // Firebase Database Functions
        function createRoom(roomCode) {
            const roomData = {
                code: roomCode,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                createdBy: 'presenter',
                status: 'active',
                currentQuestion: null,
                participants: {},
                responses: {}
            };
            
            return database.ref(`rooms/${roomCode}`).set(roomData);
        }

        function joinRoomInDatabase(roomCode, participantId) {
            const participantData = {
                id: participantId,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'active'
            };
            
            return database.ref(`rooms/${roomCode}/participants/${participantId}`).set(participantData);
        }

        function setupRoomListeners(roomCode) {
            roomRef = database.ref(`rooms/${roomCode}`);
            
            // Listen for participant changes
            participantsRef = roomRef.child('participants');
            participantsRef.on('value', (snapshot) => {
                const participantsData = snapshot.val() || {};
                participants = Object.values(participantsData);
                updateParticipantCount();
            });

            // Listen for question changes
            questionRef = roomRef.child('currentQuestion');
            questionRef.on('value', (snapshot) => {
                const questionData = snapshot.val();
                if (questionData && currentUser === 'participant') {
                    currentQuestion = questionData;
                    timeLeft = questionData.timeLeft || 0;
                    displayParticipantQuestion();
                } else if (!questionData && currentUser === 'participant') {
                    showWaitingScreen();
                }
            });

            // Listen for responses (presenter only)
            if (currentUser === 'presenter') {
                responsesRef = roomRef.child('responses');
                responsesRef.on('value', (snapshot) => {
                    responses = snapshot.val() || {};
                    if (currentQuestion) {
                        updatePresenterResults();
                        if (isFullscreen) {
                            updateFullscreenResults();
                        }
                    }
                });
            }

            // Listen for timer updates
            roomRef.child('timer').on('value', (snapshot) => {
                const timerData = snapshot.val();
                if (timerData) {
                    timeLeft = timerData.timeLeft || 0;
                    updateTimerDisplay();
                }
            });
        }

        function cleanupListeners() {
            if (roomRef) roomRef.off();
            if (questionRef) questionRef.off();
            if (responsesRef) responsesRef.off();
            if (participantsRef) participantsRef.off();
        }

        // Home Screen Functions
        async function showPresenterLogin() {
            if (!firebaseInitialized || !database) {
                showNotification('Firebase ไม่ได้เริ่มต้น กรุณาตรวจสอบการตั้งค่า', 'error');
                return;
            }
            
            if (!isConnected) {
                showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ต', 'error');
                return;
            }

            hideAllScreens();
            document.getElementById('presenterDashboard').classList.remove('hidden');
            
            currentUser = 'presenter';
            currentRoom = generateRoomCode();
            
            try {
                await createRoom(currentRoom);
                document.getElementById('currentRoomCode').textContent = currentRoom;
                setupRoomListeners(currentRoom);
                showNotification('สร้างห้องสำเร็จ! รหัสห้อง: ' + currentRoom);
                updateQuestionTypeOptions();
            } catch (error) {
                console.error('Error creating room:', error);
                showNotification('เกิดข้อผิดพลาดในการสร้างห้อง', 'error');
                goHome();
            }
        }

        async function joinRoom() {
            if (!firebaseInitialized || !database) {
                showNotification('Firebase ไม่ได้เริ่มต้น กรุณาตรวจสอบการตั้งค่า', 'error');
                return;
            }
            
            if (!isConnected) {
                showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ต', 'error');
                return;
            }

            const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
            
            if (roomCode.length !== 6) {
                showNotification('กรุณาใส่รหัสห้อง 6 หลัก', 'error');
                return;
            }

            if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
                showNotification('รหัสห้องไม่ถูกต้อง กรุณาใส่ตัวอักษรและตัวเลขเท่านั้น', 'error');
                return;
            }

            try {
                // Check if room exists
                const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
                if (!roomSnapshot.exists()) {
                    showNotification('ไม่พบห้องนี้ กรุณาตรวจสอบรหัสห้อง', 'error');
                    return;
                }

                const roomData = roomSnapshot.val();
                if (roomData.status !== 'active') {
                    showNotification('ห้องนี้ไม่ได้เปิดใช้งาน', 'error');
                    return;
                }

                hideAllScreens();
                document.getElementById('participantInterface').classList.remove('hidden');
                
                currentUser = 'participant';
                currentRoom = roomCode;
                participantId = generateParticipantId();
                
                document.getElementById('participantRoomCode').textContent = roomCode;
                
                await joinRoomInDatabase(roomCode, participantId);
                setupRoomListeners(roomCode);
                
                showNotification('เข้าร่วมห้องสำเร็จ!');
            } catch (error) {
                console.error('Error joining room:', error);
                showNotification('เกิดข้อผิดพลาดในการเข้าร่วมห้อง', 'error');
            }
        }

        function updateParticipantCount() {
            const countElement = document.getElementById('participantCount');
            if (countElement) {
                countElement.textContent = participants.length;
            }
        }

        async function goHome() {
            // Exit fullscreen if active
            if (isFullscreen) {
                exitFullscreen();
            }

            // Clean up Firebase listeners
            cleanupListeners();
            
            // Remove participant from room if they were a participant
            if (currentUser === 'participant' && currentRoom && participantId) {
                try {
                    await database.ref(`rooms/${currentRoom}/participants/${participantId}`).remove();
                } catch (error) {
                    console.error('Error removing participant:', error);
                }
            }

            // Clear timers
            if (questionTimer) {
                clearInterval(questionTimer);
                questionTimer = null;
            }

            hideAllScreens();
            document.getElementById('homeScreen').classList.remove('hidden');
            
            // Reset state
            currentUser = null;
            currentRoom = null;
            currentQuestion = null;
            participants = [];
            responses = {};
            timeLeft = 0;
            participantId = null;
            roomRef = null;
            questionRef = null;
            responsesRef = null;
            participantsRef = null;
            isFullscreen = false;
            
            // Reset form inputs
            document.getElementById('roomCodeInput').value = '';
            document.getElementById('questionText').value = '';
            document.getElementById('questionTimer').value = '60';
            
            // Reset options
            const optionsList = document.getElementById('optionsList');
            optionsList.innerHTML = `
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 rounded-lg mb-2" placeholder="ตัวเลือก 1">
                <input type="text" class="option-input w-full px-3 py-2 border border-gray-300 rounded-lg mb-2" placeholder="ตัวเลือก 2">
            `;
        }

        // Question Management
        function updateQuestionTypeOptions() {
            const questionType = document.getElementById('questionType').value;
            const optionsContainer = document.getElementById('optionsContainer');
            
            if (questionType === 'multiple-choice') {
                optionsContainer.style.display = 'block';
            } else {
                optionsContainer.style.display = 'none';
            }
        }

        function addOption() {
            const optionsList = document.getElementById('optionsList');
            const optionCount = optionsList.children.length + 1;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'option-input w-full px-3 py-2 border border-gray-300 rounded-lg mb-2';
            input.placeholder = `ตัวเลือก ${optionCount}`;
            
            optionsList.appendChild(input);
        }

        async function startQuestion() {
            if (!isConnected) {
                showNotification('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
                return;
            }

            // Show loading state
            const btn = document.getElementById('questionControlBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>กำลังเริ่ม...';
            btn.disabled = true;
            
            setTimeout(async () => {
                try {
                    const questionType = document.getElementById('questionType').value;
                    const questionText = document.getElementById('questionText').value.trim();
                    const timerValue = parseInt(document.getElementById('questionTimer').value);
                
                    if (!questionText) {
                        showNotification('กรุณาใส่คำถาม', 'error');
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        return;
                    }

                    if (timerValue < 10 || timerValue > 300) {
                        showNotification('เวลาต้องอยู่ระหว่าง 10-300 วินาที', 'error');
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        return;
                    }

                    let options = [];
                    if (questionType === 'multiple-choice') {
                        const optionInputs = document.querySelectorAll('.option-input');
                        options = Array.from(optionInputs)
                            .map(input => input.value.trim())
                            .filter(option => option.length > 0);
                        
                        if (options.length < 2) {
                            showNotification('กรุณาใส่ตัวเลือกอย่างน้อย 2 ตัวเลือก', 'error');
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                            return;
                        }

                        if (options.length > 6) {
                            showNotification('ตัวเลือกไม่ควรเกิน 6 ตัวเลือก', 'error');
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                            return;
                        }
                    }

                    currentQuestion = {
                        type: questionType,
                        text: questionText,
                        options: options,
                        timer: timerValue,
                        startTime: firebase.database.ServerValue.TIMESTAMP,
                        timeLeft: timerValue
                    };

                    // Save question to Firebase
                    await database.ref(`rooms/${currentRoom}/currentQuestion`).set(currentQuestion);
                    await database.ref(`rooms/${currentRoom}/responses`).remove(); // Clear previous responses
                    
                    responses = {};
                    startTimer(timerValue);
                    displayPresenterResults();
                    
                    // Update button states
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    document.getElementById('questionControlBtn').classList.add('hidden');
                    document.getElementById('stopQuestionBtn').classList.remove('hidden');
                    document.getElementById('fullscreenBtn').classList.remove('hidden');
                    
                    showNotification('เริ่มคำถามแล้ว!');
                } catch (error) {
                    console.error('Error starting question:', error);
                    showNotification('เกิดข้อผิดพลาดในการเริ่มคำถาม', 'error');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }, 500);
        }

        async function stopQuestion() {
            try {
                if (questionTimer) {
                    clearInterval(questionTimer);
                    questionTimer = null;
                }
                
                timeLeft = 0;
                await database.ref(`rooms/${currentRoom}/timer`).set({ timeLeft: 0 });
                await database.ref(`rooms/${currentRoom}/currentQuestion`).remove();
                
                updateTimerDisplay();
                
                // Update button states
                document.getElementById('questionControlBtn').classList.remove('hidden');
                document.getElementById('stopQuestionBtn').classList.add('hidden');
                document.getElementById('fullscreenBtn').classList.add('hidden');
                
                showNotification('หยุดคำถามแล้ว');
                endQuestion();
            } catch (error) {
                console.error('Error stopping question:', error);
                showNotification('เกิดข้อผิดพลาดในการหยุดคำถาม', 'error');
            }
        }

        function startTimer(seconds) {
            timeLeft = seconds;
            updateTimerDisplay();
            
            questionTimer = setInterval(async () => {
                timeLeft--;
                updateTimerDisplay();
                
                // Update timer in Firebase
                try {
                    await database.ref(`rooms/${currentRoom}/timer`).set({ timeLeft });
                } catch (error) {
                    console.error('Error updating timer:', error);
                }
                
                if (timeLeft <= 0) {
                    clearInterval(questionTimer);
                    endQuestion();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const presenterTimer = document.getElementById('presenterTimer');
            const participantTimer = document.getElementById('participantTimer');
            const fullscreenTimer = document.getElementById('fullscreenTimer');
            
            const displayText = timeLeft > 0 ? `${timeLeft}s` : 'หมดเวลา';
            const className = timeLeft <= 10 ? 'text-2xl font-bold text-red-500 pulse-animation' : 'text-2xl font-bold text-blue-500';
            const fullscreenClassName = timeLeft <= 10 ? 'text-4xl font-bold text-red-500 pulse-animation' : 'text-4xl font-bold text-blue-500';
            
            if (presenterTimer) {
                presenterTimer.textContent = displayText;
                presenterTimer.className = className;
            }
            
            if (participantTimer) {
                participantTimer.textContent = displayText;
                participantTimer.className = className;
            }

            if (fullscreenTimer) {
                fullscreenTimer.textContent = displayText;
                fullscreenTimer.className = fullscreenClassName;
            }
        }

        async function endQuestion() {
            try {
                // Update button states
                document.getElementById('questionControlBtn').classList.remove('hidden');
                document.getElementById('stopQuestionBtn').classList.add('hidden');
                document.getElementById('fullscreenBtn').classList.add('hidden');
                document.getElementById('exportBtn').classList.remove('hidden');
                
                // Remove current question from Firebase
                await database.ref(`rooms/${currentRoom}/currentQuestion`).remove();
                
                showNotification('คำถามสิ้นสุดแล้ว');
            } catch (error) {
                console.error('Error ending question:', error);
            }
        }

        function exportResults() {
            if (!currentQuestion) {
                showNotification('ไม่มีข้อมูลให้ส่งออก', 'error');
                return;
            }

            const exportData = {
                question: currentQuestion.text,
                type: currentQuestion.type,
                roomCode: currentRoom,
                timestamp: new Date().toISOString(),
                participantCount: participants.length,
                responses: responses
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `poll-results-${currentRoom}-${Date.now()}.json`;
            link.click();
            
            showNotification('ส่งออกผลลัพธ์สำเร็จ!');
        }

        // Display Functions
        function displayPresenterResults() {
            const container = document.getElementById('resultsContainer');
            
            if (currentQuestion.type === 'multiple-choice') {
                displayMultipleChoiceResults(container);
            } else if (currentQuestion.type === 'word-cloud') {
                displayWordCloudResults(container);
            } else if (currentQuestion.type === 'rating') {
                displayRatingResults(container);
            } else {
                displayOpenTextResults(container);
            }
        }

        function updatePresenterResults() {
            if (!currentQuestion) return;
            
            if (currentQuestion.type === 'multiple-choice') {
                updateMultipleChoiceChart();
            } else if (currentQuestion.type === 'word-cloud') {
                updateWordCloud();
            } else if (currentQuestion.type === 'rating') {
                updateRatingDisplay();
            } else {
                updateTextResponses();
            }
        }

        function displayMultipleChoiceResults(container) {
            const chartContainer = document.createElement('div');
            chartContainer.innerHTML = `
                <h3 class="text-lg font-semibold mb-4">${currentQuestion.text}</h3>
                <canvas id="resultsChart" width="400" height="200"></canvas>
                <div id="responseCount" class="mt-4 text-sm text-gray-600">จำนวนผู้ตอบ: 0</div>
            `;
            
            container.innerHTML = '';
            container.appendChild(chartContainer);
            
            // Create chart
            const ctx = document.getElementById('resultsChart').getContext('2d');
            window.currentChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: currentQuestion.options,
                    datasets: [{
                        label: 'จำนวนคะแนนโหวต',
                        data: new Array(currentQuestion.options.length).fill(0),
                        backgroundColor: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                        ],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });

            updateMultipleChoiceChart();
        }

        function updateMultipleChoiceChart() {
            if (!window.currentChart || !currentQuestion) return;
            
            const counts = new Array(currentQuestion.options.length).fill(0);
            let totalResponses = 0;
            
            Object.values(responses).forEach(response => {
                if (response.type === 'multiple-choice' && typeof response.answer === 'number') {
                    counts[response.answer]++;
                    totalResponses++;
                }
            });
            
            window.currentChart.data.datasets[0].data = counts;
            window.currentChart.update('none');
            
            const responseCountElement = document.getElementById('responseCount');
            if (responseCountElement) {
                responseCountElement.textContent = `จำนวนผู้ตอบ: ${totalResponses}`;
            }
        }

        function displayWordCloudResults(container) {
            container.innerHTML = `
                <h3 class="text-lg font-semibold mb-4">${currentQuestion.text}</h3>
                <div id="wordCloud" class="min-h-48 flex flex-wrap justify-center items-center p-4 bg-gray-50 rounded-lg">
                    <p class="text-gray-500">รอคำตอบจากผู้เข้าร่วม...</p>
                </div>
                <div id="responseCount" class="mt-4 text-sm text-gray-600">จำนวนผู้ตอบ: 0</div>
            `;

            updateWordCloud();
        }

        function updateWordCloud() {
            const wordCloud = document.getElementById('wordCloud');
            if (!wordCloud) return;
            
            const words = [];
            let totalResponses = 0;
            
            Object.values(responses).forEach(response => {
                if (response.type === 'word-cloud' && response.answer) {
                    words.push(response.answer);
                    totalResponses++;
                }
            });
            
            if (words.length === 0) {
                wordCloud.innerHTML = '<p class="text-gray-500">รอคำตอบจากผู้เข้าร่วม...</p>';
            } else {
                wordCloud.innerHTML = words.map(word => 
                    `<span class="word-cloud-item" style="font-size: ${Math.random() * 1.5 + 1}rem">${word}</span>`
                ).join('');
            }
            
            const responseCountElement = document.getElementById('responseCount');
            if (responseCountElement) {
                responseCountElement.textContent = `จำนวนผู้ตอบ: ${totalResponses}`;
            }
        }

        function displayRatingResults(container) {
            container.innerHTML = `
                <h3 class="text-lg font-semibold mb-4">${currentQuestion.text}</h3>
                <div class="text-center">
                    <div class="text-6xl font-bold text-blue-500 mb-2" id="averageRating">0.0</div>
                    <div class="text-lg text-gray-600 mb-4">คะแนนเฉลี่ย</div>
                    <div class="flex justify-center space-x-2 mb-4">
                        ${[1,2,3,4,5].map(i => `<span class="text-2xl text-yellow-400">⭐</span>`).join('')}
                    </div>
                </div>
                <div id="responseCount" class="mt-4 text-sm text-gray-600">จำนวนผู้ตอบ: 0</div>
            `;

            updateRatingDisplay();
        }

        function updateRatingDisplay() {
            let totalRating = 0;
            let totalResponses = 0;
            
            Object.values(responses).forEach(response => {
                if (response.type === 'rating' && typeof response.answer === 'number') {
                    totalRating += response.answer;
                    totalResponses++;
                }
            });
            
            const average = totalResponses > 0 ? (totalRating / totalResponses).toFixed(1) : '0.0';
            
            const averageElement = document.getElementById('averageRating');
            if (averageElement) {
                averageElement.textContent = average;
            }
            
            const responseCountElement = document.getElementById('responseCount');
            if (responseCountElement) {
                responseCountElement.textContent = `จำนวนผู้ตอบ: ${totalResponses}`;
            }
        }

        function displayOpenTextResults(container) {
            container.innerHTML = `
                <h3 class="text-lg font-semibold mb-4">${currentQuestion.text}</h3>
                <div id="textResponses" class="space-y-3 max-h-96 overflow-y-auto">
                    <p class="text-gray-500 text-center py-8">รอคำตอบจากผู้เข้าร่วม...</p>
                </div>
                <div id="responseCount" class="mt-4 text-sm text-gray-600">จำนวนผู้ตอบ: 0</div>
            `;

            updateTextResponses();
        }

        function updateTextResponses() {
            const container = document.getElementById('textResponses');
            if (!container) return;
            
            const textResponses = [];
            Object.values(responses).forEach(response => {
                if (response.type === 'open-text' && response.answer) {
                    textResponses.push(response.answer);
                }
            });
            
            if (textResponses.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">รอคำตอบจากผู้เข้าร่วม...</p>';
            } else {
                container.innerHTML = textResponses.map((response, index) => `
                    <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p class="text-gray-800">"${response}"</p>
                        <p class="text-sm text-gray-500 mt-2">ผู้เข้าร่วม #${index + 1}</p>
                    </div>
                `).join('');
            }
            
            const responseCountElement = document.getElementById('responseCount');
            if (responseCountElement) {
                responseCountElement.textContent = `จำนวนผู้ตอบ: ${textResponses.length}`;
            }
        }

        function showWaitingScreen() {
            const container = document.getElementById('participantContent');
            container.innerHTML = `
                <div class="text-center">
                    <div class="text-6xl text-blue-500 mb-6">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">รอคำถามถัดไป</h2>
                    <p class="text-gray-600">รอการเริ่มต้นคำถามจากผู้นำเสนอ...</p>
                </div>
            `;
        }

        function displayParticipantQuestion() {
            const container = document.getElementById('participantContent');
            
            if (currentQuestion.type === 'multiple-choice') {
                displayParticipantMultipleChoice(container);
            } else if (currentQuestion.type === 'word-cloud' || currentQuestion.type === 'open-text') {
                displayParticipantTextInput(container);
            } else if (currentQuestion.type === 'rating') {
                displayParticipantRating(container);
            }
        }

        function displayParticipantMultipleChoice(container) {
            const optionsHtml = currentQuestion.options.map((option, index) => `
                <button onclick="submitAnswer(${index})" 
                        class="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition duration-300 mb-3">
                    <span class="font-medium">${String.fromCharCode(65 + index)}.</span> ${option}
                </button>
            `).join('');

            container.innerHTML = `
                <div class="max-w-2xl mx-auto">
                    <div class="text-right mb-4">
                        <span id="participantTimer" class="text-2xl font-bold text-blue-500">${timeLeft}s</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-8">${currentQuestion.text}</h2>
                    <div class="space-y-3">
                        ${optionsHtml}
                    </div>
                </div>
            `;
        }

        function displayParticipantTextInput(container) {
            const placeholder = currentQuestion.type === 'word-cloud' ? 'ใส่คำหรือวลีสั้นๆ...' : 'ใส่คำตอบของคุณ...';
            
            container.innerHTML = `
                <div class="max-w-2xl mx-auto">
                    <div class="text-right mb-4">
                        <span id="participantTimer" class="text-2xl font-bold text-blue-500">${timeLeft}s</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-8">${currentQuestion.text}</h2>
                    <div class="space-y-4">
                        <textarea id="textAnswer" rows="4" 
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" 
                                  placeholder="${placeholder}"></textarea>
                        <button onclick="submitTextAnswer()" 
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300">
                            ส่งคำตอบ
                        </button>
                    </div>
                </div>
            `;
        }

        function displayParticipantRating(container) {
            container.innerHTML = `
                <div class="max-w-2xl mx-auto">
                    <div class="text-right mb-4">
                        <span id="participantTimer" class="text-2xl font-bold text-blue-500">${timeLeft}s</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-8">${currentQuestion.text}</h2>
                    <div class="text-center">
                        <p class="text-lg text-gray-600 mb-6">ให้คะแนน 1-5 ดาว</p>
                        <div class="flex justify-center space-x-2 mb-8">
                            ${[1,2,3,4,5].map(rating => `
                                <button onclick="submitRating(${rating})" 
                                        class="text-4xl text-gray-300 hover:text-yellow-400 transition duration-300">
                                    ⭐
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // Answer Submission Functions
        async function submitAnswer(optionIndex) {
            try {
                const selectedOption = currentQuestion.options[optionIndex];
                const responseData = {
                    participantId: participantId,
                    type: 'multiple-choice',
                    answer: optionIndex,
                    answerText: selectedOption,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                await database.ref(`rooms/${currentRoom}/responses/${participantId}`).set(responseData);
                
                showNotification(`ส่งคำตอบแล้ว: ${selectedOption}`);
                
                // Show confirmation
                document.getElementById('participantContent').innerHTML = `
                    <div class="text-center">
                        <div class="text-6xl text-green-500 mb-6">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">ส่งคำตอบแล้ว!</h2>
                        <p class="text-gray-600">คำตอบของคุณ: <span class="font-semibold">${selectedOption}</span></p>
                        <p class="text-gray-500 mt-4">รอผลลัพธ์จากผู้นำเสนอ...</p>
                    </div>
                `;
            } catch (error) {
                console.error('Error submitting answer:', error);
                showNotification('เกิดข้อผิดพลาดในการส่งคำตอบ', 'error');
            }
        }

        async function submitTextAnswer() {
            const answer = document.getElementById('textAnswer').value.trim();
            if (!answer) {
                showNotification('กรุณาใส่คำตอบ', 'error');
                return;
            }

            try {
                const responseData = {
                    participantId: participantId,
                    type: currentQuestion.type,
                    answer: answer,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                await database.ref(`rooms/${currentRoom}/responses/${participantId}`).set(responseData);
                
                showNotification('ส่งคำตอบแล้ว!');
                
                document.getElementById('participantContent').innerHTML = `
                    <div class="text-center">
                        <div class="text-6xl text-green-500 mb-6">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">ส่งคำตอบแล้ว!</h2>
                        <p class="text-gray-600">คำตอบของคุณ: <span class="font-semibold">"${answer}"</span></p>
                        <p class="text-gray-500 mt-4">รอผลลัพธ์จากผู้นำเสนอ...</p>
                    </div>
                `;
            } catch (error) {
                console.error('Error submitting text answer:', error);
                showNotification('เกิดข้อผิดพลาดในการส่งคำตอบ', 'error');
            }
        }

        async function submitRating(rating) {
            try {
                const responseData = {
                    participantId: participantId,
                    type: 'rating',
                    answer: rating,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                await database.ref(`rooms/${currentRoom}/responses/${participantId}`).set(responseData);
                
                showNotification(`ให้คะแนน ${rating} ดาว!`);
                
                document.getElementById('participantContent').innerHTML = `
                    <div class="text-center">
                        <div class="text-6xl text-green-500 mb-6">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">ส่งคำตอบแล้ว!</h2>
                        <div class="flex justify-center space-x-1 mb-4">
                            ${[1,2,3,4,5].map(i => `
                                <span class="text-2xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}">⭐</span>
                            `).join('')}
                        </div>
                        <p class="text-gray-600">คะแนนของคุณ: ${rating} ดาว</p>
                        <p class="text-gray-500 mt-4">รอผลลัพธ์จากผู้นำเสนอ...</p>
                    </div>
                `;
            } catch (error) {
                console.error('Error submitting rating:', error);
                showNotification('เกิดข้อผิดพลาดในการส่งคำตอบ', 'error');
            }
        }

        // Event Listeners
        document.getElementById('questionType').addEventListener('change', updateQuestionTypeOptions);
        
        document.getElementById('roomCodeInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                joinRoom();
            }
        });

        document.getElementById('roomCodeInput').addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (currentUser === 'presenter') {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    if (!document.getElementById('questionControlBtn').classList.contains('hidden')) {
                        startQuestion();
                    }
                }
                if (e.key === 'Escape') {
                    if (isFullscreen) {
                        exitFullscreen();
                    } else if (!document.getElementById('stopQuestionBtn').classList.contains('hidden')) {
                        stopQuestion();
                    }
                }
                if (e.key === 'f' || e.key === 'F') {
                    if (!isFullscreen && currentQuestion) {
                        e.preventDefault();
                        enterFullscreen();
                    }
                }
            }
        });

        // Initialize
        updateQuestionTypeOptions();
        updateConnectionStatus();
