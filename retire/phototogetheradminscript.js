    // --- FULL SCRIPT (The omitted parts from above are filled in here) ---
    // This is to ensure the final code block is complete and runnable.

    async function apiCall(action, payload = {}) {
        let loadingMessage = 'กำลังโหลดข้อมูล...';
        const actionMap = {
            login: 'กำลังเข้าสู่ระบบ...', register: 'กำลังลงทะเบียน...',
            getPlayerData: 'กำลังโหลดข้อมูลผู้เล่น...', uploadPhoto: 'กำลังอัปโหลดรูปภาพ...',
            getAdminData: 'กำลังโหลดข้อมูลแอดมิน...', approvePhoto: 'กำลังอนุมัติรูปภาพ...',
            rejectPhoto: 'กำลังปฏิเสธรูปภาพ...', addUser: 'กำลังเพิ่มผู้ใช้...',
            updateUser: 'กำลังอัปเดตผู้ใช้...', deleteUser: 'กำลังลบผู้ใช้...',
            addRetiree: 'กำลังเพิ่มผู้เกษียณ...', updateRetiree: 'กำลังอัปเดตผู้เกษียณ...',
            deleteRetiree: 'กำลังลบผู้เกษียณ...'
        };
        loadingMessage = actionMap[action] || loadingMessage;
        
        showLoading(true, loadingMessage);
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST', mode: 'cors', redirect: 'follow',
                headers: { 'Content-Type': 'text/plain;charset=utf-8', },
                body: JSON.stringify({ action, ...payload })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.status === 'error') throw new Error(result.message);
            return result;
        } catch (error) {
            console.error('API Call Error:', error);
            showAlert('เกิดข้อผิดพลาด', error.message, 'error');
            return { status: 'error', message: error.message }; 
        } finally {
            showLoading(false);
        }
    }
        
    function showLoading(show, text = 'กำลังโหลด...') {
        dom.loadingText.textContent = text;
        dom.loadingOverlay.classList.toggle('hidden', !show);
    }

    function showPage(pageId) {
        ['authPage', 'playerDashboard', 'adminDashboard'].forEach(key => {
            dom[key].classList.add('hidden');
        });
        if (pageId) {
             dom[pageId].classList.remove('hidden');
        }
    }
    
    function showAlert(title, message, type = 'info') {
        const modal = document.getElementById('alert-modal');
        const icon = document.getElementById('alert-icon');
        const btn = document.getElementById('alert-close-btn');
        document.getElementById('alert-title').textContent = title;
        document.getElementById('alert-message').textContent = message;
        if (type === 'success') { icon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>'; btn.className = 'btn-primary w-full bg-green-500 hover:bg-green-600'; }
        else if (type === 'error') { icon.innerHTML = '<i class="fas fa-times-circle text-red-500"></i>'; btn.className = 'btn-primary w-full bg-red-500 hover:bg-red-600'; }
        else { icon.innerHTML = '<i class="fas fa-info-circle text-blue-500"></i>'; btn.className = 'btn-primary w-full'; }
        modal.classList.remove('hidden');
    }

    async function loadFaceApiModels() {
        if (faceApiModelsLoaded) return;
        showLoading(true, 'กำลังโหลดโมเดล AI...');
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights');
            faceApiModelsLoaded = true;
        } catch (error) {
             showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดโมเดล AI สำหรับตรวจจับใบหน้าได้', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    function getBase64Image(img) {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg");
        return dataURL.split(',')[1];
    }
    
    function initializeApp() {
        if (!currentUser) {
            const storedUser = sessionStorage.getItem('currentUser');
            if (storedUser) currentUser = JSON.parse(storedUser);
        }
        if (currentUser) {
            if (currentUser.role === 'admin') { showPage('adminDashboard'); loadAdminData(); }
            else { showPage('playerDashboard'); loadPlayerData(); }
        } else {
            showPage('authPage');
        }
    }
    
    function handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        if (!username || !password) return showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'error');
        apiCall('login', { username, password }).then(result => {
            if (result.status === 'success') {
                currentUser = result.data;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                initializeApp();
            }
        });
    }
    
    function handleRegister() {
        const name = document.getElementById('register-name').value.trim();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        if (!name || !username || !password) return showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลทั้งหมด', 'error');
        apiCall('register', { name, username, password }).then(result => {
            if (result.status === 'success') {
                showAlert('ลงทะเบียนสำเร็จ', 'คุณสามารถเข้าสู่ระบบได้เลย', 'success');
                dom.registerForm.classList.add('hidden');
                dom.loginForm.classList.remove('hidden');
            }
        });
    }
    
    function handleLogout() {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        showPage('authPage');
    }

    async function loadPlayerData() {
        const result = await apiCall('getPlayerData', { username: currentUser.username });
        if (result.status === 'success') renderPlayerDashboard(result.data);
    }
    
    function renderPlayerDashboard(data) {
        const { event, submissions } = data;
        document.getElementById('player-name').textContent = currentUser.name;
        document.getElementById('mission-progress').textContent = `ภารกิจ: ${submissions.filter(s => s.status === 'approved').length}/${event.targetCount}`;
        const container = document.getElementById('retiree-list');
        container.innerHTML = '';
        event.retirees.forEach(retiree => {
            const sub = submissions.find(s => s.retireeName === retiree.name);
            const card = document.createElement('div');
            card.className = 'card p-4 flex flex-col items-center';
            let statusBadge = '';
            let btnHtml = `<button class="w-full mt-auto btn-primary upload-btn"><i class="fas fa-upload mr-2"></i>ส่งภาพ</button>`;
            if(sub) {
                statusBadge = `<span class="status-${sub.status.toLowerCase()} text-xs font-semibold px-2.5 py-1 rounded-full absolute top-2 right-2">${sub.status}</span>`;
                if(sub.status === 'approved') btnHtml = `<button class="w-full mt-auto bg-green-500 text-white py-2 px-4 rounded-lg" disabled><i class="fas fa-check-circle mr-2"></i>อนุมัติแล้ว</button>`;
                else if(sub.status === 'pending') btnHtml = `<button class="w-full mt-auto bg-yellow-500 text-white py-2 px-4 rounded-lg" disabled><i class="fas fa-clock mr-2"></i>รอตรวจสอบ</button>`;
                else if(sub.status === 'rejected') btnHtml = `<button class="w-full mt-auto btn-primary upload-btn bg-red-500 hover:bg-red-600"><i class="fas fa-redo mr-2"></i>ส่งภาพใหม่</button>`;
            }
            card.innerHTML = `<div class="relative w-full">${statusBadge}<img src="${retiree.profilePicUrl}" class="w-32 h-32 rounded-full mx-auto object-cover border-4"></div><h3 class="text-lg font-semibold mt-4 text-center">${retiree.name}</h3><p class="text-sm text-gray-500 text-center mb-4">${retiree.position}</p>${btnHtml}`;
            card.querySelector('.upload-btn')?.addEventListener('click', () => openUploadModal(retiree));
            container.appendChild(card);
        });
    }

    function openUploadModal(retiree) {
        currentRetiree = retiree;
        document.getElementById('modal-title').textContent = `อัปโหลดภาพคู่กับ: ${retiree.name}`;
        document.getElementById('image-preview-container').classList.add('hidden');
        document.getElementById('confirm-upload-btn').disabled = true;
        document.getElementById('photo-upload-input').value = '';
        document.getElementById('upload-modal').classList.remove('hidden');
    }
    
    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('image-preview-container').classList.remove('hidden');
            document.getElementById('confirm-upload-btn').disabled = true;
            showLoading(true, 'กำลังตรวจจับใบหน้า...');
            try {
                const detections = await faceapi.detectAllFaces(document.getElementById('image-preview'), new faceapi.TinyFaceDetectorOptions());
                const statusEl = document.getElementById('face-detection-status');
                if (detections.length >= 2) {
                    statusEl.textContent = `ตรวจพบ ${detections.length} ใบหน้า (ผ่าน)`;
                    statusEl.className = 'mt-2 text-sm font-medium text-green-600';
                    document.getElementById('confirm-upload-btn').disabled = false;
                } else {
                    statusEl.textContent = `ตรวจพบ ${detections.length} ใบหน้า (ต้องมีอย่างน้อย 2 คน)`;
                    statusEl.className = 'mt-2 text-sm font-medium text-red-600';
                }
            } catch (error) { console.error("Face detection failed:", error); } 
            finally { showLoading(false); }
        };
        reader.readAsDataURL(file);
    }

    async function confirmUpload() {
        const base64Image = getBase64Image(document.getElementById('image-preview'));
        const fileName = `${currentUser.username}_${currentRetiree.name.replace(/\s/g, '')}_${Date.now()}.jpg`;
        const result = await apiCall('uploadPhoto', {
            username: currentUser.username, retireeName: currentRetiree.name,
            fileData: base64Image, fileName: fileName, mimeType: 'image/jpeg'
        });
        if (result.status === 'success') {
            document.getElementById('upload-modal').classList.add('hidden');
            showAlert('สำเร็จ', 'ส่งภาพเรียบร้อย รอการตรวจสอบ', 'success');
            loadPlayerData();
        }
    }
    
    function renderPending(pending) {
        const container = document.getElementById('pending-approvals');
        container.innerHTML = pending.length === 0 ? '<p class="text-gray-500 text-center">ไม่มีภาพที่รอการตรวจสอบ</p>' : '';
        pending.forEach(item => {
            const div = document.createElement('div');
            div.className = 'p-4 border rounded-lg flex flex-col md:flex-row items-center gap-4';
            
            // Helper to convert Google Drive link to a direct thumbnail link
            const getDriveThumbnailUrl = (url) => {
                if (typeof url !== 'string') return '';
                const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
                }
                return url; // Fallback
            };

            div.innerHTML = `
                <a href="${item.fileUrl}" target="_blank" title="คลิกเพื่อดูภาพเต็ม">
                    <img src="${getDriveThumbnailUrl(item.fileUrl)}" alt="Submission" class="w-24 h-24 object-cover rounded-md bg-gray-200">
                </a>
                <div class="flex-grow text-center md:text-left">
                    <p><strong>ผู้ส่ง:</strong> ${item.name} (${item.username})</p>
                    <p><strong>ผู้เกษียณ:</strong> ${item.retireeName}</p>
                    <p class="text-xs text-gray-500">Row: ${item.sheetRow}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="approve-btn bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">อนุมัติ</button>
                    <button class="reject-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">ปฏิเสธ</button>
                </div>
            `;
            div.querySelector('.approve-btn').addEventListener('click', () => handleApproval(item.sheetRow, 'approvePhoto'));
            div.querySelector('.reject-btn').addEventListener('click', () => handleApproval(item.sheetRow, 'rejectPhoto'));
            container.appendChild(div);
        });
    }

    function renderLeaderboard(leaderboard) {
        const container = document.getElementById('leaderboard');
        container.innerHTML = leaderboard.length === 0 ? '<p class="text-gray-500 text-center">ยังไม่มีข้อมูลสรุป</p>' : '';
        leaderboard.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-2 rounded ' + (index % 2 === 0 ? 'bg-gray-50' : '');
            let icon = '';
            if (index === 0) icon = '<i class="fas fa-trophy text-yellow-400"></i>';
            else if (index === 1) icon = '<i class="fas fa-medal text-gray-400"></i>';
            else if (index === 2) icon = '<i class="fas fa-award text-yellow-600"></i>';
            div.innerHTML = `<div class="flex items-center gap-3"><span class="font-bold w-6 text-center">${index + 1} ${icon}</span><span>${player.name}</span></div><span class="font-semibold text-blue-600">${player.approvedCount} ภาพ</span>`;
            container.appendChild(div);
        });
    }

    function showConfirmation(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        modal.classList.remove('hidden');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const close = () => modal.classList.add('hidden');
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        newOkBtn.addEventListener('click', () => { onConfirm(); close(); }, { once: true });
        cancelBtn.addEventListener('click', close, { once: true });
    }

    function openRetireeModal(retiree = null) {
        const modal = document.getElementById('retiree-modal');
        document.getElementById('retiree-modal-title').textContent = retiree ? 'แก้ไขข้อมูลผู้เกษียณ' : 'เพิ่มผู้เกษียณใหม่';
        document.getElementById('retiree-row-index').value = retiree ? retiree.rowIndex : '';
        document.getElementById('retiree-name').value = retiree ? retiree.name : '';
        document.getElementById('retiree-position').value = retiree ? retiree.position : '';
        document.getElementById('retiree-url').value = retiree ? retiree.profilePicUrl : '';
        modal.classList.remove('hidden');
    }
    
    async function saveRetiree() {
        const rowIndex = document.getElementById('retiree-row-index').value;
        const payload = {
            name: document.getElementById('retiree-name').value,
            position: document.getElementById('retiree-position').value,
            profilePicUrl: document.getElementById('retiree-url').value,
        };
        const action = rowIndex ? 'updateRetiree' : 'addRetiree';
        if(rowIndex) payload.rowIndex = rowIndex;
        const result = await apiCall(action, payload);
        if(result.status === 'success') {
            document.getElementById('retiree-modal').classList.add('hidden');
            showAlert('สำเร็จ', 'บันทึกข้อมูลผู้เกษียณเรียบร้อย', 'success');
            loadAdminData();
        }
    }
    
    function deleteRetiree(retiree) {
        showConfirmation('ยืนยันการลบ', `คุณต้องการลบผู้เกษียณ "${retiree.name}" ใช่หรือไม่?`, async () => {
            const result = await apiCall('deleteRetiree', { rowIndex: retiree.rowIndex });
            if(result.status === 'success') {
                showAlert('สำเร็จ', 'ลบผู้เกษียณเรียบร้อย', 'success');
                loadAdminData();
            }
        });
    }

    