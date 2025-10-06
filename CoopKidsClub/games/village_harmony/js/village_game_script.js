document.addEventListener('DOMContentLoaded', () => {
    const villageMapContainer = document.getElementById('villageMapContainer');
    const minigameView = document.getElementById('minigameView');
    const feedbackTextEl = document.getElementById('feedbackText');
    const aomtungGuideImg = document.getElementById('aomtungGuideImg');
    const panpolGuideImg = document.getElementById('panpolGuideImg');
    const villageHappinessFill = document.getElementById('villageHappinessFill');
    const backToMapBtn = document.getElementById('backToMapBtn');
    const villageMapBg = document.getElementById('villageMapBg');
    const coopBuildingHotspot = document.getElementById('coopBuildingHotspot');
    const coopBuildingImg = document.getElementById('coopBuildingImg');

    let villageHappiness = 0;
    const totalMinigames = 3;
    let completedMinigames = 0;

    const gameState = {
        farmerSolved: false,
        weaverSolved: false,
        fishermanSolved: false,
        coopBuilt: false
    };

    function setFeedback(text, mascot = "aomtung") {
        feedbackTextEl.textContent = text;
        if (mascot === "aomtung") {
            aomtungGuideImg.style.opacity = 1;
            panpolGuideImg.style.opacity = 0.7;
        } else {
            aomtungGuideImg.style.opacity = 0.7;
            panpolGuideImg.style.opacity = 1;
        }
    }

    function showView(viewToShow) {
        if (viewToShow === 'map') {
            villageMapContainer.classList.add('active-view');
            minigameView.classList.remove('active-view');
            backToMapBtn.style.display = 'none';
            setFeedback("หมู่บ้านหรรษามีปัญหาหลายอย่างเลย! มาเลือกช่วยชาวบ้านกันเถอะ!");
        } else {
            villageMapContainer.classList.remove('active-view');
            minigameView.classList.add('active-view');
            backToMapBtn.style.display = 'inline-block';
        }
    }

    function updateProgress() {
        const happinessPercentage = Math.round((completedMinigames / totalMinigames) * 100);
        villageHappiness = happinessPercentage;
        villageHappinessFill.style.width = `${villageHappiness}%`;
        villageHappinessFill.textContent = `${villageHappiness}%`;

        if (completedMinigames === totalMinigames && !gameState.coopBuilt) {
            coopBuildingHotspot.style.display = 'flex';
            setFeedback("เยี่ยมมาก! เราแก้ปัญหาให้ชาวบ้านได้หมดแล้ว ลองไปสร้างสหกรณ์กัน!", "panpol");
        }
        if (gameState.coopBuilt) {
             villageMapBg.src = 'images/village_map_happy.png';
             coopBuildingImg.src = 'images/coop_building_active.png';
             let sign = document.getElementById('coopSign');
             if (!sign) {
                sign = document.createElement('img');
                sign.src = 'images/coop_sign.png';
                sign.id = 'coopSign';
                sign.style.position = 'absolute';
                sign.style.width = '70px';
                sign.style.bottom = '50px';
                sign.style.left = '50%';
                sign.style.transform = 'translateX(-50%)';
                coopBuildingHotspot.appendChild(sign);
             }
             setFeedback("หมู่บ้านหรรษากลับมามีความสุขแล้ว เพราะทุกคนร่วมมือกันสร้าง 'สหกรณ์หมู่บ้านหรรษา'!", "aomtung");
        }
    }

    const minigames = {
        farmer: {
            initHTML: () => `
                <h3 class="minigame-title">ช่วยลุงมีจัดการฟาร์ม</h3>
                <p class="minigame-instructions">เลือกวิธีซื้อปุ๋ยที่คุ้มค่าที่สุด และหาวิธีจัดหาเครื่องมือใหม่</p>
                <div class="minigame-content-wrapper">
                    <h4>1. ปัญหาปุ๋ยแพง</h4>
                    <div class="farmer-options">
                        <div class="farmer-option" data-choice="single">
                            <img src="images/icon_fertilizer.png" alt="ซื้อคนเดียว">
                            <p>ซื้อคนเดียว: 100 บาท/ถุง</p>
                        </div>
                        <div class="farmer-option" data-choice="group">
                            <img src="images/icon_fertilizer.png" alt="รวมกลุ่มซื้อ">
                            <p>รวมกลุ่มซื้อ: 80 บาท/ถุง</p>
                        </div>
                    </div>
                    <div id="fertilizerResult" style="margin-top:10px; font-weight:bold;"></div>
                    <h4 style="margin-top:20px;">2. ปัญหาเครื่องมือเก่า</h4>
                    <div class="tool-sharing-ui">
                        <img src="images/icon_coin.png" alt="เหรียญ"> + <img src="images/icon_coin.png" alt="เหรียญ"> + <img src="images/icon_coin.png" alt="เหรียญ">
                        <span style="font-size: 2em; margin: 0 10px;">➔</span>
                        <img src="images/icon_tool_shared.png" alt="เครื่องมือใหม่">
                    </div>
                    <p>เมื่อชาวบ้านหลายคนร่วมกันลงเงิน ก็สามารถซื้อเครื่องมือดีๆ มาใช้ร่วมกันได้!</p>
                    <button id="solveFarmerProblemBtn" class="game-btn" style="margin-top:20px;">แก้ปัญหานี้สำเร็จ!</button>
                </div>
            `,
            initLogic: () => {
                setFeedback("ลุงมีกำลังรอความช่วยเหลือเรื่องปุ๋ยและเครื่องมืออยู่นะ", "aomtung");
                const options = minigameView.querySelectorAll('.farmer-option');
                const fertilizerResult = minigameView.querySelector('#fertilizerResult');
                options.forEach(opt => opt.addEventListener('click', () => {
                    options.forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    if (opt.dataset.choice === 'group') {
                        fertilizerResult.textContent = "เลือกได้เยี่ยม! รวมกันซื้อ ประหยัดกว่าเห็นๆ!";
                        fertilizerResult.style.color = 'green';
                    } else {
                        fertilizerResult.textContent = "ซื้อคนเดียวก็สะดวกดี แต่แพงกว่านะ";
                        fertilizerResult.style.color = 'orange';
                    }
                }));
                minigameView.querySelector('#solveFarmerProblemBtn').addEventListener('click', () => {
                    if (!gameState.farmerSolved) {
                        gameState.farmerSolved = true;
                        completedMinigames++;
                        document.getElementById('hotspotFarmer').classList.add('solved');
                        document.getElementById('farmerSolvedIndicator').style.display = 'block';
                        updateProgress();
                    }
                    showView('map');
                });
            }
        },
        weaver: {
            initHTML: () => `
                <h3 class="minigame-title">เปิดร้านให้ป้าสวย</h3>
                <p class="minigame-instructions">ลากสินค้าหัตถกรรมไปวางบนแผงขายของชุมชนให้น่าสนใจ!</p>
                <div class="minigame-content-wrapper">
                    <div class="available-crafts" style="margin-bottom:20px; display:flex; gap:10px;">
                        <div class="craft-item" data-item="fabric" draggable="true" title="ผ้าทอ" style="background-image: url('images/weaver_fabric_icon.png');"></div>
                        <div class="craft-item" data-item="pottery" draggable="true" title="เครื่องปั้นดินเผา" style="background-image: url('images/pottery_icon.png');"></div>
                    </div>
                    <div class="market-stall-area" id="marketStallDropzone"></div>
                    <div id="marketStatus" style="margin-top:10px; font-weight:bold;"></div>
                    <button id="openShopBtn" class="game-btn" style="margin-top:20px;">เปิดร้านค้าชุมชน!</button>
                </div>
            `,
            initLogic: () => {
                setFeedback("มาช่วยกันจัดร้านค้าให้ป้าสวยและเพื่อนๆ กันเถอะ!", "panpol");
                const stall = minigameView.querySelector('#marketStallDropzone');
                const items = minigameView.querySelectorAll('.craft-item');
                let itemsOnStall = 0;

                items.forEach(item => {
                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', e.target.dataset.item);
                        e.target.style.opacity = '0.5';
                    });
                    item.addEventListener('dragend', (e) => e.target.style.opacity = '1');
                });

                stall.addEventListener('dragover', (e) => e.preventDefault());
                stall.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const itemName = e.dataTransfer.getData('text/plain');
                    const droppedItem = Array.from(items).find(i => i.dataset.item === itemName && !i.parentElement.isSameNode(stall));
                    
                    if (droppedItem && itemsOnStall < 3) {
                        const newItemVisual = droppedItem.cloneNode(true);
                        newItemVisual.style.cursor = 'default';
                        stall.appendChild(newItemVisual);
                        itemsOnStall++;
                        minigameView.querySelector('#marketStatus').textContent = `มีสินค้า ${itemsOnStall} ชิ้นบนแผงแล้ว!`;
                        if(itemsOnStall >= 2){
                             stall.style.backgroundImage = "url('images/market_stall_full.png')";
                        }
                    }
                });

                minigameView.querySelector('#openShopBtn').addEventListener('click', () => {
                     if (itemsOnStall >= 2 && !gameState.weaverSolved) {
                        gameState.weaverSolved = true;
                        completedMinigames++;
                        document.getElementById('hotspotWeaver').classList.add('solved');
                        document.getElementById('weaverSolvedIndicator').style.display = 'block';
                        updateProgress();
                    }
                    showView('map');
                });
            }
        },
        fisherman: {
            initHTML: () => `
                <h3 class="minigame-title">รวมพลังชาวประมง</h3>
                <p class="minigame-instructions">1. เลือกวิธีซื้อน้ำมัน และ 2. ลองดูว่าจะรวมเงินซื้ออุปกรณ์ที่ดีขึ้นได้ไหม</p>
                <div class="minigame-content-wrapper">
                    <h4>1. ปัญหาน้ำมันแพง</h4>
                     <div class="farmer-options">
                        <div class="farmer-option" data-choice="single-fuel">
                            <img src="images/icon_fuel.png" alt="ซื้อน้ำมันคนเดียว">
                            <p>ซื้อคนเดียว: 50 บาท/ลิตร</p>
                        </div>
                        <div class="farmer-option" data-choice="group-fuel">
                            <img src="images/icon_fuel.png" alt="รวมกลุ่มซื้อน้ำมัน">
                            <p>รวมกลุ่มซื้อ: 40 บาท/ลิตร</p>
                        </div>
                    </div>
                    <div id="fuelResult" style="margin-top:10px; font-weight:bold;"></div>
                    <h4 style="margin-top:20px;">2. ปัญหาเรือเล็กและอุปกรณ์</h4>
                    <p>เมื่อชาวประมงหลายคนร่วมกันลงเงิน (<img src="images/icon_coin.png" style="height:20px;vertical-align:middle;">) ก็สามารถซื้อเรือลำใหญ่ขึ้น (<img src="images/fishing_boat_improved.png" style="height:40px;vertical-align:middle;">) หรืออุปกรณ์ที่ดีกว่า (<img src="images/icon_net.png" style="height:30px;vertical-align:middle;">) มาใช้ร่วมกันได้</p>
                    <button id="solveFishermanProblemBtn" class="game-btn" style="margin-top:20px;">แก้ปัญหานี้สำเร็จ!</button>
                </div>
            `,
             initLogic: () => {
                setFeedback("ชาวประมงต้องการความช่วยเหลือเรื่องน้ำมันและเรือนะ!", "aomtung");
                const fuelOptions = minigameView.querySelectorAll('.farmer-option[data-choice*="fuel"]');
                const fuelResultEl = minigameView.querySelector('#fuelResult');
                fuelOptions.forEach(opt => opt.addEventListener('click', () => {
                    fuelOptions.forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                     if (opt.dataset.choice === 'group-fuel') {
                        fuelResultEl.textContent = "ดีมาก! รวมกันซื้อน้ำมัน ประหยัดได้เยอะ!";
                        fuelResultEl.style.color = 'green';
                    } else {
                        fuelResultEl.textContent = "ซื้อคนเดียวแพงกว่านะ ลองคิดดูใหม่สิ";
                        fuelResultEl.style.color = 'orange';
                    }
                }));

                minigameView.querySelector('#solveFishermanProblemBtn').addEventListener('click', () => {
                    if (!gameState.fishermanSolved) {
                        gameState.fishermanSolved = true;
                        completedMinigames++;
                        document.getElementById('hotspotFisherman').classList.add('solved');
                        document.getElementById('fishermanSolvedIndicator').style.display = 'block';
                        updateProgress();
                    }
                    showView('map');
                });
            }
        },
        coop_build: {
            initHTML: () => `
                <h3 class="minigame-title">สร้างสหกรณ์หมู่บ้านหรรษา!</h3>
                <p class="minigame-instructions">เมื่อทุกคนร่วมมือกันแก้ปัญหา ก็ถึงเวลารวมพลังสร้างสหกรณ์ของพวกเราแล้ว!</p>
                <div class="minigame-content-wrapper" style="flex-direction:row; justify-content:space-around; align-items:flex-end;">
                    <div id="villagerSourceArea" style="display:flex; flex-direction:column; gap:10px;">
                        ${gameState.farmerSolved ? '<img src="images/farmer_happy.png" class="draggable-villager" data-villager="farmer" style="height:80px; cursor:grab;" alt="ลุงมี">' : ''}
                        ${gameState.weaverSolved ? '<img src="images/weaver_happy.png" class="draggable-villager" data-villager="weaver" style="height:80px; cursor:grab;" alt="ป้าสวย">' : ''}
                        ${gameState.fishermanSolved ? '<img src="images/fisherman_happy.png" class="draggable-villager" data-villager="fisherman" style="height:80px; cursor:grab;" alt="น้าชัย">' : ''}
                    </div>
                    <div id="coopBuildDropzone" style="width:200px; height:200px; border:3px dashed var(--game-accent-color1); background-image:url('images/coop_building_empty.png'); background-size:contain; background-repeat:no-repeat; background-position:center;">
                        <p style="text-align:center; margin-top:5px; font-size:0.8em;">ลากมาที่นี่</p>
                    </div>
                </div>
                <p id="coopBuildStatus" style="text-align:center; margin-top:15px; font-weight:bold;"></p>
                <button id="completeCoopBuildBtn" class="game-btn" style="margin-top:20px; display:none;">สหกรณ์ของเราเสร็จแล้ว!</button>
            `,
            initLogic: () => {
                setFeedback("มาสร้างสหกรณ์ให้หมู่บ้านกันเถอะ!", "panpol");
                const dropzone = minigameView.querySelector('#coopBuildDropzone');
                const villagers = minigameView.querySelectorAll('.draggable-villager');
                const statusEl = minigameView.querySelector('#coopBuildStatus');
                const completeBtn = minigameView.querySelector('#completeCoopBuildBtn');
                let villagersInCoop = 0;
                const totalVillagersToDrag = villagers.length;

                villagers.forEach(v => {
                    v.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', e.target.dataset.villager));
                });

                dropzone.addEventListener('dragover', (e) => e.preventDefault());
                dropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const villagerType = e.dataTransfer.getData('text/plain');
                    const villagerEl = minigameView.querySelector(`.draggable-villager[data-villager="${villagerType}"]`);
                    if (villagerEl && !villagerEl.classList.contains('dropped')) {
                        villagerEl.classList.add('dropped');
                        villagerEl.style.display = 'none';
                        villagersInCoop++;
                        statusEl.textContent = `มีสมาชิก ${villagersInCoop}/${totalVillagersToDrag} คนแล้ว!`;
                        if (villagersInCoop === totalVillagersToDrag) {
                            dropzone.style.backgroundImage = "url('images/coop_building_active.png')";
                            statusEl.textContent = "สมาชิกครบแล้ว! สหกรณ์ของเราพร้อมแล้ว!";
                            completeBtn.style.display = 'inline-block';
                        }
                    }
                });
                completeBtn.addEventListener('click', () => {
                    if(!gameState.coopBuilt){
                        gameState.coopBuilt = true;
                        updateProgress();
                    }
                    showView('map');
                });
            }
        }
    };

    function loadMiniGame(gameKey) {
        const gameData = minigames[gameKey];
        if (gameData) {
            minigameView.innerHTML = gameData.initHTML();
            gameData.initLogic();
            showView('minigame');
        }
    }

    document.querySelectorAll('.problem-hotspot, .coop-building-spot').forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            if (!hotspot.classList.contains('solved')) {
                const gameKey = hotspot.dataset.minigame;
                loadMiniGame(gameKey);
            }
        });
    });

    backToMapBtn.addEventListener('click', () => showView('map'));
    showView('map');
    updateProgress();
});