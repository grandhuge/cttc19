document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.lesson-slide');
    const navButtons = document.querySelectorAll('.lesson-nav-btn');
    const slideNarrationPlayer = document.getElementById('slideNarrationPlayer');
    const slideNarrationButtons = document.querySelectorAll('.slide-narration-btn');

    let currentPlayingButton = null; // Keep track of which button's audio is playing

    // --- Slide Navigation (remains the same) ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Stop any narration if slide changes
            if (slideNarrationPlayer && !slideNarrationPlayer.paused) {
                slideNarrationPlayer.pause();
                slideNarrationPlayer.currentTime = 0;
                if (currentPlayingButton) {
                    currentPlayingButton.classList.remove('playing');
                    currentPlayingButton.textContent = '🔊 ฟังเสียงบรรยายสไลด์นี้'; // Reset button text
                }
                currentPlayingButton = null;
            }

            const currentSlide = button.closest('.lesson-slide');
            const targetSlideId = button.dataset.target;

            if (currentSlide) {
                currentSlide.style.display = 'none';
            }
            if (targetSlideId) {
                const targetSlide = document.getElementById(targetSlideId);
                if (targetSlide) {
                    targetSlide.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else if (button.tagName === 'A') {
                return; // Let link navigation work
            }
        });
    });

    // --- MP3 Narration Playback ---
    slideNarrationButtons.forEach(button => {
        button.addEventListener('click', () => {
            const audioSrc = button.dataset.audioSrc;
            if (!audioSrc) return;

            if (currentPlayingButton === button && !slideNarrationPlayer.paused) {
                // If same button is clicked and audio is playing, pause it
                slideNarrationPlayer.pause();
                button.classList.remove('playing');
                button.textContent = '🔊 ฟังเสียงบรรยายสไลด์นี้';
                // currentPlayingButton = null; // Keep it as current to allow resume, or nullify to force restart
            } else if (slideNarrationPlayer.src !== audioSrc || slideNarrationPlayer.paused) {
                // If new audio or current is paused (could be same audio but paused)
                // Stop any currently playing audio from other buttons
                if (!slideNarrationPlayer.paused && currentPlayingButton && currentPlayingButton !== button) {
                    slideNarrationPlayer.pause();
                    currentPlayingButton.classList.remove('playing');
                    currentPlayingButton.textContent = '🔊 ฟังเสียงบรรยายสไลด์นี้';
                }
                
                slideNarrationPlayer.src = audioSrc;
                slideNarrationPlayer.play()
                    .then(() => {
                        button.classList.add('playing');
                        button.textContent = '❚❚ กำลังเล่น...'; // Pause symbol
                        currentPlayingButton = button;
                    })
                    .catch(error => {
                        console.error("Error playing audio:", error);
                        button.textContent = '⚠️ เกิดข้อผิดพลาด';
                    });
            }
        });
    });

    // When audio finishes, reset the button
    if (slideNarrationPlayer) {
        slideNarrationPlayer.onended = () => {
            if (currentPlayingButton) {
                currentPlayingButton.classList.remove('playing');
                currentPlayingButton.textContent = '🔊 ฟังเสียงบรรยายสไลด์นี้';
            }
            currentPlayingButton = null;
        };
        // Also reset if paused manually and another button is not clicked
        slideNarrationPlayer.onpause = () => {
            if (currentPlayingButton && slideNarrationPlayer.currentTime !== 0 && slideNarrationPlayer.currentTime !== slideNarrationPlayer.duration ) { // true pause, not end
                // currentPlayingButton.classList.remove('playing'); // Keep it looking like it could resume
                // currentPlayingButton.textContent = '▶️ เล่นต่อ';
            } else if (currentPlayingButton && (slideNarrationPlayer.currentTime === 0 || slideNarrationPlayer.currentTime === slideNarrationPlayer.duration)) {
                // This means it was stopped or ended.
                 currentPlayingButton.classList.remove('playing');
                 currentPlayingButton.textContent = '🔊 ฟังเสียงบรรยายสไลด์นี้';
                 currentPlayingButton = null;
            }
        };
    }


    // --- Interactive Poll on Slide 2 (remains the same) ---
    const pollButtons = document.querySelectorAll('.poll-btn');
    const pollCounts = {
        pencil: document.getElementById('poll-pencil-count'),
        ball: document.getElementById('poll-ball-count'),
        broom: document.getElementById('poll-broom-count')
    };
    pollButtons.forEach(button => {
        button.addEventListener('click', () => {
            const problemId = button.dataset.problemId;
            if (pollCounts[problemId] && !button.disabled) { // Check if not disabled
                let currentCount = parseInt(pollCounts[problemId].textContent);
                pollCounts[problemId].textContent = currentCount + 1;
                button.disabled = true;
                button.style.backgroundColor = "#ccc";
                button.style.cursor = "default";
            }
        });
    });

    // --- Drag and Drop Activity on Slide 3 (updated dropzone target) ---
    const draggableSolutions = document.querySelectorAll('#slide3 .solution-item.draggable');
    const problemDropzones = document.querySelectorAll('#slide3 .problem-item[data-dropzone="true"]'); // Target only dropzones
    const dragDropFeedbackEl = document.getElementById('dragDropFeedback');
    let solvedPairs = 0;
    const totalPairsToSolve = problemDropzones.length;


    draggableSolutions.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/id', e.target.id);
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    });

    problemDropzones.forEach(target => {
        target.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!target.classList.contains('solved')) {
                target.style.backgroundColor = '#D1C4E9'; // Highlight effect
            }
        });
        target.addEventListener('dragleave', (e) => {
            if (!target.classList.contains('solved')) {
                target.style.backgroundColor = '#ffebee'; // Original problem dropzone color
            }
        });
        target.addEventListener('drop', (e) => {
            e.preventDefault();
            if (target.classList.contains('solved')) return; // Already solved

            target.style.backgroundColor = '#ffebee'; // Original problem dropzone color
            const solutionId = e.dataTransfer.getData('text/id');
            const solutionElement = document.getElementById(solutionId);

            if (solutionElement && solutionElement.dataset.matches === target.id) {
                // target.appendChild(solutionElement); // Don't move, just mark as solved
                solutionElement.draggable = false;
                solutionElement.style.cursor = 'default';
                solutionElement.style.backgroundColor = '#A5D6A7'; 
                solutionElement.style.opacity = '0.6'; // Make it look used
                
                target.classList.add('solved');
                target.textContent = `✔️ ${target.textContent.replace('✔️ ','')} - ${solutionElement.textContent}`; // Add solution text
                target.style.borderColor = 'green';
                target.style.backgroundColor = '#C8E6C9';


                dragDropFeedbackEl.textContent = "ถูกต้องจ้า! 👍";
                dragDropFeedbackEl.style.color = "green";
                solvedPairs++;
                if (solvedPairs === totalPairsToSolve) {
                    dragDropFeedbackEl.textContent = "เก่งมาก! จับคู่ครบแล้ว!";
                }
            } else if (solutionElement) { // Dropped on wrong target or already used solution
                dragDropFeedbackEl.textContent = "เอ๊ะ...ยังไม่ถูกนะ ลองใหม่! 🤔";
                dragDropFeedbackEl.style.color = "red";
            }
            setTimeout(() => dragDropFeedbackEl.textContent = "", 2000);
        });
    });


    // --- Benefits Sort Activity on Slide 5 (updated dropzone target) ---
    const draggableBenefits = document.querySelectorAll('#slide5 .benefit-card.draggable');
    const benefitDropzones = document.querySelectorAll('#slide5 .dropzone[data-dropzone="true"]'); // Target only dropzones
    const benefitSortFeedbackEl = document.getElementById('benefitSortFeedback');
    let sortedBenefitsCount = 0;
    const totalBenefitsToSort = draggableBenefits.length;


    draggableBenefits.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/id', card.textContent.trim());
            e.dataTransfer.setData('text/category', card.dataset.category);
            card.style.opacity = '0.5';
        });
        card.addEventListener('dragend', (e) => {
            card.style.opacity = '1';
        });
    });

    benefitDropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.backgroundColor = '#e0e0e0';
        });
        zone.addEventListener('dragleave', (e) => {
            zone.style.backgroundColor = '#fafafa';
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.backgroundColor = '#fafafa';
            const cardIdText = e.dataTransfer.getData('text/id');
            const cardCategory = e.dataTransfer.getData('text/category');
            // Find the original draggable card from the pool, not one already dropped
            const cardElement = Array.from(document.querySelectorAll('#slide5 .benefit-items-pool .benefit-card.draggable')).find(c => c.textContent.trim() === cardIdText);

            if (cardElement && zone.dataset.category === cardCategory) {
                zone.appendChild(cardElement);
                cardElement.draggable = false;
                cardElement.style.cursor = 'default';
                // cardElement.style.backgroundColor = '#E1BEE7'; // No need to change color, it's moved
                
                benefitSortFeedbackEl.textContent = "ถูกต้องค่ะ! 🎉";
                benefitSortFeedbackEl.style.color = "green";
                sortedBenefitsCount++;
                if (sortedBenefitsCount === totalBenefitsToSort) {
                    benefitSortFeedbackEl.textContent = "เยี่ยมเลย! จัดกลุ่มครบแล้ว!";
                }
            } else if (cardElement) {
                benefitSortFeedbackEl.textContent = "ลองดูใหม่นะ กลุ่มนี้ยังไม่ใช่ 🤔";
                benefitSortFeedbackEl.style.color = "orange";
            }
            setTimeout(() => benefitSortFeedbackEl.textContent = "", 2000);
        });
    });

    // --- Fun Quiz on Slide 7 (remains the same) ---
    const quizQuestionCards = document.querySelectorAll('.fun-quiz-container .quiz-question-card');
    const checkQuizAnswersBtn = document.getElementById('checkQuizAnswersBtn');
    const finalQuizResultEl = document.getElementById('finalQuizResult');
    let selectedAnswers = {};

    quizQuestionCards.forEach(card => {
        const questionNumber = card.dataset.question;
        const answerBtns = card.querySelectorAll('.answer-btn');
        answerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (card.classList.contains('answered')) return; // Prevent changing answer after check

                answerBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                // selectedAnswers[questionNumber] = btn.dataset.correct === 'true'; // Store selection, not correctness yet
            });
        });
    });

    if (checkQuizAnswersBtn) {
        checkQuizAnswersBtn.addEventListener('click', () => {
            let correctCount = 0;
            let answeredCount = 0;

            quizQuestionCards.forEach(card => {
                const questionNumber = card.dataset.question;
                const feedbackIconEl = card.querySelector('.feedback-icon');
                const selectedBtn = card.querySelector('.answer-btn.selected');
                
                feedbackIconEl.textContent = '';
                // card.querySelectorAll('.answer-btn').forEach(b => {
                //     b.classList.remove('correct', 'incorrect'); // Reset only if needed, or do it per button
                // });

                if (selectedBtn) {
                    answeredCount++;
                    card.classList.add('answered'); // Mark question as answered to lock buttons
                    const isCorrect = selectedBtn.dataset.correct === 'true';
                    if (isCorrect) {
                        correctCount++;
                        selectedBtn.classList.add('correct');
                        feedbackIconEl.textContent = '✔️';
                        feedbackIconEl.style.color = 'green';
                    } else {
                        selectedBtn.classList.add('incorrect');
                        feedbackIconEl.textContent = '❌';
                        feedbackIconEl.style.color = 'red';
                        const correctButton = card.querySelector('.answer-btn[data-correct="true"]');
                        if(correctButton) correctButton.classList.add('correct'); // Highlight correct answer
                    }
                }
            });

            if (answeredCount < quizQuestionCards.length) {
                finalQuizResultEl.textContent = "เอ...ยังตอบไม่ครบทุกข้อเลยนะ ลองดูอีกทีจ้า";
                finalQuizResultEl.className = 'final-quiz-result-display none-correct';
                return;
            }

            finalQuizResultEl.textContent = `ได้ ${correctCount} เต็ม ${quizQuestionCards.length} คะแนน! `;
            if (correctCount === quizQuestionCards.length) {
                finalQuizResultEl.textContent += "เก่งมากๆ เลยค่ะ! 🥳";
                finalQuizResultEl.className = 'final-quiz-result-display all-correct';
            } else if (correctCount >= Math.ceil(quizQuestionCards.length / 2)) {
                finalQuizResultEl.textContent += "เยี่ยมมาก! พยายามอีกนิดนะ! 😊";
                finalQuizResultEl.className = 'final-quiz-result-display some-correct';
            } else {
                finalQuizResultEl.textContent += "ไม่เป็นไรนะ ลองทบทวนดูอีกครั้ง! 頑張って! 💪";
                finalQuizResultEl.className = 'final-quiz-result-display none-correct';
            }
        });
    }
});