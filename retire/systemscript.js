
        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAMY49YYOfOq4vmgV6-0B6Nw0YMbeNDKqY",
            authDomain: "cttc19suratthani.firebaseapp.com",
            databaseURL: "https://cttc19suratthani-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "cttc19suratthani",
            storageBucket: "cttc19suratthani.firebasestorage.app",
            messagingSenderId: "400782042259",
            appId: "1:400782042259:web:9f713e742d3321638c9966",
            measurementId: "G-45JL7XWT16"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Global variables
        let retirees = [];
        let blessings = {};
        let currentRetireeId = null;
        let editingRetireeId = null;
        let isLoggedIn = false;
        let isConnected = false;
        let isLoading = false;
        let sortSettings = {
            field: 'name',
            order: 'asc',
            customOrder: []
        };
        let draggedElement = null;

        // Connection monitoring
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            isConnected = snapshot.val();
            updateConnectionStatus();
        });

        function updateConnectionStatus() {
            const statusIndicator = document.getElementById('connection-status');
            const statusText = document.getElementById('connection-text');
            if (statusIndicator && statusText) {
                if (isConnected) {
                    statusIndicator.className = 'w-3 h-3 bg-green-500 rounded-full mr-2';
                    statusIndicator.title = 'เชื่อมต่อแล้ว';
                    statusText.textContent = 'Online';
                } else {
                    statusIndicator.className = 'w-3 h-3 bg-red-500 rounded-full mr-2';
                    statusIndicator.title = 'ไม่ได้เชื่อมต่อ';
                    statusText.textContent = 'Offline';
                }
            }
        }

        // Firebase data functions
        function loadFirebaseData() {
            setLoading(true);
            
            // Load retirees
            database.ref('retirees').on('value', (snapshot) => {
                const data = snapshot.val();
                retirees = data ? Object.keys(data).map(key => ({...data[key], id: key})) : [];
                renderRetirees();
                populateFilters();
                if (isLoggedIn) {
                    renderAdminTable();
                }
                setLoading(false);
            }, (error) => {
                console.error('Error loading retirees:', error);
                showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้เกษียณ', 'error');
                setLoading(false);
            });

            // Load blessings
            database.ref('blessings').on('value', (snapshot) => {
                const data = snapshot.val();
                blessings = data || {};
                renderRetirees();
                if (currentRetireeId) {
                    showProfile(currentRetireeId);
                }
            }, (error) => {
                console.error('Error loading blessings:', error);
                showNotification('เกิดข้อผิดพลาดในการโหลดคำอวยพร', 'error');
            });
        }

        function saveRetiree(retireeData) {
            return new Promise((resolve, reject) => {
                if (retireeData.id && retireeData.id !== 'new') {
                    // Update existing retiree
                    const {id, ...dataToUpdate} = retireeData;
                    database.ref(`retirees/${id}`).update(dataToUpdate)
                        .then(() => resolve(id))
                        .catch(reject);
                } else {
                    // Add new retiree
                    const {id, ...dataToSave} = retireeData;
                    const newRef = database.ref('retirees').push();
                    newRef.set(dataToSave)
                        .then(() => resolve(newRef.key))
                        .catch(reject);
                }
            });
        }

        function deleteRetireeFromFirebase(retireeId) {
            return Promise.all([
                database.ref(`retirees/${retireeId}`).remove(),
                database.ref(`blessings/${retireeId}`).remove()
            ]);
        }

        function saveBlessingToFirebase(retireeId, blessingData) {
            const newRef = database.ref(`blessings/${retireeId}`).push();
            return newRef.set(blessingData);
        }

        function setLoading(loading) {
            isLoading = loading;
            const loadingIndicator = document.getElementById('loading-indicator');
            const gridLoading = document.getElementById('grid-loading');
            
            if (loadingIndicator) {
                if (loading) {
                    loadingIndicator.classList.remove('hidden');
                } else {
                    loadingIndicator.classList.add('hidden');
                }
            }
            
            if (gridLoading && retirees.length === 0) {
                if (loading) {
                    gridLoading.classList.remove('hidden');
                } else {
                    gridLoading.classList.add('hidden');
                }
            }
        }

        function setButtonLoading(buttonId, loading, originalText = '') {
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            if (loading) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>กำลังดำเนินการ...';
            } else {
                button.disabled = false;
                button.innerHTML = originalText;
            }
        }

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
            setupEventListeners();
            loadFirebaseData();
        });

        function initializeApp() {
            // Initial setup
            updateConnectionStatus();
        }

        function setupEventListeners() {
            // Search functionality
            document.getElementById('search-input').addEventListener('input', filterRetirees);
            document.getElementById('position-filter').addEventListener('change', filterRetirees);
            document.getElementById('department-filter').addEventListener('change', filterRetirees);
            
            // Sort modal functionality
            document.getElementById('sort-field').addEventListener('change', toggleCustomSort);
            
            // Load sort settings from localStorage
            const savedSort = localStorage.getItem('gallerySort');
            if (savedSort) {
                sortSettings = JSON.parse(savedSort);
            }

            // Emoji picker
            document.querySelectorAll('.emoji-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('bg-indigo-100'));
                    this.classList.add('bg-indigo-100');
                    document.getElementById('selected-emoji').value = this.dataset.emoji;
                });
            });

            // Forms
            document.getElementById('retiree-form').addEventListener('submit', handleRetireeSubmit);
            document.getElementById('blessing-form').addEventListener('submit', handleBlessingSubmit);
            document.getElementById('login-form').addEventListener('submit', handleLogin);
        }

        function showView(viewName) {
            document.querySelectorAll('.view-container').forEach(view => view.classList.add('hidden'));
            document.getElementById(viewName + '-view').classList.remove('hidden');
            
            if (viewName === 'admin' && isLoggedIn) {
                renderAdminTable();
            }
        }

        function showAdminLogin() {
            if (isLoggedIn) {
                showView('admin');
                renderAdminTable();
            } else {
                document.getElementById('login-modal').classList.remove('hidden');
                document.getElementById('login-username').focus();
            }
        }

        function closeLoginModal() {
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('login-form').reset();
            document.getElementById('login-error').classList.add('hidden');
        }

        function handleLogin(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            setButtonLoading('login-btn', true, 'เข้าสู่ระบบ');
            
            // Simulate login delay
            setTimeout(() => {
                if (username === 'admin' && password === 'Tle019') {
                    isLoggedIn = true;
                    closeLoginModal();
                    showView('admin');
                    renderAdminTable();
                    showNotification('เข้าสู่ระบบสำเร็จ!', 'success');
                } else {
                    document.getElementById('login-error').classList.remove('hidden');
                }
                setButtonLoading('login-btn', false, 'เข้าสู่ระบบ');
            }, 1000);
        }

        function logout() {
            isLoggedIn = false;
            showView('gallery');
            showNotification('ออกจากระบบเรียบร้อยแล้ว', 'info');
        }

        function renderRetirees() {
            const grid = document.getElementById('retirees-grid');
            const gridLoading = document.getElementById('grid-loading');
            
            // Hide loading if we have data
            if (retirees.length > 0) {
                gridLoading.classList.add('hidden');
            }
            
            // Clear existing cards except loading
            const existingCards = grid.querySelectorAll('.card-hover');
            existingCards.forEach(card => card.remove());

            if (retirees.length === 0 && !isLoading) {
                const emptyState = document.createElement('div');
                emptyState.className = 'col-span-full text-center py-12';
                emptyState.innerHTML = `
                    <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">ยังไม่มีข้อมูลผู้เกษียณ</p>
                    <p class="text-gray-400 text-sm mt-2">เข้าสู่ระบบจัดการเพื่อเพิ่มข้อมูลผู้เกษียณ</p>
                `;
                grid.appendChild(emptyState);
                return;
            }

            // Sort retirees based on current settings
            const sortedRetirees = getSortedRetirees();

            sortedRetirees.forEach(retiree => {
                const blessingCount = blessings[retiree.id] ? Object.keys(blessings[retiree.id]).length : 0;
                const card = document.createElement('div');
                card.className = 'bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-md overflow-hidden card-hover cursor-pointer';
                card.onclick = () => showProfile(retiree.id);
                
                card.innerHTML = `
                    <div class="aspect-w-1 aspect-h-1">
                        <img src="${retiree.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPGF0aCBkPSJNMTAwIDIwMEMxMDAgMTcyLjM4NiAxMjIuMzg2IDE1MCAxNTAgMTUwUzIwMCAxNzIuMzg2IDIwMCAyMDBWMjUwSDEwMFYyMDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='}" alt="${retiree.name}" 
                             class="w-full h-48 object-cover"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPGF0aCBkPSJNMTAwIDIwMEMxMDAgMTcyLjM4NiAxMjIuMzg2IDE1MCAxNTAgMTUwUzIwMCAxNzIuMzg2IDIwMCAyMDBWMjUwSDEwMFYyMDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='; this.alt='รูปโปรไฟล์';">
                    </div>
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-1">${retiree.name}</h3>
                        <p class="text-sm text-gray-600 mb-1">${retiree.position}</p>
                        <p class="text-sm text-gray-500 mb-3">${retiree.department}</p>
                        <div class="flex justify-end">
                            <div class="flex items-center text-indigo-600">
                                <i class="fas fa-heart text-xs mr-1"></i>
                                <span class="text-xs">${blessingCount} คำอวยพร</span>
                            </div>
                        </div>
                    </div>
                `;
                
                grid.appendChild(card);
            });
        }

        function showProfile(retireeId) {
            const retiree = retirees.find(r => r.id === retireeId);
            if (!retiree) return;

            currentRetireeId = retireeId;
            const profileContent = document.getElementById('profile-content');
            const retireeBlessing = blessings[retireeId] || {};
            const blessingArray = Object.values(retireeBlessing);
            const publicBlessings = blessingArray.filter(b => b.isPublic);

            profileContent.innerHTML = `
                <div class="md:flex">
                    <div class="md:w-1/3">
                        <img src="${retiree.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPGF0aCBkPSJNMTAwIDIwMEMxMDAgMTcyLjM4NiAxMjIuMzg2IDE1MCAxNTAgMTUwUzIwMCAxNzIuMzg2IDIwMCAyMDBWMjUwSDEwMFYyMDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='}" alt="${retiree.name}" 
                             class="w-full h-64 md:h-full object-cover"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPGF0aCBkPSJNMTAwIDIwMEMxMDAgMTcyLjM4NiAxMjIuMzg2IDE1MCAxNTAgMTUwUzIwMCAxNzIuMzg2IDIwMCAyMDBWMjUwSDEwMFYyMDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='; this.alt='รูปโปรไฟล์';">
                    </div>
                    <div class="md:w-2/3 p-6">
                        <h2 class="text-3xl font-bold text-gray-800 mb-2">${retiree.name}</h2>
                        <p class="text-xl text-indigo-600 mb-1">${retiree.position}</p>
                        <p class="text-lg text-gray-600 mb-4">${retiree.department}</p>
                        ${retiree.bio ? `<p class="text-gray-700 mb-6 italic">"${retiree.bio}"</p>` : ''}
                        
                        <div class="flex justify-end mb-6">
                            <button onclick="showBlessingModal()" 
                                    class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                                <i class="fas fa-heart mr-2"></i>ส่งคำอวยพร
                            </button>
                        </div>

                        <div class="border-t pt-6">
                            <h3 class="text-xl font-semibold text-gray-800 mb-4">
                                คำอวยพรจากเพื่อนร่วมงาน (${publicBlessings.length})
                            </h3>
                            <div class="space-y-4 max-h-96 overflow-y-auto">
                                ${publicBlessings.length > 0 ? 
                                    publicBlessings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(blessing => `
                                        <div class="blessing-card bg-gray-50 bg-opacity-80 backdrop-blur-sm rounded-lg p-4">
                                            <div class="flex items-start space-x-3">
                                                <span class="text-2xl">${blessing.emoji}</span>
                                                <div class="flex-1">
                                                    <p class="text-gray-800 text-base leading-relaxed mb-3">${blessing.message}</p>
                                                    <div class="flex items-center justify-between">
                                                        <span class="text-sm text-gray-600">— ${blessing.sender}</span>
                                                        <span class="text-xs text-gray-400">${formatDateTime(blessing.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : 
                                    '<div class="text-center py-8"><i class="fas fa-heart text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">ยังไม่มีคำอวยพร</p><p class="text-gray-400 text-sm">เป็นคนแรกที่ส่งคำอวยพรให้ท่าน</p></div>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

            showView('profile');
        }

        function showBlessingModal() {
            document.getElementById('blessing-modal').classList.remove('hidden');
            document.getElementById('blessing-sender').focus();
        }

        function closeBlessingModal() {
            document.getElementById('blessing-modal').classList.add('hidden');
            document.getElementById('blessing-form').reset();
            document.getElementById('selected-emoji').value = '🎉';
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('bg-indigo-100'));
            document.querySelector('.emoji-btn[data-emoji="🎉"]').classList.add('bg-indigo-100');
        }

        function handleBlessingSubmit(e) {
            e.preventDefault();
            
            const sender = document.getElementById('blessing-sender').value.trim();
            const message = document.getElementById('blessing-message').value.trim();
            const emoji = document.getElementById('selected-emoji').value;
            const isPublic = document.getElementById('blessing-public').checked;
            
            // Validation
            if (!sender || !message) {
                showNotification('กรุณากรอกชื่อและข้อความอวยพร', 'error');
                return;
            }
            
            if (message.length < 10) {
                showNotification('ข้อความอวยพรต้องมีอย่างน้อย 10 ตัวอักษร', 'error');
                return;
            }

            if (!isConnected) {
                showNotification('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
                return;
            }

            setButtonLoading('send-blessing-btn', true, 'ส่งคำอวยพร');

            const blessingData = {
                sender,
                message,
                emoji,
                isPublic,
                timestamp: new Date().toISOString()
            };

            saveBlessingToFirebase(currentRetireeId, blessingData)
                .then(() => {
                    closeBlessingModal();
                    showNotification('ส่งคำอวยพรเรียบร้อยแล้ว!', 'success');
                })
                .catch((error) => {
                    console.error('Error saving blessing:', error);
                    showNotification('เกิดข้อผิดพลาดในการส่งคำอวยพร', 'error');
                })
                .finally(() => {
                    setButtonLoading('send-blessing-btn', false, 'ส่งคำอวยพร');
                });
        }

        function populateFilters() {
            const positions = [...new Set(retirees.map(r => r.position))];
            const departments = [...new Set(retirees.map(r => r.department))];

            const positionFilter = document.getElementById('position-filter');
            const departmentFilter = document.getElementById('department-filter');

            // Clear existing options except first
            positionFilter.innerHTML = '<option value="">ทุกตำแหน่ง</option>';
            departmentFilter.innerHTML = '<option value="">ทุกหน่วยงาน</option>';

            positions.forEach(position => {
                const option = document.createElement('option');
                option.value = position;
                option.textContent = position;
                positionFilter.appendChild(option);
            });

            departments.forEach(department => {
                const option = document.createElement('option');
                option.value = department;
                option.textContent = department;
                departmentFilter.appendChild(option);
            });
        }

        function getSortedRetirees() {
            let sorted = [...retirees];
            
            if (sortSettings.field === 'custom' && sortSettings.customOrder.length > 0) {
                // Custom sorting
                sorted.sort((a, b) => {
                    const indexA = sortSettings.customOrder.indexOf(a.id);
                    const indexB = sortSettings.customOrder.indexOf(b.id);
                    
                    // If both items are in custom order, sort by their position
                    if (indexA !== -1 && indexB !== -1) {
                        return indexA - indexB;
                    }
                    // If only one is in custom order, prioritize it
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    // If neither is in custom order, sort by name
                    return a.name.localeCompare(b.name, 'th');
                });
            } else {
                // Standard sorting
                sorted.sort((a, b) => {
                    let valueA, valueB;
                    
                    switch (sortSettings.field) {
                        case 'name':
                            valueA = a.name;
                            valueB = b.name;
                            break;
                        case 'position':
                            valueA = a.position;
                            valueB = b.position;
                            break;
                        case 'department':
                            valueA = a.department;
                            valueB = b.department;
                            break;
                        case 'blessings':
                            valueA = blessings[a.id] ? Object.keys(blessings[a.id]).length : 0;
                            valueB = blessings[b.id] ? Object.keys(blessings[b.id]).length : 0;
                            return sortSettings.order === 'asc' ? valueA - valueB : valueB - valueA;
                        default:
                            valueA = a.name;
                            valueB = b.name;
                    }
                    
                    const comparison = valueA.localeCompare(valueB, 'th');
                    return sortSettings.order === 'asc' ? comparison : -comparison;
                });
            }
            
            return sorted;
        }

        function filterRetirees() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const positionFilter = document.getElementById('position-filter').value;
            const departmentFilter = document.getElementById('department-filter').value;

            const filteredRetirees = retirees.filter(retiree => {
                const matchesSearch = retiree.name.toLowerCase().includes(searchTerm) || 
                                    retiree.position.toLowerCase().includes(searchTerm);
                const matchesPosition = !positionFilter || retiree.position === positionFilter;
                const matchesDepartment = !departmentFilter || retiree.department === departmentFilter;

                return matchesSearch && matchesPosition && matchesDepartment;
            });

            renderFilteredRetirees(filteredRetirees);
        }

        function getSortedRetirees() {
            let sorted = [...retirees];
            
            if (sortSettings.field === 'custom' && sortSettings.customOrder.length > 0) {
                // Custom sorting
                sorted.sort((a, b) => {
                    const indexA = sortSettings.customOrder.indexOf(a.id);
                    const indexB = sortSettings.customOrder.indexOf(b.id);
                    
                    // If both items are in custom order, sort by their position
                    if (indexA !== -1 && indexB !== -1) {
                        return indexA - indexB;
                    }
                    // If only one is in custom order, prioritize it
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    // If neither is in custom order, sort by name
                    return a.name.localeCompare(b.name, 'th');
                });
            } else {
                // Standard sorting
                sorted.sort((a, b) => {
                    let valueA, valueB;
                    
                    switch (sortSettings.field) {
                        case 'name':
                            valueA = a.name;
                            valueB = b.name;
                            break;
                        case 'position':
                            valueA = a.position;
                            valueB = b.position;
                            break;
                        case 'department':
                            valueA = a.department;
                            valueB = b.department;
                            break;
                        case 'blessings':
                            valueA = blessings[a.id] ? Object.keys(blessings[a.id]).length : 0;
                            valueB = blessings[b.id] ? Object.keys(blessings[b.id]).length : 0;
                            return sortSettings.order === 'asc' ? valueA - valueB : valueB - valueA;
                        default:
                            valueA = a.name;
                            valueB = b.name;
                    }
                    
                    const comparison = valueA.localeCompare(valueB, 'th');
                    return sortSettings.order === 'asc' ? comparison : -comparison;
                });
            }
            
            return sorted;
        }

        function renderFilteredRetirees(filteredRetirees) {
            const grid = document.getElementById('retirees-grid');
            const gridLoading = document.getElementById('grid-loading');
            
            // Clear existing cards except loading
            const existingCards = grid.querySelectorAll('.card-hover, .col-span-full');
            existingCards.forEach(card => card.remove());

            if (filteredRetirees.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'col-span-full text-center py-12';
                emptyState.innerHTML = `
                    <i class="fas fa-search text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">ไม่พบข้อมูลผู้เกษียณที่ตรงกับการค้นหา</p>
                `;
                grid.appendChild(emptyState);
                return;
            }

            // Sort filtered results
            const sortedFiltered = [...filteredRetirees];
            if (sortSettings.field === 'custom' && sortSettings.customOrder.length > 0) {
                sortedFiltered.sort((a, b) => {
                    const indexA = sortSettings.customOrder.indexOf(a.id);
                    const indexB = sortSettings.customOrder.indexOf(b.id);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.name.localeCompare(b.name, 'th');
                });
            }

            sortedFiltered.forEach(retiree => {
                const blessingCount = blessings[retiree.id] ? Object.keys(blessings[retiree.id]).length : 0;
                const card = document.createElement('div');
                card.className = 'bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-md overflow-hidden card-hover cursor-pointer';
                card.onclick = () => showProfile(retiree.id);
                
                card.innerHTML = `
                    <div class="aspect-w-1 aspect-h-1">
                        <img src="${retiree.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPGF0aCBkPSJNMTAwIDIwMEMxMDAgMTcyLjM4NiAxMjIuMzg2IDE1MCAxNTAgMTUwUzIwMCAxNzIuMzg2IDIwMCAyMDBWMjUwSDEwMFYyMDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='}" alt="${retiree.name}" 
                             class="w-full h-48 object-cover"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPGF0aCBkPSJNMTAwIDIwMEMxMDAgMTcyLjM4NiAxMjIuMzg2IDE1MCAxNTAgMTUwUzIwMCAxNzIuMzg2IDIwMCAyMDBWMjUwSDEwMFYyMDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='; this.alt='รูปโปรไฟล์';">
                    </div>
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-1">${retiree.name}</h3>
                        <p class="text-sm text-gray-600 mb-1">${retiree.position}</p>
                        <p class="text-sm text-gray-500 mb-3">${retiree.department}</p>
                        <div class="flex justify-end">
                            <div class="flex items-center text-indigo-600">
                                <i class="fas fa-heart text-xs mr-1"></i>
                                <span class="text-xs">${blessingCount} คำอวยพร</span>
                            </div>
                        </div>
                    </div>
                `;
                
                grid.appendChild(card);
            });
        }

        function renderAdminTable() {
            const tbody = document.getElementById('admin-table-body');
            tbody.innerHTML = '';

            if (retirees.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-users text-3xl mb-2"></i>
                        <p>ยังไม่มีข้อมูลผู้เกษียณ</p>
                    </td>
                `;
                tbody.appendChild(row);
                return;
            }

            // Sort retirees based on current settings
            const sortedRetirees = getSortedRetirees();

            sortedRetirees.forEach(retiree => {
                const blessingCount = blessings[retiree.id] ? Object.keys(blessings[retiree.id]).length : 0;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <img src="${retiree.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMTYiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwIDMwQzEwIDI2IDE0IDIyIDIwIDIyUzMwIDI2IDMwIDMwVjM0SDEwVjMwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}" alt="${retiree.name}" 
                                 class="h-10 w-10 rounded-full object-cover mr-3"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMTYiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwIDMwQzEwIDI2IDE0IDIyIDIwIDIyUzMwIDI2IDMwIDMwVjM0SDEwVjMwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'; this.alt='รูปโปรไฟล์';">
                            <div class="text-sm font-medium text-gray-900">${retiree.name}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${retiree.position}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${retiree.department}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            ${blessingCount} คำอวยพร
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onclick="editRetiree('${retiree.id}')" class="text-indigo-600 hover:text-indigo-900">แก้ไข</button>
                        <button onclick="exportBlessings('${retiree.id}')" class="text-green-600 hover:text-green-900">ส่งออก</button>
                        <button onclick="deleteRetiree('${retiree.id}')" class="text-red-600 hover:text-red-900">ลบ</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function showAddRetireeForm() {
            editingRetireeId = null;
            document.getElementById('modal-title').textContent = 'เพิ่มผู้เกษียณใหม่';
            document.getElementById('retiree-form').reset();
            document.getElementById('retiree-modal').classList.remove('hidden');
            document.getElementById('retiree-name').focus();
        }

        function editRetiree(id) {
            const retiree = retirees.find(r => r.id === id);
            if (!retiree) return;

            editingRetireeId = id;
            document.getElementById('modal-title').textContent = 'แก้ไขข้อมูลผู้เกษียณ';
            document.getElementById('retiree-name').value = retiree.name;
            document.getElementById('retiree-position').value = retiree.position;
            document.getElementById('retiree-department').value = retiree.department;
            document.getElementById('retiree-image').value = retiree.image || '';
            document.getElementById('retiree-bio').value = retiree.bio || '';
            document.getElementById('retiree-modal').classList.remove('hidden');
            document.getElementById('retiree-name').focus();
        }

        function closeRetireeModal() {
            document.getElementById('retiree-modal').classList.add('hidden');
            editingRetireeId = null;
        }

        function handleRetireeSubmit(e) {
            e.preventDefault();
            
            const name = document.getElementById('retiree-name').value.trim();
            const position = document.getElementById('retiree-position').value.trim();
            const department = document.getElementById('retiree-department').value.trim();
            const image = document.getElementById('retiree-image').value.trim();
            const bio = document.getElementById('retiree-bio').value.trim();
            
            // Validation
            if (!name || !position || !department) {
                showNotification('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
                return;
            }

            if (!isConnected) {
                showNotification('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
                return;
            }
            
            setButtonLoading('save-retiree-btn', true, 'บันทึก');
            
            const formData = {
                id: editingRetireeId || 'new',
                name,
                position,
                department,
                image: image || '',
                bio: bio || ''
            };

            saveRetiree(formData)
                .then(() => {
                    closeRetireeModal();
                    if (editingRetireeId) {
                        showNotification('แก้ไขข้อมูลเรียบร้อยแล้ว!', 'success');
                    } else {
                        showNotification('เพิ่มผู้เกษียณใหม่เรียบร้อยแล้ว!', 'success');
                    }
                })
                .catch((error) => {
                    console.error('Error saving retiree:', error);
                    showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                })
                .finally(() => {
                    setButtonLoading('save-retiree-btn', false, 'บันทึก');
                });
        }

        function deleteRetiree(id) {
            const retiree = retirees.find(r => r.id === id);
            if (!retiree) return;

            if (confirm(`คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ "${retiree.name}"?\n\nการดำเนินการนี้จะลบคำอวยพรทั้งหมดด้วย`)) {
                if (!isConnected) {
                    showNotification('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
                    return;
                }

                deleteRetireeFromFirebase(id)
                    .then(() => {
                        showNotification('ลบข้อมูลเรียบร้อยแล้ว!', 'success');
                    })
                    .catch((error) => {
                        console.error('Error deleting retiree:', error);
                        showNotification('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
                    });
            }
        }

        function exportBlessings(retireeId) {
            const retiree = retirees.find(r => r.id === retireeId);
            const retireeBlessing = blessings[retireeId] || {};
            const blessingArray = Object.values(retireeBlessing);
            
            if (blessingArray.length === 0) {
                showNotification('ไม่มีคำอวยพรสำหรับผู้เกษียณท่านนี้', 'warning');
                return;
            }

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <title>คำอวยพรสำหรับ ${retiree.name}</title>
                    <style>
                        body { font-family: 'Sarabun', sans-serif; margin: 20px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
                        .retiree-info { background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                        .blessing { margin-bottom: 20px; padding: 15px; border-left: 4px solid #4F46E5; background: #F9FAFB; page-break-inside: avoid; }
                        .blessing-header { font-weight: bold; margin-bottom: 5px; }
                        .blessing-meta { font-size: 12px; color: #6B7280; margin-bottom: 10px; }
                        .blessing-message { line-height: 1.6; }
                        .stats { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
                        @media print { body { font-size: 12pt; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>คำอวยพรสำหรับผู้เกษียณ</h1>
                        <h2>${retiree.name}</h2>
                    </div>
                    
                    <div class="retiree-info">
                        <p><strong>ชื่อ:</strong> ${retiree.name}</p>
                        <p><strong>ตำแหน่ง:</strong> ${retiree.position}</p>
                        <p><strong>หน่วยงาน:</strong> ${retiree.department}</p>
                        ${retiree.bio ? `<p><strong>คำคม:</strong> "${retiree.bio}"</p>` : ''}
                    </div>

                    <h3>คำอวยพรทั้งหมด (${blessingArray.length} รายการ)</h3>
                    
                    ${blessingArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(blessing => `
                        <div class="blessing">
                            <div class="blessing-header">
                                ${blessing.emoji} ${blessing.sender}
                                ${blessing.isPublic ? '' : '(ส่วนตัว)'}
                            </div>
                            <div class="blessing-meta">
                                วันที่: ${formatDateTime(blessing.timestamp)}
                            </div>
                            <div class="blessing-message">
                                ${blessing.message}
                            </div>
                        </div>
                    `).join('')}

                    <div class="stats">
                        <p>รายงานสร้างเมื่อ: ${formatDateTime(new Date().toISOString())}</p>
                        <p>จำนวนคำอวยพรทั้งหมด: ${blessingArray.length} รายการ</p>
                        <p>คำอวยพรสาธารณะ: ${blessingArray.filter(b => b.isPublic).length} รายการ</p>
                        <p>คำอวยพรส่วนตัว: ${blessingArray.filter(b => !b.isPublic).length} รายการ</p>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        }

        function formatDateTime(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function showSortModal() {
            document.getElementById('sort-modal').classList.remove('hidden');
            
            // Set current values
            document.getElementById('sort-field').value = sortSettings.field;
            document.getElementById('sort-order').value = sortSettings.order;
            
            toggleCustomSort();
        }

        function closeSortModal() {
            document.getElementById('sort-modal').classList.add('hidden');
        }

        function toggleCustomSort() {
            const sortField = document.getElementById('sort-field').value;
            const customSection = document.getElementById('custom-sort-section');
            
            if (sortField === 'custom') {
                customSection.classList.remove('hidden');
                populateSortableList();
            } else {
                customSection.classList.add('hidden');
            }
        }

        function populateSortableList() {
            const sortableList = document.getElementById('sortable-list');
            sortableList.innerHTML = '';
            
            const currentOrder = sortSettings.customOrder.length > 0 ? 
                sortSettings.customOrder.map(id => retirees.find(r => r.id === id)).filter(Boolean) :
                [...retirees];
            
            currentOrder.forEach((retiree, index) => {
                const item = document.createElement('div');
                item.className = 'flex items-center p-2 bg-white border border-gray-200 rounded cursor-move hover:bg-gray-50';
                item.draggable = true;
                item.dataset.retireeId = retiree.id;
                
                item.innerHTML = `
                    <i class="fas fa-grip-vertical text-gray-400 mr-3"></i>
                    <img src="${retiree.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1IiBjeT0iMTIiIHI9IjQiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTggMjJDOCAyMCAxMCAxOCAxNSAxOFMyMiAyMCAyMiAyMlYyNEg4VjIyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}" alt="${retiree.name}" 
                         class="w-8 h-8 rounded-full object-cover mr-3"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1IiBjeT0iMTIiIHI9IjQiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTggMjJDOCAyMCAxMCAxOCAxNSAxOFMyMiAyMCAyMiAyMlYyNEg4VjIyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';">
                    <div class="flex-1">
                        <div class="font-medium text-sm">${retiree.name}</div>
                        <div class="text-xs text-gray-500">${retiree.position}</div>
                    </div>
                    <span class="text-xs text-gray-400">#${index + 1}</span>
                `;
                
                // Add drag and drop event listeners
                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragover', handleDragOver);
                item.addEventListener('drop', handleDrop);
                item.addEventListener('dragend', handleDragEnd);
                
                sortableList.appendChild(item);
            });
        }

        function handleDragStart(e) {
            draggedElement = this;
            this.style.opacity = '0.5';
        }

        function handleDragOver(e) {
            e.preventDefault();
        }

        function handleDrop(e) {
            e.preventDefault();
            if (this !== draggedElement) {
                const sortableList = document.getElementById('sortable-list');
                const allItems = Array.from(sortableList.children);
                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(this);
                
                if (draggedIndex < targetIndex) {
                    this.parentNode.insertBefore(draggedElement, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedElement, this);
                }
                
                // Update numbering
                updateSortableNumbers();
            }
        }

        function handleDragEnd(e) {
            this.style.opacity = '';
            draggedElement = null;
        }

        function updateSortableNumbers() {
            const items = document.querySelectorAll('#sortable-list > div');
            items.forEach((item, index) => {
                const numberSpan = item.querySelector('span:last-child');
                numberSpan.textContent = `#${index + 1}`;
            });
        }

        function applySorting() {
            const sortField = document.getElementById('sort-field').value;
            const sortOrder = document.getElementById('sort-order').value;
            
            setButtonLoading('apply-sort-btn', true, 'ใช้การเรียง');
            
            sortSettings.field = sortField;
            sortSettings.order = sortOrder;
            
            if (sortField === 'custom') {
                const sortableItems = document.querySelectorAll('#sortable-list > div');
                sortSettings.customOrder = Array.from(sortableItems).map(item => item.dataset.retireeId);
            }
            
            // Save to localStorage
            localStorage.setItem('gallerySort', JSON.stringify(sortSettings));
            
            setTimeout(() => {
                renderRetirees();
                closeSortModal();
                showNotification('จัดเรียงแกลอรี่เรียบร้อยแล้ว!', 'success');
                setButtonLoading('apply-sort-btn', false, 'ใช้การเรียง');
            }, 500);
        }

        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full max-w-sm`;
            
            switch(type) {
                case 'success':
                    notification.classList.add('bg-green-500');
                    break;
                case 'warning':
                    notification.classList.add('bg-yellow-500');
                    break;
                case 'error':
                    notification.classList.add('bg-red-500');
                    break;
                default:
                    notification.classList.add('bg-blue-500');
            }
            
            notification.innerHTML = `
                <div class="flex items-center">
                    <span class="flex-1">${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 100);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.add('translate-x-full');
                    setTimeout(() => {
                        if (notification.parentElement) {
                            document.body.removeChild(notification);
                        }
                    }, 300);
                }
            }, 5000);
        }