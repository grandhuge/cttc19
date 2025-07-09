document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const startScreen = document.getElementById('startScreen');
    const gamePlayScreen = document.getElementById('gamePlayScreen');
    const winScreen = document.getElementById('winScreen');
    const allScreens = document.querySelectorAll('.game-screen');
    
    const startGameBtn = document.getElementById('startGameBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');

    const trustMeterEl = document.getElementById('trustMeter').querySelector('span');
    const resourceMeterEl = document.getElementById('resourceMeter').querySelector('span');
    const knowledgeMeterEl = document.getElementById('knowledgeMeter').querySelector('span');
    const villageMapEl = document.getElementById('villageMap');
    const dialogueTextEl = document.getElementById('dialogueText');
    
    const modal = document.getElementById('interactionModal');
    const modalTitleEl = document.getElementById('modalTitle');
    const modalDescriptionEl = document.getElementById('modalDescription');
    const modalInteractionAreaEl = document.getElementById('modalInteractionArea');
    const modalOptionsEl = document.getElementById('modalOptions');

    const sounds = {
        problem: document.getElementById('problemAppearSound'),
        trust: document.getElementById('trustGainSound'),
        resource: document.getElementById('resourceGainSound'),
        knowledge: document.getElementById('knowledgeGainSound'),
        complete: document.getElementById('taskCompleteSound'),
        win: document.getElementById('villageCelebrateSound')
    };

    // --- Game State & Config ---
    let gameState = {};

    const VILLAGERS_DATA = {
        farmer: { id: 'farmer', name: 'ลุงชาวนา', problem: 'มีผลไม้เยอะเกินไป แต่ไม่มีแรงขนไปขายที่ตลาดคนเดียว', sad_img: 'images/characters/villager_farmer_sad.png', happy_img: 'images/characters/villager_farmer_happy.png', pos: {top: '65%', left: '15%'}, solved: false, reward: {trust: 20, resource: 10} },
        weaver: { id: 'weaver', name: 'ป้าช่างทอผ้า', problem: 'อยากทอผ้าลายใหม่ แต่ขาดแคลนเส้นด้ายสีสวยๆ', sad_img: 'images/characters/villager_weaver_sad.png', happy_img: 'images/characters/villager_weaver_happy.png', pos: {top: '25%', left: '30%'}, solved: false, reward: {trust: 20, knowledge: 10} },
        carpenter: { id: 'carpenter', name: 'พี่ช่างไม้', problem: 'เครื่องมือเก่าและทื่อมาก อยากได้เครื่องมือดีๆ มาซ่อมสะพาน', sad_img: 'images/characters/villager_carpenter_sad.png', happy_img: 'images/characters/villager_carpenter_happy.png', pos: {top: '60%', left: '70%'}, solved: false, reward: {trust: 20, resource: 10} }
    };
    
    function playSound(sound) { if (sound) sound.play(); }

    function showScreen(screenEl) {
        allScreens.forEach(s => s.classList.remove('active-screen'));
        screenEl.classList.add('active-screen');
    }
    
    function updateDashboard() {
        trustMeterEl.textContent = gameState.trust;
        resourceMeterEl.textContent = gameState.resources;
        knowledgeMeterEl.textContent = gameState.knowledge;
    }

    function initGame() {
        gameState = {
            phase: 1,
            trust: 0,
            resources: 0,
            knowledge: 0,
            villagers: JSON.parse(JSON.stringify(VILLAGERS_DATA)) // Deep copy
        };
        showScreen(gamePlayScreen);
        villageMapEl.style.backgroundImage = "url('images/backgrounds/village_map_phase1.png')";
        villageMapEl.innerHTML = '';
        updateDashboard();
        renderVillagers();
        setDialogue("หมู่บ้านนี้ดูเงียบเหงาจัง... ลองคลิกที่คนที่มีเครื่องหมาย '❗️' ดูสิ");
    }

    function renderVillagers() {
        for (const id in gameState.villagers) {
            const data = gameState.villagers[id];
            const villagerEl = document.createElement('div');
            villagerEl.id = `villager-${id}`;
            villagerEl.className = 'villager';
            villagerEl.style.top = data.pos.top;
            villagerEl.style.left = data.pos.left;
            villagerEl.style.backgroundImage = `url(${data.solved ? data.happy_img : data.sad_img})`;
            
            if (!data.solved) {
                const problemIndicator = document.createElement('div');
                problemIndicator.className = 'problem-indicator';
                villagerEl.appendChild(problemIndicator);
                villagerEl.onclick = () => showProblem(id);
                 playSound(sounds.problem);
            }
            villageMapEl.appendChild(villagerEl);
        }
    }
    
    function setDialogue(text) {
        dialogueTextEl.textContent = text;
    }

    function showProblem(villagerId) {
        const data = gameState.villagers[villagerId];
        modalTitleEl.textContent = `ปัญหาของ${data.name}`;
        modalDescriptionEl.textContent = data.problem;
        modalInteractionAreaEl.innerHTML = '';
        modalOptionsEl.innerHTML = '';

        if (villagerId === 'farmer') {
            setDialogue("ลุงชาวนาต้องการคนช่วยขนผลไม้ เราอาจจะขอให้พี่ช่างไม้ช่วยได้นะ!");
            const btn = createModalButton('ขอให้พี่ช่างไม้ช่วยสร้างรถเข็น', () => solveIndividualProblem(villagerId));
            if (gameState.villagers.carpenter.solved) btn.disabled = true; // Can't ask a helped villager
            modalOptionsEl.appendChild(btn);
        } else if (villagerId === 'weaver') {
             setDialogue("ป้าช่างทอผ้าต้องการด้าย บางทีลุงชาวนาอาจจะมีพืชที่ให้เส้นใยก็ได้นะ");
             const btn = createModalButton('ถามลุงชาวนาเรื่องเส้นใยย้อมสี', () => solveIndividualProblem(villagerId));
             modalOptionsEl.appendChild(btn);
        } else if (villagerId === 'carpenter') {
            setDialogue("พี่ช่างไม้ต้องการเครื่องมือใหม่ ถ้าเรารวบรวมทรัพยากร อาจจะพอซื้อได้นะ");
            const btn = createModalButton('รวบรวมเงินและทรัพยากรไปซื้อเครื่องมือ', () => solveIndividualProblem(villagerId));
            modalOptionsEl.appendChild(btn);
        }
        
        const closeBtn = createModalButton('กลับไปก่อน', closeModal, 'secondary');
        modalOptionsEl.appendChild(closeBtn);
        modal.classList.add('active');
    }

    function solveIndividualProblem(villagerId) {
        const data = gameState.villagers[villagerId];
        data.solved = true;
        
        gameState.trust += data.reward.trust;
        gameState.resources += data.reward.resource || 0;
        gameState.knowledge += data.reward.knowledge || 0;

        playSound(sounds.complete);
        playSound(sounds.trust);
        
        closeModal();
        updateDashboard();
        renderVillagers();
        setDialogue(`เยี่ยมมาก! เราช่วย${data.name}ได้แล้ว! ความไว้ใจของชาวบ้านเพิ่มขึ้น!`);
        
        checkPhaseChange();
    }
    
    function checkPhaseChange() {
        const allSolved = Object.values(gameState.villagers).every(v => v.solved);
        if (allSolved && gameState.phase === 1) {
            gameState.phase = 2;
            setDialogue("ทุกคนแฮปปี้! แต่... สะพานข้ามแม่น้ำยังพังอยู่เลยนะ เราจะทำยังไงดี?");
            setTimeout(() => showBridgeProblem(), 2000);
        } else if (gameState.phase === 2 && gameState.bridgeFixed) {
            gameState.phase = 3;
            setDialogue("สะพานเสร็จแล้ว! ตอนนี้ถึงเวลาที่สำคัญที่สุด... ชวนทุกคนมาสร้าง 'สหกรณ์' กันเถอะ!");
            setTimeout(() => showCoopProposal(), 2000);
        }
    }

    function showBridgeProblem() {
        modalTitleEl.textContent = "ปัญหาใหญ่: สะพานพัง!";
        modalDescriptionEl.textContent = "สะพานที่ใช้ข้ามไปตลาดพังลงมา ทำให้ทุกคนเดือดร้อน เราต้องใช้ทรัพยากรและความรู้ทั้งหมดเพื่อซ่อมมัน!";
        modalInteractionAreaEl.innerHTML = '';
        modalOptionsEl.innerHTML = '';
        
        const btn = createModalButton(`ใช้ทรัพยากร ${gameState.resources} และความรู้ ${gameState.knowledge} ซ่อมสะพาน`, () => {
            if (gameState.resources >= 20 && gameState.knowledge >= 10) {
                fixBridge();
            } else {
                setDialogue("แย่จัง! ทรัพยากรและความรู้ของเรายังไม่พอ ต้องกลับไปช่วยเหลือคนอื่นก่อน");
                closeModal();
            }
        });
        modalOptionsEl.appendChild(btn);
        modal.classList.add('active');
    }
    
    function fixBridge() {
        playSound(sounds.complete);
        villageMapEl.style.backgroundImage = "url('images/backgrounds/village_map_phase2.png')";
        setDialogue("สุดยอด! ทุกคนช่วยกันซ่อมสะพานสำเร็จแล้ว!");
        gameState.bridgeFixed = true;
        closeModal();
        checkPhaseChange();
    }
    
    function showCoopProposal() {
         modalTitleEl.textContent = "ข้อเสนอครั้งสำคัญ: สร้างสหกรณ์!";
        modalDescriptionEl.textContent = "ด้วยความไว้ใจจากทุกคน เราสามารถชักชวนให้พวกเขารวมตัวกันสร้างสหกรณ์ เพื่อแก้ปัญหาระยะยาวได้! เราต้องใช้ค่าความไว้ใจทั้งหมดเพื่อเริ่มโปรเจกต์นี้!";
        modalInteractionAreaEl.innerHTML = '';
        modalOptionsEl.innerHTML = '';

        const btn = createModalButton(`ใช้ความไว้ใจ ${gameState.trust} หน่วย ก่อตั้งสหกรณ์!`, () => {
             if (gameState.trust >= 60) {
                foundCoop();
            } else {
                setDialogue("ชาวบ้านยังไม่ไว้ใจเราพอ... เราอาจต้องทำอะไรมากกว่านี้");
                closeModal();
            }
        });
        modalOptionsEl.appendChild(btn);
        modal.classList.add('active');
    }

    function foundCoop() {
        playSound(sounds.win);
        villageMapEl.style.backgroundImage = "url('images/backgrounds/village_map_phase3.png')";
        const coopBuilding = document.createElement('div');
        coopBuilding.className = 'villager'; // Reuse style for simplicity
        coopBuilding.style.backgroundImage = "url('images/ui/coop_building.png')";
        coopBuilding.style.width = '120px';
        coopBuilding.style.height = '120px';
        coopBuilding.style.top = '40%';
        coopBuilding.style.left = '45%';
        villageMapEl.appendChild(coopBuilding);
        
        closeModal();
        setDialogue("สำเร็จ! สหกรณ์แห่งแรกของหมู่บ้านก่อตั้งขึ้นแล้ว!");
        
        setTimeout(() => showScreen(winScreen), 3000);
    }

    function createModalButton(text, onClick, type = 'primary') {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'game-btn';
        if (type === 'secondary') btn.classList.add('secondary-btn');
        btn.onclick = onClick;
        return btn;
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    // --- Event Listeners ---
    startGameBtn.addEventListener('click', initGame);
    playAgainBtn.addEventListener('click', () => showScreen(startScreen));
});