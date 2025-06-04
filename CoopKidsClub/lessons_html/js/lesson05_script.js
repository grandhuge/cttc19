document.addEventListener('DOMContentLoaded', () => {
    // --- Slide Navigation & Narration Control (เหมือน lesson01/02/03/04_script.js) ---
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

    // --- Interactive Elements for Lesson 5 ---

    // Slide 1: Honesty Scenario
    const scenarioButtons = document.querySelectorAll('.scenario-option-btn');
    const scenarioFeedbackEl = document.querySelector('.scenario-feedback');
    scenarioButtons.forEach(button => {
        button.addEventListener('click', () => {
            scenarioButtons.forEach(btn => btn.disabled = true); // Disable all options
            if (button.classList.contains('correct-action')) {
                scenarioFeedbackEl.textContent = "ยอดเยี่ยม! ความซื่อสัตย์เป็นสิ่งสำคัญที่สุดเลยค่ะ 👍";
                scenarioFeedbackEl.style.color = "green";
            } else {
                scenarioFeedbackEl.textContent = "เอ๊ะ...ลองคิดดูอีกทีนะ การคืนของ/เงินที่ได้มาเกินเป็นสิ่งที่ดีนะ 🤔";
                scenarioFeedbackEl.style.color = "red";
            }
        });
    });

    // Slide 2: Responsibility Role Play
    const roleTaskButtons = document.querySelectorAll('.role-task-btn');
    const rolePlayFeedbackEl = document.querySelector('.role-play-feedback');
    let correctTasksSelected = 0;
    const totalCorrectTasks = Array.from(roleTaskButtons).filter(btn => btn.dataset.correct === 'true').length;
    roleTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('selected-correct') || button.classList.contains('selected-incorrect')) return;

            const isCorrect = button.dataset.correct === 'true';
            if (isCorrect) {
                button.classList.add('selected-correct');
                correctTasksSelected++;
                rolePlayFeedbackEl.textContent = "ถูกต้อง! นี่คือความรับผิดชอบของกรรมการสหกรณ์ค่ะ 👍";
                rolePlayFeedbackEl.style.color = "green";
            } else {
                button.classList.add('selected-incorrect');
                rolePlayFeedbackEl.textContent = "ไม่ใช่เลย... การกระทำแบบนี้ไม่แสดงความรับผิดชอบนะ 🤔";
                rolePlayFeedbackEl.style.color = "red";
            }
             if (correctTasksSelected === totalCorrectTasks) {
                 setTimeout(() => {
                    rolePlayFeedbackEl.textContent = "เก่งมาก! เลือกหน้าที่ที่แสดงความรับผิดชอบได้ถูกต้องหมดเลย! 🎉";
                }, 1000);
            }
            setTimeout(() => { if (!(correctTasksSelected === totalCorrectTasks)) rolePlayFeedbackEl.textContent = ""; }, 2500);
        });
    });

    // Slide 3: Saving Tips
    const savingTipCards = document.querySelectorAll('.saving-tip-card');
    const savingTipsFeedbackEl = document.querySelector('.saving-tips-feedback');
    let correctTipsClicked = 0;
    const totalCorrectTips = Array.from(savingTipCards).filter(card => card.dataset.correct === 'true').length;

    savingTipCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('selected-correct') || card.classList.contains('selected-incorrect')) return;

            const isCorrect = card.dataset.correct === 'true';
            if (isCorrect) {
                card.classList.add('selected-correct');
                correctTipsClicked++;
                savingTipsFeedbackEl.textContent = "ใช่เลย! นี่เป็นวิธีประหยัดที่ดีมาก 👍";
                savingTipsFeedbackEl.style.color = "green";
            } else {
                card.classList.add('selected-incorrect');
                savingTipsFeedbackEl.textContent = "วิธีนี้ยังไม่ช่วยประหยัดเท่าไหร่นะ 🤔";
                savingTipsFeedbackEl.style.color = "red";
            }

            if (correctTipsClicked === totalCorrectTips) {
                 setTimeout(() => {
                    savingTipsFeedbackEl.textContent = "ยอดเยี่ยม! น้องรู้จักวิธีประหยัดหลายอย่างเลย! 🎉";
                 }, 1000);
            }
             setTimeout(() => { if (!(correctTipsClicked === totalCorrectTips)) savingTipsFeedbackEl.textContent = ""; }, 2500);
        });
    });

    // Slide 4: Puzzle Teamwork (Simplified Logic)
    const puzzlePiecesL5 = document.querySelectorAll('.puzzle-piece-l5');
    const puzzleSlotsL5 = document.querySelectorAll('.puzzle-slot-l5');
    const puzzleFeedbackL5 = document.querySelector('.puzzle-feedback-l5');
    let filledSlotsL5 = 0;

    puzzlePiecesL5.forEach(piece => {
        piece.addEventListener('dragstart', e => {
            if (piece.classList.contains('used')) { e.preventDefault(); return; }
            e.dataTransfer.setData('text/piece', e.target.dataset.piece);
            e.target.style.opacity = '0.5';
        });
        piece.addEventListener('dragend', e => {
            e.target.style.opacity = '1';
        });
        // Basic click to rotate (optional, can be complex to implement well)
        // piece.addEventListener('click', () => {
        //     let currentRotation = parseInt(piece.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
        //     piece.style.transform = `rotate(${currentRotation + 90}deg)`;
        // });
    });

    puzzleSlotsL5.forEach(slot => {
        slot.addEventListener('dragover', e => {
            e.preventDefault();
            if (!slot.classList.contains('filled')) slot.style.backgroundColor = '#E9E9E9';
        });
        slot.addEventListener('dragleave', e => {
            if (!slot.classList.contains('filled')) slot.style.backgroundColor = 'transparent';
        });
        slot.addEventListener('drop', e => {
            e.preventDefault();
            if (slot.classList.contains('filled')) return;
            slot.style.backgroundColor = 'transparent';
            const pieceNumber = e.dataTransfer.getData('text/piece');
            const pieceElement = document.querySelector(`.puzzle-piece-l5[data-piece="${pieceNumber}"]:not(.used)`);

            if (pieceElement && slot.dataset.accept === pieceNumber) {
                slot.style.backgroundImage = pieceElement.style.backgroundImage;
                slot.classList.add('filled');
                pieceElement.classList.add('used');
                pieceElement.style.visibility = 'hidden'; // Hide original piece
                filledSlotsL5++;
                puzzleFeedbackL5.textContent = "เยี่ยม! ต่อถูกชิ้นแล้ว 👍";
                puzzleFeedbackL5.style.color = "green";

                if (filledSlotsL5 === puzzleSlotsL5.length) {
                    puzzleFeedbackL5.textContent = "สุดยอด! ต่อภาพทีมเวิร์คสำเร็จแล้ว! 🎉 ทุกคนร่วมมือกันงานก็สำเร็จ!";
                }
            } else if (pieceElement) {
                puzzleFeedbackL5.textContent = "เอ๊ะ...ชิ้นนี้ยังไม่ใช่ช่องนี้นะ 🤔";
                puzzleFeedbackL5.style.color = "red";
            }
            setTimeout(() => { if (filledSlotsL5 < puzzleSlotsL5.length) puzzleFeedbackL5.textContent = ""; }, 2000);
        });
    });


    // Slide 5: Sharing Choice
    const sharingOptionButtons = document.querySelectorAll('.sharing-option-btn');
    const sharingFeedbackEl = document.querySelector('.sharing-feedback');
    let correctSharingChoices = 0;
    const totalCorrectSharing = Array.from(sharingOptionButtons).filter(b => b.dataset.correct === 'true').length;

    sharingOptionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Allow multiple correct selections, or treat as single choice then check.
            // For this example, let's make it so they can select multiple "good" options.
            if (button.classList.contains('selected')) return; // Don't re-evaluate if already clicked

            const isCorrect = button.dataset.correct === 'true';
            button.classList.add('selected');

            if (isCorrect) {
                button.style.backgroundColor = "#0097A7"; // Darker cyan for correct selection
                correctSharingChoices++;
                sharingFeedbackEl.textContent = "เป็นความคิดที่ดีมากเลย! 👍";
                sharingFeedbackEl.style.color = "green";
            } else {
                button.style.backgroundColor = "#FF8A65"; // Orange for incorrect
                button.style.opacity = 0.7;
                sharingFeedbackEl.textContent = "ลองคิดดูอีกทีนะ กิจกรรมนี้อาจจะไม่ใช่การแบ่งปันเพื่อส่วนรวมเท่าไหร่ 🤔";
                sharingFeedbackEl.style.color = "red";
            }

            if (correctSharingChoices > 0 && correctSharingChoices === totalCorrectSharing) { // Or a certain number of good choices
                 setTimeout(() => {
                    sharingFeedbackEl.textContent = "น้องๆ มีหัวใจแห่งการแบ่งปันจริงๆ! เยี่ยมมาก! 🎉";
                 }, 1000);
            }
             setTimeout(() => {
                if (!(correctSharingChoices > 0 && correctSharingChoices === totalCorrectSharing)) {
                    sharingFeedbackEl.textContent = "";
                }
            }, 3000);
        });
    });


    // --- Quiz (Same as previous lessons, ensure explanations are specific to L5) ---
    const quizQuestionCards_L5 = document.querySelectorAll('#slide6 .fun-quiz-container .quiz-question-card');
    const checkQuizAnswersBtn_L5 = document.querySelector('#slide6 #checkQuizAnswersBtn');
    const finalQuizResultEl_L5 = document.querySelector('#slide6 #finalQuizResult');

    const quizExplanations_L5 = {
        "q1": "การทอนเงินให้ลูกค้าถูกต้อง ไม่เอาเปรียบใคร คือ ความซื่อสัตย์ ค่ะ",
        "q2": "การตั้งใจทำหน้าที่ที่ได้รับมอบหมายให้ดีที่สุด เช่น ดูแลความสะอาดร้านค้า คือ ความรับผิดชอบ ค่ะ",
        "q3": "การรู้จักเก็บเงินค่าขนมไปฝากสหกรณ์ เป็นการฝึก การประหยัดและอดออม ที่ดีมากค่ะ",
        "q4": "การรับฟังความคิดเห็นของทุกคนและหาข้อสรุปร่วมกัน เป็นหัวใจของ ความสามัคคีและการทำงานเป็นทีม ค่ะ",
        "q5": "การบริจาคสิ่งของให้ผู้ที่ขาดแคลน เป็นการแสดงออกถึง การช่วยเหลือแบ่งปัน และความเอื้ออาทรต่อผู้อื่นค่ะ"
    };

    quizQuestionCards_L5.forEach(card => {
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

    if (checkQuizAnswersBtn_L5) {
        checkQuizAnswersBtn_L5.addEventListener('click', () => {
            let correctCount = 0;
            let answeredCount = 0;
            quizQuestionCards_L5.forEach(card => {
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
                            explanationEl.textContent = "เก่งมาก ถูกต้องค่ะ! 👍 " + (quizExplanations_L5[questionId] || "");
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
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ คำตอบที่ถูกคือ: " + correctButton.textContent.trim().substring(3) + " ค่ะ 🤔 " + (quizExplanations_L5[questionId] || "");
                            } else {
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ 🤔 " + (quizExplanations_L5[questionId] || "");
                            }
                            explanationEl.style.color = 'red';
                        }
                    }
                }
            });
            if (answeredCount < quizQuestionCards_L5.length) {
                finalQuizResultEl_L5.textContent = "เอ...ยังตอบไม่ครบทุกข้อเลยนะ ลองดูอีกทีจ้า";
                finalQuizResultEl_L5.className = 'final-quiz-result-display none-correct';
                return;
            }
            finalQuizResultEl_L5.textContent = `ได้ ${correctCount} เต็ม ${quizQuestionCards_L5.length} คะแนน! `;
            if (correctCount === quizQuestionCards_L5.length) {
                finalQuizResultEl_L5.textContent += "เก่งมากๆ เลยค่ะ! 🥳";
                finalQuizResultEl_L5.className = 'final-quiz-result-display all-correct';
            } else if (correctCount >= Math.ceil(quizQuestionCards_L5.length / 2)) {
                finalQuizResultEl_L5.textContent += "เยี่ยมมาก! พยายามอีกนิดนะ! 😊";
                finalQuizResultEl_L5.className = 'final-quiz-result-display some-correct';
            } else {
                finalQuizResultEl_L5.textContent += "ไม่เป็นไรนะ ลองทบทวนดูอีกครั้ง! 💪";
                finalQuizResultEl_L5.className = 'final-quiz-result-display none-correct';
            }
            checkQuizAnswersBtn_L5.disabled = true;
            checkQuizAnswersBtn_L5.style.opacity = 0.7;
            checkQuizAnswersBtn_L5.textContent = "ตรวจคำตอบแล้ว";
        });
    }
});