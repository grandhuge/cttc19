document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const startScreen = document.getElementById('gameStartScreen_G3');
    const playScreen = document.getElementById('gamePlayScreen_G3');
    const endScreen = document.getElementById('gameEndScreen_G3');
    const allScreens = document.querySelectorAll('.game-screen-g3');

    const startGameBtn = document.getElementById('startGameBtn_G3');
    const playAgainBtn = document.getElementById('playAgainBtn_G3');

    const currentWeekEl = document.getElementById('currentWeek');
    const fundsDisplayEl = document.getElementById('fundsDisplay');
    const happinessFillEl = document.getElementById('happinessFill');
    const happinessValueEl = document.getElementById('happinessValue');
    const storeShelfEl = document.getElementById('storeShelf');

    const eventTitleEl = document.getElementById('eventTitle');
    const eventDescriptionEl = document.getElementById('eventDescription');
    const decisionOptionsEl = document.getElementById('decisionOptions');

    const advisorMascotEl = document.getElementById('advisorMascot');
    const advisorTextEl = document.getElementById('advisorText');

    const cashRegisterSound = document.getElementById('cashRegisterSound');
    const happyCustomerSound = document.getElementById('happyCustomerSound');
    const sadCustomerSound = document.getElementById('sadCustomerSound');
    const decisionPopupSound = document.getElementById('decisionPopupSound');

    // --- Game Configuration & State ---
    const TOTAL_WEEKS = 8;
    const INITIAL_FUNDS = 1000;
    const INITIAL_HAPPINESS = 50;

    let week, funds, happiness, inventory, pricingMultiplier, promotionActive;

    const PRODUCTS = {
        'สมุด': { cost: 15, basePrice: 20, popularity: 0.7, image: 'images/product_notebook.png' },
        'ดินสอ': { cost: 4, basePrice: 6, popularity: 0.9, image: 'images/product_pencil.png' },
        'ยางลบ': { cost: 5, basePrice: 8, popularity: 0.8, image: 'images/product_eraser.png' },
        'นม': { cost: 10, basePrice: 13, popularity: 1.0, image: 'images/product_milk.png' },
        'ขนมปัง': { cost: 12, basePrice: 15, popularity: 0.9, image: 'images/product_bread.png' },
        'น้ำผลไม้': { cost: 12, basePrice: 15, popularity: 0.8, image: 'images/product_juice.png' }
    };

    const GAME_EVENTS = {
        1: {
            title: "เปิดร้านวันแรก: สั่งของเข้าร้าน!",
            description: "เรามีเงินทุนเริ่มต้น 1000 บาท เราจะสั่งสินค้าชุดไหนมาขายเป็นชุดแรกดี? การเลือกสินค้าที่ถูกต้องจะทำให้เพื่อนๆ พอใจ!",
            options: [
                { text: "ชุดเครื่องเขียนพื้นฐาน [ต้นทุน 300.-]", effect: { funds: -300, happiness: 10, inventory: {'สมุด': 15, 'ดินสอ': 25, 'ยางลบ': 20} }, advisor: "เป็นการเริ่มต้นที่ปลอดภัย เพื่อนๆ ต้องใช้แน่นอน!" },
                { text: "ชุดของกินน่าอร่อย [ต้นทุน 350.-]", effect: { funds: -350, happiness: 15, inventory: {'นม': 20, 'ขนมปัง': 15, 'น้ำผลไม้': 15} }, advisor: "ว้าว! ของกินขายดีเสมอ แต่ต้นทุนสูงหน่อยนะ" },
                { text: "ชุดผสมผสาน [ต้นทุน 400.-]", effect: { funds: -400, happiness: 15, inventory: {'สมุด': 10, 'ดินสอ': 15, 'นม': 10, 'ขนมปัง': 10} }, advisor: "ดีเลย! มีทั้งของกินและของใช้ให้เลือก!" }
            ]
        },
        2: {
            title: "สัปดาห์ที่ 2: กลยุทธ์การตั้งราคา",
            description: "เพื่อนๆ เริ่มมาซื้อของแล้ว เราจะตั้งราคาสินค้าอย่างไรดี?",
            options: [
                { text: "ตั้งราคายุติธรรม (กำไรเล็กน้อย)", effect: { happiness: 5 }, advisor: "เพื่อนๆ พอใจ ราคาไม่แพงเกินไป", pricing: 1.0 },
                { text: "ตั้งราคาถูกสุดๆ (เพื่อความสุข)", effect: { happiness: 15 }, advisor: "เพื่อนๆ มีความสุขมาก แต่กำไรเราจะน้อยลงนะ!", pricing: 0.8 },
                { text: "ตั้งราคาสูงหน่อย (เน้นกำไร)", effect: { happiness: -10 }, advisor: "เราได้กำไรเยอะ แต่เพื่อนๆ เริ่มบ่นว่าของแพงแล้ว", pricing: 1.2 }
            ]
        },
        3: {
            title: "สัปดาห์ที่ 3: เสียงจากเพื่อนๆ",
            description: "เพื่อนๆ หลายคนบอกว่าอยากให้มี 'น้ำผลไม้' มาขายด้วย เราจะสั่งมาเพิ่มดีไหม?",
            options: [
                { text: "สั่งมาเลย! ตามใจเพื่อนๆ [ต้นทุน 120.-]", effect: { funds: -120, happiness: 15, inventory_add: {'น้ำผลไม้': 10} }, advisor: "เพื่อนๆ ต้องดีใจแน่ๆ ที่เรารับฟัง!" },
                { text: "ยังก่อนดีกว่า ตอนนี้ของเยอะแล้ว", effect: { happiness: -5 }, advisor: "ก็รอบคอบดีนะ แต่เพื่อนๆ ที่อยากได้อาจจะแอบผิดหวัง" }
            ]
        },
        4: {
            title: "สัปดาห์ที่ 4: สัปดาห์สอบ",
            description: "สัปดาห์นี้เป็นช่วงสอบ เพื่อนๆ ต้องใช้เครื่องเขียนเยอะเป็นพิเศษ!",
            options: [
                { text: "สั่งเครื่องเขียนมาเพิ่ม [ต้นทุน 150.-]", effect: { funds: -150, inventory_add: {'สมุด': 10, 'ดินสอ': 20, 'ยางลบ': 15}}, advisor: "เตรียมพร้อมดีมาก! ของไม่ขาดแน่นอน" },
                { text: "จัดโปรโมชั่น ซื้อครบ 50 บาท ลด 5 บาท", effect: { happiness: 10, promotion: true }, advisor: "เป็นการช่วยเพื่อนๆ ในช่วงสอบที่ดีเลย!" }
            ]
        },
        5: {
            title: "สัปดาห์ที่ 5: สินค้าใกล้หมดอายุ",
            description: "แย่แล้ว! นมในร้านอีก 2-3 กล่องกำลังจะหมดอายุในอีกไม่กี่วัน เราจะทำยังไงดี?",
            options: [
                { text: "จัดโปรลดราคาพิเศษเฉพาะนม", effect: { happiness: 5 }, advisor: "เป็นวิธีแก้ปัญหาที่ดี! อย่างน้อยก็ไม่เสียของไปเปล่าๆ", action: 'clear_milk' },
                { text: "ทิ้งไปเพื่อความปลอดภัย", effect: { happiness: -5, funds: -20 }, advisor: "ปลอดภัยไว้ก่อน แต่เราก็เสียเงินทุนไปนะ" }
            ]
        },
        6: {
            title: "สัปดาห์ที่ 6: งานกีฬาสี",
            description: "โรงเรียนจะจัดงานกีฬาสี! เราจะไปตั้งซุ้มขายน้ำและขนมที่สนามดีไหม? อาจจะขายดีมาก แต่ก็ต้องลงทุนเพิ่มนะ",
            options: [
                { text: "ไปสิ! โอกาสทำกำไร! [ลงทุนเพิ่ม 200.-]", effect: { funds: -200, happiness: 10 }, advisor: "สุดยอด! ขอให้ขายดีเป็นเทน้ำเทท่าเลยนะ!", action: 'sports_day_boost' },
                { text: "ไม่ดีกว่า เสี่ยงเกินไป อยู่ที่ร้านเหมือนเดิม", effect: { happiness: -5 }, advisor: "เป็นการตัดสินใจที่ปลอดภัย แต่เราก็พลาดโอกาสสนุกๆ ไปนะ" }
            ]
        },
        7: {
            title: "สัปดาห์ที่ 7: วางแผนเพื่อส่วนรวม",
            description: "สหกรณ์ของเราเริ่มมีกำไรแล้ว เราจะนำเงินส่วนหนึ่ง (150 บาท) ไปทำอะไรดี?",
            options: [
                { text: "นำไปซื้อหนังสือใหม่เข้าห้องสมุด", effect: { funds: -150, happiness: 20 }, advisor: "เป็นความคิดที่ดีมาก! นี่คือหลักการเอื้ออาทรต่อชุมชนเลยนะ" },
                { text: "เก็บไว้เป็นทุนสำรองของร้าน", effect: { happiness: 5 }, advisor: "รอบคอบมาก! ทำให้ร้านเรามั่นคงขึ้น" }
            ]
        },
        8: {
            title: "สัปดาห์สุดท้าย!",
            description: "สัปดาห์สุดท้ายของภาคเรียนแล้ว! มาทำให้ดีที่สุดกันเถอะ!",
            options: [
                { text: "ขอบคุณเพื่อนๆ ทุกคนที่มาอุดหนุน!", effect: { happiness: 10 }, advisor: "บริหารร้านมาจนถึงสัปดาห์สุดท้ายแล้ว เก่งมาก!" }
            ]
        }
    };
    
    // --- Game Logic Functions ---
    function showScreen(screenEl) {
        allScreens.forEach(s => s.classList.remove('active-screen'));
        screenEl.classList.add('active-screen');
    }

    function updateDisplay() {
        currentWeekEl.textContent = week;
        fundsDisplayEl.textContent = funds;
        happinessValueEl.textContent = `${happiness}%`;
        happinessFillEl.style.width = `${happiness}%`;
        advisorMascotEl.src = `images/mascot_advisor_${happiness > 60 ? 'happy' : (happiness < 40 ? 'worried' : 'neutral')}.png`;

        storeShelfEl.innerHTML = '';
        let productCount = 0;
        for (const productName in inventory) {
            if (inventory[productName] > 0) {
                productCount++;
                const product = PRODUCTS[productName];
                const img = document.createElement('img');
                img.src = product.image;
                img.alt = productName;
                img.classList.add('product-icon-on-shelf');
                img.title = `${productName} (คงเหลือ: ${inventory[productName]})`;
                storeShelfEl.appendChild(img);
            }
        }
        if (productCount === 0) {
            storeShelfEl.innerHTML = '<p class="empty-shelf-text">สินค้าหมดสต็อก!</p>';
        }
    }
    
    function simulateSales() {
        let weeklyProfit = 0;
        for (const productName in inventory) {
            if (inventory[productName] > 0) {
                const product = PRODUCTS[productName];
                // More popular products sell better, higher happiness sells better
                let demand = Math.random() * (happiness / 50) * product.popularity;
                // Promotion boosts demand
                if (promotionActive) demand *= 1.5;

                let itemsSold = Math.min(inventory[productName], Math.floor(demand * 5)); // Sell up to 5 items of each type per week based on demand
                
                inventory[productName] -= itemsSold;
                weeklyProfit += itemsSold * (product.basePrice * pricingMultiplier - product.cost);
            }
        }
        funds += Math.floor(weeklyProfit);
    }
    
    function loadEventForWeek(weekNum) {
        if(window.decisionPopupSound) decisionPopupSound.play();
        const eventData = GAME_EVENTS[weekNum];
        eventTitleEl.textContent = eventData.title;
        eventDescriptionEl.textContent = eventData.description;
        decisionOptionsEl.innerHTML = '';
        eventData.options.forEach(opt => {
            const button = document.createElement('button');
            button.classList.add('decision-btn-g3');
            button.textContent = opt.text;
            button.onclick = () => handleDecision(opt);
            decisionOptionsEl.appendChild(button);
        });
    }

    function handleDecision(option) {
        // Disable buttons after choice
        decisionOptionsEl.querySelectorAll('.decision-btn-g3').forEach(btn => btn.disabled = true);

        // Apply effects
        if (option.effect.funds) funds += option.effect.funds;
        if (option.effect.happiness) happiness += option.effect.happiness;
        if (option.effect.inventory) inventory = { ...option.effect.inventory };
        if (option.effect.inventory_add) {
            for(const item in option.effect.inventory_add) {
                inventory[item] = (inventory[item] || 0) + option.effect.inventory_add[item];
            }
        }
        if (option.pricing) pricingMultiplier = option.pricing;
        if (option.promotion) promotionActive = true;
        
        // Handle special actions
        if (option.action === 'clear_milk' && inventory['นม']) {
            funds += inventory['นม'] * PRODUCTS['นม'].basePrice * 0.5; // Sell at half price
            inventory['นม'] = 0;
        }
        if (option.action === 'sports_day_boost') {
            // Simulate big sales
            funds += 400;
            happiness += 10;
        }

        // Clamp values & update display
        happiness = Math.max(0, Math.min(100, happiness));
        advisorTextEl.textContent = option.advisor;
        updateDisplay();
        
        // Play sounds
        if (option.effect.happiness > 0 && window.happyCustomerSound) happyCustomerSound.play();
        if (option.effect.happiness < 0 && window.sadCustomerSound) sadCustomerSound.play();
        if (option.effect.funds && window.cashRegisterSound) cashRegisterSound.play();

        // Wait a bit, then move to next week
        setTimeout(nextWeek, 2500); // 2.5 second delay to read feedback
    }

    function nextWeek() {
        // Sales simulation for the week that just passed
        simulateSales();
        promotionActive = false; // Reset promotion
        
        week++;
        updateDisplay();
        
        if (week > TOTAL_WEEKS) {
            setTimeout(endGame, 1000);
        } else {
            loadEventForWeek(week);
        }
    }

    function startGame() {
        week = 1;
        funds = INITIAL_FUNDS;
        happiness = INITIAL_HAPPINESS;
        inventory = {};
        pricingMultiplier = 1.0;
        promotionActive = false;
        
        showScreen(playScreen);
        updateDisplay();
        loadEventForWeek(1);
    }

    function endGame() {
        const endFundsEl = document.getElementById('finalFunds');
        const endHappinessEl = document.getElementById('finalHappiness');
        const endTitleEl = document.getElementById('gameEndTitle');
        const endMessageEl = document.getElementById('gameEndMessage');
        const endImageEl = document.getElementById('endGameImage');

        endFundsEl.textContent = funds;
        endHappinessEl.textContent = `${happiness}%`;

        if (funds >= 1100 && happiness >= 80) {
            endTitleEl.textContent = "🎉 สุดยอดผู้จัดการร้าน! 🎉";
            endMessageEl.textContent = "สหกรณ์ของเราประสบความสำเร็จอย่างงดงาม ทั้งมีกำไรและเพื่อนๆ ก็มีความสุขมาก! คุณคือผู้จัดการตัวจริง!";
            endImageEl.src = "images/game_summary_win.png";
        } else if (funds < 900) {
            endTitleEl.textContent = "😥 ร้านค้าขาดทุน... ลองใหม่อีกครั้งนะ 😥";
            endMessageEl.textContent = "โอ๊ะโอ... ดูเหมือนว่าร้านของเราจะขาดทุนไปหน่อย ไม่เป็นไรนะ! การเรียนรู้จากความผิดพลาดคือสิ่งสำคัญ ลองวางแผนใหม่ในครั้งหน้านะ!";
            endImageEl.src = "images/game_summary_lose.png";
        } else {
            endTitleEl.textContent = "🙂 ทำได้ดีมาก! 🙂";
            endMessageEl.textContent = "คุณบริหารร้านได้ดีเลยนะ! สหกรณ์ของเราอยู่รอดและเพื่อนๆ ก็ค่อนข้างพอใจ พัฒนาต่อไปนะ!";
            endImageEl.src = "images/game_summary_neutral.png";
        }
        showScreen(endScreen);
    }
    
    // --- Event Listeners ---
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);
});