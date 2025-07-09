const words = [
            { word: "ความสามัคคี", hint: "เมื่อหลายคนรวมพลังกันโดยไม่ทะเลาะ เพื่อเป้าหมายเดียวกันอย่างเต็มใจ" },
            { word: "ความโปร่งใส", hint: "ทุกคนสามารถเห็นข้อมูลหรือการทำงานอย่างชัดเจน ไม่ซ่อนเร้น" },
            { word: "ความซื่อสัตย์สุจริต", hint: "การทำในสิ่งที่ถูกต้องแม้ไม่มีใครมองอยู่ ไม่โกง ไม่เอาเปรียบ" },
            { word: "การมีส่วนร่วมของสมาชิก", hint: "เปิดโอกาสให้ทุกคนได้แสดงความคิดเห็น และช่วยกันตัดสินใจ" },
            { word: "การสื่อสารที่ชัดเจน", hint: "การพูดหรือบอกข้อมูลที่เข้าใจง่าย ไม่คลุมเครือ ทำให้ไม่เข้าใจผิด" },
            { word: "การศึกษาและฝึกอบรม", hint: "การพัฒนาความรู้และทักษะเพิ่มเติม เพื่อทำงานให้ดียิ่งขึ้น" },
            { word: "การวางแผนที่ชัดเจน", hint: "การกำหนดแนวทางล่วงหน้า ว่าจะทำอะไร เมื่อไหร่ อย่างไร" },
            { word: "การบริหารจัดการที่ดี", hint: "การควบคุม ดูแล และตัดสินใจให้ทุกอย่างดำเนินไปอย่างราบรื่น" },
            { word: "การตรวจสอบ", hint: "การเช็กข้อมูลหรือเอกสารเพื่อให้แน่ใจว่าไม่มีข้อผิดพลาดหรือปัญหา" },
            { word: "เทคโนโลยีสารสนเทศ", hint: "เครื่องมือสมัยใหม่ที่ช่วยให้การทำงานเร็วขึ้น เช่น คอมพิวเตอร์หรือแอป" },
            { word: "ความรับผิดชอบต่อส่วนรวม", hint: "คิดถึงประโยชน์ของกลุ่ม มากกว่าความสะดวกของตัวเอง" },
            { word: "จริยธรรม", hint: "หลักความดีงามที่ใช้ตัดสินใจทำในสิ่งที่เหมาะสม" },
            { word: "ความเป็นธรรม", hint: "การปฏิบัติต่อทุกคนอย่างเท่าเทียม ไม่ลำเอียงหรือเอื้อประโยชน์เฉพาะกลุ่ม" },
            { word: "ความยืดหยุ่นและการปรับตัว", hint: "การเปลี่ยนแปลงตัวเองให้เข้ากับสถานการณ์ใหม่ ๆ ได้ดี" },
            { word: "การบริหารการเงินที่มั่นคง", hint: "ดูแลรายรับรายจ่ายให้สมดุล ไม่ขาดทุน และมีเงินเก็บใช้ในอนาคต" },
            { word: "ความเชื่อมั่นในองค์กร", hint: "ความรู้สึกไว้วางใจว่ากลุ่มนี้จะไม่ทำให้ผิดหวัง" }
        ];

        let history = [];
        let currentWord = null;
        let isSpinning = false;
        let remainingWords = [...words]; // Track remaining words

        function showPage(page) {
            const wordsPage = document.getElementById('wordsPage');
            const gamePage = document.getElementById('gamePage');
            const wordsBtn = document.getElementById('wordsBtn');
            const gameBtn = document.getElementById('gameBtn');

            if (page === 'words') {
                wordsPage.classList.remove('hidden');
                gamePage.classList.add('hidden');
                wordsBtn.classList.add('bg-purple-600', 'text-white');
                wordsBtn.classList.remove('bg-gray-200', 'text-gray-700');
                gameBtn.classList.remove('bg-purple-600', 'text-white');
                gameBtn.classList.add('bg-gray-200', 'text-gray-700');
            } else {
                wordsPage.classList.add('hidden');
                gamePage.classList.remove('hidden');
                gameBtn.classList.add('bg-purple-600', 'text-white');
                gameBtn.classList.remove('bg-gray-200', 'text-gray-700');
                wordsBtn.classList.remove('bg-purple-600', 'text-white');
                wordsBtn.classList.add('bg-gray-200', 'text-gray-700');
            }
        }

        function spinSlot() {
            if (isSpinning) return;
            
            // Check if there are remaining words
            if (remainingWords.length === 0) {
                alert('🎉 สุ่มครบทุกคำแล้ว! กดปุ่ม "รีเซ็ต" เพื่อเริ่มใหม่');
                return;
            }
            
            isSpinning = true;
            const hintDisplay = document.getElementById('hintDisplay');
            const answerDisplay = document.getElementById('answerDisplay');
            const spinBtn = document.getElementById('spinBtn');
            const showAnswerBtn = document.getElementById('showAnswerBtn');

            // Hide answer if showing
            answerDisplay.classList.add('hidden');
            showAnswerBtn.classList.add('hidden');
            
            // Start spinning animation
            hintDisplay.classList.add('spinning');
            spinBtn.disabled = true;
            spinBtn.textContent = '🎰 กำลังสุ่ม...';

            // Phase 1: Fast spinning (2 seconds)
            let spinCount = 0;
            const fastSpinInterval = setInterval(() => {
                const randomWord = words[Math.floor(Math.random() * words.length)];
                hintDisplay.innerHTML = `<span class="text-yellow-300">${randomWord.hint}</span>`;
                spinCount++;

                if (spinCount > 15) {
                    clearInterval(fastSpinInterval);
                    startSlowSpin();
                }
            }, 120);

            function startSlowSpin() {
                // Phase 2: Slow down gradually
                let slowSpinCount = 0;
                const slowSpinInterval = setInterval(() => {
                    const randomWord = words[Math.floor(Math.random() * words.length)];
                    hintDisplay.innerHTML = `<span class="text-yellow-300">${randomWord.hint}</span>`;
                    slowSpinCount++;

                    if (slowSpinCount > 8) {
                        clearInterval(slowSpinInterval);
                        finalResult();
                    }
                }, 200 + (slowSpinCount * 50)); // Gradually slower
            }

            function finalResult() {
                // Phase 3: Final result with animation
                hintDisplay.classList.remove('spinning');
                hintDisplay.classList.add('slowing-down');
                
                // Final word selection from remaining words only
                const randomIndex = Math.floor(Math.random() * remainingWords.length);
                currentWord = remainingWords[randomIndex];
                hintDisplay.innerHTML = `<span class="text-yellow-300">${currentWord.hint}</span>`;
                
                // Remove slowing animation after it completes
                setTimeout(() => {
                    hintDisplay.classList.remove('slowing-down');
                    
                    // Enable buttons
                    spinBtn.disabled = false;
                    if (remainingWords.length > 1) {
                        spinBtn.textContent = '🎰 สุ่มคำใหม่';
                    } else {
                        spinBtn.textContent = '🎰 คำสุดท้าย!';
                    }
                    showAnswerBtn.classList.remove('hidden');
                    
                    isSpinning = false;
                }, 300);
            }
        }

        function showAnswer() {
            if (!currentWord) return;

            const answerDisplay = document.getElementById('answerDisplay');
            const answerText = document.getElementById('answerText');
            const showAnswerBtn = document.getElementById('showAnswerBtn');

            answerText.textContent = currentWord.word;
            answerDisplay.classList.remove('hidden');
            showAnswerBtn.classList.add('hidden');

            // Remove word from remaining words
            const wordIndex = remainingWords.findIndex(w => w.word === currentWord.word);
            if (wordIndex > -1) {
                remainingWords.splice(wordIndex, 1);
            }

            // Add to history
            addToHistory(currentWord);
            
            // Update remaining count display
            updateRemainingCount();
        }

        function addToHistory(wordObj) {
            history.push(wordObj);
            updateHistoryDisplay();
            updateUndoButton();
        }

        function updateHistoryDisplay() {
            const historyList = document.getElementById('historyList');
            
            if (history.length === 0) {
                historyList.innerHTML = '<p class="text-gray-500 text-center py-4">ยังไม่มีประวัติการสุ่ม</p>';
                return;
            }

            historyList.innerHTML = history.map((item, index) => `
                <div class="history-item bg-gray-50 rounded-lg p-3 border-l-4 border-purple-400">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="font-bold text-purple-600">${index + 1}. ${item.word}</span>
                            <p class="text-sm text-gray-600 mt-1">${item.hint}</p>
                        </div>
                    </div>
                </div>
            `).reverse().join('');
        }

        function updateUndoButton() {
            const undoBtn = document.getElementById('undoBtn');
            undoBtn.disabled = history.length === 0;
        }

        function undoLast() {
            if (history.length > 0) {
                const lastWord = history.pop();
                
                // Add word back to remaining words if not already there
                const wordExists = remainingWords.find(w => w.word === lastWord.word);
                if (!wordExists) {
                    remainingWords.push(lastWord);
                }
                
                updateHistoryDisplay();
                updateUndoButton();
                updateRemainingCount();
            }
        }

        // Bingo Card Functions
        function generateBingoCard() {
            const shuffledWords = [...words].sort(() => Math.random() - 0.5);
            const bingoCard = document.getElementById('bingoCard');
            const bingoCardSection = document.getElementById('bingoCardSection');
            const printBtn = document.getElementById('printBtn');
            
            bingoCard.innerHTML = '';
            
            shuffledWords.forEach((wordObj, index) => {
                const cell = document.createElement('div');
                cell.className = 'bg-purple-100 border-2 border-purple-300 rounded-lg p-3 text-center min-h-[80px] flex items-center justify-center';
                cell.innerHTML = `<span class="font-bold text-purple-800 text-sm">${wordObj.word}</span>`;
                bingoCard.appendChild(cell);
            });
            
            bingoCardSection.classList.remove('hidden');
            printBtn.classList.remove('hidden');
        }
        
        function printBingoCard() {
            const bingoCardSection = document.getElementById('bingoCardSection');
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>ใบบิงโกสหกรณ์</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
                        body { 
                            font-family: 'Kanit', sans-serif; 
                            margin: 20px;
                            background: white;
                        }
                        .bingo-container {
                            max-width: 600px;
                            margin: 0 auto;
                            text-align: center;
                        }
                        .bingo-title {
                            font-size: 24px;
                            font-weight: bold;
                            color: #6b46c1;
                            margin-bottom: 20px;
                        }
                        .bingo-grid {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 8px;
                            margin-bottom: 20px;
                        }
                        .bingo-cell {
                            border: 2px solid #a855f7;
                            border-radius: 8px;
                            padding: 12px;
                            min-height: 60px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            color: #6b46c1;
                            font-size: 14px;
                        }
                        .instructions {
                            font-size: 12px;
                            color: #666;
                            margin-top: 20px;
                            text-align: left;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="bingo-container">
                        <div class="bingo-title">🎯 ใบบิงโกสหกรณ์</div>
                        <div class="bingo-grid">
                            ${Array.from(document.querySelectorAll('#bingoCard > div')).map(cell => 
                                `<div class="bingo-cell">${cell.querySelector('span').textContent}</div>`
                            ).join('')}
                        </div>
                        <div class="instructions">
                            <strong>วิธีเล่น:</strong><br>
                            1. ฟังคำอธิบายจากระบบสุ่มคำ<br>
                            2. ทำเครื่องหมาย ✓ ในช่องที่ตรงกัน<br>
                            3. ชนะเมื่อได้เส้นตรง 4 ช่อง (แนวนอน แนวตั้ง หรือแนวทแยง)<br><br>
                            <strong>หัวข้อ:</strong> การทำงานร่วมกันในสหกรณ์จะประสบความสำเร็จต้องประกอบด้วย
                        </div>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
        
        function downloadGuide() {
            const guideContent = `คู่มือคำสำคัญ - เกมบิงโกสหกรณ์
การทำงานร่วมกันในสหกรณ์จะประสบความสำเร็จต้องประกอบด้วย

${words.map((item, index) => `${index + 1}. ${item.word}
   คำอธิบาย: ${item.hint}
`).join('\n')}

วิธีการเล่นเกมบิงโก:
1. ใช้ระบบสุ่มคำเพื่อได้คำอธิบาย
2. ผู้เล่นทายคำจากคำอธิบายที่ได้
3. ทำเครื่องหมายในใบบิงโกที่ตรงกัน
4. ชนะเมื่อได้เส้นตรง 4 ช่อง (แนวนอน แนวตั้ง หรือแนวทแยง)

© developed by Tle Narongphisit | CTTC19 @ CPD`;

            const blob = new Blob([guideContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'คู่มือคำสำคัญ-บิงโกสหกรณ์.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Helper Functions
        function updateRemainingCount() {
            const remainingCount = document.getElementById('remainingCount');
            remainingCount.textContent = `${remainingWords.length}/16`;
            
            // Change color based on remaining count
            if (remainingWords.length <= 3) {
                remainingCount.className = 'text-2xl font-bold text-red-600';
            } else if (remainingWords.length <= 8) {
                remainingCount.className = 'text-2xl font-bold text-yellow-600';
            } else {
                remainingCount.className = 'text-2xl font-bold text-green-600';
            }
        }
        
        function resetGame() {
            remainingWords = [...words];
            history = [];
            currentWord = null;
            
            // Reset UI
            const hintDisplay = document.getElementById('hintDisplay');
            const answerDisplay = document.getElementById('answerDisplay');
            const showAnswerBtn = document.getElementById('showAnswerBtn');
            const spinBtn = document.getElementById('spinBtn');
            
            hintDisplay.innerHTML = '<span class="text-gray-400">กดปุ่ม "สุ่มคำ" เพื่อเริ่มเกม! 🎯</span>';
            answerDisplay.classList.add('hidden');
            showAnswerBtn.classList.add('hidden');
            spinBtn.textContent = '🎰 สุ่มคำ';
            
            updateHistoryDisplay();
            updateUndoButton();
            updateRemainingCount();
        }

        // Initialize
        updateUndoButton();
        updateRemainingCount();