// ตัวแปรสำหรับเกม
let currentQuestionIndex = 0;
let shuffledQuestions = [];
let reserveQuestions = []; // คำถามสำรองสำหรับตัวช่วยเปลี่ยนคำถาม
let score = 0;
let timer;
let timeLeft = 60;
let disabledAnswers = []; // เก็บตัวเลือกที่ถูกตัดออกไปแล้ว
let isTimePaused = false;
let pauseTimeoutId = null;
let isDoubleScoreActive = false;
let isShieldActive = false; // สถานะโล่ป้องกัน
let hasAnsweredCorrectly = false; // เพิ่มตัวแปรเพื่อตรวจสอบว่าตอบถูกแล้วหรือยัง
let currentQuestionScore = 1.0; // คะแนนเริ่มต้นของแต่ละข้อ
let wrongAttempts = 0; // จำนวนครั้งที่ตอบผิด
let questionStartTime; // เวลาเริ่มต้นของคำถาม
let timeBonus = 0; // โบนัสคะแนนจากเวลา
let isSoundOn = true; // สถานะเสียง
let totalWrongAttempts = 0; // จำนวนครั้งที่ตอบผิดทั้งหมด
let gameStartTime; // เวลาเริ่มต้นเกม
let totalGameTime = 0; // เวลาที่ใช้ในการเล่นทั้งหมด (วินาที)

// ตัวแปรสำหรับตัวช่วย
let pauseTimeUsed = false;
let addTimeUsed = false;
let doubleScoreUsed = false;
let fiftyFiftyUsed = false;
let changeQuestionUsed = false;
let shieldUsed = false;



// องค์ประกอบ DOM
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers');
const timerDisplay = document.getElementById('timer');
const timerBar = document.getElementById('timer-bar');
const scoreDisplay = document.getElementById('score');
const correctCountDisplay = document.getElementById('correct-count');
const feedback = document.getElementById('feedback');
const correctFeedback = document.getElementById('correct-feedback');
const incorrectFeedback = document.getElementById('incorrect-feedback');
const resultMessage = document.getElementById('result-message');
const nextQuestionContainer = document.getElementById('next-question-container');
const nextQuestionButton = document.getElementById('next-question');
const pauseTimeButton = document.getElementById('pause-time');
const addTimeButton = document.getElementById('add-time');
const doubleScoreButton = document.getElementById('double-score');
const fiftyFiftyButton = document.getElementById('fifty-fifty');
const changeQuestionButton = document.getElementById('change-question');
const shieldButton = document.getElementById('shield');
const doubleScoreIndicator = document.getElementById('double-score-indicator');
const shieldIndicator = document.getElementById('shield-indicator');
const questionScoreInfo = document.getElementById('question-score-info');
const questionScoreDisplay = document.getElementById('question-score');
const bonusScoreDisplay = document.getElementById('bonus-score');
const currentScoreDisplay = document.getElementById('current-score-display');
const currentScoreValue = document.getElementById('current-score');
const totalTimeDisplay = document.getElementById('total-time');
const perfectBonusElement = document.getElementById('perfect-bonus');
const perfectBonusText = document.getElementById('perfect-bonus-text');
const timeBonusElement = document.getElementById('time-bonus');
const timeBonusText = document.getElementById('time-bonus-text');
const playerNameInput = document.getElementById('player-name');
const saveScoreButton = document.getElementById('save-score');
const saveStatusMessage = document.getElementById('save-status');
const viewLeaderboardButton = document.getElementById('view-leaderboard-button');
const tabGame = document.getElementById('tab-game');
const tabLeaderboard = document.getElementById('tab-leaderboard');
const gameTab = document.getElementById('game-tab');
const leaderboardTab = document.getElementById('leaderboard-tab');
const backToGameButton = document.getElementById('back-to-game');
const leaderboardLoading = document.getElementById('leaderboard-loading');
const leaderboardContent = document.getElementById('leaderboard-content');
const leaderboardError = document.getElementById('leaderboard-error');
const leaderboardData = document.getElementById('leaderboard-data');
const loadingModal = document.getElementById('loading-modal');

// เสียง
const bgMusic = document.getElementById('bg-music');
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');

// =============================================
// ฟังก์ชันใหม่ที่ใช้ localStorage แทน API
// =============================================

