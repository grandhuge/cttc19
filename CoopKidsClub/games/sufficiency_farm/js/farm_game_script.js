document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. DOM Elements
    // =================================================================
    const seasonEl = document.getElementById('seasonDisplay');
    const moneyEl = document.getElementById('moneyDisplay');
    const happinessFill = document.getElementById('happinessFill');
    const farmPlotElements = document.querySelectorAll('.farm-plot');
    const farmerCharacterImg = document.getElementById('farmerCharacter').querySelector('img');

    const planningPhaseEl = document.getElementById('planningPhase');
    const growingPhaseEl = document.getElementById('growingPhase');
    const harvestPhaseEl = document.getElementById('harvestPhase');
    const resultPhaseEl = document.getElementById('resultPhase');

    const gameOverModal = document.getElementById('game-over-modal');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverText = document.getElementById('gameOverText');
    const gameOverImage = document.getElementById('gameOverImage');

    const finishPlanningBtn = document.getElementById('finishPlanningBtn');
    const nextSeasonBtn = document.getElementById('nextSeasonBtn');

    // =================================================================
    // 2. Game Data
    // =================================================================
    const seeds = {
        rice: { name: 'ข้าว', cost: 100, income: [150, 250], water: 'medium', resilience: 'pest', img: 'images/plot_rice.png' },
        corn: { name: 'ข้าวโพด', cost: 80, income: [120, 200], water: 'low', resilience: 'drought', img: 'images/plot_corn.png' },
        vegetable: { name: 'ผักสวนครัว', cost: 120, income: [200, 350], water: 'high', resilience: 'none', img: 'images/plot_vegetable.png' },
        fruit_tree: { name: 'ไม้ผล', cost: 250, income: [0, 600], water: 'medium', resilience: 'drought', img: 'images/plot_fruit_tree.png' }
    };

    const events = [
        { id: 'drought', text: 'พยากรณ์: ฤดูนี้อาจจะแล้ง!', img: 'images/event_drought.png', effect: (crop) => crop.water === 'high' ? 0.5 : 1.2 },
        { id: 'pest', text: 'ระวัง! อาจมีแมลงศัตรูพืชระบาด', img: 'images/event_pest.png', effect: (crop) => crop.resilience === 'pest' ? 1 : 0.6 },
        { id: 'good_sun', text: 'พยากรณ์: ปีนี้แดดดีมาก!', img: 'images/event_good_sun.png', effect: (crop) => 1.3 }
    ];

    // =================================================================
    // 3. Game State Variables
    // =================================================================
    let season;
    let money;
    let happiness;
    let farmPlots;
    let selectedSeed;
    let currentEvent;
    let growingChoiceBonus;
    
    // =================================================================
    // 4. Game Loop Functions
    // =================================================================

    function initGame() {
        season = 1;
        money = 1000;
        happiness = 10;
        farmPlots = [null, null, null, null];
        selectedSeed = null;
        growingChoiceBonus = 1;
        
        updateStatsUI();
        resetFarmPlotsUI();
        startPlanningPhase();
    }

    function startPlanningPhase() {
        showPhase('planningPhase');
        farmerCharacterImg.src = 'images/farmer_in_normal.png';

        currentEvent = events[Math.floor(Math.random() * events.length)];
        document.getElementById('eventCard').innerHTML = `<img src="${currentEvent.img}" alt="${currentEvent.text}"><p>${currentEvent.text}</p>`;
        document.getElementById('eventCard').classList.remove('event-card-hidden');

        const seedShop = document.getElementById('seedShop');
        seedShop.innerHTML = '';
        for (const key in seeds) {
            const seed = seeds[key];
            const affordable = money >= seed.cost ? '' : 'disabled';
            seedShop.innerHTML += `
                <div class="seed-card ${affordable}" data-seed="${key}">
                    <img src="images/icon_seed_${key}.png" alt="${seed.name}">
                    <p><strong>${seed.name}</strong></p>
                    <p>ต้นทุน: ${seed.cost} บาท</p>
                </div>`;
        }
        addSeedCardListeners();
        addFarmPlotListeners();
    }

    function startGrowingPhase() {
        showPhase('growingPhase');
        document.getElementById('growingProblem').innerHTML = `<p>เกิดปัญหาวัชพืชขึ้นเต็มฟาร์ม! จะจัดการอย่างไรดี?</p>`;
        document.getElementById('growingChoices').innerHTML = `
            <button id="manualToolBtn" class="game-btn"><img src="images/tool_manual.png" style="height:40px;">ใช้แรงตัวเอง</button>
            <button id="coopToolBtn" class="game-btn"><img src="images/tool_tractor_coop.png" style="height:40px;">ใช้เครื่องมือสหกรณ์ (จ่าย 50 บาท)</button>`;
        
        document.getElementById('manualToolBtn').onclick = () => {
            growingChoiceBonus = 0.9;
            startHarvestPhase();
        };
        document.getElementById('coopToolBtn').onclick = () => {
            if (money >= 50) {
                money -= 50;
                growingChoiceBonus = 1.1;
                updateStatsUI();
                startHarvestPhase();
            } else {
                alert("เงินไม่พอใช้บริการเครื่องมือสหกรณ์!");
            }
        };
    }

    function startHarvestPhase() {
        showPhase('harvestPhase');
        document.getElementById('sellLocalBtn').onclick = () => calculateResults(1.0);
        document.getElementById('sellCoopBtn').onclick = () => calculateResults(1.2);
    }
    
    function calculateResults(sellMultiplier) {
        let seasonIncome = 0;
        farmPlots.forEach(plotKey => {
            if (plotKey) {
                const crop = seeds[plotKey];
                let baseIncome = crop.income[0] + Math.random() * (crop.income[1] - crop.income[0]);
                let eventMultiplier = currentEvent.effect(crop);
                seasonIncome += baseIncome * eventMultiplier * growingChoiceBonus;
            }
        });
        seasonIncome = Math.round(seasonIncome * sellMultiplier);
        
        const oldHappiness = happiness;
        money += seasonIncome;
        happiness += Math.round(seasonIncome / 100) + 5;
        if (happiness > 100) happiness = 100;

        showResultPhase(seasonIncome, oldHappiness);
    }

    function showResultPhase(income, oldHappiness) {
        showPhase('resultPhase');
        updateStatsUI();

        const happinessGained = happiness - oldHappiness;
        document.getElementById('seasonResultText').innerHTML = `
            <p>ฤดูกาลที่ ${season} สิ้นสุดลงแล้ว</p>
            <p>คุณมีรายได้รวม <strong>${income}</strong> บาท</p>
            <p>ความสุขของฟาร์มเพิ่มขึ้น <strong>${happinessGained}</strong>%!</p>`;
            
        if (happiness >= 50) {
            farmerCharacterImg.src = 'images/farmer_in_happy.png';
        } else {
            farmerCharacterImg.src = 'images/farmer_in_sad.png';
        }
    }

    // =================================================================
    // 5. UI Functions
    // =================================================================

    function updateStatsUI() {
        seasonEl.textContent = `ฤดูกาลที่: ${season}`;
        moneyEl.innerHTML = `<img src="images/icon_money.png" alt="เงิน"> ${money} บาท`;
        happinessFill.style.width = `${happiness}%`;
        happinessFill.textContent = `${happiness}%`;
    }

    function resetFarmPlotsUI() {
        farmPlotElements.forEach(plot => {
            plot.innerHTML = `<img src="images/plot_empty.png" alt="แปลงว่าง">`;
        });
    }

    function showPhase(phaseId) {
        document.querySelectorAll('.phase-container').forEach(p => p.classList.add('hidden'));
        document.getElementById(phaseId).classList.remove('hidden');
    }
    
    function checkEndGameConditions() {
        if (happiness >= 100) {
            gameOverTitle.textContent = "ยินดีด้วย!";
            gameOverText.textContent = `คุณช่วยลุงอินพัฒนาฟาร์มจนมีความสุข ${happiness}% สำเร็จ!`;
            gameOverImage.src = 'images/farmer_in_happy.png';
            gameOverModal.classList.remove('hidden');
        } else if (season > 4) {
            gameOverTitle.textContent = "จบเกมแล้ว!";
            gameOverText.textContent = `คุณเล่นครบ 4 ฤดูกาลแล้ว และมีความสุขฟาร์มที่ ${happiness}%. ลองเล่นอีกครั้งเพื่อทำให้ดีขึ้นนะ!`;
            gameOverImage.src = 'images/farmer_in_normal.png';
            gameOverModal.classList.remove('hidden');
        } else {
            startPlanningPhase();
        }
    }

    // =================================================================
    // 6. Event Listeners
    // =================================================================
    
    function addSeedCardListeners() {
        document.querySelectorAll('.seed-card').forEach(card => {
            card.addEventListener('click', () => {
                if(card.classList.contains('disabled')) return;
                document.querySelectorAll('.seed-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedSeed = card.dataset.seed;
            });
        });
    }

    function addFarmPlotListeners() {
        farmPlotElements.forEach((plot, index) => {
            plot.onclick = () => {
                if (selectedSeed && farmPlots[index] === null) {
                    const seedData = seeds[selectedSeed];
                    if (money >= seedData.cost) {
                        money -= seedData.cost;
                        farmPlots[index] = selectedSeed;
                        plot.innerHTML = `<img src="${seedData.img}" alt="${seedData.name}">`;
                        updateStatsUI();
                        document.querySelector('.seed-card.selected').classList.remove('selected');
                        selectedSeed = null;
                    } else {
                        alert("เงินไม่พอสำหรับซื้อเมล็ดพันธุ์นี้!");
                    }
                }
            };
        });
    }
    
    finishPlanningBtn.addEventListener('click', startGrowingPhase);

    nextSeasonBtn.addEventListener('click', () => {
        season++;
        farmPlots.fill(null);
        selectedSeed = null;
        resetFarmPlotsUI();
        checkEndGameConditions();
    });

    gameOverModal.querySelector('.game-btn').addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        initGame();
    });

    // =================================================================
    // 7. Initial Game Start
    // =================================================================
    initGame();
});