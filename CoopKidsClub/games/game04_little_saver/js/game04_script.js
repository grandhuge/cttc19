document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const startScreen = document.getElementById('gameStartScreen');
    const playScreen = document.getElementById('gamePlayScreen');
    const winScreen = document.getElementById('gameWinScreen');
    const allScreens = document.querySelectorAll('.game-screen');
    const modal = document.getElementById('eventModal');

    const goalSelectBtns = document.querySelectorAll('.goal-select-btn');
    const startGameBtn = document.getElementById('startGameBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const confirmAllocationBtn = document.getElementById('confirmAllocationBtn');
    
    // --- Game Display ---
    const currentMonthEl = document.getElementById('currentMonth');
    const happinessFillEl = document.getElementById('happinessFill');
    const goalTextEl = document.getElementById('goalText');
    const savedMoneyDisplayEl = document.getElementById('savedMoneyDisplay');
    const goalPriceDisplayEl = document.getElementById('goalPriceDisplay');
    const savingsFillEl = document.getElementById('savingsFill');
    const moneyContainerEl = document.getElementById('pocketMoneyContainer');
    const savingsJarEl = document.getElementById('savingsJar');
    const wantsJarEl = document.getElementById('wantsJar');
    const savingsJarTotalEl = document.getElementById('savingsJarTotal');
    const wantsJarTotalEl = document.getElementById('wantsJarTotal');

    // --- Modal ---
    const eventMascotEl = document.getElementById('eventMascot');
    const eventTitleEl = document.getElementById('eventTitle');
    const eventDescriptionEl = document.getElementById('eventDescription');
    const eventOptionsEl = document.getElementById('eventOptions');
    
    // --- Win Screen ---
    const winMessageEl = document.getElementById('winMessage');
    const totalDividendsEl = document.getElementById('totalDividends');
    
    // --- Audio ---
    const sounds = {
        drag: document.getElementById('dragCoinSound'),
        dropSavings: document.getElementById('dropCoinSavingsSound'),
        dropWants: document.getElementById('dropCoinWantsSound'),
        popup: document.getElementById('eventPopupSound'),
        happyUp: document.getElementById('happinessUpSound'),
        happyDown: document.getElementById('happinessDownSound'),
        dividend: document.getElementById('dividendSound'),
        win: document.getElementById('goalAchievedSound')
    };

    // --- Game State & Config ---
    let month, allowance, coopSavings, wantsFund, happiness, savingsGoal, goalPrice, goalImage, totalDividends;
    const MONTHLY_ALLOWANCE = 100;
    const DIVIDEND_RATE = 0.05; // 5%

    const GAME_EVENTS = [
        { title: 'เพื่อนชวนไปดูหนัง!', desc: 'เพื่อนสนิทชวนไปดูหนังรอบใหม่ล่าสุด ต้องใช้เงินจาก "โหลของที่อยากได้" 60 บาท ไปไหม?', cost: 60, happy_gain: 15, happy_loss: -10, mascot: 'images/mascots/panpol_thinking.png' },
        { title: 'วันเกิดเพื่อน!', desc: 'ถึงวันเกิดเพื่อนสนิทแล้ว! เราจะซื้อของขวัญให้เพื่อนไหม? ใช้เงินจาก "โหลของที่อยากได้" 40 บาท', cost: 40, happy_gain: 10, happy_loss: -5, mascot: 'images/mascots/panpol_thinking.png' },
        { title: 'เจอของเล่นที่อยากได้!', desc: 'เดินผ่านร้านค้า เจอของเล่นที่อยากได้มานาน! ราคา 50 บาท ซื้อเลยไหม? (ใช้เงินจากโหลของที่อยากได้)', cost: 50, happy_gain: 10, happy_loss: -5, mascot: 'images/mascots/panpol_thinking.png' }
    ];

    // --- Functions ---
    function playSound(sound) { if (sound) sound.play(); }

    function showScreen(screenEl) {
        allScreens.forEach(s => s.classList.remove('active-screen'));
        screenEl.classList.add('active-screen');
    }

    function updateDisplay() {
        currentMonthEl.textContent = month;
        happinessFillEl.style.width = `${happiness}%`;
        goalTextEl.textContent = savingsGoal;
        savedMoneyDisplayEl.textContent = coopSavings;
        goalPriceDisplayEl.textContent = goalPrice;
        const progress = Math.min(100, (coopSavings / goalPrice) * 100);
        savingsFillEl.style.width = `${progress}%`;
    }

    goalSelectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            goalSelectBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            savingsGoal = btn.dataset.goal;
            goalPrice = parseInt(btn.dataset.price);
            goalImage = btn.dataset.image;
            startGameBtn.disabled = false;
        });
    });

    function startGame() {
        if (!savingsGoal) return;
        month = 0;
        coopSavings = 0;
        wantsFund = 0;
        happiness = 70; // Start with decent happiness
        totalDividends = 0;
        showScreen(playScreen);
        nextMonth();
    }

    function nextMonth() {
        if (coopSavings >= goalPrice) {
            endGame();
            return;
        }
        month++;
        allowance = MONTHLY_ALLOWANCE;
        
        // Dividend Logic (every 3 months)
        if (month > 1 && (month - 1) % 3 === 0) {
            const dividend = Math.floor(coopSavings * DIVIDEND_RATE);
            if (dividend > 0) {
                playSound(sounds.dividend);
                coopSavings += dividend;
                totalDividends += dividend;
                showModal({ title: `ได้รับเงินปันผลพิเศษ! ✨`, desc: `ยอดเยี่ยม! เงินออมในสหกรณ์ของเรางอกเงยขึ้นมา ${dividend} บาท!`, mascot: 'images/mascots/panpol_happy.png' }, true);
                return; // Wait for user to close modal before continuing
            }
        }
        
        startPlanningPhase();
    }

    function startPlanningPhase() {
        updateDisplay();
        confirmAllocationBtn.disabled = false;
        moneyContainerEl.innerHTML = '';
        wantsJarTotalEl.textContent = wantsFund;
        savingsJarTotalEl.textContent = coopSavings;
        
        for (let i = 0; i < allowance / 10; i++) {
            const coin = document.createElement('img');
            coin.src = 'images/icons/icon_coin_10.png';
            coin.classList.add('coin-icon');
            coin.draggable = true;
            coin.dataset.value = 10;
            coin.addEventListener('dragstart', e => {
                playSound(sounds.drag);
                e.dataTransfer.setData('text/plain', coin.dataset.value);
            });
            moneyContainerEl.appendChild(coin);
        }
    }
    
    // Drag & Drop Logic
    [savingsJarEl, wantsJarEl].forEach(jar => {
        jar.addEventListener('dragover', e => {
            e.preventDefault();
            jar.classList.add('drag-over');
        });
        jar.addEventListener('dragleave', e => {
            jar.classList.remove('drag-over');
        });
        jar.addEventListener('drop', e => {
            e.preventDefault();
            jar.classList.remove('drag-over');
            const value = parseInt(e.dataTransfer.getData('text/plain'));
            const draggedCoin = document.querySelector('.coin-icon'); // Find a coin to remove
            
            if (draggedCoin) {
                if (jar.id === 'savingsJar') {
                    playSound(sounds.dropSavings);
                    coopSavings += value;
                    savingsJarTotalEl.textContent = coopSavings;
                } else {
                    playSound(sounds.dropWants);
                    wantsFund += value;
                    wantsJarTotalEl.textContent = wantsFund;
                }
                allowance -= value;
                draggedCoin.remove();
            }
        });
    });

    function confirmAllocation() {
        confirmAllocationBtn.disabled = true;
        happiness += Math.floor(wantsFund / 20); // More wants allocation = more happiness
        happiness -= Math.floor(allowance / 20); // Leftover money feels like missed opportunity
        happiness = Math.max(0, Math.min(100, happiness));
        updateDisplay();
        
        // Trigger random event
        if (Math.random() > 0.3) { // 70% chance
            const event = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
            showModal(event);
        } else {
            setTimeout(nextMonth, 1500); // If no event, wait and go to next month
        }
    }
    
    function showModal(eventData, isSpecial = false) {
        playSound(sounds.popup);
        eventMascotEl.src = eventData.mascot;
        eventTitleEl.textContent = eventData.title;
        eventDescriptionEl.textContent = eventData.desc;
        eventOptionsEl.innerHTML = '';
        
        if(isSpecial) {
             const okBtn = document.createElement('button');
             okBtn.textContent = 'ยอดเยี่ยม!';
             okBtn.className = 'game-btn';
             okBtn.onclick = () => { modal.classList.remove('active'); startPlanningPhase(); };
             eventOptionsEl.appendChild(okBtn);
        } else {
            // "Yes" option
            const yesBtn = document.createElement('button');
            yesBtn.textContent = 'ตกลง!';
            yesBtn.className = 'game-btn';
            if (eventData.cost > wantsFund) yesBtn.disabled = true;
            yesBtn.onclick = () => {
                wantsFund -= eventData.cost;
                happiness += eventData.happy_gain;
                playSound(sounds.happyUp);
                modal.classList.remove('active');
                updateDisplay();
                setTimeout(nextMonth, 1000);
            };
            eventOptionsEl.appendChild(yesBtn);
            
            // "No" option
            const noBtn = document.createElement('button');
            noBtn.textContent = 'ไม่เป็นไร';
            noBtn.className = 'game-btn secondary-btn';
            noBtn.onclick = () => {
                happiness += eventData.happy_loss;
                 playSound(sounds.happyDown);
                modal.classList.remove('active');
                updateDisplay();
                setTimeout(nextMonth, 1000);
            };
            eventOptionsEl.appendChild(noBtn);
        }
        
        modal.classList.add('active');
    }

    function endGame() {
        playSound(sounds.win);
        winMessageEl.textContent = `สุดยอดมาก! ในที่สุดเธอก็ออมเงินซื้อ ${savingsGoal} ได้สำเร็จใน ${month} เดือน!`;
        totalDividendsEl.textContent = totalDividends;
        showScreen(winScreen);
    }
    
    // --- Event Listeners ---
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', () => {
        savingsGoal = null;
        startGameBtn.disabled = true;
        goalSelectBtns.forEach(b => b.classList.remove('selected'));
        showScreen(startScreen);
    });
    confirmAllocationBtn.addEventListener('click', confirmAllocation);

    // Init
    showScreen(startScreen);
});