// ฟังก์ชันบันทึกคะแนน
function saveScoreToLocalStorage(playerName, score, correctAnswers, wrongAnswers, totalTime) {
    try {
        // ดึงข้อมูลคะแนนที่มีอยู่
        const existingScores = JSON.parse(localStorage.getItem('gameScores')) || [];

        // สร้างข้อมูลคะแนนใหม่
        const newScore = {
            id: Date.now(), // ใช้ timestamp เป็น ID
            playerName: playerName,
            score: parseFloat(score.toFixed(1)),
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            totalTime: totalTime,
            date: new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        };

        // เพิ่มคะแนนใหม่
        existingScores.push(newScore);

        // เรียงลำดับคะแนนจากสูงไปต่ำ
        existingScores.sort((a, b) => b.score - a.score);

        // เก็บเฉพาะ 50 อันดับแรก
        const topScores = existingScores.slice(0, 50);

        // บันทึกลง localStorage
        localStorage.setItem('gameScores', JSON.stringify(topScores));

        return { status: 'success', message: 'บันทึกคะแนนสำเร็จ!' };
    } catch (error) {
        console.error('Error saving score:', error);
        return { status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก' };
    }
}

// ฟังก์ชันดึงข้อมูลคะแนนสูงสุด
function fetchHighScoresFromLocalStorage() {
    try {
        const scores = JSON.parse(localStorage.getItem('gameScores')) || [];
        return { status: 'success', data: scores };
    } catch (error) {
        console.error('Error fetching scores:', error);
        return { status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' };
    }
}


// =============================================
// ฟังก์ชันใหม่ที่เพิ่มสำหรับการเชื่อมต่อกับ API
// =============================================



// ฟังก์ชันแสดงหน้าจอโหลด (ปรับปรุง)
function showLoading() {
    // สำหรับ localStorage เราไม่ต้องแสดงหน้าจอโหลดนาน
    // แต่ยังคงใช้สำหรับกรณีที่ต้องการแสดงการประมวลผล
    loadingModal.classList.remove('hidden');
}

// ฟังก์ชันซ่อนหน้าจอโหลด (ปรับปรุง)
function hideLoading() {
    loadingModal.classList.add('hidden');
}

// ฟังก์ชันแสดงข้อความแจ้งเตือน
function showNotification(message, type = 'info') {
    const colors = {
        info: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// =============================================
// ฟังก์ชันเดิมที่ปรับปรุงเพื่อรองรับระบบใหม่
// =============================================

// แสดงผลลัพธ์ (ปรับปรุง)
function showResults() {
    // หยุดเพลงพื้นหลัง
    bgMusic.pause();

    // คำนวณเวลาที่ใช้ทั้งหมด
    totalGameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    totalTimeDisplay.textContent = totalGameTime;

    // คำนวณจำนวนคำถามที่ตอบถูก
    const correctCount = Math.floor(score);
    correctCountDisplay.textContent = correctCount;

    // แสดงคะแนน
    scoreDisplay.textContent = score.toFixed(1);

    // ตรวจสอบโบนัสไม่ตอบผิดเลย
    if (totalWrongAttempts === 0) {
        perfectBonusElement.classList.remove('bg-gray-100');
        perfectBonusElement.classList.add('bg-green-100');
        perfectBonusText.textContent = 'ได้รับโบนัส +2.0 คะแนน';
        perfectBonusText.classList.remove('text-gray-500');
        perfectBonusText.classList.add('text-green-600', 'font-bold');
        score += 2.0;
    } else {
        perfectBonusText.textContent = 'ไม่ได้รับโบนัส (ตอบผิด ' + totalWrongAttempts + ' ครั้ง)';
    }

    // ตรวจสอบโบนัสเวลา (สมมติว่าเวลาดีคือน้อยกว่า 300 วินาที)
    if (totalGameTime <= 300) {
        timeBonusElement.classList.remove('bg-gray-100');
        timeBonusElement.classList.add('bg-green-100');
        timeBonusText.textContent = 'ได้รับโบนัส +1.0 คะแนน';
        timeBonusText.classList.remove('text-gray-500');
        timeBonusText.classList.add('text-green-600', 'font-bold');
        score += 1.0;
    } else {
        timeBonusText.textContent = 'ไม่ได้รับโบนัส (ใช้เวลา ' + totalGameTime + ' วินาที)';
    }

    // อัพเดทคะแนนที่แสดง
    scoreDisplay.textContent = score.toFixed(1);

    // แสดงข้อความผลลัพธ์
    let message = '';
    if (score >= 18.4) {
        message = 'ยอดเยี่ยมมาก! คุณเก่งมากเลย 🎉';
    } else if (score >= 16.4) {
        message = 'ทำได้ดีมาก! เกือบจะเต็มแล้ว 😊';
    } else if (score >= 12.3) {
        message = 'ดีแล้ว! ลองเล่นอีกครั้งเพื่อทำคะแนนให้ดีขึ้นนะ 👍';
    } else {
        message = 'ยังมีที่สำหรับการพัฒนาอีกนะ ลองเล่นอีกครั้งดู! 💪';
    }
    resultMessage.innerHTML = `<p class="text-2xl">${message}</p>`;

    // ซ่อนหน้าคำถามและแสดงหน้าผลลัพธ์
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
}


// =============================================
// ปรับปรุงฟังก์ชันเดิมให้ใช้ localStorage
// =============================================

// เมื่อคลิกปุ่มบันทึกคะแนน (ปรับปรุง)
saveScoreButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();

    document.getElementById("save-score").disabled = true; //ปิดการใช้งานปุ่มบันทึกคะแนน

    if (!playerName) {
        saveStatusMessage.textContent = 'กรุณากรอกชื่อผู้เล่น';
        saveStatusMessage.className = 'mt-2 text-sm text-red-500';
        return;
    }

    // คำนวณจำนวนคำถามที่ตอบถูกและผิด
    const correctCount = Math.floor(score);
    const wrongCount = 10 - correctCount;

    try {
        const result = saveScoreToLocalStorage(playerName, score, correctCount, wrongCount, totalGameTime);

        if (result.status === 'success') {
            saveStatusMessage.textContent = 'บันทึกคะแนนสำเร็จ!';
            saveStatusMessage.className = 'mt-2 text-sm text-green-500';
            saveScoreButton.disabled = true;
            showNotification('บันทึกคะแนนสำเร็จ!', 'success');
        } else {
            throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
        }

    } catch (error) {
        console.error('Error saving score:', error);
        saveStatusMessage.textContent = 'เกิดข้อผิดพลาด: ' + error.message;
        saveStatusMessage.className = 'mt-2 text-sm text-red-500';
        showNotification('บันทึกคะแนนไม่สำเร็จ: ' + error.message, 'error');
    }
});

// เมื่อคลิกแท็บสถิติผู้เล่น (ปรับปรุง)
tabLeaderboard.addEventListener('click', () => {
    tabGame.classList.remove('active');
    tabLeaderboard.classList.add('active');
    gameTab.classList.remove('active');
    leaderboardTab.classList.remove('hidden');
    leaderboardTab.classList.add('active');

    // แสดงหน้าจอโหลด
    leaderboardLoading.classList.remove('hidden');
    leaderboardContent.classList.add('hidden');
    leaderboardError.classList.add('hidden');

    try {
        const result = fetchHighScoresFromLocalStorage();

        if (result.status === 'success') {
            // ล้างข้อมูลเดิม
            leaderboardData.innerHTML = '';

            // เพิ่มข้อมูลใหม่
            if (result.data && result.data.length > 0) {
                result.data.forEach((player, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${player.playerName}</td>
                        <td>${player.score.toFixed(1)}</td>
                        <td>${player.totalTime} วินาที</td>
                        <td>${player.date}</td>
                    `;
                    leaderboardData.appendChild(row);
                });

                leaderboardLoading.classList.add('hidden');
                leaderboardContent.classList.remove('hidden');
            } else {
                leaderboardLoading.classList.add('hidden');
                leaderboardError.textContent = 'ยังไม่มีข้อมูลคะแนน';
                leaderboardError.classList.remove('hidden');
            }
        } else {
            leaderboardLoading.classList.add('hidden');
            leaderboardError.textContent = result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล';
            leaderboardError.classList.remove('hidden');
            showNotification('ดึงข้อมูลคะแนนไม่สำเร็จ: ' + (result.message || 'ไม่ทราบสาเหตุ'), 'error');
        }
    } catch (error) {
        leaderboardLoading.classList.add('hidden');
        leaderboardError.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        leaderboardError.classList.remove('hidden');
        showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
});

// เมื่อคลิกปุ่มเริ่มเกม (ปรับปรุง)
startButton.addEventListener('click', () => {
    // สุ่มคำถาม
    const { main, reserve } = selectRandomQuestions();
    shuffledQuestions = main;
    reserveQuestions = reserve;

    // รีเซ็ตตัวแปรเกม
    currentQuestionIndex = 0;
    score = 0;
    totalWrongAttempts = 0;
    gameStartTime = Date.now();
    totalGameTime = 0;

    // รีเซ็ตตัวช่วยทั้งหมด (ตัวแปร)
    pauseTimeUsed = false;
    addTimeUsed = false;
    doubleScoreUsed = false;
    fiftyFiftyUsed = false;
    changeQuestionUsed = false;
    shieldUsed = false;
    isDoubleScoreActive = false;
    isShieldActive = false;

    // ==========================================
    // เพิ่มโค้ดส่วนนี้เพื่อรีเซ็ตหน้าตาและการกดปุ่มตัวช่วย
    // ==========================================

    // 1. ปลดล็อกและคืนสีปุ่มหยุดเวลา
    pauseTimeButton.disabled = false;
    pauseTimeButton.classList.remove('bg-gray-100', 'text-gray-400');
    pauseTimeButton.classList.add('bg-blue-100', 'text-blue-700');

    // 2. ปลดล็อกและคืนสีปุ่มเพิ่มเวลา
    addTimeButton.disabled = false;
    addTimeButton.classList.remove('bg-gray-100', 'text-gray-400');
    addTimeButton.classList.add('bg-green-100', 'text-green-700');

    // 3. ปลดล็อกและคืนสีปุ่มคะแนนคูณสอง
    doubleScoreButton.disabled = false;
    doubleScoreButton.classList.remove('bg-gray-100', 'text-gray-400');
    doubleScoreButton.classList.add('bg-yellow-100', 'text-yellow-700');

    // 4. ปลดล็อกและคืนสีปุ่ม 50:50
    fiftyFiftyButton.disabled = false;
    fiftyFiftyButton.classList.remove('bg-gray-100', 'text-gray-400');
    fiftyFiftyButton.classList.add('bg-pink-100', 'text-pink-700');

    // 5. ปลดล็อกและคืนสีปุ่มเปลี่ยนคำถาม
    changeQuestionButton.disabled = false;
    changeQuestionButton.classList.remove('bg-gray-100', 'text-gray-400');
    changeQuestionButton.classList.add('bg-purple-100', 'text-purple-700');

    // 6. ปลดล็อกและคืนสีปุ่มโล่ป้องกัน
    shieldButton.disabled = false;
    shieldButton.classList.remove('bg-gray-100', 'text-gray-400');
    shieldButton.classList.add('bg-indigo-100', 'text-indigo-700');

    // ==========================================

    // เปิดเพลงพื้นหลัง (ถ้าเปิดเสียงอยู่)
    if (isSoundOn) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log('Cannot play music:', e));
    }

    // แสดงคะแนนสะสม
    currentScoreDisplay.classList.remove('hidden');
    updateCurrentScoreDisplay();

    // ซ่อนหน้าจอเริ่มต้นและแสดงหน้าคำถาม
    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');

    // แสดงคำถามแรก
    displayQuestion();
});

// เมื่อคลิกปุ่มเล่นอีกครั้ง (ปรับปรุง)
restartButton.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');

    // รีเซ็ตฟอร์มบันทึกคะแนน
    playerNameInput.value = '';
    saveStatusMessage.textContent = '';
    saveScoreButton.disabled = false;

    // กลับไปที่แท็บเกม
    tabGame.classList.add('active');
    tabLeaderboard.classList.remove('active');
    gameTab.classList.add('active');
    leaderboardTab.classList.remove('active');
});

// เมื่อคลิกปุ่มดูสถิติผู้เล่นจากหน้าผลลัพธ์ (ใหม่)
viewLeaderboardButton.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');

    // ไปที่แท็บสถิติ
    tabGame.classList.remove('active');
    tabLeaderboard.classList.add('active');
    gameTab.classList.remove('active');
    leaderboardTab.classList.add('active');

    // โหลดข้อมูลสถิติ
    tabLeaderboard.click();
});

// =============================================
// ฟังก์ชันเดิมที่ไม่มีการเปลี่ยนแปลง
// =============================================

// ฟังก์ชันควบคุมเสียง
function toggleSound() {
    isSoundOn = !isSoundOn;

    if (isSoundOn) {
        soundIcon.textContent = '🔊';
        bgMusic.play();
    } else {
        soundIcon.textContent = '🔇';
        bgMusic.pause();
    }
}

// เล่นเสียงเมื่อตอบถูก
function playCorrectSound() {
    if (isSoundOn) {
        correctSound.currentTime = 0;
        correctSound.play();
    }
}

// เล่นเสียงเมื่อตอบผิด
function playWrongSound() {
    if (isSoundOn) {
        wrongSound.currentTime = 0;
        wrongSound.play();
    }
}

// สุ่มคำถาม 10 ข้อจาก 15 ข้อ
function selectRandomQuestions() {
    // สร้างสำเนาของคำถามทั้งหมด
    const questionsCopy = [...allQuestions];
    // สลับตำแหน่งคำถาม
    for (let i = questionsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsCopy[i], questionsCopy[j]] = [questionsCopy[j], questionsCopy[i]];
    }
    // เลือก 10 ข้อแรกเป็นคำถามหลัก
    const mainQuestions = questionsCopy.slice(0, 10);
    // เลือกที่เหลือเป็นคำถามสำรอง
    const reserve = questionsCopy.slice(10);

    return { main: mainQuestions, reserve: reserve };
}

// แสดงคำถามปัจจุบัน
function displayQuestion() {
    const question = shuffledQuestions[currentQuestionIndex];
    questionNumber.textContent = currentQuestionIndex + 1;
    questionText.textContent = question.question;

    // ล้างตัวเลือกคำตอบเดิม
    answersContainer.innerHTML = '';
    disabledAnswers = []; // รีเซ็ตตัวเลือกที่ถูกตัดออก
    hasAnsweredCorrectly = false; // รีเซ็ตสถานะการตอบถูก
    wrongAttempts = 0; // รีเซ็ตจำนวนครั้งที่ตอบผิด
    currentQuestionScore = 1.0; // รีเซ็ตคะแนนของข้อนี้
    timeBonus = 0; // รีเซ็ตโบนัสเวลา

    // อัพเดทแสดงคะแนนข้อนี้
    questionScoreDisplay.textContent = currentQuestionScore.toFixed(1);
    questionScoreInfo.classList.remove('hidden');
    bonusScoreDisplay.classList.add('hidden');

    // ซ่อนปุ่มไปข้อถัดไป
    nextQuestionContainer.classList.add('hidden');

    // ตรวจสอบสถานะตัวช่วย
    if (isDoubleScoreActive) {
        doubleScoreIndicator.classList.remove('hidden');
    } else {
        doubleScoreIndicator.classList.add('hidden');
    }

    if (isShieldActive) {
        shieldIndicator.classList.remove('hidden');
    } else {
        shieldIndicator.classList.add('hidden');
    }

    // สร้างปุ่มตัวเลือกคำตอบ
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn bg-white border-3 border-indigo-200 hover:border-indigo-500 text-gray-800 font-semibold py-4 px-6 text-lg text-left transition-all w-full';

        // เพิ่มไอคอนตามตัวเลือก
        const icons = ['1️⃣ ', '2️⃣ ', '3️⃣ ', '4️⃣ '];
        button.innerHTML = `<span class="mr-3 text-xl">${icons[index]}</span> ${answer}`;

        button.dataset.index = index;
        button.addEventListener('click', () => selectAnswer(index));
        answersContainer.appendChild(button);
    });

    // บันทึกเวลาเริ่มต้นของคำถาม
    questionStartTime = Date.now();

    // เริ่มจับเวลาใหม่
    resetTimer();

    // อัพเดทคะแนนสะสมที่แสดง
    updateCurrentScoreDisplay();
}

// อัพเดทคะแนนสะสมที่แสดงระหว่างเล่น
function updateCurrentScoreDisplay() {
    currentScoreValue.textContent = score.toFixed(1);
}

// คำนวณโบนัสคะแนนจากเวลา
function calculateTimeBonus() {
    const timeElapsed = (Date.now() - questionStartTime) / 1000; // เวลาที่ใช้ในการตอบคำถาม (วินาที)

    // คำนวณโบนัสตามเวลาที่ใช้ (เร็วกว่าได้โบนัสมากกว่า)
    if (timeElapsed <= 5) {
        // ตอบภายใน 5 วินาที ได้โบนัสเต็ม 0.6
        return 0.6;
    } else if (timeElapsed <= 10) {
        // ตอบภายใน 10 วินาที ได้โบนัส 0.5
        return 0.5;
    } else if (timeElapsed <= 15) {
        // ตอบภายใน 15 วินาที ได้โบนัส 0.4
        return 0.4;
    } else if (timeElapsed <= 20) {
        // ตอบภายใน 20 วินาที ได้โบนัส 0.3
        return 0.3;
    } else if (timeElapsed <= 30) {
        // ตอบภายใน 30 วินาที ได้โบนัส 0.2
        return 0.2;
    } else if (timeElapsed <= 45) {
        // ตอบภายใน 45 วินาที ได้โบนัส 0.1
        return 0.1;
    } else {
        // ตอบช้ากว่า 45 วินาที ไม่ได้โบนัส
        return 0;
    }
}

// เลือกคำตอบ
function selectAnswer(answerIndex) {
    // ถ้าตอบถูกแล้ว ไม่ให้ตอบซ้ำ
    if (hasAnsweredCorrectly) {
        return;
    }

    const question = shuffledQuestions[currentQuestionIndex];
    const buttons = answersContainer.querySelectorAll('button');

    if (answerIndex === question.correct) {
        // ตอบถูก
        hasAnsweredCorrectly = true; // ตั้งค่าว่าตอบถูกแล้ว

        // เล่นเสียงตอบถูก
        playCorrectSound();

        // เปลี่ยนสีปุ่มที่ถูกต้องเป็นสีเขียว
        buttons[answerIndex].classList.add('correct-answer');

        // ปิดการใช้งานปุ่มทั้งหมด
        buttons.forEach(btn => {
            btn.disabled = true;
        });

        showFeedback(true);
        createConfetti();
        clearInterval(timer); // หยุดเวลา

        // คำนวณคะแนนตามจำนวนครั้งที่ตอบผิด
        let questionScore = currentQuestionScore;

        // ถ้าเหลือตัวเลือกเดียว (ตัวเลือกที่ถูก) ให้คะแนนเพียง 0.1
        if (disabledAnswers.length === question.answers.length - 1) {
            questionScore = 0.1;
        }

        // คำนวณโบนัสคะแนนจากเวลา
        timeBonus = calculateTimeBonus();

        // แสดงโบนัสคะแนน
        if (timeBonus > 0) {
            bonusScoreDisplay.textContent = `+${timeBonus.toFixed(1)}`;
            bonusScoreDisplay.classList.remove('hidden');
        }

        // เพิ่มคะแนน
        let totalScore = questionScore + timeBonus;

        if (isDoubleScoreActive) {
            score += totalScore * 2;
            isDoubleScoreActive = false; // รีเซ็ตสถานะคะแนนคูณสอง
        } else {
            score += totalScore;
        }

        // อัพเดทคะแนนสะสมที่แสดง
        updateCurrentScoreDisplay();

        // แสดงปุ่มไปข้อถัดไป
        setTimeout(() => {
            nextQuestionContainer.classList.remove('hidden');
        }, 1500);

        // รีเซ็ตสถานะโล่ป้องกัน
        isShieldActive = false;
    } else {
        // ตอบผิด
        showFeedback(false);

        // เล่นเสียงตอบผิด
        playWrongSound();

        // เพิ่มจำนวนครั้งที่ตอบผิด
        wrongAttempts++;
        totalWrongAttempts++;

        // ถ้าไม่มีโล่ป้องกัน ให้ลดคะแนน
        if (!isShieldActive) {
            // ลดคะแนนลง 0.3 คะแนนต่อการตอบผิด 1 ครั้ง
            currentQuestionScore -= 0.3;
            if (currentQuestionScore < 0.1) currentQuestionScore = 0.1; // ไม่ให้น้อยกว่า 0.1

            // อัพเดทแสดงคะแนนข้อนี้
            questionScoreDisplay.textContent = currentQuestionScore.toFixed(1);
        } else {
            // ถ้ามีโล่ป้องกัน ให้ใช้โล่แล้วรีเซ็ตสถานะ
            isShieldActive = false;
            shieldIndicator.classList.add('hidden');

            // แสดงข้อความแจ้งเตือน
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
            notification.textContent = '🛡️ โล่ป้องกันช่วยคุณไว้! ไม่เสียคะแนน';
            document.body.appendChild(notification);

            // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // เพิ่มตัวเลือกที่ผิดเข้าไปในรายการที่ถูกตัด
        disabledAnswers.push(answerIndex);

        // ปิดปุ่มที่ตอบผิด
        buttons[answerIndex].classList.remove('bg-white', 'hover:border-indigo-500');
        buttons[answerIndex].classList.add('bg-red-100', 'border-red-300', 'text-red-400', 'cursor-not-allowed', 'disabled-btn');
        buttons[answerIndex].disabled = true;
    }
}

// ไปข้อถัดไป
function goToNextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < shuffledQuestions.length) {
        displayQuestion();
    } else {
        showResults();
    }
}

// สร้างคอนเฟ็ตติเมื่อตอบถูก
function createConfetti() {
    const confettiCount = 100;
    const colors = ['#FFC700', '#FF0058', '#2BD1FC', '#F19CBB', '#C3FF00'];

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.opacity = 1;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

        document.body.appendChild(confetti);

        const size = Math.random() * 10 + 5;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;

        const destinationX = confetti.offsetLeft + (Math.random() - 0.5) * 600;
        const destinationY = -100;

        const animation = confetti.animate([
            { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${destinationX}px, ${destinationY}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 1000,
            easing: 'cubic-bezier(0, .9, .57, 1)',
            delay: Math.random() * 200
        });

        animation.onfinish = () => confetti.remove();
    }
}

// แสดงผลลัพธ์ถูก/ผิด
function showFeedback(isCorrect) {
    feedback.classList.remove('hidden');

    if (isCorrect) {
        correctFeedback.classList.remove('hidden');
        incorrectFeedback.classList.add('hidden');
    } else {
        correctFeedback.classList.add('hidden');
        incorrectFeedback.classList.remove('hidden');
    }

    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 1500);
}

// เริ่มจับเวลาใหม่
function resetTimer() {
    clearInterval(timer);
    isTimePaused = false;
    if (pauseTimeoutId) {
        clearTimeout(pauseTimeoutId);
        pauseTimeoutId = null;
    }

    timeLeft = 60;
    timerDisplay.textContent = timeLeft;
    timerBar.style.width = '100%';
    timerDisplay.classList.remove('time-freeze');

    timer = setInterval(() => {
        if (!isTimePaused) {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            timerBar.style.width = `${(timeLeft / 60) * 100}%`;

            if (timeLeft <= 10) {
                timerBar.classList.add('bg-red-400');
                timerBar.classList.remove('bg-yellow-300');
            } else {
                timerBar.classList.add('bg-yellow-300');
                timerBar.classList.remove('bg-red-400');
            }

            if (timeLeft <= 0) {
                clearInterval(timer);
                // เมื่อหมดเวลา ให้ตัดตัวเลือกที่ไม่ใช่คำตอบที่ถูกต้องออกไป 1 ตัวเลือก
                autoEliminateOneWrongAnswer();
            }
        }
    }, 1000);
}

// ตัดตัวเลือกที่ผิดออกไป 1 ตัวเลือกเมื่อหมดเวลา
function autoEliminateOneWrongAnswer() {
    // ถ้าตอบถูกแล้ว ไม่ต้องตัดตัวเลือก
    if (hasAnsweredCorrectly) {
        return;
    }

    const question = shuffledQuestions[currentQuestionIndex];
    const correctIndex = question.correct;

    // หาตัวเลือกที่ผิดที่ยังไม่ถูกตัดออก
    const availableWrongAnswers = [];
    for (let i = 0; i < question.answers.length; i++) {
        if (i !== correctIndex && !disabledAnswers.includes(i)) {
            availableWrongAnswers.push(i);
        }
    }

    if (availableWrongAnswers.length > 0) {
        // หักคะแนน 0.2 คะแนนเมื่อหมดเวลา
        currentQuestionScore -= 0.2;
        if (currentQuestionScore < 0.1) currentQuestionScore = 0.1; // ไม่ให้น้อยกว่า 0.1
        questionScoreDisplay.textContent = currentQuestionScore.toFixed(1); // อัพเดทคะแนนที่แสดง

        // สุ่มตัวเลือกที่ผิดมา 1 ตัว
        const randomIndex = Math.floor(Math.random() * availableWrongAnswers.length);
        const wrongAnswerIndex = availableWrongAnswers[randomIndex];

        // ตัดตัวเลือกนั้นออก
        disabledAnswers.push(wrongAnswerIndex);

        const buttons = answersContainer.querySelectorAll('button');
        buttons[wrongAnswerIndex].classList.remove('bg-white', 'hover:border-indigo-500');
        buttons[wrongAnswerIndex].classList.add('bg-gray-100', 'border-gray-300', 'text-gray-400', 'cursor-not-allowed', 'disabled-btn');
        buttons[wrongAnswerIndex].disabled = true;

        // แสดงข้อความแจ้งเตือน
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
        notification.textContent = '⏰ หมดเวลา! ตัดตัวเลือกออก 1 ข้อ (-0.2 คะแนน)';
        document.body.appendChild(notification);

        // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // เริ่มจับเวลาใหม่
        resetTimer();
    }
}

// ฟังก์ชันตัวช่วย: หยุดเวลา
function pauseTime() {
    if (!pauseTimeUsed && !hasAnsweredCorrectly) {
        // หักคะแนนจากการใช้ตัวช่วย
        score -= 0.1;
        if (score < 0) score = 0;
        updateCurrentScoreDisplay();

        pauseTimeUsed = true;
        pauseTimeButton.disabled = true;
        pauseTimeButton.classList.add('bg-gray-100', 'text-gray-400');
        pauseTimeButton.classList.remove('bg-blue-100', 'text-blue-700');

        isTimePaused = true;
        timerDisplay.classList.add('time-freeze');

        // แสดงข้อความแจ้งเตือน
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
        notification.textContent = '⏸️ หยุดเวลาแล้ว 10 วินาที! (-0.1 คะแนน)';
        document.body.appendChild(notification);

        // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // เริ่มนับเวลาใหม่หลังจาก 10 วินาที
        pauseTimeoutId = setTimeout(() => {
            isTimePaused = false;
            timerDisplay.classList.remove('time-freeze');

            // แสดงข้อความแจ้งเตือน
            const endNotification = document.createElement('div');
            endNotification.className = 'fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50';
            endNotification.textContent = '▶️ เวลาเริ่มเดินต่อแล้ว!';
            document.body.appendChild(endNotification);

            // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
            setTimeout(() => {
                endNotification.remove();
            }, 3000);
        }, 10000);
    }
}

// ฟังก์ชันตัวช่วย: เพิ่มเวลา
function addTime() {
    if (!addTimeUsed && !hasAnsweredCorrectly) {
        // หักคะแนนจากการใช้ตัวช่วย
        score -= 0.1;
        if (score < 0) score = 0;
        updateCurrentScoreDisplay();

        addTimeUsed = true;
        addTimeButton.disabled = true;
        addTimeButton.classList.add('bg-gray-100', 'text-gray-400');
        addTimeButton.classList.remove('bg-green-100', 'text-green-700');

        timeLeft += 20;
        timerDisplay.textContent = timeLeft;
        timerBar.style.width = `${(timeLeft / 60) * 100}%`;

        // แสดงข้อความแจ้งเตือน
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
        notification.textContent = '⏱️ เพิ่มเวลา 20 วินาที! (-0.1 คะแนน)';
        document.body.appendChild(notification);

        // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// ฟังก์ชันตัวช่วย: คะแนนคูณสอง
function doubleScore() {
    if (!doubleScoreUsed && !hasAnsweredCorrectly) {
        // หักคะแนนจากการใช้ตัวช่วย
        score -= 0.1;
        if (score < 0) score = 0;
        updateCurrentScoreDisplay();

        doubleScoreUsed = true;
        doubleScoreButton.disabled = true;
        doubleScoreButton.classList.add('bg-gray-100', 'text-gray-400');
        doubleScoreButton.classList.remove('bg-yellow-100', 'text-yellow-700');

        isDoubleScoreActive = true;
        doubleScoreIndicator.classList.remove('hidden');

        // แสดงข้อความแจ้งเตือน
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
        notification.textContent = '2️⃣ คำถามนี้ได้คะแนนคูณสอง! (-0.1 คะแนน)';
        document.body.appendChild(notification);

        // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// ฟังก์ชันตัวช่วย: 50:50 (ตัดตัวเลือกที่ผิด 2 ข้อ)
function fiftyFifty() {
    if (!fiftyFiftyUsed && !hasAnsweredCorrectly) {
        // หักคะแนนจากการใช้ตัวช่วย
        score -= 0.1;
        if (score < 0) score = 0;
        updateCurrentScoreDisplay();

        fiftyFiftyUsed = true;
        fiftyFiftyButton.disabled = true;
        fiftyFiftyButton.classList.add('bg-gray-100', 'text-gray-400');
        fiftyFiftyButton.classList.remove('bg-pink-100', 'text-pink-700');

        const question = shuffledQuestions[currentQuestionIndex];
        const correctIndex = question.correct;

        // หาตัวเลือกที่ผิดที่ยังไม่ถูกตัดออก
        const availableWrongAnswers = [];
        for (let i = 0; i < question.answers.length; i++) {
            if (i !== correctIndex && !disabledAnswers.includes(i)) {
                availableWrongAnswers.push(i);
            }
        }

        // สลับตำแหน่งตัวเลือกที่ผิด
        for (let i = availableWrongAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableWrongAnswers[i], availableWrongAnswers[j]] = [availableWrongAnswers[j], availableWrongAnswers[i]];
        }

        // เลือกตัวเลือกที่ผิด 2 ตัวแรก (หรือทั้งหมดถ้ามีน้อยกว่า 2)
        const wrongToEliminate = availableWrongAnswers.slice(0, Math.min(2, availableWrongAnswers.length));

        // ตัดตัวเลือกที่ผิดออก
        const buttons = answersContainer.querySelectorAll('button');
        wrongToEliminate.forEach(index => {
            disabledAnswers.push(index);
            buttons[index].classList.remove('bg-white', 'hover:border-indigo-500');
            buttons[index].classList.add('bg-gray-100', 'border-gray-300', 'text-gray-400', 'cursor-not-allowed', 'disabled-btn');
            buttons[index].disabled = true;
        });

        // แสดงข้อความแจ้งเตือน
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-pink-100 text-pink-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
        notification.textContent = '5️⃣0️⃣ ตัดตัวเลือกที่ไม่ใช่ออก 2 ข้อ! (-0.1 คะแนน)';
        document.body.appendChild(notification);

        // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// ฟังก์ชันตัวช่วย: เปลี่ยนคำถาม
function changeQuestion() {
    if (!changeQuestionUsed && !hasAnsweredCorrectly && reserveQuestions.length > 0) {
        // หักคะแนนจากการใช้ตัวช่วย
        score -= 0.1;
        if (score < 0) score = 0;
        updateCurrentScoreDisplay();

        changeQuestionUsed = true;
        changeQuestionButton.disabled = true;
        changeQuestionButton.classList.add('bg-gray-100', 'text-gray-400');
        changeQuestionButton.classList.remove('bg-purple-100', 'text-purple-700');

        // สุ่มคำถามจากคำถามสำรอง
        const randomIndex = Math.floor(Math.random() * reserveQuestions.length);
        const newQuestion = reserveQuestions.splice(randomIndex, 1)[0];

        // แทนที่คำถามปัจจุบัน
        shuffledQuestions[currentQuestionIndex] = newQuestion;

        // แสดงข้อความแจ้งเตือน
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
        notification.textContent = '🔄 เปลี่ยนคำถามแล้ว! (-0.1 คะแนน)';
        document.body.appendChild(notification);

        // ลบข้อความแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // แสดงคำถามใหม่
        displayQuestion();
    }
}

// ฟังก์ชันตัวช่วย: โล่ป้องกัน (ตอบผิดไม่เสียคะแนน)
function activateShield() {
    if (!shieldUsed && !hasAnsweredCorrectly) {
        // หักคะแนนจากการใช้ตัวช่วย
        score -= 0.1;
        if (score < 0) score = 0;
        updateCurrentScoreDisplay();

        shieldUsed = true;
        shieldButton.disabled = true;
        shieldButton.classList.add('bg-gray-100', 'text-gray-400');
        shieldButton.classList.remove('bg-indigo-100', 'text-indigo-700');

        isShieldActive = true;
        shieldIndicator.classList.remove('hidden');
    }
}

// =============================================
// การเชื่อมต่อ Event Listeners (เหมือนเดิม)
// =============================================

// เสียง
soundToggle.addEventListener('click', toggleSound);

// ตัวช่วย
pauseTimeButton.addEventListener('click', pauseTime);
addTimeButton.addEventListener('click', addTime);
doubleScoreButton.addEventListener('click', doubleScore);
fiftyFiftyButton.addEventListener('click', fiftyFifty);
changeQuestionButton.addEventListener('click', changeQuestion);
shieldButton.addEventListener('click', activateShield);

// ไปข้อถัดไป
nextQuestionButton.addEventListener('click', goToNextQuestion);

// กลับไปที่หน้าเกมจากแท็บสถิติ
backToGameButton.addEventListener('click', () => {
    tabGame.classList.add('active');
    tabLeaderboard.classList.remove('active');
    gameTab.classList.add('active');
    leaderboardTab.classList.remove('active');
});

tabGame.addEventListener('click', () => {
    tabGame.classList.add('active');
    tabLeaderboard.classList.remove('active');
    gameTab.classList.add('active');
    leaderboardTab.classList.remove('active');
});