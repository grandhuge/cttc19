document.addEventListener('DOMContentLoaded', () => {
    // --- Slide Navigation & Narration Control (เหมือนเดิม) ---
    const slides = document.querySelectorAll('.lesson-slide');
    const navButtons = document.querySelectorAll('.lesson-nav-btn');
    const slideNarrationPlayer = document.getElementById('slideNarrationPlayer');
    const slideNarrationButtons = document.querySelectorAll('.slide-narration-btn');
    let currentPlayingButton = null;

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (slideNarrationPlayer && !slideNarrationPlayer.paused) {
                slideNarrationPlayer.pause();
                if (currentPlayingButton) {
                    currentPlayingButton.classList.remove('playing');
                    currentPlayingButton.textContent = currentPlayingButton.dataset.defaultText || '🔊 ฟังเสียงบรรยายสไลด์นี้';
                }
                currentPlayingButton = null;
            }
            const currentSlide = button.closest('.lesson-slide');
            const targetSlideId = button.dataset.target;
            if (currentSlide) currentSlide.style.display = 'none';
            if (targetSlideId) {
                const targetSlide = document.getElementById(targetSlideId);
                if (targetSlide) {
                    targetSlide.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else if (button.tagName === 'A') return;
        });
    });
    slideNarrationButtons.forEach(button => {
        button.dataset.defaultText = button.textContent;
        button.addEventListener('click', () => {
            const audioSrc = button.dataset.audioSrc;
            if (!audioSrc) return;
            if (currentPlayingButton === button && !slideNarrationPlayer.paused) {
                slideNarrationPlayer.pause();
            } else {
                if (!slideNarrationPlayer.paused && currentPlayingButton && currentPlayingButton !== button) {
                    slideNarrationPlayer.pause();
                    currentPlayingButton.classList.remove('playing');
                    currentPlayingButton.textContent = currentPlayingButton.dataset.defaultText;
                }
                slideNarrationPlayer.src = audioSrc;
                slideNarrationPlayer.play().then(() => {
                    button.classList.add('playing');
                    button.textContent = '❚❚ กำลังเล่น...';
                    currentPlayingButton = button;
                }).catch(error => console.error("Audio Playback Error:", error));
            }
        });
    });
    if (slideNarrationPlayer) {
        slideNarrationPlayer.onended = () => {
            if (currentPlayingButton) {
                currentPlayingButton.classList.remove('playing');
                currentPlayingButton.textContent = currentPlayingButton.dataset.defaultText;
            }
            currentPlayingButton = null;
        };
        slideNarrationPlayer.onpause = () => {
            if (currentPlayingButton) {
                 if(slideNarrationPlayer.duration > 0 && slideNarrationPlayer.currentTime > 0 && slideNarrationPlayer.currentTime < slideNarrationPlayer.duration) {
                    currentPlayingButton.textContent = '▶️ เล่นต่อ';
                } else {
                     currentPlayingButton.textContent = currentPlayingButton.dataset.defaultText;
                }
                currentPlayingButton.classList.remove('playing');
            }
        };
    }

    // --- Interactive Elements for Lesson 6 ---

    // Slide 1: Shopping Choice
    const shopItemCards = document.querySelectorAll('.shop-item-card');
    const shoppingBasketEl = document.getElementById('shoppingBasket');
    const totalPriceEl = document.getElementById('totalPrice');
    const shoppingFeedbackEl = document.querySelector('.shopping-feedback');
    const resetShoppingBtn = document.getElementById('resetShoppingBtn');
    let currentBasket = [];
    let currentTotal = 0;
    const budget = 20;

    function updateBasketDisplay() {
        shoppingBasketEl.textContent = currentBasket.map(item => item.name).join(', ') || "ยังไม่ได้เลือก";
        totalPriceEl.textContent = currentTotal;
        if (currentTotal > budget) {
            shoppingFeedbackEl.textContent = "อุ๊ย! เงินเกินงบแล้วนะ ลองเลือกใหม่ดู";
            shoppingFeedbackEl.style.color = "red";
        } else if (currentTotal > 0 && currentTotal <= budget) {
            shoppingFeedbackEl.textContent = "เลือกได้พอดีเลย! 👍";
            shoppingFeedbackEl.style.color = "green";
        } else {
            shoppingFeedbackEl.textContent = "";
        }
    }
    shopItemCards.forEach(card => {
        card.addEventListener('click', () => {
            const price = parseInt(card.dataset.price);
            const name = card.dataset.name;
            // Toggle selection
            if (card.classList.contains('selected')) {
                card.classList.remove('selected');
                currentTotal -= price;
                currentBasket = currentBasket.filter(item => item.name !== name);
            } else {
                if (currentTotal + price <= budget * 1.5) { // Allow some overspending to show feedback
                    card.classList.add('selected');
                    currentTotal += price;
                    currentBasket.push({name: name, price: price});
                } else {
                    shoppingFeedbackEl.textContent = "เงินไม่พอแล้วจ้า ลองเอาบางอย่างออกก่อนนะ";
                    shoppingFeedbackEl.style.color = "orange";
                     setTimeout(() => shoppingFeedbackEl.textContent = "", 2000);
                    return;
                }
            }
            updateBasketDisplay();
        });
    });
    if(resetShoppingBtn) {
        resetShoppingBtn.addEventListener('click', () => {
            currentBasket = [];
            currentTotal = 0;
            shopItemCards.forEach(card => card.classList.remove('selected'));
            updateBasketDisplay();
            shoppingFeedbackEl.textContent = "เลือกของใหม่ได้เลยจ้า";
        });
    }


    // Slide 2: Decision Making
    const decisionOptionButtons = document.querySelectorAll('.decision-option-btn');
    const decisionFeedbackEl = document.querySelector('.decision-feedback');
    decisionOptionButtons.forEach(button => {
        button.addEventListener('click', () => {
            decisionOptionButtons.forEach(btn => btn.disabled = true);
            const reason = button.dataset.reason;
            if (reason === "good") {
                decisionFeedbackEl.textContent = "เป็นการตัดสินใจที่ดีมาก! ใช้เหตุผลและรอบคอบ 👍";
                decisionFeedbackEl.style.color = "green";
            } else if (reason === "ok") {
                decisionFeedbackEl.textContent = "ก็พอใช้ได้นะ แต่ยังมีวิธีที่ดีกว่านี้อีก 😉";
                decisionFeedbackEl.style.color = "orange";
            } else {
                decisionFeedbackEl.textContent = "เอ๊ะ...วิธีนี้อาจจะไม่เหมาะสมเท่าไหร่นะ 🤔";
                decisionFeedbackEl.style.color = "red";
            }
        });
    });

    // Slide 3: Build Shield (Resilience)
    const shieldDraggables = document.querySelectorAll('.shield-item.draggable');
    const shieldDropzone = document.querySelector('.shield-dropzone');
    const shieldContentsEl = document.getElementById('shieldContents');
    const shieldFeedbackEl = document.querySelector('.shield-feedback');
    let shieldStrength = 0;

    shieldDraggables.forEach(item => {
        item.addEventListener('dragstart', e => {
            if(item.classList.contains('used')) {e.preventDefault(); return;}
            e.dataTransfer.setData('text/shieldtype', e.target.dataset.shield);
            e.dataTransfer.setData('text/id', e.target.textContent.trim());
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', e => e.target.style.opacity = '1');
    });
    if (shieldDropzone) {
        shieldDropzone.addEventListener('dragover', e => {
            e.preventDefault();
            shieldDropzone.style.backgroundColor = '#f0f0f0';
        });
        shieldDropzone.addEventListener('dragleave', e => {
            shieldDropzone.style.backgroundColor = '#fff';
        });
        shieldDropzone.addEventListener('drop', e => {
            e.preventDefault();
            shieldDropzone.style.backgroundColor = '#fff';
            const shieldType = e.dataTransfer.getData('text/shieldtype');
            const shieldText = e.dataTransfer.getData('text/id');
            const draggableElement = Array.from(shieldDraggables).find(d => d.textContent.trim() === shieldText && !d.classList.contains('used'));


            if (draggableElement) {
                draggableElement.classList.add('used');
                draggableElement.style.display = 'none'; // Hide from pool

                const listItem = document.createElement('li');
                listItem.textContent = shieldText;
                if (shieldType === "good") {
                    shieldStrength++;
                    listItem.style.color = "green";
                    shieldFeedbackEl.textContent = "เยี่ยม! เพิ่มพลังให้เกราะป้องกัน! 💪";
                    shieldFeedbackEl.style.color = "green";
                } else {
                    shieldStrength--; // Or no change, or specific penalty
                    listItem.style.color = "red";
                    listItem.textContent += " (ลดพลัง)";
                    shieldFeedbackEl.textContent = "โอ๊ะโอ! อันนี้ทำให้เกราะอ่อนแอลงนะ 💔";
                    shieldFeedbackEl.style.color = "red";
                }
                shieldContentsEl.appendChild(listItem);

                if (Array.from(shieldDraggables).every(d => d.classList.contains('used'))) {
                     setTimeout(() => {
                        if (shieldStrength >= 2) { // Example threshold
                            shieldFeedbackEl.textContent = "เกราะป้องกันแข็งแกร่งมาก! สหกรณ์พร้อมรับมือทุกสถานการณ์! 🎉";
                        } else {
                            shieldFeedbackEl.textContent = "เกราะป้องกันยังไม่แข็งแรงพอ ต้องเพิ่มสิ่งดีๆ มากกว่านี้นะ";
                        }
                    }, 1000);
                }
            }
             setTimeout(() => {if (!Array.from(shieldDraggables).every(d => d.classList.contains('used'))) shieldFeedbackEl.textContent = ""}, 2000);
        });
    }

    // Slide 4: Match Action with SEP
    const actionSepButtons = document.querySelectorAll('.action-sep-btn');
    const actionSepFeedbackEl = document.querySelector('.action-sep-feedback');
    actionSepButtons.forEach(button => {
        button.addEventListener('click', () => {
            if(button.classList.contains('selected-correct') || button.classList.contains('selected-incorrect')) return;
            const isSEP = button.dataset.sep === 'true';
            if (isSEP) {
                button.classList.add('selected-correct');
                actionSepFeedbackEl.textContent = "ถูกต้อง! การกระทำนี้สอดคล้องกับเศรษฐกิจพอเพียงค่ะ 👍";
                actionSepFeedbackEl.style.color = "green";
            } else {
                button.classList.add('selected-incorrect');
                actionSepFeedbackEl.textContent = "ยังไม่ค่อยสอดคล้องเท่าไหร่นะ ลองคิดดูอีกที 🤔";
                actionSepFeedbackEl.style.color = "red";
            }
            // To allow selecting multiple or just one and disable others:
            // actionSepButtons.forEach(btn => btn.disabled = true);
             setTimeout(() => actionSepFeedbackEl.textContent = "", 2500);
        });
    });


    // --- Quiz (Same as previous lessons, ensure explanations are specific to L6) ---
    const quizQuestionCards_L6 = document.querySelectorAll('#slide5 .fun-quiz-container .quiz-question-card');
    const checkQuizAnswersBtn_L6 = document.querySelector('#slide5 #checkQuizAnswersBtn');
    const finalQuizResultEl_L6 = document.querySelector('#slide5 #finalQuizResult');

    const quizExplanations_L6 = {
        "q1": "การซื้อของแต่พอดี ไม่ฟุ่มเฟือย คือ 'ความพอประมาณ' ค่ะ",
        "q2": "การตัดสินใจโดยพิจารณาความต้องการของสมาชิกอย่างรอบคอบ คือ 'ความมีเหตุผล' ค่ะ",
        "q3": "การมีเงินทุนสำรองไว้ใช้ยามฉุกเฉิน เป็นการสร้าง 'การมีภูมิคุ้มกันที่ดี' ให้กับสหกรณ์ค่ะ",
        "q4": "การมีเงินเยอะที่สุดไม่ใช่ส่วนประกอบโดยตรงของภูมิคุ้มกัน แต่ความรู้และคุณธรรมต่างหากที่สำคัญค่ะ",
        "q5": "ใช่แล้วค่ะ! การเป็นสมาชิกที่ดี ปฏิบัติตามคุณธรรมต่างๆ ก็คือการใช้ชีวิตตามหลักเศรษฐกิจพอเพียงนั่นเอง"
    };

    quizQuestionCards_L6.forEach(card => {
        const questionId = card.dataset.questionId;
        const answerBtns = card.querySelectorAll('.answer-btn');
        const explanationEl = card.querySelector('.explanation-text');
        if(explanationEl) explanationEl.textContent = '';

        answerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (card.classList.contains('answered')) return;
                answerBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    });

    if (checkQuizAnswersBtn_L6) {
        checkQuizAnswersBtn_L6.addEventListener('click', () => {
            let correctCount = 0;
            let answeredCount = 0;
            quizQuestionCards_L6.forEach(card => {
                const questionId = card.dataset.questionId;
                const feedbackIconEl = card.querySelector('.feedback-icon');
                const selectedBtn = card.querySelector('.answer-btn.selected');
                const explanationEl = card.querySelector('.explanation-text');
                
                feedbackIconEl.textContent = '';
                if(explanationEl) explanationEl.textContent = '';
                explanationEl.style.color = '#555';

                if (selectedBtn) {
                    answeredCount++;
                    card.classList.add('answered');
                    const isCorrect = selectedBtn.dataset.correct === 'true';
                    if (isCorrect) {
                        correctCount++;
                        selectedBtn.classList.add('correct');
                        feedbackIconEl.textContent = '✔️';
                        feedbackIconEl.style.color = 'green';
                        if(explanationEl) {
                            explanationEl.textContent = "เก่งมาก ถูกต้องค่ะ! 👍 " + (quizExplanations_L6[questionId] || "");
                            explanationEl.style.color = 'green';
                        }
                    } else {
                        selectedBtn.classList.add('incorrect');
                        feedbackIconEl.textContent = '❌';
                        feedbackIconEl.style.color = 'red';
                        const correctButton = card.querySelector('.answer-btn[data-correct="true"]');
                        if(explanationEl) {
                            if(correctButton) {
                                correctButton.classList.add('correct');
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ คำตอบที่ถูกคือ: " + correctButton.textContent.trim().substring(3) + " ค่ะ 🤔 " + (quizExplanations_L6[questionId] || "");
                            } else {
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ 🤔 " + (quizExplanations_L6[questionId] || "");
                            }
                            explanationEl.style.color = 'red';
                        }
                    }
                }
            });
            if (answeredCount < quizQuestionCards_L6.length) {
                finalQuizResultEl_L6.textContent = "เอ...ยังตอบไม่ครบทุกข้อเลยนะ ลองดูอีกทีจ้า";
                finalQuizResultEl_L6.className = 'final-quiz-result-display none-correct';
                return;
            }
            finalQuizResultEl_L6.textContent = `ได้ ${correctCount} เต็ม ${quizQuestionCards_L6.length} คะแนน! `;
            if (correctCount === quizQuestionCards_L6.length) {
                finalQuizResultEl_L6.textContent += "เก่งมากๆ เลยค่ะ! เข้าใจเรื่องเศรษฐกิจพอเพียงกับสหกรณ์ได้เป็นอย่างดี! 🥳";
                finalQuizResultEl_L6.className = 'final-quiz-result-display all-correct';
            } else if (correctCount >= Math.ceil(quizQuestionCards_L6.length / 2)) {
                finalQuizResultEl_L6.textContent += "เยี่ยมมาก! พยายามอีกนิดนะ! 😊";
                finalQuizResultEl_L6.className = 'final-quiz-result-display some-correct';
            } else {
                finalQuizResultEl_L6.textContent += "ไม่เป็นไรนะ ลองทบทวนดูอีกครั้ง! 💪";
                finalQuizResultEl_L6.className = 'final-quiz-result-display none-correct';
            }
            checkQuizAnswersBtn_L6.disabled = true;
            checkQuizAnswersBtn_L6.style.opacity = 0.7;
            checkQuizAnswersBtn_L6.textContent = "ตรวจคำตอบแล้ว";
        });
    }
});