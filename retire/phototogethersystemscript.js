        // --- CONFIGURATION ---
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwm0VKDjQMYUb3klhmbYHyGc6ipal-GwQ2xsezY0ZKLfWT9NBnNmzihvFt_FbZjiSUjzA/exec";

        // --- STATE ---
        let currentUser = null;
        let currentRetiree = null;
        let faceApiModelsLoaded = false;
        let adminDataCache = null;

        // --- DOM ELEMENTS ---
        const dom = {
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            authPage: document.getElementById('auth-page'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            playerDashboard: document.getElementById('player-dashboard'),
            adminDashboard: document.getElementById('admin-dashboard'),
        };

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            setupModalHTML();
            initializeApp();
            loadFaceApiModels();
            setupEventListeners();
        });

        function setupModalHTML() {
            // Inject modal HTML to keep main body clean
            document.getElementById('upload-modal').innerHTML = `
                <div class="card p-6 w-full max-w-lg mx-4 relative">
                    <button id="close-upload-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    <h3 id="modal-title" class="text-2xl font-semibold mb-4">อัปโหลดภาพคู่กับ: </h3>
                    <input type="file" id="photo-upload-input" class="hidden" accept="image/*">
                    <button id="select-photo-btn" class="w-full btn-primary mb-2"><i class="fas fa-camera mr-2"></i>เลือก/ถ่ายภาพ</button>
                    <div id="image-preview-container" class="hidden mb-4 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <img id="image-preview" src="#" alt="Image Preview" class="max-h-64 w-auto mx-auto rounded-md"/>
                        <p id="face-detection-status" class="mt-2 text-sm font-medium"></p>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button id="cancel-upload-btn" class="bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button id="confirm-upload-btn" class="btn-primary py-2 px-6 disabled:bg-gray-400" disabled>ยืนยัน</button>
                    </div>
                </div>`;
            
            document.getElementById('alert-modal').innerHTML = `
                <div class="card p-8 w-full max-w-sm mx-4 text-center">
                    <div id="alert-icon" class="text-5xl mb-4"></div>
                    <h3 id="alert-title" class="text-2xl font-semibold mb-2"></h3>
                    <p id="alert-message" class="text-gray-600 mb-6"></p>
                    <button id="alert-close-btn" class="btn-primary w-full">ตกลง</button>
                </div>`;
            
            document.getElementById('confirm-modal').innerHTML = `
                <div class="card p-8 w-full max-w-sm mx-4 text-center">
                    <div class="text-5xl mb-4 text-yellow-500"><i class="fas fa-exclamation-triangle"></i></div>
                    <h3 id="confirm-title" class="text-2xl font-semibold mb-2"></h3>
                    <p id="confirm-message" class="text-gray-600 mb-6"></p>
                    <div class="flex justify-center space-x-4">
                        <button id="confirm-cancel-btn" class="bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button id="confirm-ok-btn" class="btn-primary bg-red-600 hover:bg-red-700 py-2 px-6">ยืนยัน</button>
                    </div>
                </div>`;

            document.getElementById('user-modal').innerHTML = `
                <div class="card p-6 w-full max-w-lg mx-4 relative">
                    <button id="close-user-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    <h3 id="user-modal-title" class="text-2xl font-semibold mb-4">จัดการผู้ใช้</h3>
                    <input type="hidden" id="user-row-index">
                    <div class="space-y-4">
                        <input id="user-name" type="text" placeholder="ชื่อ-สกุล" class="w-full p-3 border rounded-lg">
                        <input id="user-username" type="text" placeholder="Username" class="w-full p-3 border rounded-lg">
                        <input id="user-password" type="text" placeholder="รหัสผ่าน" class="w-full p-3 border rounded-lg">
                        <select id="user-role" class="w-full p-3 border rounded-lg bg-white"><option value="player">Player</option><option value="admin">Admin</option></select>
                    </div>
                    <div class="flex justify-end mt-6">
                        <button id="save-user-btn" class="btn-primary py-2 px-6">บันทึก</button>
                    </div>
                </div>`;
            
            document.getElementById('retiree-modal').innerHTML = `
                <div class="card p-6 w-full max-w-lg mx-4 relative">
                    <button id="close-retiree-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                    <h3 id="retiree-modal-title" class="text-2xl font-semibold mb-4">จัดการผู้เกษียณ</h3>
                    <input type="hidden" id="retiree-row-index">
                    <div class="space-y-4">
                        <input id="retiree-name" type="text" placeholder="ชื่อ-สกุล" class="w-full p-3 border rounded-lg">
                        <input id="retiree-position" type="text" placeholder="ตำแหน่ง" class="w-full p-3 border rounded-lg">
                        <input id="retiree-url" type="text" placeholder="URL รูปโปรไฟล์" class="w-full p-3 border rounded-lg">
                    </div>
                    <div class="flex justify-end mt-6">
                        <button id="save-retiree-btn" class="btn-primary py-2 px-6">บันทึก</button>
                    </div>
                </div>`;
        }
        
        // --- EVENT LISTENERS ---
        function setupEventListeners() {
            // Auth
            document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); dom.loginForm.classList.add('hidden'); dom.registerForm.classList.remove('hidden'); });
            document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); dom.registerForm.classList.add('hidden'); dom.loginForm.classList.remove('hidden'); });
            document.getElementById('login-btn').addEventListener('click', handleLogin);
            document.getElementById('register-btn').addEventListener('click', handleRegister);
            document.getElementById('logout-btn-player').addEventListener('click', handleLogout);
            document.getElementById('logout-btn-admin').addEventListener('click', handleLogout);

            // Admin
            document.getElementById('refresh-admin-btn').addEventListener('click', loadAdminData);
            document.querySelectorAll('.admin-tab').forEach(tab => tab.addEventListener('click', handleTabClick));
            document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());
            document.getElementById('add-retiree-btn').addEventListener('click', () => openRetireeModal());
            
            // Modals
            document.getElementById('close-upload-modal-btn').addEventListener('click', () => document.getElementById('upload-modal').classList.add('hidden'));
            document.getElementById('cancel-upload-btn').addEventListener('click', () => document.getElementById('upload-modal').classList.add('hidden'));
            document.getElementById('select-photo-btn').addEventListener('click', () => document.getElementById('photo-upload-input').click());
            document.getElementById('photo-upload-input').addEventListener('change', handleImageUpload);
            document.getElementById('confirm-upload-btn').addEventListener('click', confirmUpload);
            document.getElementById('alert-close-btn').addEventListener('click', () => document.getElementById('alert-modal').classList.add('hidden'));
            document.getElementById('close-user-modal-btn').addEventListener('click', () => document.getElementById('user-modal').classList.add('hidden'));
            document.getElementById('save-user-btn').addEventListener('click', saveUser);
            document.getElementById('close-retiree-modal-btn').addEventListener('click', () => document.getElementById('retiree-modal').classList.add('hidden'));
            document.getElementById('save-retiree-btn').addEventListener('click', saveRetiree);
        }
        
        // --- API & Core Logic ---
        async function apiCall(action, payload = {}) { /* ... (same as before, full code omitted for brevity) ... */ }
        function showLoading(show, text = 'กำลังโหลด...') { /* ... (same as before) ... */ }
        function showAlert(title, message, type = 'info') { /* ... (same as before) ... */ }
        function showPage(pageId) { /* ... (same as before) ... */ }
        async function loadFaceApiModels() { /* ... (same as before) ... */ }
        function getBase64Image(img) { /* ... (same as before) ... */ }

        // --- AUTH ---
        function handleLogin() { /* ... (same as before) ... */ }
        function handleRegister() { /* ... (same as before) ... */ }
        function handleLogout() { /* ... (same as before) ... */ }
        
        // --- PLAYER ---
        function renderPlayerDashboard(data) { /* ... (same as before) ... */ }
        async function loadPlayerData() { /* ... (same as before) ... */ }
        async function handleImageUpload(event) { /* ... (same as before) ... */ }
        async function confirmUpload() { /* ... (same as before) ... */ }

        // --- ADMIN ---
        function handleTabClick(e) {
            e.preventDefault();
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-content').forEach(c => c.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(`content-${e.target.id.split('-')[1]}`).classList.remove('hidden');
        }

        async function loadAdminData() {
            const result = await apiCall('getAdminData');
            if (result.status === 'success') {
                adminDataCache = result.data;
                renderAdminDashboard(adminDataCache);
            }
        }

        function renderAdminDashboard(data) {
            // Render all parts of the admin dash
            renderPending(data.pending);
            renderLeaderboard(data.leaderboard);
            renderUserManagement(data.users);
            renderRetireeManagement(data.retirees);
        }

        function renderPending(pending) {
            const container = document.getElementById('pending-approvals');
            container.innerHTML = pending.length === 0 ? '<p class="text-gray-500 text-center">ไม่มีภาพที่รอการตรวจสอบ</p>' : '';
            pending.forEach(item => {
                const div = document.createElement('div');
                div.className = 'p-4 border rounded-lg flex flex-col md:flex-row items-center gap-4';
                div.innerHTML = `...`; // Same as before
                div.querySelector('.approve-btn').addEventListener('click', () => handleApproval(item.sheetRow, 'approvePhoto'));
                div.querySelector('.reject-btn').addEventListener('click', () => handleApproval(item.sheetRow, 'rejectPhoto'));
                container.appendChild(div);
            });
        }
        function renderLeaderboard(leaderboard) { /* ... (same as before) ... */ }

        function renderUserManagement(users) {
            const tbody = document.getElementById('users-table-body');
            tbody.innerHTML = '';
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.className = 'border-b';
                tr.innerHTML = `
                    <td class="py-2 px-4">${user.name}</td>
                    <td class="py-2 px-4">${user.username}</td>
                    <td class="py-2 px-4">${user.role}</td>
                    <td class="py-2 px-4 space-x-2">
                        <button class="edit-user-btn text-blue-500 hover:text-blue-700" data-row-index="${user.rowIndex}"><i class="fas fa-edit"></i></button>
                        <button class="delete-user-btn text-red-500 hover:text-red-700" data-row-index="${user.rowIndex}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tr.querySelector('.edit-user-btn').addEventListener('click', () => openUserModal(user));
                tr.querySelector('.delete-user-btn').addEventListener('click', () => deleteUser(user));
                tbody.appendChild(tr);
            });
        }
        function renderRetireeManagement(retirees) {
            const tbody = document.getElementById('retirees-table-body');
            tbody.innerHTML = '';
            retirees.forEach(retiree => {
                const tr = document.createElement('tr');
                tr.className = 'border-b';
                tr.innerHTML = `
                    <td class="py-2 px-4"><img src="${retiree.profilePicUrl}" class="w-10 h-10 rounded-full object-cover"></td>
                    <td class="py-2 px-4">${retiree.name}</td>
                    <td class="py-2 px-4">${retiree.position}</td>
                    <td class="py-2 px-4 space-x-2">
                        <button class="edit-retiree-btn text-blue-500 hover:text-blue-700" data-row-index="${retiree.rowIndex}"><i class="fas fa-edit"></i></button>
                        <button class="delete-retiree-btn text-red-500 hover:text-red-700" data-row-index="${retiree.rowIndex}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tr.querySelector('.edit-retiree-btn').addEventListener('click', () => openRetireeModal(retiree));
                tr.querySelector('.delete-retiree-btn').addEventListener('click', () => deleteRetiree(retiree));
                tbody.appendChild(tr);
            });
        }
        
        async function handleApproval(sheetRow, action) {
             const result = await apiCall(action, { sheetRow });
            if (result.status === 'success') {
                showAlert('สำเร็จ', 'อัปเดตสถานะเรียบร้อย', 'success');
                loadAdminData();
            }
        }
        
        // --- CRUD MODAL LOGIC ---
        function showConfirmation(title, message, onConfirm) {
            // ... (same as before) ...
        }

        function openUserModal(user = null) {
            const modal = document.getElementById('user-modal');
            document.getElementById('user-modal-title').textContent = user ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่';
            document.getElementById('user-row-index').value = user ? user.rowIndex : '';
            document.getElementById('user-name').value = user ? user.name : '';
            document.getElementById('user-username').value = user ? user.username : '';
            document.getElementById('user-password').value = user ? user.password : '';
            document.getElementById('user-role').value = user ? user.role : 'player';
            modal.classList.remove('hidden');
        }

        async function saveUser() {
            const rowIndex = document.getElementById('user-row-index').value;
            const payload = {
                name: document.getElementById('user-name').value,
                username: document.getElementById('user-username').value,
                password: document.getElementById('user-password').value,
                role: document.getElementById('user-role').value,
            };
            const action = rowIndex ? 'updateUser' : 'addUser';
            if(rowIndex) payload.rowIndex = rowIndex;
            
            const result = await apiCall(action, payload);
            if(result.status === 'success') {
                document.getElementById('user-modal').classList.add('hidden');
                showAlert('สำเร็จ', 'บันทึกข้อมูลผู้ใช้เรียบร้อย', 'success');
                loadAdminData();
            }
        }

        function deleteUser(user) {
            showConfirmation('ยืนยันการลบ', `คุณต้องการลบผู้ใช้ "${user.name}" ใช่หรือไม่?`, async () => {
                const result = await apiCall('deleteUser', { rowIndex: user.rowIndex });
                if(result.status === 'success') {
                    showAlert('สำเร็จ', 'ลบผู้ใช้เรียบร้อย', 'success');
                    loadAdminData();
                }
            });
        }

        function openRetireeModal(retiree = null) { /* ... (Similar to openUserModal) ... */ }
        async function saveRetiree() { /* ... (Similar to saveUser) ... */ }
        function deleteRetiree(retiree) { /* ... (Similar to deleteUser) ... */ }

        // --- Re-add full function bodies that were omitted for brevity above ---
        // (This is a placeholder to remind that the full code should be here)
        // ... all functions from previous version ...
    