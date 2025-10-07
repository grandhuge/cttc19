document.addEventListener('DOMContentLoaded', () => {
    // --- Data for Game Rounds (*** เพิ่ม property 'icon' เข้าไปในแต่ละคู่ ***) ---
    const gameRounds = [
        {
            title: "รอบที่ 1: ประเภทของสหกรณ์",
            instruction: "ลากคำอธิบาย ไปวางให้ตรงกับประเภทของสหกรณ์ให้ถูกต้องนะ",
            pairs: [
                { id: 'agri', term: 'สหกรณ์การเกษตร', definition: 'ช่วยเหลือสมาชิกในด้านการผลิตและจำหน่ายผลผลิตทางการเกษตร', icon: 'images/icon_agri_coop.png' },
                { id: 'savings', term: 'สหกรณ์ออมทรัพย์', definition: 'ส่งเสริมให้สมาชิกรู้จักการออมและให้กู้ยืมเงินเมื่อจำเป็น', icon: 'images/icon_savings_coop.png' },
                { id: 'store', term: 'สหกรณ์ร้านค้า', definition: 'จัดหาสินค้าอุปโภคบริโภคมาจำหน่ายแก่สมาชิกในราคายุติธรรม', icon: 'images/icon_store_coop.png' },
                { id: 'fishery', term: 'สหกรณ์ประมง', definition: 'ช่วยเหลือสมาชิกชาวประมงในด้านอุปกรณ์และการขายสัตว์น้ำ', icon: 'images/icon_fishery_coop.png' }
            ]
        },
        {
            title: "รอบที่ 2: หลักการสหกรณ์",
            instruction: "จับคู่หลักการสหกรณ์กับการกระทำที่สอดคล้องกันให้ถูกต้อง",
            pairs: [
                { id: 'democratic', term: 'หลักประชาธิปไตย', definition: 'ในการประชุมใหญ่ สมาชิกทุกคนมี 1 เสียงเท่ากันในการออกความเห็น', icon: 'images/icon_principle_democratic.png' },
                { id: 'voluntary', term: 'หลักการเป็นสมาชิกโดยสมัครใจ', definition: 'นักเรียนสามารถสมัครเป็นสมาชิกสหกรณ์ร้านค้าของโรงเรียนได้ตามความต้องการ', icon: 'images/icon_principle_voluntary.png' },
                { id: 'community', term: 'หลักการเอื้ออาทรต่อชุมชน', definition: 'สหกรณ์นำผลกำไรส่วนหนึ่งไปมอบเป็นทุนการศึกษาให้โรงเรียนใกล้เคียง', icon: 'images/icon_principle_community.png' },
                { id: 'education', term: 'หลักการให้การศึกษา', definition: 'สหกรณ์จัดอบรมให้ความรู้เรื่องการวางแผนการเงินแก่สมาชิก', icon: 'images/icon_principle_education.png' }
            ]
        },
        {
            title: "รอบที่ 3: ปัญหาและคุณประโยชน์",
            instruction: "ปัญหาเหล่านี้ แก้ไขได้ด้วยประโยชน์จากสหกรณ์! ลองจับคู่ดูสิ",
            pairs: [
                { id: 'low_price', term: 'ปัญหา: ผลไม้ราคาตกต่ำ', definition: 'ประโยชน์: รวมกันขายผ่านสหกรณ์ ทำให้มีอำนาจต่อรองราคามากขึ้น', icon: 'images/icon_problem_low_price.png' },
                { id: 'no_capital', term: 'ปัญหา: ไม่มีเงินทุนซื้ออุปกรณ์', definition: 'ประโยชน์: กู้ยืมเงินจากสหกรณ์ออมทรัพย์ด้วยดอกเบี้ยที่เป็นธรรม', icon: 'images/icon_problem_no_capital.png' },
                { id: 'expensive_goods', term: 'ปัญหา: ต้องซื้อของใช้แพง', definition: 'ประโยชน์: ซื้อสินค้าจำเป็นจากสหกรณ์ร้านค้าที่ขายในราคาถูกกว่า', icon: 'images/icon_problem_expensive_goods.png' }
            ]
        }
    ];

    // --- DOM Elements ---
    const dropZonesContainer = document.getElementById('dropZonesContainer');
    const draggableCardsContainer = document.getElementById('draggableCardsContainer');
    const roundTitleEl = document.getElementById('roundTitle');
    const instructionTextEl = document.getElementById('instructionText');
    const progressBar = document.getElementById('progressBar');
    const roundCompleteMessage = document.getElementById('roundCompleteMessage');
    const nextRoundBtn = document.getElementById('nextRoundBtn');
    const finalScoreModal = document.getElementById('finalScoreModal');
    const mascotImageEl = document.getElementById('mascotImage'); // Get mascot image element

    // --- Game State ---
    let currentRoundIndex = 0;
    let correctMatches = 0;
    let totalPairsInRound = 0;
    let draggedCard = null;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function loadRound(roundIndex) {
        correctMatches = 0;
        dropZonesContainer.innerHTML = '';
        draggableCardsContainer.innerHTML = '';
        roundCompleteMessage.classList.add('hidden');
        mascotImageEl.src = '../../assets/images/mascots/มาสคลอต ปันผล+ออมตัง_02.jpg'; // Reset mascot image if needed

        const roundData = gameRounds[roundIndex];
        totalPairsInRound = roundData.pairs.length;
        roundTitleEl.textContent = roundData.title;
        instructionTextEl.textContent = roundData.instruction;
        updateProgressBar();

        const draggableItems = [...roundData.pairs];
        shuffleArray(draggableItems);

        // Create drop zones (the terms with icons)
        roundData.pairs.forEach(pair => {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.dataset.id = pair.id;
            // *** สร้าง HTML ใหม่ให้มีรูปภาพไอคอน ***
            dropZone.innerHTML = `
                <div class="drop-zone-content">
                    <img src="${pair.icon}" class="drop-zone-icon" alt="${pair.term}">
                    <span class="drop-zone-term">${pair.term}</span>
                </div>
                <div class="drop-zone-placeholder">วางการ์ดคำตอบที่นี่</div>`;
            dropZonesContainer.appendChild(dropZone);
        });

        // Create draggable cards (the definitions)
        draggableItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'draggable-card';
            card.draggable = true;
            card.dataset.id = item.id;
            card.textContent = item.definition;
            draggableCardsContainer.appendChild(card);
        });

        addEventListeners();
    }

    function addEventListeners() {
        const draggables = document.querySelectorAll('.draggable-card');
        const dropZones = document.querySelectorAll('.drop-zone');

        draggables.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                draggedCard = e.target;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                draggedCard = null;
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                if (draggedCard && zone.dataset.id === draggedCard.dataset.id && !zone.classList.contains('correct')) {
                    handleCorrectMatch(draggedCard, zone);
                }
            });
        });
    }

    function handleCorrectMatch(card, zone) {
        card.draggable = false;
        card.classList.add('dropped');
        
        const placeholder = zone.querySelector('.drop-zone-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        zone.appendChild(card);
        zone.classList.add('correct');
        
        correctMatches++;
        updateProgressBar();

        if (correctMatches === totalPairsInRound) {
            handleRoundComplete();
        }
    }

    function updateProgressBar() {
        const percentage = totalPairsInRound > 0 ? (correctMatches / totalPairsInRound) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }

    function handleRoundComplete() {
        mascotImageEl.src = 'images/mascot_celebrate.png'; // เปลี่ยนเป็นภาพยินดี
        if (currentRoundIndex < gameRounds.length - 1) {
            nextRoundBtn.textContent = 'ไปรอบต่อไป!';
            roundCompleteMessage.classList.remove('hidden');
        } else {
            finalScoreModal.classList.remove('hidden');
        }
    }
    
    nextRoundBtn.addEventListener('click', () => {
        currentRoundIndex++;
        if (currentRoundIndex < gameRounds.length) {
            loadRound(currentRoundIndex);
        }
    });

    // --- Start Game ---
    loadRound(currentRoundIndex);
});