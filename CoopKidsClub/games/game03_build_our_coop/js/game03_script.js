document.addEventListener('DOMContentLoaded', () => {
    // --- Screen Elements ---
    const gameStartScreen = document.getElementById('gameStartScreen_G3');
    const gamePlayScreen = document.getElementById('gamePlayScreen_G3');
    const gameEndScreen = document.getElementById('gameEndScreen_G3');

    // --- Button Elements ---
    const startGameBtn = document.getElementById('startGameBtn_G3');
    const playAgainBtn = document.getElementById('playAgainBtn_G3');

    // --- Game Play Display Elements ---
    const currentWeekEl = document.getElementById('currentWeek');
    const totalWeeksEl = document.getElementById('totalWeeks'); // Should be set
    const fundsDisplayEl = document.getElementById('fundsDisplay');
    const happinessDisplayEl = document.getElementById('happinessDisplay');
    const stockDisplayEl = document.getElementById('stockDisplay');
    const coopImageEl = document.getElementById('coopImage');
    const coopImageCaptionEl = document.getElementById('coopImageCaption');
    const eventTitleEl = document.getElementById('eventTitle');
    const eventDescriptionEl = document.getElementById('eventDescription');
    const decisionOptionsEl = document.getElementById('decisionOptions');
    const advisorMascotEl = document.getElementById('advisorMascot');
    const advisorTextEl = document.getElementById('advisorText');

    // --- Game End Display Elements ---
    const gameEndTitleEl = document.getElementById('gameEndTitle');
    const gameEndBgEl = document.getElementById('gameEndBg');
    const endGameMascotEl = document.getElementById('endGameMascot');
    const gameEndMessageEl = document.getElementById('gameEndMessage');
    const finalFundsEl = document.getElementById('finalFunds');
    const finalHappinessEl = document.getElementById('finalHappiness');

    // --- Audio Elements ---
    const positiveSound = document.getElementById('positiveSound_G3');
    const negativeSound = document.getElementById('negativeSound_G3');
    const cashSound = document.getElementById('cashSound_G3');

    // --- Game State Variables ---
    let currentWeek = 1;
    const totalWeeks = 10; // Example: 10 weeks for the game
    let funds = 500; // Initial funds
    let happiness = 50; // Initial happiness (0-100)
    let stockLevel = 0; // 0: empty, 1: low, 2: medium, 3: high
    const stockMessages = ["ว่างเปล่า", "เหลือน้อย", "พอใช้", "เต็มร้าน"];
    const coopImages = ["images/coop_store_empty.png", "images/coop_store_low_stock.png", "images/coop_store_stocked.png", "images/coop_store_very_stocked.png"];

    const gameEvents = [
        // Phase 1: Setup
        {
            week: 1,
            title: "ก่อตั้งสหกรณ์: เลือกกิจกรรมหลัก",
            description: "เราจะเริ่มสหกรณ์โรงเรียนด้วยกิจกรรมอะไรดีเป็นอย่างแรก เพื่อดึงดูดเพื่อนๆ และเริ่มต้นได้ง่าย?",
            imageUpdate: null, // No image change for this specific decision
            options: [
                { text: "เปิดร้านค้าขายอุปกรณ์การเรียน", effect: { funds: -100, happiness: 10, stock: 1 }, advisor: "ดีเลย! เพื่อนๆ ต้องใช้สมุดดินสอแน่ๆ" },
                { text: "เริ่มกิจกรรมออมทรัพย์ ชวนเพื่อนๆ มาฝากเงิน", effect: { funds: 20, happiness: 5 }, advisor: "การออมเป็นสิ่งที่ดีนะ แต่ช่วงแรกอาจจะยังไม่เห็นผลมาก" }
            ]
        },
        {
            week: 1, // Can have multiple events in a week or control flow
            title: "ระดมทุน: ชวนเพื่อนๆ ซื้อหุ้น",
            description: "เพื่อให้สหกรณ์มีเงินทุนเริ่มต้น เราควรชวนเพื่อนๆ มาซื้อหุ้นสหกรณ์กันดีไหม?",
            imageUpdate: null,
            options: [
                { text: "ชวนเพื่อนๆ ซื้อหุ้นคนละ 10 บาท", effect: { funds: 200, happiness: 10 }, advisor: "เยี่ยม! ทุกคนได้เป็นเจ้าของร่วมกัน" },
                { text: "ขอเงินสนับสนุนจากคุณครูอย่างเดียว", effect: { funds: 150, happiness: -5 }, advisor: "ก็ได้นะ แต่ถ้าเพื่อนๆ มีส่วนร่วมจะดีกว่า" }
            ]
        },
        // Phase 2: Operations - Example events
        {
            week: 2,
            title: "ร้านค้า: สั่งของเข้าร้าน (รอบแรก)",
            description: "เราควรสั่งอุปกรณ์การเรียนแบบไหนมาขายดี ให้เพื่อนๆ พอใจและร้านค้าไม่ขาดทุน?",
            imageUpdate: "images/coop_store_low_stock.png",
            captionUpdate: "เริ่มมีของในร้านแล้ว!",
            options: [
                { text: "สั่งของจำเป็นพื้นฐาน (สมุด, ดินสอ, ยางลบ) จำนวนพอประมาณ", effect: { funds: -150, happiness: 15, stock: 2 }, advisor: "เป็นการเริ่มต้นที่ดี รอบคอบมาก!" },
                { text: "สั่งของเล่นและขนมสีสันสดใสเยอะๆ ดึงดูดเพื่อนๆ", effect: { funds: -200, happiness: 5, stock: 2 }, advisor: "น่าสนุกดีนะ แต่ระวังขายไม่หมดล่ะ" },
                { text: "สั่งของมาน้อยๆ ก่อน กลัวขายไม่ได้", effect: { funds: -50, happiness: 0, stock: 1 }, advisor: "ปลอดภัยดี แต่ของอาจจะไม่พอขายนะ" }
            ]
        },
        {
            week: 3,
            title: "กิจกรรมส่งเสริม: จัดโปรโมชั่น",
            description: "มีเพื่อนๆ เสนอให้จัดโปรโมชั่น 'ซื้อสมุด 2 เล่ม แถมดินสอ 1 แท่ง' เพื่อกระตุ้นยอดขาย เราควรทำไหม?",
            imageUpdate: null,
            options: [
                { text: "เห็นด้วย! น่าจะขายดีขึ้น", effect: { funds: -20, happiness: 10, stock: -1 }, advisor: "เพื่อนๆ คงชอบกันใหญ่เลย!" }, // stock decreases due to "free" pencils
                { text: "ไม่ดีกว่า เปลืองของ เดี๋ยวขาดทุน", effect: { happiness: -5 }, advisor: "ก็รอบคอบดีนะ แต่บางทีก็ต้องลองอะไรใหม่ๆ บ้าง" }
            ]
        },
        // ... More events for weeks 4-9 ...
        {
            week: 10, // Last week event could be a summary or final challenge
            title: "ปิดภาคเรียน: สรุปผลงานสหกรณ์",
            description: "ถึงเวลาสรุปผลงานสหกรณ์ของเราในเทอมนี้แล้ว! เพื่อนๆ คิดว่าเราควรนำเสนอผลงานให้ทุกคนทราบอย่างไรดี?",
            imageUpdate: "images/coop_store_stocked.png", // Assuming store is well by end
            captionUpdate: "ร้านเราดูดีมากเลย!",
            options: [
                { text: "จัดประชุมสมาชิก แจ้งผลกำไร และขอบคุณทุกคน", effect: { happiness: 15 }, advisor: "ดีมาก! ทุกคนควรได้รู้และภูมิใจร่วมกัน" },
                { text: "ไม่ต้องทำอะไรมาก แค่ปิดร้านตามปกติ", effect: { happiness: -10 }, advisor: "อ้าว...เพื่อนๆ อาจจะอยากรู้ผลงานของเรานะ" }
            ]
        }
    ];
    let currentEventIndex = 0;

    function updateGameDisplay() {
        currentWeekEl.textContent = currentWeek;
        totalWeeksEl.textContent = totalWeeks;
        fundsDisplayEl.textContent = funds;
        happinessDisplayEl.textContent = Math.max(0, Math.min(100, happiness)); // Keep between 0-100
        stockLevel = Math.max(0, Math.min(3, stockLevel)); // Keep between 0-3
        stockDisplayEl.textContent = stockMessages[stockLevel];
        if(coopImages[stockLevel]) { // Check if image exists for this stock level
             coopImageEl.src = coopImages[stockLevel];
        }
    }

    function loadEvent(eventIndex) {
        if (eventIndex >= gameEvents.length || currentWeek > totalWeeks) {
            triggerEndGame();
            return;
        }
        const event = gameEvents[eventIndex];
        // Check if this event is for the current game week
        if (event.week > currentWeek && currentWeek <= totalWeeks) {
            // No specific event for this week, maybe a generic "running the store" message or skip to next week with an event
            advisorTextEl.textContent = `สัปดาห์ที่ ${currentWeek}: ร้านค้าเปิดทำการปกติ เพื่อนๆ มาใช้บริการเรื่อยๆ...`;
            decisionOptionsEl.innerHTML = '<button class="decision-btn-g3" id="nextWeekBtn_G3">ไปสัปดาห์ต่อไป</button>';
            document.getElementById('nextWeekBtn_G3').addEventListener('click', () => {
                currentWeek++;
                currentEventIndex = eventIndex; // Stay on this event for next week check
                updateGameDisplay();
                loadEvent(currentEventIndex); // Re-check for events in the new week
            });
            return;
        } else if (event.week < currentWeek) { // Event already passed for some reason, find next
            loadEvent(eventIndex + 1);
            return;
        }


        eventTitleEl.textContent = `สัปดาห์ที่ ${event.week}: ${event.title}`;
        eventDescriptionEl.textContent = event.description;
        if (event.imageUpdate) {
            coopImageEl.src = event.imageUpdate;
        }
        if (event.captionUpdate) {
            coopImageCaptionEl.textContent = event.captionUpdate;
        }


        decisionOptionsEl.innerHTML = ''; // Clear previous options
        event.options.forEach((opt, index) => {
            const button = document.createElement('button');
            button.classList.add('decision-btn-g3');
            button.textContent = opt.text;
            button.dataset.choiceIndex = index;
            button.addEventListener('click', handleDecision);
            decisionOptionsEl.appendChild(button);
        });
        advisorTextEl.textContent = "เราจะตัดสินใจยังไงดีนะ?";
        advisorMascotEl.src = "images/mascot_advisor_thinking.png"; // Default thinking
        updateGameDisplay();
    }

    function handleDecision(e) {
        const choiceIndex = parseInt(e.target.dataset.choiceIndex);
        const event = gameEvents[currentEventIndex];
        const chosenOption = event.options[choiceIndex];

        // Apply effects
        if (chosenOption.effect.funds) funds += chosenOption.effect.funds;
        if (chosenOption.effect.happiness) happiness += chosenOption.effect.happiness;
        if (chosenOption.effect.stock !== undefined) stockLevel = chosenOption.effect.stock; // Direct set
        else if (chosenOption.effect.stockChange) stockLevel += chosenOption.effect.stockChange; // Incremental change


        // Clamp values
        happiness = Math.max(0, Math.min(100, happiness));
        stockLevel = Math.max(0, Math.min(3, stockLevel));
        
        if (chosenOption.effect.funds) {
            if (chosenOption.effect.funds > 0 && cashSound) cashSound.play();
            // else if (chosenOption.effect.funds < 0 && negativeSound) negativeSound.play(); // Or just general feedback
        }
        if(chosenOption.effect.happiness > 0 && positiveSound) positiveSound.play();
        else if (chosenOption.effect.happiness < 0 && negativeSound) negativeSound.play();


        advisorTextEl.textContent = chosenOption.advisor || "การตัดสินใจถูกบันทึกแล้ว";
        if(chosenOption.effect.happiness > 5 || (chosenOption.effect.funds && chosenOption.effect.funds > 50)) {
             advisorMascotEl.src = "images/mascot_advisor_happy.png";
        } else {
            advisorMascotEl.src = "images/mascot_advisor_aomtung.png"; // Neutral/AomTung
        }


        // Move to next event or next week
        currentEventIndex++;
        if (currentEventIndex >= gameEvents.length || gameEvents[currentEventIndex].week > currentWeek) {
            currentWeek++; // Move to next week if all events for current week are done
        }
        
        updateGameDisplay();
        if (currentWeek > totalWeeks) {
            triggerEndGame();
        } else {
             // Disable buttons after choice, then load next event or "next week" button
            decisionOptionsEl.querySelectorAll('.decision-btn-g3').forEach(btn => btn.disabled = true);
            const nextStepButton = document.createElement('button');
            nextStepButton.textContent = (currentEventIndex < gameEvents.length && gameEvents[currentEventIndex].week === currentWeek) ? "เหตุการณ์ต่อไป" : "ไปสัปดาห์ต่อไป";
            nextStepButton.classList.add('decision-btn-g3');
            nextStepButton.style.marginTop = "10px";
            nextStepButton.style.backgroundColor = "var(--primary-color)";
            nextStepButton.style.color = "white";

            nextStepButton.addEventListener('click', () => {
                loadEvent(currentEventIndex);
            });
            decisionOptionsEl.innerHTML = ''; // Clear old options
            decisionOptionsEl.appendChild(nextStepButton);
        }
    }

    function triggerEndGame() {
        gamePlayScreen.style.display = 'none';
        gameEndScreen.style.display = 'block';
        finalFundsEl.textContent = funds;
        finalHappinessEl.textContent = happiness;

        if (happiness >= 70 && funds >= 300) { // Winning condition (example)
            gameEndTitleEl.textContent = "🎉 ภารกิจสำเร็จ! สหกรณ์ของเราสุดยอด! 🎉";
            gameEndMessageEl.textContent = "เยี่ยมมาก! เพื่อนๆ บริหารสหกรณ์โรงเรียนได้ประสบความสำเร็จ สมาชิกทุกคนมีความสุขและสหกรณ์ก็มั่นคง!";
            gameEndBgEl.src = "images/game_win_bg.png";
            endGameMascotEl.src = "images/mascot_advisor_happy.png";
             if (positiveSound) positiveSound.play();
        } else if (happiness >= 50 && funds >= 100) {
            gameEndTitleEl.textContent = "🙂 ทำได้ดีนะ! สหกรณ์ของเราไปได้สวย 🙂";
            gameEndMessageEl.textContent = "เก่งมาก! สหกรณ์ของเราดำเนินไปได้ด้วยดีเลยนะ ลองพยายามอีกนิดเพื่อให้ดียิ่งขึ้นไปอีก!";
            gameEndBgEl.src = "images/game_neutral_bg.png"; // Create a neutral bg
            endGameMascotEl.src = "../../assets/images/mascots/mascot.png";
        }
        else {
            gameEndTitleEl.textContent = "😥 อุ๊ย! ลองใหม่อีกครั้งนะ 😥";
            gameEndMessageEl.textContent = "ไม่เป็นไรนะ! การบริหารสหกรณ์ก็มีเรื่องท้าทาย ลองเริ่มต้นใหม่และตัดสินใจให้ดีขึ้นในครั้งหน้านะ สู้ๆ!";
            gameEndBgEl.src = "images/game_lose_bg.png";
            endGameMascotEl.src = "images/mascot_advisor_thinking.png";
             if (negativeSound) negativeSound.play();
        }
    }

    startGameBtn.addEventListener('click', () => {
        // Reset game state
        currentWeek = 1;
        funds = 500;
        happiness = 50;
        stockLevel = 0;
        currentEventIndex = 0;

        gameStartScreen.style.display = 'none';
        gameEndScreen.style.display = 'none';
        gamePlayScreen.style.display = 'block';
        advisorMascotEl.src = "images/mascot_advisor_aomtung.png";
        loadEvent(currentEventIndex);
    });

    playAgainBtn.addEventListener('click', () => {
        startGameBtn.click(); // Trigger start game logic
    });

});