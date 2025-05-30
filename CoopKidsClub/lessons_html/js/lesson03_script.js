document.addEventListener('DOMContentLoaded', () => {
    // --- Slide Navigation & Narration Control (เหมือน lesson01/lesson02_script.js) ---
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

    // --- Interactive Elements for Lesson 3 ---

    // Slide 1: Store Items
    const itemChoiceButtons = document.querySelectorAll('.item-choice-btn');
    const storeItemsFeedbackEl = document.querySelector('.store-items-feedback');
    let correctStoreItemsSelected = 0;
    const totalCorrectStoreItems = Array.from(itemChoiceButtons).filter(btn => btn.dataset.correct === 'true').length;

    itemChoiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('selected-correct') || button.classList.contains('selected-incorrect')) return; // Already judged

            const isCorrect = button.dataset.correct === 'true';
            if (isCorrect) {
                button.classList.add('selected-correct');
                correctStoreItemsSelected++;
                storeItemsFeedbackEl.textContent = "ถูกต้อง! 👍 ของชิ้นนี้มีขายในสหกรณ์ร้านค้าได้";
                storeItemsFeedbackEl.style.color = "green";
            } else {
                button.classList.add('selected-incorrect');
                storeItemsFeedbackEl.textContent = "เอ...🤔 ของชิ้นนี้ไม่น่าจะมีขายในสหกรณ์โรงเรียนนะ";
                storeItemsFeedbackEl.style.color = "red";
            }
            // Check if all correct items selected
            if (correctStoreItemsSelected === totalCorrectStoreItems) {
                 setTimeout(() => {
                    storeItemsFeedbackEl.textContent = "เก่งมาก! เลือกของที่จะขายในสหกรณ์ได้ถูกต้องหมดเลย! 🎉";
                    storeItemsFeedbackEl.style.color = "green";
                }, 1000);
            }
            setTimeout(() => { if (! (correctStoreItemsSelected === totalCorrectStoreItems)) storeItemsFeedbackEl.textContent = ""; }, 2000);
        });
    });

    // Slide 2: Savings Drag
    const draggableCoins = document.querySelectorAll('.draggable-coin');
    const piggyBankDropzone = document.querySelector('.piggy-bank-dropzone');
    const savingsAmountEl = document.getElementById('savingsAmount');
    const savingsFeedbackEl = document.querySelector('.savings-feedback');
    let savingsCount = 0;
    const maxSavingsDrags = 3;

    draggableCoins.forEach(coin => {
        coin.addEventListener('dragstart', (e) => {
            if (savingsCount >= maxSavingsDrags || coin.classList.contains('used')) {
                e.preventDefault(); // Prevent dragging if limit reached or coin used
                return;
            }
            e.dataTransfer.setData('text/plain', 'coin');
            e.target.style.opacity = '0.5';
        });
        coin.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    });

    if (piggyBankDropzone) {
        piggyBankDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (savingsCount < maxSavingsDrags) {
                piggyBankDropzone.style.backgroundColor = '#fffde7'; // Highlight
            }
        });
        piggyBankDropzone.addEventListener('dragleave', (e) => {
            piggyBankDropzone.style.backgroundColor = '#fff';
        });
        piggyBankDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            piggyBankDropzone.style.backgroundColor = '#fff';
            const draggedItemType = e.dataTransfer.getData('text/plain');
            // Find the actual dragged element (not perfectly robust, assumes one drag at time)
            const draggedCoin = Array.from(draggableCoins).find(c => c.style.opacity === '0.5' && !c.classList.contains('used'));

            if (draggedItemType === 'coin' && savingsCount < maxSavingsDrags && draggedCoin) {
                savingsCount++;
                savingsAmountEl.textContent = savingsCount;
                draggedCoin.style.display = 'none'; // Or visually move it to piggy bank
                draggedCoin.classList.add('used');
                savingsFeedbackEl.textContent = `ออมแล้ว ${savingsCount} เหรียญ! เยี่ยมไปเลย!`;
                savingsFeedbackEl.style.color = "green";
                if (savingsCount === maxSavingsDrags) {
                    savingsFeedbackEl.textContent = `ออมครบ ${maxSavingsDrags} เหรียญแล้ว! เป็นนักออมตัวยงเลยนะ! 💰`;
                }
            } else if (savingsCount >= maxSavingsDrags) {
                 savingsFeedbackEl.textContent = `กระปุกเต็มแล้วจ้า! (ออมได้ ${maxSavingsDrags} เหรียญแล้ว)`;
                 savingsFeedbackEl.style.color = "orange";
            }
            setTimeout(() => { if(savingsCount < maxSavingsDrags) savingsFeedbackEl.textContent = "";}, 2000);
        });
    }

    // Slide 3: Agricultural Match
    const agriDraggableSolutions = document.querySelectorAll('.agri-card.solution.draggable');
    const agriProblemDropzones = document.querySelectorAll('.agri-card.problem'); // These are the drop targets
    const agriMatchFeedbackEl = document.querySelector('.agri-match-feedback');
    let agriSolvedPairs = 0;
    const totalAgriPairs = agriProblemDropzones.length;

    agriDraggableSolutions.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            if (item.classList.contains('used')) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData('text/id', e.target.id); // Use ID if solutions have unique IDs
            e.dataTransfer.setData('text/matches', e.target.dataset.matches);
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    });

    agriProblemDropzones.forEach(target => {
        target.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!target.classList.contains('solved')) {
                target.style.backgroundColor = '#E8F5E9'; // Highlight
            }
        });
        target.addEventListener('dragleave', (e) => {
             if (!target.classList.contains('solved')) {
                target.style.backgroundColor = '#FFCDD2'; // Original problem color
            }
        });
        target.addEventListener('drop', (e) => {
            e.preventDefault();
             if (target.classList.contains('solved')) return;
            target.style.backgroundColor = '#FFCDD2'; // Original problem color

            const solutionMatchesTargetId = e.dataTransfer.getData('text/matches');
            // Find the dragged element to mark it used
            const solutionElement = agriDraggableSolutions[Array.from(agriDraggableSolutions).findIndex(s => s.dataset.matches === solutionMatchesTargetId && !s.classList.contains('used'))];


            if (solutionElement && solutionMatchesTargetId === target.id) {
                target.innerHTML = `✔️ ${target.textContent} <br><small style="color:green;">แก้ไขโดย: ${solutionElement.textContent}</small>`;
                target.classList.add('solved');
                solutionElement.classList.add('used');
                solutionElement.draggable = false; // Prevent re-dragging
                
                agriMatchFeedbackEl.textContent = "ถูกต้อง! เก่งมากจ้ะ 👍";
                agriMatchFeedbackEl.style.color = "green";
                agriSolvedPairs++;
                if (agriSolvedPairs === totalAgriPairs) {
                    agriMatchFeedbackEl.textContent = "สุดยอด! จับคู่ปัญหาและวิธีแก้ได้ครบถ้วน!";
                }
            } else if (solutionElement) {
                agriMatchFeedbackEl.textContent = "ยังไม่ถูกคู่กันนะ ลองใหม่สิ 🤔";
                agriMatchFeedbackEl.style.color = "red";
            }
             setTimeout(() => { if (agriSolvedPairs < totalAgriPairs) agriMatchFeedbackEl.textContent = ""; }, 2000);
        });
    });


    // --- Quiz (Same as lesson01/lesson02_script.js, ensure explanations are updated) ---
    const quizQuestionCards_L3 = document.querySelectorAll('#slide5 .fun-quiz-container .quiz-question-card');
    const checkQuizAnswersBtn_L3 = document.querySelector('#slide5 #checkQuizAnswersBtn');
    const finalQuizResultEl_L3 = document.querySelector('#slide5 #finalQuizResult');

    const quizExplanations_L3 = {
        "q1": "สหกรณ์ร้านค้ามีหน้าที่หลักในการจัดหาสินค้าอุปโภคบริโภคมาขายให้สมาชิก เช่น สมุด ดินสอ ในโรงเรียนค่ะ",
        "q2": "การนำเงินไปฝากเพื่อสะสมและรับดอกเบี้ย เป็นบริการของสหกรณ์ออมทรัพย์ค่ะ ช่วยส่งเสริมการออม",
        "q3": "การรวมกลุ่มของเกษตรกรเพื่อช่วยเรื่องการผลิต การจัดหาปัจจัยการผลิต และการขายผลผลิต คือลักษณะของสหกรณ์การเกษตรค่ะ",
        "q4": "สหกรณ์ออมทรัพย์มีวัตถุประสงค์เพื่อส่งเสริมการออมและให้เงินกู้แก่สมาชิกเมื่อมีความจำเป็นในอัตราดอกเบี้ยที่เป็นธรรมค่ะ",
        "q5": "สหกรณ์ร้านค้าจะเน้นการจัดหาสินค้าที่สมาชิกต้องการมาจำหน่ายในราคายุติธรรมค่ะ"
    };

    quizQuestionCards_L3.forEach(card => {
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

    if (checkQuizAnswersBtn_L3) {
        checkQuizAnswersBtn_L3.addEventListener('click', () => {
            let correctCount = 0;
            let answeredCount = 0;
            quizQuestionCards_L3.forEach(card => {
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
                            explanationEl.textContent = "เก่งมาก ถูกต้องค่ะ! 👍 " + (quizExplanations_L3[questionId] || "");
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
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ คำตอบที่ถูกคือ: " + correctButton.textContent.trim().substring(3) + " ค่ะ 🤔 " + (quizExplanations_L3[questionId] || "");
                            } else {
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ 🤔 " + (quizExplanations_L3[questionId] || "");
                            }
                            explanationEl.style.color = 'red';
                        }
                    }
                }
            });
            if (answeredCount < quizQuestionCards_L3.length) {
                finalQuizResultEl_L3.textContent = "เอ...ยังตอบไม่ครบทุกข้อเลยนะ ลองดูอีกทีจ้า";
                finalQuizResultEl_L3.className = 'final-quiz-result-display none-correct';
                return;
            }
            finalQuizResultEl_L3.textContent = `ได้ ${correctCount} เต็ม ${quizQuestionCards_L3.length} คะแนน! `;
            if (correctCount === quizQuestionCards_L3.length) {
                finalQuizResultEl_L3.textContent += "เก่งมากๆ เลยค่ะ! 🥳";
                finalQuizResultEl_L3.className = 'final-quiz-result-display all-correct';
            } else if (correctCount >= Math.ceil(quizQuestionCards_L3.length / 2)) {
                finalQuizResultEl_L3.textContent += "เยี่ยมมาก! พยายามอีกนิดนะ! 😊";
                finalQuizResultEl_L3.className = 'final-quiz-result-display some-correct';
            } else {
                finalQuizResultEl_L3.textContent += "ไม่เป็นไรนะ ลองทบทวนดูอีกครั้ง! 💪";
                finalQuizResultEl_L3.className = 'final-quiz-result-display none-correct';
            }
            checkQuizAnswersBtn_L3.disabled = true;
            checkQuizAnswersBtn_L3.style.opacity = 0.7;
            checkQuizAnswersBtn_L3.textContent = "ตรวจคำตอบแล้ว";
        });
    }
});