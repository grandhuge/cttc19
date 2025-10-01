        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAMY49YYOfOq4vmgV6-0B6Nw0YMbeNDKqY",
            authDomain: "cttc19suratthani.firebaseapp.com",
            databaseURL: "https://cttc19suratthani-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "cttc19suratthani",
            storageBucket: "cttc19suratthani.firebasestorage.app",
            messagingSenderId: "400782042259",
            appId: "1:400782042259:web:f2413290877d7d5a8c9966",
            measurementId: "G-60M90WD3KF"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Global variables
        let currentUser = null;
        let isAdmin = false;
        let codeReader = null;

        // DOM Elements
        const loginPage = document.getElementById('loginPage');
        const registerPage = document.getElementById('registerPage');
        const userDashboard = document.getElementById('userDashboard');
        const adminDashboard = document.getElementById('adminDashboard');

        // Show toast notification
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            
            toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${
                type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`;
            
            toastMessage.textContent = message;
            toast.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                toast.style.transform = 'translateX(100%)';
            }, 3000);
        }

        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.add('show');
        }

        function hideModal(modalId) {
            document.getElementById(modalId).classList.remove('show');
        }

        // Confirmation modal
        function showConfirmModal(title, message, onConfirm) {
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            
            const confirmOk = document.getElementById('confirmOk');
            const confirmCancel = document.getElementById('confirmCancel');
            
            // Remove existing event listeners
            confirmOk.replaceWith(confirmOk.cloneNode(true));
            confirmCancel.replaceWith(confirmCancel.cloneNode(true));
            
            // Add new event listeners
            document.getElementById('confirmOk').addEventListener('click', () => {
                hideModal('confirmModal');
                onConfirm();
            });
            
            document.getElementById('confirmCancel').addEventListener('click', () => {
                hideModal('confirmModal');
            });
            
            showModal('confirmModal');
        }

        // Info modal
        function showInfoModal(title, message) {
            document.getElementById('infoTitle').textContent = title;
            document.getElementById('infoMessage').innerHTML = message;
            
            const infoOk = document.getElementById('infoOk');
            infoOk.replaceWith(infoOk.cloneNode(true));
            
            document.getElementById('infoOk').addEventListener('click', () => {
                hideModal('infoModal');
            });
            
            showModal('infoModal');
        }

        // Alert functions
        function showAlert(type, message, duration = 3000) {
            const alertElement = document.getElementById(`${type}Alert`);
            const messageElement = document.getElementById(`${type}Message`);
            
            messageElement.textContent = message;
            alertElement.classList.add('show');
            
            setTimeout(() => {
                alertElement.classList.remove('show');
            }, duration);
        }

        function showSuccessAlert(message) {
            showAlert('success', message);
        }

        function showErrorAlert(message) {
            showAlert('error', message);
        }

        function showWarningAlert(message) {
            showAlert('warning', message);
        }

        // Show/Hide pages
        function showPage(page) {
            [loginPage, registerPage, userDashboard, adminDashboard].forEach(p => p.classList.add('hidden'));
            page.classList.remove('hidden');
        }

        // Update stamp display with visual elements
        function updateStampDisplay(stamps) {
            const stampsDisplay = document.getElementById('userStampsDisplay');
            const stampStars = document.getElementById('stampStars');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const levelBadge = document.getElementById('levelBadge');
            
            if (!stampsDisplay) return;
            
            // Update stamp counter
            stampsDisplay.textContent = stamps;
            
            // Calculate level and progress
            const level = Math.floor(stamps / 10) + 1;
            const currentLevelStamps = stamps % 10;
            const nextLevelStamps = 10;
            const progressPercent = (currentLevelStamps / nextLevelStamps) * 100;
            
            // Update progress bar
            progressFill.style.width = progressPercent + '%';
            progressText.textContent = `${currentLevelStamps} / ${nextLevelStamps} แต้มถึงเลเวลถัดไป`;
            
            // Update level badge
            const levelNames = {
                1: '🌟 เลเวล 1 - มือใหม่',
                2: '⭐ เลเวล 2 - มือสมัครเล่น',
                3: '🌠 เลเวล 3 - นักสะสม',
                4: '💫 เลเวล 4 - ผู้เชี่ยวชาญ',
                5: '🏆 เลเวล 5 - นักสะสมมืออาชีพ'
            };
            
            const levelName = levelNames[Math.min(level, 5)] || `🎖️ เลเวล ${level} - ตำนานนักสะสม`;
            levelBadge.textContent = levelName;
            
            // Generate stars based on stamps
            stampStars.innerHTML = '';
            const starCount = Math.min(stamps, 20); // Max 20 stars for display
            
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                star.style.setProperty('--delay', `${i * 0.1}s`);
                
                // Different star types based on count
                if (i < 5) star.textContent = '⭐';
                else if (i < 10) star.textContent = '🌟';
                else if (i < 15) star.textContent = '💫';
                else star.textContent = '✨';
                
                stampStars.appendChild(star);
            }
            
            // Add bonus stars for high levels
            if (level >= 3) {
                for (let i = 0; i < Math.min(level - 2, 5); i++) {
                    const bonusStar = document.createElement('span');
                    bonusStar.className = 'star';
                    bonusStar.style.setProperty('--delay', `${(starCount + i) * 0.1}s`);
                    bonusStar.textContent = '🏆';
                    stampStars.appendChild(bonusStar);
                }
            }
        }

        // Login form handler
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showWarningAlert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
                return;
            }

            // Check admin credentials
            if (username === 'admin' && password === 'Tle019') {
                isAdmin = true;
                currentUser = { username: 'admin', name: 'ผู้ดูแลระบบ' };
                showPage(adminDashboard);
                showSuccessAlert('เข้าสู่ระบบผู้ดูแลสำเร็จ');
                return;
            }

            // Check user credentials
            try {
                const userSnapshot = await database.ref(`users/${username}`).once('value');
                const userData = userSnapshot.val();
                
                if (userData && userData.password === password) {
                    isAdmin = false;
                    currentUser = userData;
                    currentUser.username = username;
                    
                    document.getElementById('userName').textContent = `สวัสดี ${userData.name}!`;
                    updateStampDisplay(userData.stamps || 0);
                    
                    showPage(userDashboard);
                    showSuccessAlert('เข้าสู่ระบบสำเร็จ');
                    
                    showInfoModal('ยินดีต้อนรับ!', 
                        `สวัสดี ${userData.name}<br>
                         สแตมป์ปัจจุบัน: ${userData.stamps || 0} แต้ม<br>
                         เริ่มสะสมสแตมป์ได้เลย!`);
                } else {
                    showErrorAlert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
                }
            } catch (error) {
                showErrorAlert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        });

        // Register form handler
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const name = document.getElementById('regName').value.trim();
            const password = document.getElementById('regPassword').value;

            if (!username || !name || !password) {
                showWarningAlert('กรุณากรอกข้อมูลให้ครบถ้วน');
                return;
            }

            if (username.length < 3) {
                showWarningAlert('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
                return;
            }

            if (password.length < 4) {
                showWarningAlert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
                return;
            }

            try {
                // Check if username already exists
                const userSnapshot = await database.ref(`users/${username}`).once('value');
                if (userSnapshot.exists()) {
                    showErrorAlert('ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาเลือกชื่อใหม่');
                    return;
                }

                // Create new user
                await database.ref(`users/${username}`).set({
                    name: name,
                    password: password,
                    stamps: 0,
                    createdAt: Date.now()
                });

                showSuccessAlert('สมัครสมาชิกสำเร็จ');
                showInfoModal('สมัครสมาชิกสำเร็จ!', 
                    `ยินดีต้อนรับ ${name}!<br>
                     ชื่อผู้ใช้: ${username}<br>
                     คุณสามารถเข้าสู่ระบบได้แล้ว`);
                
                showPage(loginPage);
                document.getElementById('registerForm').reset();
                
                // Auto fill login form
                document.getElementById('username').value = username;
            } catch (error) {
                showErrorAlert('เกิดข้อผิดพลาดในการสมัครสมาชิก');
            }
        });

        // Navigation between login and register
        document.getElementById('showRegister').addEventListener('click', () => showPage(registerPage));
        document.getElementById('showLogin').addEventListener('click', () => showPage(loginPage));

        // Logout handlers
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('adminLogoutBtn').addEventListener('click', logout);

        function logout() {
            showConfirmModal(
                'ออกจากระบบ',
                'คุณต้องการออกจากระบบใช่หรือไม่?',
                () => {
                    currentUser = null;
                    isAdmin = false;
                    showPage(loginPage);
                    document.getElementById('loginForm').reset();
                    
                    // Reset forms and hide containers
                    document.getElementById('stampQRContainer').classList.add('hidden');
                    document.getElementById('redeemQRContainer').classList.add('hidden');
                    document.getElementById('redeemInfo').classList.add('hidden');
                    
                    showSuccessAlert('ออกจากระบบแล้ว');
                }
            );
        }

        // Generate stamp QR code (Admin)
        document.getElementById('generateStampQR').addEventListener('click', async () => {
            const amount = document.getElementById('stampAmount').value;
            if (!amount || amount < 1) {
                showErrorAlert('กรุณากรอกจำนวนสแตมป์ที่ถูกต้อง');
                return;
            }

            try {
                // Generate unique QR ID
                const qrId = 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // Save QR code to database
                await database.ref(`qrcodes/${qrId}`).set({
                    type: 'stamp',
                    amount: parseInt(amount),
                    timestamp: Date.now(),
                    used: false,
                    createdBy: 'admin'
                });

                const qrData = JSON.stringify({
                    type: 'stamp',
                    qrId: qrId,
                    amount: parseInt(amount),
                    timestamp: Date.now()
                });

                const qr = new QRious({
                    element: document.getElementById('stampQRCode'),
                    value: qrData,
                    size: 200,
                    background: 'white',
                    foreground: 'black'
                });

                document.getElementById('stampQRContainer').classList.remove('hidden');
                showSuccessAlert('สร้าง QR Code สำเร็จ');
                
                showInfoModal('QR Code สร้างสำเร็จ', 
                    `QR Code นี้สามารถใช้ได้เพียงครั้งเดียวเท่านั้น<br>
                     จำนวนสแตมป์: ${amount} แต้ม<br>
                     รหัส QR: ${qrId}`);
            } catch (error) {
                showErrorAlert('เกิดข้อผิดพลาดในการสร้าง QR Code');
            }
        });

        // Generate redeem QR code (User)
        document.getElementById('generateRedeemQR').addEventListener('click', () => {
            const amount = document.getElementById('redeemAmount').value;
            const userStamps = currentUser.stamps || 0;
            
            if (!amount || amount < 1) {
                showErrorAlert('กรุณากรอกจำนวนสแตมป์ที่ถูกต้อง');
                return;
            }
            
            if (parseInt(amount) > userStamps) {
                showWarningAlert('สแตมป์ของคุณไม่เพียงพอสำหรับการแลกรางวัล');
                return;
            }

            showConfirmModal(
                'ยืนยันการแลกรางวัล',
                `คุณต้องการแลกสแตมป์ ${amount} แต้ม ใช่หรือไม่?`,
                () => {
                    const qrData = JSON.stringify({
                        type: 'redeem',
                        username: currentUser.username,
                        amount: parseInt(amount),
                        timestamp: Date.now()
                    });

                    const qr = new QRious({
                        element: document.getElementById('redeemQRCode'),
                        value: qrData,
                        size: 200,
                        background: 'white',
                        foreground: 'black'
                    });

                    document.getElementById('redeemQRContainer').classList.remove('hidden');
                    showSuccessAlert('สร้าง QR Code สำหรับแลกรางวัลสำเร็จ');
                    
                    showInfoModal('QR Code พร้อมใช้งาน', 
                        `กรุณาแสดง QR Code นี้ให้ผู้ดูแลระบบ<br>
                         จำนวนสแตมป์ที่แลก: ${amount} แต้ม<br>
                         <strong>หมายเหตุ:</strong> QR Code นี้จะหมดอายุใน 10 นาที`);
                }
            );
        });

        // QR Scanner functions
        let isScanning = false;

        async function startScanner(videoElement, isUserScanner = true) {
            if (isScanning) return;
            
            try {
                if (!codeReader) {
                    codeReader = new ZXing.BrowserQRCodeReader();
                }

                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                videoElement.srcObject = stream;
                videoElement.classList.remove('hidden');
                isScanning = true;
                
                if (isUserScanner) {
                    document.getElementById('userScanPlaceholder').classList.add('hidden');
                } else {
                    document.getElementById('adminScanPlaceholder').classList.add('hidden');
                }

                codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {
                    if (result && isScanning) {
                        handleQRResult(result.text, isUserScanner);
                        stopScanner(videoElement, isUserScanner);
                    }
                });
            } catch (error) {
                isScanning = false;
                showToast('ไม่สามารถเข้าถึงกล้องได้', 'error');
            }
        }

        function stopScanner(videoElement, isUserScanner = true) {
            isScanning = false;
            
            if (videoElement.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            
            videoElement.classList.add('hidden');
            
            if (isUserScanner) {
                document.getElementById('userScanPlaceholder').classList.remove('hidden');
            } else {
                document.getElementById('adminScanPlaceholder').classList.remove('hidden');
            }
        }

        // Handle QR scan results
        async function handleQRResult(qrText, isUserScanner) {
            try {
                const qrData = JSON.parse(qrText);
                
                if (isUserScanner && qrData.type === 'stamp') {
                    // User scanning stamp QR - Check if QR code is still valid
                    if (!qrData.qrId) {
                        showErrorAlert('QR Code รุ่นเก่าไม่สามารถใช้งานได้');
                        return;
                    }
                    
                    const qrSnapshot = await database.ref(`qrcodes/${qrData.qrId}`).once('value');
                    const qrInfo = qrSnapshot.val();
                    
                    if (!qrInfo) {
                        showErrorAlert('QR Code ไม่ถูกต้องหรือไม่มีอยู่ในระบบ');
                        return;
                    }
                    
                    if (qrInfo.used) {
                        showWarningAlert('QR Code นี้ถูกใช้งานไปแล้ว ไม่สามารถใช้ซ้ำได้');
                        return;
                    }
                    
                    // Mark QR code as used and record who used it
                    await database.ref(`qrcodes/${qrData.qrId}`).update({
                        used: true,
                        usedBy: currentUser.username,
                        usedAt: Date.now()
                    });
                    
                    // Add stamps to user
                    const newStamps = (currentUser.stamps || 0) + qrData.amount;
                    await database.ref(`users/${currentUser.username}/stamps`).set(newStamps);
                    
                    // Record transaction
                    await database.ref('transactions').push({
                        username: currentUser.username,
                        amount: qrData.amount,
                        timestamp: Date.now(),
                        type: 'earn',
                        qrId: qrData.qrId
                    });
                    
                    currentUser.stamps = newStamps;
                    updateStampDisplay(newStamps);
                    
                    showSuccessAlert(`ได้รับสแตมป์ ${qrData.amount} แต้ม!`);
                    
                } else if (!isUserScanner && qrData.type === 'redeem') {
                    // Admin scanning redeem QR
                    const currentTime = Date.now();
                    const qrAge = currentTime - qrData.timestamp;
                    const maxAge = 10 * 60 * 1000; // 10 minutes
                    
                    if (qrAge > maxAge) {
                        showErrorAlert('QR Code หมดอายุแล้ว (เกิน 10 นาที)');
                        return;
                    }
                    
                    const userSnapshot = await database.ref(`users/${qrData.username}`).once('value');
                    const userData = userSnapshot.val();
                    
                    if (!userData) {
                        showErrorAlert('ไม่พบข้อมูลผู้ใช้');
                        return;
                    }
                    
                    if (userData.stamps < qrData.amount) {
                        showWarningAlert('ผู้ใช้ไม่มีสแตมป์เพียงพอ');
                        return;
                    }
                    
                    document.getElementById('redeemDetails').innerHTML = `
                        <p><strong>ผู้ใช้:</strong> ${userData.name} (${qrData.username})</p>
                        <p><strong>จำนวนสแตมป์ที่แลก:</strong> ${qrData.amount} แต้ม</p>
                        <p><strong>สแตมป์คงเหลือ:</strong> ${userData.stamps} แต้ม</p>
                        <p><strong>สแตมป์หลังแลก:</strong> ${userData.stamps - qrData.amount} แต้ม</p>
                    `;
                    document.getElementById('redeemInfo').classList.remove('hidden');
                    
                    // Store redeem data for confirmation
                    window.pendingRedeem = qrData;
                    
                } else {
                    showErrorAlert('QR Code ไม่ถูกต้องหรือไม่สามารถใช้งานได้');
                }
            } catch (error) {
                showErrorAlert('ไม่สามารถอ่าน QR Code ได้ กรุณาลองใหม่');
            }
        }

        // Scanner button handlers
        document.getElementById('startUserScan').addEventListener('click', () => {
            startScanner(document.getElementById('userVideo'), true);
        });

        document.getElementById('startAdminScan').addEventListener('click', () => {
            startScanner(document.getElementById('adminVideo'), false);
        });

        // Redeem confirmation handlers
        document.getElementById('confirmRedeem').addEventListener('click', async () => {
            if (!window.pendingRedeem) return;
            
            showConfirmModal(
                'ยืนยันการแลกรางวัล',
                'คุณแน่ใจหรือไม่ที่จะอนุมัติการแลกรางวัลนี้?',
                async () => {
                    try {
                        const redeemData = window.pendingRedeem;
                        const userRef = database.ref(`users/${redeemData.username}`);
                        const userSnapshot = await userRef.once('value');
                        const userData = userSnapshot.val();
                        
                        if (userData && userData.stamps >= redeemData.amount) {
                            // Update user stamps
                            const newStamps = userData.stamps - redeemData.amount;
                            await userRef.update({ stamps: newStamps });
                            
                            // Record transaction
                            await database.ref('transactions').push({
                                username: redeemData.username,
                                amount: redeemData.amount,
                                timestamp: Date.now(),
                                type: 'redeem',
                                approvedBy: 'admin'
                            });
                            
                            showSuccessAlert('แลกรางวัลสำเร็จ');
                            document.getElementById('redeemInfo').classList.add('hidden');
                            window.pendingRedeem = null;
                            
                            showInfoModal('การแลกรางวัลสำเร็จ', 
                                `ผู้ใช้: ${userData.name}<br>
                                 แลกสแตมป์: ${redeemData.amount} แต้ม<br>
                                 สแตมป์คงเหลือ: ${newStamps} แต้ม`);
                        } else {
                            showErrorAlert('ข้อมูลไม่ถูกต้องหรือสแตมป์ไม่เพียงพอ');
                        }
                    } catch (error) {
                        showErrorAlert('เกิดข้อผิดพลาดในการแลกรางวัล');
                    }
                }
            );
        });

        document.getElementById('cancelRedeem').addEventListener('click', () => {
            showConfirmModal(
                'ยกเลิกการแลกรางวัล',
                'คุณต้องการยกเลิกการแลกรางวัลนี้ใช่หรือไม่?',
                () => {
                    document.getElementById('redeemInfo').classList.add('hidden');
                    window.pendingRedeem = null;
                    showToast('ยกเลิกการแลกรางวัลแล้ว');
                }
            );
        });

        // Initialize app
        showPage(loginPage);
    