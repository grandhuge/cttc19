document.addEventListener('DOMContentLoaded', () => {
    // --- Slide Navigation & Narration Control (เหมือน lesson01/lesson02/lesson03_script.js) ---
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


    // --- Interactive Elements for Lesson 4 ---

    // Slide 1: Keywords
    const keywordButtons = document.querySelectorAll('.keyword-btn');
    const keywordsFeedbackEl = document.querySelector('.keywords-feedback');
    let correctKeywordsSelected = 0;
    const totalCorrectKeywords = Array.from(keywordButtons).filter(btn => btn.dataset.correct === 'true').length;
    keywordButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('selected-correct') || button.classList.contains('selected-incorrect')) return;
            const isCorrect = button.dataset.correct === 'true';
            if (isCorrect) {
                button.classList.add('selected-correct');
                correctKeywordsSelected++;
                keywordsFeedbackEl.textContent = "ถูกต้อง! 👍 นี่คือคำสำคัญของสหกรณ์โรงเรียน";
                keywordsFeedbackEl.style.color = "green";
            } else {
                button.classList.add('selected-incorrect');
                keywordsFeedbackEl.textContent = "เอ๊ะ...🤔 คำนี้ไม่น่าจะใช่นะ";
                keywordsFeedbackEl.style.color = "red";
            }
            if (correctKeywordsSelected === totalCorrectKeywords) {
                setTimeout(() => {
                    keywordsFeedbackEl.textContent = "เก่งมาก! เลือกคำสำคัญได้ถูกต้องหมดเลย! 🎉";
                }, 1000);
            }
             setTimeout(() => { if (! (correctKeywordsSelected === totalCorrectKeywords)) keywordsFeedbackEl.textContent = ""; }, 2000);
        });
    });

    // Slide 2: Match Objective
    const objDraggables = document.querySelectorAll('.obj-draggable');
    const objDropzones = document.querySelectorAll('.obj-dropzone');
    const objMatchFeedbackEl = document.querySelector('.objective-match-feedback');
    let objSolvedCount = 0;

    objDraggables.forEach(item => {
        item.addEventListener('dragstart', e => {
            if(item.classList.contains('used')) {e.preventDefault(); return;}
            e.dataTransfer.setData('text/matchkey', e.target.dataset.matchkey);
            e.dataTransfer.setData('text/id', e.target.id); // Pass ID to hide original
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', e => e.target.style.opacity = '1');
    });
    objDropzones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            if(!zone.classList.contains('filled')) zone.style.backgroundColor = '#E8F5E9';
        });
        zone.addEventListener('dragleave', e => {
            if(!zone.classList.contains('filled')) zone.style.backgroundColor = '#fff';
        });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            if(zone.classList.contains('filled')) return;
            zone.style.backgroundColor = '#fff';
            const droppedMatchKey = e.dataTransfer.getData('text/matchkey');
            const droppedId = e.dataTransfer.getData('text/id');
            const draggableElement = document.getElementById(droppedId);

            if (zone.dataset.dropkey === droppedMatchKey && draggableElement) {
                zone.textContent = draggableElement.textContent; // Put text in dropzone
                zone.classList.add('filled');
                draggableElement.classList.add('used'); // Mark as used
                draggableElement.style.display = 'none'; // Hide original
                objSolvedCount++;
                objMatchFeedbackEl.textContent = "ถูกต้องจ้า! 👍";
                objMatchFeedbackEl.style.color = "green";
                if (objSolvedCount === objDropzones.length) {
                    objMatchFeedbackEl.textContent = "เก่งมาก! จับคู่ครบแล้ว!";
                }
            } else {
                objMatchFeedbackEl.textContent = "ยังไม่ถูกคู่กันนะ ลองใหม่! 🤔";
                objMatchFeedbackEl.style.color = "red";
            }
            setTimeout(() => { if(objSolvedCount < objDropzones.length) objMatchFeedbackEl.textContent = ""}, 2000);
        });
    });


    // Slide 3: Benefit Sort
    const benefitDraggables = document.querySelectorAll('.benefit-item.draggable');
    const benefitGroupDropzones = document.querySelectorAll('.benefit-group[data-dropzone="true"]');
    const benefitSortFeedbackEl = document.querySelector('.benefit-sort-feedback');
    let benefitSortedCount = 0;

    benefitDraggables.forEach(item => {
        item.addEventListener('dragstart', e => {
            if(item.classList.contains('used')) {e.preventDefault(); return;}
            e.dataTransfer.setData('text/group', e.target.dataset.group);
            e.dataTransfer.setData('text/id', e.target.textContent.trim()); // Use text as ID
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', e => e.target.style.opacity = '1');
    });

    benefitGroupDropzones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.style.borderColor = 'green'; // Highlight dropzone
        });
        zone.addEventListener('dragleave', e => {
            zone.style.borderColor = '#78909C';
        });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.style.borderColor = '#78909C';
            const droppedGroup = e.dataTransfer.getData('text/group');
            const droppedIdText = e.dataTransfer.getData('text/id');
            const draggableElement = Array.from(benefitDraggables).find(d => d.textContent.trim() === droppedIdText && !d.classList.contains('used'));


            if (draggableElement && zone.dataset.group === droppedGroup) {
                zone.appendChild(draggableElement.cloneNode(true)); // Clone to show in dropzone
                draggableElement.classList.add('used');
                draggableElement.style.display = 'none'; // Hide original from pool
                benefitSortedCount++;
                benefitSortFeedbackEl.textContent = "ถูกต้องค่ะ! 🎉";
                benefitSortFeedbackEl.style.color = "green";
                if (benefitSortedCount === benefitDraggables.length) {
                    benefitSortFeedbackEl.textContent = "เยี่ยมเลย! จัดกลุ่มครบแล้ว!";
                }
            } else if (draggableElement) {
                benefitSortFeedbackEl.textContent = "ลองดูใหม่นะ กลุ่มนี้ยังไม่ใช่ 🤔";
                benefitSortFeedbackEl.style.color = "orange";
            }
            setTimeout(() => {if(benefitSortedCount < benefitDraggables.length) benefitSortFeedbackEl.textContent = ""}, 2000);
        });
    });

    // Slide 4: Role Match
    const roleDraggables = document.querySelectorAll('.role-item.draggable');
    const roleDescDropzones = document.querySelectorAll('.role-desc-dropzone[data-dropzone="true"]');
    const roleMatchFeedbackEl = document.querySelector('.role-match-feedback');
    let roleSolvedCount = 0;

    roleDraggables.forEach(item => {
        item.addEventListener('dragstart', e => {
            if(item.classList.contains('used')) {e.preventDefault(); return;}
            e.dataTransfer.setData('text/match', e.target.dataset.match);
            e.dataTransfer.setData('text/id', e.target.textContent.trim());
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', e => e.target.style.opacity = '1');
    });
    roleDescDropzones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            if(!zone.classList.contains('filled')) zone.style.backgroundColor = '#EDE7F6';
        });
        zone.addEventListener('dragleave', e => {
             if(!zone.classList.contains('filled')) zone.style.backgroundColor = '#fff';
        });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            if(zone.classList.contains('filled')) return;
            zone.style.backgroundColor = '#fff';
            const droppedMatchKey = e.dataTransfer.getData('text/match');
            const droppedIdText = e.dataTransfer.getData('text/id');
            const draggableElement = Array.from(roleDraggables).find(d => d.textContent.trim() === droppedIdText && !d.classList.contains('used'));

            if (draggableElement && zone.dataset.match === droppedMatchKey) {
                zone.innerHTML = `<strong>${draggableElement.textContent}</strong><br><small>${zone.textContent}</small>`; // Combine role and description
                zone.classList.add('filled');
                draggableElement.classList.add('used');
                draggableElement.style.display = 'none';
                roleSolvedCount++;
                roleMatchFeedbackEl.textContent = "ถูกต้องจ้า! 👍";
                roleMatchFeedbackEl.style.color = "green";
                 if (roleSolvedCount === roleDescDropzones.length) {
                    roleMatchFeedbackEl.textContent = "เก่งมาก! จับคู่บทบาทหน้าที่ครบแล้ว!";
                }
            } else if (draggableElement) {
                roleMatchFeedbackEl.textContent = "ยังไม่ถูกคู่กันนะ ลองใหม่! 🤔";
                roleMatchFeedbackEl.style.color = "red";
            }
             setTimeout(() => {if(roleSolvedCount < roleDescDropzones.length) roleMatchFeedbackEl.textContent = ""}, 2000);
        });
    });


    // --- Quiz (Same as previous lessons, ensure explanations are specific to L4) ---
    const quizQuestionCards_L4 = document.querySelectorAll('#slide6 .fun-quiz-container .quiz-question-card');
    const checkQuizAnswersBtn_L4 = document.querySelector('#slide6 #checkQuizAnswersBtn');
    const finalQuizResultEl_L4 = document.querySelector('#slide6 #finalQuizResult');

    const quizExplanations_L4 = {
        "q1": "สหกรณ์ในโรงเรียนจัดตั้งขึ้นโดยนักเรียน เพื่อนักเรียนเป็นหลักค่ะ",
        "q2": "เป้าหมายสำคัญคือเพื่อให้นักเรียนได้เรียนรู้และฝึกฝนการทำงานร่วมกัน การออม และประชาธิปไตยค่ะ",
        "q3": "เมื่อซื้อของจากสหกรณ์โรงเรียน นักเรียนที่เป็นสมาชิกจะได้รับประโยชน์โดยตรง เช่น ได้ของราคาถูก หรือมีเงินปันผลคืนค่ะ",
        "q4": "คณะกรรมการนักเรียนที่ได้รับเลือกตั้งจากสมาชิก จะเป็นผู้ดูแลและบริหารงานสหกรณ์โรงเรียนเป็นหลัก โดยมีคุณครูเป็นที่ปรึกษาค่ะ",
        "q5": "การให้กู้ยืมเงินซื้อบ้านเป็นกิจกรรมของสหกรณ์ออมทรัพย์ขนาดใหญ่ ไม่ใช่กิจกรรมหลักของสหกรณ์นักเรียนในโรงเรียนทั่วไปค่ะ"
    };

    quizQuestionCards_L4.forEach(card => {
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

    if (checkQuizAnswersBtn_L4) {
        checkQuizAnswersBtn_L4.addEventListener('click', () => {
            let correctCount = 0;
            let answeredCount = 0;
            quizQuestionCards_L4.forEach(card => {
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
                            explanationEl.textContent = "เก่งมาก ถูกต้องค่ะ! 👍 " + (quizExplanations_L4[questionId] || "");
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
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ คำตอบที่ถูกคือ: " + correctButton.textContent.trim().substring(3) + " ค่ะ 🤔 " + (quizExplanations_L4[questionId] || "");
                            } else {
                                explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ 🤔 " + (quizExplanations_L4[questionId] || "");
                            }
                            explanationEl.style.color = 'red';
                        }
                    }
                }
            });
            if (answeredCount < quizQuestionCards_L4.length) {
                finalQuizResultEl_L4.textContent = "เอ...ยังตอบไม่ครบทุกข้อเลยนะ ลองดูอีกทีจ้า";
                finalQuizResultEl_L4.className = 'final-quiz-result-display none-correct';
                return;
            }
            finalQuizResultEl_L4.textContent = `ได้ ${correctCount} เต็ม ${quizQuestionCards_L4.length} คะแนน! `;
            if (correctCount === quizQuestionCards_L4.length) {
                finalQuizResultEl_L4.textContent += "เก่งมากๆ เลยค่ะ! 🥳";
                finalQuizResultEl_L4.className = 'final-quiz-result-display all-correct';
            } else if (correctCount >= Math.ceil(quizQuestionCards_L4.length / 2)) {
                finalQuizResultEl_L4.textContent += "เยี่ยมมาก! พยายามอีกนิดนะ! 😊";
                finalQuizResultEl_L4.className = 'final-quiz-result-display some-correct';
            } else {
                finalQuizResultEl_L4.textContent += "ไม่เป็นไรนะ ลองทบทวนดูอีกครั้ง! 💪";
                finalQuizResultEl_L4.className = 'final-quiz-result-display none-correct';
            }
            checkQuizAnswersBtn_L4.disabled = true;
            checkQuizAnswersBtn_L4.style.opacity = 0.7;
            checkQuizAnswersBtn_L4.textContent = "ตรวจคำตอบแล้ว";
        });
    }
});