document.addEventListener('DOMContentLoaded', () => {
    const gameStartScreen = document.getElementById('gameStartScreen');
    const gamePlayScreen = document.getElementById('gamePlayScreen');
    const gameEndScreen = document.getElementById('gameEndScreen');

    const startGameBtn = document.getElementById('startGameBtn');
    const nextMissionBtn = document.getElementById('nextMissionBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');

    const missionTitleEl = document.getElementById('missionTitle');
    const missionImageEl = document.getElementById('missionImage');
    const missionDescriptionEl = document.getElementById('missionDescription');
    const missionQuestionEl = document.getElementById('missionQuestion');
    const missionOptionsEl = document.getElementById('missionOptions');

    const feedbackMascotEl = document.getElementById('feedbackMascot');
    const feedbackTextEl = document.getElementById('feedbackText');
    const badgeDisplayAreaEl = document.querySelector('.badge-display-area');
    const finalBadgesEl = document.querySelector('.final-badges-collected');

    const correctSound = document.getElementById('correctSound');
    const wrongSound = document.getElementById('wrongSound');
    const missionCompleteSound = document.getElementById('missionCompleteSound'); // For all 7 done

    const missions = [
        {
            id: 1,
            title: "หลักการที่ 1: เป็นสมาชิกด้วยความสมัครใจและเปิดกว้าง",
            image: "images/principle1_scenario.png",
            description: "มีนักเรียนใหม่ชื่อ 'แก้วตา' ย้ายเข้ามาที่โรงเรียนของเรา แก้วตาสนใจอยากเข้าร่วมกิจกรรมสหกรณ์โรงเรียนมาก เมื่อแก้วตามาขอสมัครเป็นสมาชิก พี่ออมตังค์และน้องปันผล (กรรมการสหกรณ์) ควรทำอย่างไร?",
            question: "การกระทำใดเหมาะสมที่สุด?",
            options: [
                { text: "A) ต้อนรับแก้วตา และอธิบายกฎระเบียบการเป็นสมาชิกให้ฟัง", correct: true },
                { text: "B) บอกแก้วตาว่าสหกรณ์เต็มแล้ว รับสมาชิกใหม่ไม่ได้", correct: false },
                { text: "C) บอกว่ารับเฉพาะเพื่อนสนิทของกรรมการเท่านั้น", correct: false }
            ],
            feedbackCorrect: "ยอดเยี่ยม! สหกรณ์เปิดรับสมาชิกทุกคนที่สมัครใจและยอมรับในกฎเกณฑ์จ้ะ",
            feedbackIncorrect: "ยังไม่ถูกนะ... สหกรณ์ที่ดีต้องเปิดกว้างให้ทุกคนที่สนใจเข้าร่วมได้จ้ะ"
        },
        {
            id: 2,
            title: "หลักการที่ 2: ควบคุมโดยสมาชิกตามหลักประชาธิปไตย",
            image: "images/principle2_scenario.png",
            description: "สหกรณ์โรงเรียนต้องการเลือกประธานกรรมการสหกรณ์คนใหม่ เพื่อมาช่วยดูแลการทำงาน พี่ออมตังค์และน้องปันผลเสนอตัวเข้าสมัครพร้อมกับเพื่อนอีกคน",
            question: "วิธีการใดเหมาะสมที่สุดในการเลือกประธานกรรมการ?",
            options: [
                { text: "A) ให้คุณครูที่ปรึกษาเป็นคนเลือกให้เลย", correct: false },
                { text: "B) ให้สมาชิกทุกคนในสหกรณ์ลงคะแนนเสียงเลือกตั้ง (1 คน 1 เสียง)", correct: true },
                { text: "C) ให้พี่ออมตังค์เป็นประธานเลย เพราะเรียนเก่งที่สุด", correct: false }
            ],
            feedbackCorrect: "ถูกต้อง! สมาชิกทุกคนมีสิทธิออกเสียงเลือกตั้งตัวแทนของตนเองอย่างเท่าเทียมกันจ้ะ",
            feedbackIncorrect: "ไม่ใช่หลักประชาธิปไตยนะ... สมาชิกทุกคนควรมีส่วนร่วมในการตัดสินใจสำคัญๆ ของสหกรณ์"
        },
        // ... (ภารกิจสำหรับหลักการที่ 3-7) ...
        {
            id: 3,
            title: "หลักการที่ 3: การมีส่วนร่วมทางเศรษฐกิจของสมาชิก",
            image: "images/principle3_scenario.png",
            description: "สหกรณ์ร้านค้าโรงเรียนมีกำไรเล็กน้อยจากการขายของเมื่อสิ้นปี คณะกรรมการสหกรณ์ (พี่ออมตังค์, น้องปันผล และเพื่อนๆ) กำลังคิดว่าจะทำอย่างไรกับเงินส่วนนี้ดี",
            question: "ข้อใดคือการจัดการเงินกำไรที่เหมาะสมตามหลักการมีส่วนร่วมทางเศรษฐกิจ?",
            options: [
                { text: "A) นำเงินทั้งหมดไปให้คุณครูใหญ่", correct: false },
                { text: "B) แบ่งปันผลกำไรคืนให้สมาชิกตามส่วน (ปันผล) หรือนำไปพัฒนาสหกรณ์ให้ดีขึ้น", correct: true },
                { text: "C) พี่ออมตังค์ (เหรัญญิก) เก็บเงินทั้งหมดไว้ใช้ส่วนตัว", correct: false }
            ],
            feedbackCorrect: "ใช่เลย! ผลประโยชน์ที่เกิดขึ้นควรกลับคืนสู่สมาชิกหรือนำไปพัฒนากิจการของสหกรณ์เพื่อประโยชน์ร่วมกัน",
            feedbackIncorrect: "ยังไม่ถูกจ้ะ... เงินทุนและผลประโยชน์ของสหกรณ์ควรเป็นไปเพื่อสมาชิกโดยรวมนะ"
        },
        {
            id: 4,
            title: "หลักการที่ 4: การปกครองตนเองและความเป็นอิสระ",
            image: "images/principle4_scenario.png",
            description: "มีบริษัทขายขนมยี่ห้อหนึ่งเสนอจะให้เงินสนับสนุนสหกรณ์โรงเรียนจำนวนมาก แต่มีเงื่อนไขว่าสหกรณ์ต้องขายแต่ขนมของบริษัทนี้เท่านั้น และต้องตั้งราคาตามที่บริษัทกำหนด",
            question: "คณะกรรมการสหกรณ์โรงเรียนควรตัดสินใจอย่างไรเพื่อให้สหกรณ์ยังคงความเป็นอิสระ?",
            options: [
                { text: "A) รับข้อเสนอทันที เพราะจะได้เงินเยอะ", correct: false },
                { text: "B) ขอบคุณในข้อเสนอ แต่ขอตัดสินใจเรื่องการขายสินค้าและราคาเองตามความต้องการของสมาชิก", correct: true },
                { text: "C) ให้คุณครูที่ปรึกษาตัดสินใจแทนทั้งหมด", correct: false }
            ],
            feedbackCorrect: "ยอดเยี่ยม! สหกรณ์ต้องสามารถตัดสินใจเรื่องสำคัญๆ เองได้ เพื่อประโยชน์ของสมาชิกอย่างแท้จริง",
            feedbackIncorrect: "เอ๊ะ...ถ้าสหกรณ์ไม่สามารถตัดสินใจเองได้ ก็จะไม่เป็นอิสระนะ"
        },
        {
            id: 5,
            title: "หลักการที่ 5: การศึกษา ฝึกอบรม และสารสนเทศ",
            image: "images/principle5_scenario.png",
            description: "น้องปันผลเพิ่งได้รับเลือกเป็นกรรมการสหกรณ์คนใหม่ และยังไม่ค่อยเข้าใจวิธีการจดบันทึกการประชุม พี่ออมตังค์ซึ่งมีประสบการณ์มากกว่าเห็นเข้า",
            question: "พี่ออมตังค์ควรทำอย่างไรตามหลักการนี้?",
            options: [
                { text: "A) ปล่อยให้น้องปันผลทำผิดๆ ถูกๆ ไปเอง เดี๋ยวก็เป็น", correct: false },
                { text: "B) สอนและแนะนำวิธีการจดบันทึกการประชุมที่ถูกต้องให้น้องปันผล", correct: true },
                { text: "C) บอกให้คุณครูมาสอนน้องปันผลคนเดียว", correct: false }
            ],
            feedbackCorrect: "ถูกต้อง! การให้ความรู้และฝึกอบรมแก่สมาชิกและกรรมการเป็นสิ่งสำคัญมากจ้ะ",
            feedbackIncorrect: "การช่วยเหลือให้ความรู้เพื่อนกรรมการด้วยกันเป็นสิ่งที่ดีนะ"
        },
        {
            id: 6,
            title: "หลักการที่ 6: การร่วมมือระหว่างสหกรณ์",
            image: "images/principle6_scenario.png",
            description: "สหกรณ์โรงเรียนของพี่ออมตังค์ต้องการซื้อสมุดมาขายในราคาที่ถูกลง เพื่อให้สมาชิกได้ประโยชน์ แต่การสั่งจำนวนน้อยทำให้ได้ราคาแพง",
            question: "สหกรณ์โรงเรียนของพี่ออมตังค์อาจจะแก้ปัญหานี้ได้อย่างไรโดยใช้หลักการร่วมมือระหว่างสหกรณ์?",
            options: [
                { text: "A) ขึ้นราคาสมุดที่ขายให้สมาชิกแทน", correct: false },
                { text: "B) ลองติดต่อรวมกลุ่มกับสหกรณ์โรงเรียนอื่นๆ เพื่อสั่งซื้อสมุดพร้อมกันในจำนวนมาก ทำให้ได้ราคาถูกลง", correct: true },
                { text: "C) เลิกขายสมุดไปเลย เพราะแก้ปัญหาไม่ได้", correct: false }
            ],
            feedbackCorrect: "ใช่แล้ว! การร่วมมือกันระหว่างสหกรณ์ช่วยให้มีพลังต่อรองและเกิดประโยชน์มากขึ้น!",
            feedbackIncorrect: "ลองคิดดูสิว่าถ้าสหกรณ์ต่างๆ ช่วยเหลือกัน จะเกิดผลดีอย่างไร"
        },
        {
            id: 7,
            title: "หลักการที่ 7: ความเอื้ออาทรต่อชุมชน",
            image: "images/principle7_scenario.png",
            description: "หลังจากดำเนินงานมาครบปี สหกรณ์โรงเรียนมีผลกำไรส่วนหนึ่งเหลือจากการปันผลให้สมาชิกแล้ว คณะกรรมการกำลังคิดว่าจะนำเงินส่วนนี้ไปทำอะไรดี",
            question: "กิจกรรมใดต่อไปนี้แสดงถึงความเอื้ออาทรต่อชุมชน (โรงเรียน) ได้ดีที่สุด?",
            options: [
                { text: "A) นำเงินทั้งหมดไปจัดงานเลี้ยงฉลองให้เฉพาะกรรมการสหกรณ์", correct: false },
                { text: "B) บริจาคเงินส่วนหนึ่งเพื่อซื้อหนังสือใหม่เข้าห้องสมุดของโรงเรียน หรือปรับปรุงสนามเด็กเล่น", correct: true },
                { text: "C) เก็บเงินทั้งหมดไว้เฉยๆ ไม่ทำอะไรเลย", correct: false }
            ],
            feedbackCorrect: "ยอดเยี่ยม! การนำผลกำไรไปพัฒนาโรงเรียนหรือชุมชน เป็นการแสดงความเอื้ออาทรที่ดีมาก",
            feedbackIncorrect: "สหกรณ์ที่ดีไม่เพียงแต่ดูแลสมาชิก แต่ยังใส่ใจชุมชนรอบข้างด้วยนะ"
        }
    ];

    let currentMissionIndex = 0;
    let badgesCollected = []; // Array to store IDs of collected badges

    function initBadges() {
        badgeDisplayAreaEl.innerHTML = '';
        finalBadgesEl.innerHTML = '';
        for (let i = 1; i <= 7; i++) {
            const badgeImg = document.createElement('img');
            badgeImg.src = `images/badge_p${i}_gray.png`;
            badgeImg.alt = `เหรียญตราหลักการ ${i}`;
            badgeImg.classList.add('badge-icon');
            badgeImg.id = `badge-display-${i}`;
            badgeDisplayAreaEl.appendChild(badgeImg.cloneNode(true)); // For gameplay screen
             finalBadgesEl.appendChild(badgeImg); // For end screen
        }
    }
    
    function updateCollectedBadge(principleId) {
        const badgeInDisplay = document.getElementById(`badge-display-${principleId}`);
        const badgeInFinal = finalBadgesEl.querySelector(`img[alt="เหรียญตราหลักการ ${principleId}"]`);
        if (badgeInDisplay) {
            badgeInDisplay.src = `images/badge_p${principleId}.png`; // Show colored badge
        }
         if (badgeInFinal) {
            badgeInFinal.src = `images/badge_p${principleId}.png`;
        }
    }


    function loadMission(missionIndex) {
        if (missionIndex >= missions.length) {
            endGame();
            return;
        }
        const mission = missions[missionIndex];
        missionTitleEl.textContent = `ภารกิจที่ ${mission.id}: ${mission.title}`;
        missionImageEl.src = mission.image;
        missionDescriptionEl.textContent = mission.description;
        missionQuestionEl.textContent = mission.question;

        missionOptionsEl.innerHTML = ''; // Clear previous options
        mission.options.forEach(opt => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = opt.text;
            button.dataset.correct = opt.correct;
            button.addEventListener('click', handleOptionClick);
            missionOptionsEl.appendChild(button);
        });

        feedbackTextEl.textContent = "เลือกคำตอบที่ถูกต้องสิ!";
        feedbackTextEl.className = 'feedback-text-bubble'; // Reset class
        feedbackMascotEl.src = "../../assets/images/mascots/mascot.png"; // Default mascot
        nextMissionBtn.style.display = 'none';
    }

    function handleOptionClick(event) {
        const selectedButton = event.target;
        const isCorrect = selectedButton.dataset.correct === 'true';
        const currentMission = missions[currentMissionIndex];

        // Disable all option buttons
        missionOptionsEl.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.correct === 'true' && btn !== selectedButton) { // Show correct if wrong one selected
                 // btn.classList.add('correct-answer'); // Optionally always highlight correct
            }
        });

        if (isCorrect) {
            selectedButton.classList.add('correct-answer');
            feedbackTextEl.textContent = currentMission.feedbackCorrect;
            feedbackTextEl.classList.add('correct');
            feedbackMascotEl.src = "images/mascot_guide_happy.png"; // Happy mascot
            if (correctSound) correctSound.play();
            
            if (!badgesCollected.includes(currentMission.id)) {
                badgesCollected.push(currentMission.id);
                updateCollectedBadge(currentMission.id);
            }
        } else {
            selectedButton.classList.add('wrong-answer');
            // Highlight the correct answer
            missionOptionsEl.querySelector('.option-btn[data-correct="true"]').classList.add('correct-answer');
            feedbackTextEl.textContent = currentMission.feedbackIncorrect;
            feedbackTextEl.classList.add('incorrect');
            feedbackMascotEl.src = "images/mascot_guide_thinking.png"; // Thinking/Oops mascot
            if (wrongSound) wrongSound.play();
        }
        nextMissionBtn.style.display = 'inline-block';
    }

    function startGame() {
        currentMissionIndex = 0;
        badgesCollected = [];
        initBadges(); // Initialize grey badges
        gameStartScreen.style.display = 'none';
        gameEndScreen.style.display = 'none';
        gamePlayScreen.style.display = 'block';
        loadMission(currentMissionIndex);
    }

    function endGame() {
        gamePlayScreen.style.display = 'none';
        gameEndScreen.style.display = 'block';
        if (missionCompleteSound) missionCompleteSound.play();
        // Final badges are already updated by updateCollectedBadge
    }

    startGameBtn.addEventListener('click', startGame);
    nextMissionBtn.addEventListener('click', () => {
        currentMissionIndex++;
        loadMission(currentMissionIndex);
    });
    playAgainBtn.addEventListener('click', startGame);

    // Initial call if needed, or just start with startGameBtn
    // startGame(); 
});