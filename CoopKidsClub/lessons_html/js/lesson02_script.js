document.addEventListener('DOMContentLoaded', () => {
    // ... (โค้ดส่วน Slide Navigation และ MP3 Narration คงเดิม) ...
    const slides = document.querySelectorAll('.lesson-slide');
    const navButtons = document.querySelectorAll('.lesson-nav-btn');
    const slideNarrationPlayer = document.getElementById('slideNarrationPlayer');
    const slideNarrationButtons = document.querySelectorAll('.slide-narration-btn');
    let currentPlayingButton = null;

    // --- Slide Navigation & Narration Control (เหมือนเดิม) ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (slideNarrationPlayer && !slideNarrationPlayer.paused) {
                slideNarrationPlayer.pause();
                // slideNarrationPlayer.currentTime = 0; // Optional: reset audio position
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
        button.dataset.defaultText = button.textContent; // Store default text
        button.addEventListener('click', () => {
            const audioSrc = button.dataset.audioSrc;
            if (!audioSrc) return;

            if (currentPlayingButton === button && !slideNarrationPlayer.paused) {
                slideNarrationPlayer.pause();
                // button.classList.remove('playing'); // Handled by onpause event
                // button.textContent = button.dataset.defaultText.replace('ฟังเสียง', 'เล่นต่อ');
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
                }).catch(error => {
                    console.error("Audio Playback Error:", error);
                    button.textContent = '⚠️ เกิดข้อผิดพลาด';
                });
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
                 // Only change text if it was genuinely paused by the user, not stopped by changing slide or error
                if(slideNarrationPlayer.duration > 0 && slideNarrationPlayer.currentTime > 0 && slideNarrationPlayer.currentTime < slideNarrationPlayer.duration) {
                    currentPlayingButton.textContent = '▶️ เล่นต่อ'; // Or original text if prefered
                } else {
                    currentPlayingButton.textContent = currentPlayingButton.dataset.defaultText;
                }
                currentPlayingButton.classList.remove('playing');
                // currentPlayingButton = null; // Nullifying here means it won't resume with same button text state
            }
        };
    }
    // --- Interactive Elements for Lesson 2 (โค้ดส่วนนี้คงเดิมจากครั้งที่แล้ว) ---
    // Principle 1: True/False
    const tfContainers = document.querySelectorAll('.interactive-tf');
    tfContainers.forEach(container => {
        const buttons = container.querySelectorAll('.tf-btn');
        const feedbackEl = container.querySelector('.tf-feedback');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const isCorrect = button.dataset.answer === 'true';
                feedbackEl.textContent = isCorrect ? "ถูกต้อง! สหกรณ์ต้องเข้าร่วมด้วยความสมัครใจจ้า 👍" : "ยังไม่ถูกนะ! การสมัครใจเป็นสิ่งสำคัญมากเลย 🤔";
                feedbackEl.style.color = isCorrect ? "green" : "red";
                buttons.forEach(btn => btn.disabled = true);
            });
        });
    });

    // Principle 2: Simple Vote
    const voteContainers = document.querySelectorAll('.interactive-vote');
    voteContainers.forEach(container => {
        const buttons = container.querySelectorAll('.vote-option-btn');
        const feedbackEl = container.querySelector('.vote-feedback');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                feedbackEl.textContent = `ขอบคุณที่โหวตให้ "${button.dataset.option}" นะ! ทุกเสียงมีความหมายจ้ะ 😊`;
                feedbackEl.style.color = "var(--accent-color)";
                buttons.forEach(btn => btn.disabled = true);
            });
        });
    });

    // Principle 3: Collect Shares
    const collectCoinBtn = document.querySelector('.collect-coin-btn');
    const coopFundAmountEl = document.getElementById('coopFundAmount');
    let fund = 0;
    let clicks = 0;
    if (collectCoinBtn) {
        collectCoinBtn.addEventListener('click', () => {
            if (clicks < 3) {
                fund += 10; 
                clicks++;
                coopFundAmountEl.textContent = fund;
                collectCoinBtn.style.transform = "scale(1.1)";
                setTimeout(() => { collectCoinBtn.style.transform = "scale(1)"; }, 100);
                if (clicks === 3) {
                    coopFundAmountEl.textContent += " บาท (ครบแล้ว! ขอบคุณที่ร่วมลงหุ้นนะ)";
                    collectCoinBtn.style.opacity = 0.5;
                    collectCoinBtn.style.cursor = "default";
                }
            }
        });
    }

    // Principle 4: Click to Reveal
    const revealContainers = document.querySelectorAll('.interactive-click-reveal');
    revealContainers.forEach(container => {
        const buttons = container.querySelectorAll('.reveal-option-btn');
        const feedbackEl = container.querySelector('.reveal-feedback');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('correct-reveal')) {
                    feedbackEl.textContent = "ถูกต้อง! สมาชิกทุกคนร่วมกันตัดสินใจ 👍";
                    feedbackEl.style.color = "green";
                } else {
                    feedbackEl.textContent = "ไม่ใช่จ้ะ สหกรณ์เป็นของสมาชิกทุกคนนะ 🤔";
                    feedbackEl.style.color = "red";
                }
                buttons.forEach(btn => btn.disabled = true);
            });
        });
    });

    // Principle 5: Match Activity
    const matchContainers = document.querySelectorAll('.interactive-match-activity');
    matchContainers.forEach(container => {
        const buttons = container.querySelectorAll('.match-option-btn');
        const feedbackEl = container.querySelector('.match-feedback');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('correct-match')) {
                    feedbackEl.textContent = "ใช่เลย! การให้ความรู้ก็คือการศึกษานั่นเอง 💡";
                    feedbackEl.style.color = "green";
                } else {
                    feedbackEl.textContent = "นั่นเป็นกิจกรรมอื่นของสหกรณ์จ้ะ ลองดูใหม่นะ 😉";
                    feedbackEl.style.color = "orange";
                }
                buttons.forEach(btn => btn.disabled = true);
            });
        });
    });
    
    // Principle 6: Connect Coops
    const canvas = document.getElementById('connectCanvas');
    const connectFeedbackEl = document.querySelector('.connect-feedback');
    const checkConnectionsBtn = document.getElementById('checkConnectionsBtn');

    if (canvas) {
        const ctx = canvas.getContext('2d');
        const nodes = Array.from(document.querySelectorAll('.coop-node'));
        let selectedNode = null;
        let connections = []; 
        const correctConnections = [ ['coopA', 'coopB'] ];

        function getNodeCenter(nodeEl) {
            const rect = nodeEl.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - canvasRect.left,
                y: rect.top + rect.height / 2 - canvasRect.top
            };
        }

        function drawConnections() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#0277BD";
            ctx.lineWidth = 2;
            connections.forEach(pair => {
                const node1El = document.getElementById(pair[0]);
                const node2El = document.getElementById(pair[1]);
                if (node1El && node2El) {
                    const pos1 = getNodeCenter(node1El);
                    const pos2 = getNodeCenter(node2El);
                    ctx.beginPath();
                    ctx.moveTo(pos1.x, pos1.y);
                    ctx.lineTo(pos2.x, pos2.y);
                    ctx.stroke();
                }
            });
        }
        
        nodes.forEach(node => {
            node.addEventListener('click', () => {
                if (checkConnectionsBtn.disabled) return; // Do not allow changes after checking
                if (!selectedNode) {
                    selectedNode = node;
                    node.classList.add('selected-node');
                } else {
                    if (selectedNode !== node) {
                        const newConnectionUnsorted = [selectedNode.id, node.id];
                        const newConnectionSorted = [...newConnectionUnsorted].sort().join('-'); // Sort for consistent check
                        const existingConnectionsSorted = connections.map(c => [...c].sort().join('-'));
                        
                        if (!existingConnectionsSorted.includes(newConnectionSorted)) {
                             connections.push(newConnectionUnsorted);
                        } else { // If connection exists, remove it (toggle behavior)
                            connections = connections.filter(c => [...c].sort().join('-') !== newConnectionSorted);
                        }
                        drawConnections();
                    }
                    selectedNode.classList.remove('selected-node');
                    selectedNode = null;
                }
            });
        });

        if (checkConnectionsBtn) {
            checkConnectionsBtn.addEventListener('click', () => {
                let correctCount = 0;
                let attemptedCount = connections.length;
                
                const userConnectionsSet = new Set(connections.map(c => [...c].sort().join('-')));
                const correctConnectionsSet = new Set(correctConnections.map(c => [...c].sort().join('-')));

                userConnectionsSet.forEach(conn => {
                    if (correctConnectionsSet.has(conn)) {
                        correctCount++;
                    }
                });

                if (correctCount === correctConnections.length && attemptedCount === correctConnections.length) {
                    connectFeedbackEl.textContent = "ถูกต้อง! สหกรณ์เหล่านี้ร่วมมือกันได้ดีเลย 👍";
                    connectFeedbackEl.style.color = "green";
                } else if (correctCount > 0 && correctCount < correctConnections.length) {
                    connectFeedbackEl.textContent = `เกือบถูกแล้ว! มีถูก ${correctCount} เส้นทาง จากที่ควรจะเป็น ${correctConnections.length} เส้นทาง ลองดูอีกทีนะ`;
                    connectFeedbackEl.style.color = "orange";
                } else if (correctCount > 0 && attemptedCount > correctConnections.length) {
                    connectFeedbackEl.textContent = `มีบางเส้นทางที่ถูก แต่มีบางเส้นทางอาจจะไม่จำเป็นนะ (ถูก ${correctCount} จาก ${attemptedCount} ที่ลาก)`;
                     connectFeedbackEl.style.color = "orange";
                } else {
                    connectFeedbackEl.textContent = "ยังไม่ถูกนะ ลองจับคู่การร่วมมือใหม่จ้า 🤔";
                    connectFeedbackEl.style.color = "red";
                }
                nodes.forEach(n => n.style.pointerEvents = 'none');
                checkConnectionsBtn.disabled = true;
            });
        }
    }

    // Principle 7: Choose Project
    const projectContainers = document.querySelectorAll('.interactive-choose-project');
    projectContainers.forEach(container => {
        const buttons = container.querySelectorAll('.project-choice-btn');
        const feedbackEl = container.querySelector('.project-choice-feedback');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                feedbackEl.textContent = `ยอดเยี่ยม! การเลือก "${button.textContent}" เป็นกิจกรรมที่ดีเพื่อชุมชนของเราจริงๆ! 🌟`;
                feedbackEl.style.color = "var(--primary-color)";
                buttons.forEach(btn => btn.disabled = true);
            });
        });
    });

    // --- Fun Quiz on Slide 8 (Updated with Explanations) ---
    const quizQuestionCards = document.querySelectorAll('#slide8 .fun-quiz-container .quiz-question-card');
    const checkQuizAnswersBtn = document.getElementById('checkQuizAnswersBtn');
    const finalQuizResultEl = document.getElementById('finalQuizResult');

    // --- คำอธิบายสำหรับแต่ละคำถาม ---
    const quizExplanations = {
        "q1": "หลักการ '1 คน 1 เสียง' เป็นหัวใจสำคัญของ 'การควบคุมโดยสมาชิกตามหลักประชาธิปไตย' ค่ะ ทำให้ทุกคนมีสิทธิเท่าเทียมกันในการบริหารสหกรณ์",
        "q2": "การนำกำไรไปพัฒนาส่วนรวม เช่น ซื้อหนังสือเข้าห้องสมุด แสดงถึง 'ความเอื้ออาทรต่อชุมชน' ซึ่งเป็นสิ่งที่สหกรณ์ที่ดีควรทำค่ะ",
        "q3": "ไม่ตรงค่ะ เพราะหลักการแรกของสหกรณ์คือ 'การเป็นสมาชิกโดยสมัครใจและเปิดกว้าง' ไม่มีการบังคับค่ะ",
        "q4": "สหกรณ์ที่ดีต้อง 'ปกครองตนเองและมีความเป็นอิสระ' สมาชิกจึงเป็นผู้มีอำนาจตัดสินใจสูงสุดค่ะ ไม่ใช่รัฐบาลหรือองค์กรภายนอก",
        "q5": "การสอนให้สมาชิกมีความรู้ความสามารถในการบริหารจัดการ เช่น การทำบัญชี ถือเป็น 'การศึกษา ฝึกอบรม และสารสนเทศ' เพื่อพัฒนาสหกรณ์ค่ะ"
    };

    quizQuestionCards.forEach(card => {
        const questionId = card.dataset.questionId; // ใช้ questionId ที่เราตั้งไว้
        const answerBtns = card.querySelectorAll('.answer-btn');
        const explanationEl = card.querySelector('.explanation-text'); // Element สำหรับแสดงคำอธิบาย
        
        // ล้างคำอธิบายเดิม (ถ้ามี)
        if(explanationEl) explanationEl.textContent = ''; 

        answerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (card.classList.contains('answered')) return; 

                answerBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    });

    if (checkQuizAnswersBtn) {
        checkQuizAnswersBtn.addEventListener('click', () => {
            let correctCount = 0;
            let answeredCount = 0;

            quizQuestionCards.forEach(card => {
                const questionId = card.dataset.questionId;
                const feedbackIconEl = card.querySelector('.feedback-icon');
                const selectedBtn = card.querySelector('.answer-btn.selected');
                const explanationEl = card.querySelector('.explanation-text');
                
                feedbackIconEl.textContent = ''; 
                explanationEl.textContent = ''; // Clear previous explanation
                explanationEl.style.color = '#555'; // Default color for explanation

                card.querySelectorAll('.answer-btn').forEach(b => {
                    // b.classList.remove('correct', 'incorrect'); // No, keep selected visual until re-answer if allowed
                });

                if (selectedBtn) {
                    answeredCount++;
                    card.classList.add('answered'); 
                    const isCorrect = selectedBtn.dataset.correct === 'true';

                    if (isCorrect) {
                        correctCount++;
                        selectedBtn.classList.add('correct');
                        feedbackIconEl.textContent = '✔️';
                        feedbackIconEl.style.color = 'green';
                        explanationEl.textContent = "เก่งมาก ถูกต้องค่ะ! 👍 " + (quizExplanations[questionId] || "");
                        explanationEl.style.color = 'green';
                    } else {
                        selectedBtn.classList.add('incorrect');
                        feedbackIconEl.textContent = '❌';
                        feedbackIconEl.style.color = 'red';
                        const correctButton = card.querySelector('.answer-btn[data-correct="true"]');
                        if(correctButton) {
                            correctButton.classList.add('correct'); // Highlight correct answer
                            explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ คำตอบที่ถูกคือ: " + correctButton.textContent.trim().substring(3) + " ค่ะ 🤔 " + (quizExplanations[questionId] || "");
                        } else {
                            explanationEl.textContent = "เสียดายจัง ยังไม่ถูกนะคะ 🤔 " + (quizExplanations[questionId] || "");
                        }
                        explanationEl.style.color = 'red';
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
            } else if (correctCount >= Math.ceil(quizQuestionCards.length / 2)) { // More than half correct
                finalQuizResultEl.textContent += "เยี่ยมมาก! พยายามอีกนิดนะ! 😊";
                finalQuizResultEl.className = 'final-quiz-result-display some-correct';
            } else {
                finalQuizResultEl.textContent += "ไม่เป็นไรนะ ลองทบทวนดูอีกครั้ง! 💪";
                finalQuizResultEl.className = 'final-quiz-result-display none-correct';
            }
            checkQuizAnswersBtn.disabled = true; // Disable after checking
            checkQuizAnswersBtn.style.opacity = 0.7;
            checkQuizAnswersBtn.textContent = "ตรวจคำตอบแล้ว";
        });
    }
});