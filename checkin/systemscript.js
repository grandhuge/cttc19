        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAMY49YYOfOq4vmgV6-0B6Nw0YMbeNDKqY",
            authDomain: "cttc19suratthani.firebaseapp.com",
            databaseURL: "https://cttc19suratthani-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "cttc19suratthani",
            storageBucket: "cttc19suratthani.firebasestorage.app",
            messagingSenderId: "400782042259",
            appId: "1:400782042259:web:20df8eb7dfe2c9fb8c9966",
            measurementId: "G-VCLQMJWY3L"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Global variables
        let currentUser = null;
        let isAdmin = false;
        let codeReader = null;
        let videoStream = null;
        let maxAllowedDistance = 1000; // meters
        let attendanceRecords = [];
        let users = {};

        // Firebase Data Functions
        async function loadDataFromFirebase() {
            try {
                // Load users
                const usersSnapshot = await database.ref('users').once('value');
                const usersData = usersSnapshot.val();
                
                if (usersData) {
                    users = usersData;
                } else {
                    // Initialize default users if none exist
                    users = {
                        'test': { password: '123456', isAdmin: true },
                        'user1': { password: 'password123', isAdmin: false },
                        'user2': { password: 'password456', isAdmin: false },
                        'user3': { password: 'password789', isAdmin: false }
                    };
                    await database.ref('users').set(users);
                }

                // Load attendance records
                const recordsSnapshot = await database.ref('attendanceRecords').once('value');
                const recordsData = recordsSnapshot.val();
                
                if (recordsData) {
                    attendanceRecords = Object.values(recordsData);
                } else {
                    attendanceRecords = [];
                }

                // Load settings
                const settingsSnapshot = await database.ref('settings').once('value');
                const settingsData = settingsSnapshot.val();
                
                if (settingsData && settingsData.maxAllowedDistance) {
                    maxAllowedDistance = settingsData.maxAllowedDistance;
                    document.getElementById('maxDistance').value = maxAllowedDistance;
                }

                console.log('ข้อมูลโหลดจาก Firebase เรียบร้อยแล้ว');
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
                alert('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
            }
        }

        async function saveUsersToFirebase() {
            try {
                await database.ref('users').set(users);
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการบันทึกผู้ใช้:', error);
                throw error;
            }
        }

        async function saveRecordToFirebase(record) {
            try {
                await database.ref('attendanceRecords').push(record);
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลการลงเวลา:', error);
                throw error;
            }
        }

        async function saveSettingsToFirebase() {
            try {
                await database.ref('settings').set({
                    maxAllowedDistance: maxAllowedDistance
                });
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า:', error);
                throw error;
            }
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', async function() {
            try {
                // Load data from Firebase
                await loadDataFromFirebase();
                
                // Initialize the app
                initializeApp();
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเริ่มต้นระบบ:', error);
                alert('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
            }
        });

        // Initialize after Firebase data is loaded
        function initializeApp() {
            updateDateTime();
            setInterval(updateDateTime, 1000);
            
            // Event listeners
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);
            document.getElementById('checkInBtn').addEventListener('click', () => startScanning('in'));
            document.getElementById('checkOutBtn').addEventListener('click', () => startScanning('out'));
            document.getElementById('closeScannerBtn').addEventListener('click', closeScanner);
            document.getElementById('adminBtn').addEventListener('click', showAdminScreen);
            document.getElementById('backToMainBtn').addEventListener('click', showMainScreen);
            document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
            document.getElementById('userManagementBtn').addEventListener('click', showUserManagement);
            document.getElementById('backToAdminBtn').addEventListener('click', showAdminScreen);
            document.getElementById('qrGeneratorBtn').addEventListener('click', showQRGenerator);
            document.getElementById('backToAdminFromQRBtn').addEventListener('click', showAdminScreen);
            document.getElementById('qrGeneratorForm').addEventListener('submit', generateQRCode);
            document.getElementById('getCurrentLocationBtn').addEventListener('click', getCurrentLocation);
            document.getElementById('downloadQRBtn').addEventListener('click', downloadQRCode);
            document.getElementById('printQRBtn').addEventListener('click', printQRCode);
            document.getElementById('addUserForm').addEventListener('submit', addUser);
            document.getElementById('editUserForm').addEventListener('submit', editUser);
            document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
            document.getElementById('monthFilter').addEventListener('change', updateAdminRecords);
            document.getElementById('yearFilter').addEventListener('change', updateAdminRecords);

            // Set up real-time listeners
            setupRealtimeListeners();
        }

        function setupRealtimeListeners() {
            // Listen for attendance records changes
            database.ref('attendanceRecords').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    attendanceRecords = Object.values(data);
                    if (currentUser) {
                        updateTodayRecords();
                        updateLastAction();
                        if (isAdmin) {
                            updateAdminDashboard();
                            updateAdminRecords();
                        }
                    }
                }
            });

            // Listen for users changes
            database.ref('users').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    users = data;
                    if (isAdmin) {
                        updateUsersList();
                        updateAdminDashboard();
                    }
                }
            });

            // Listen for settings changes
            database.ref('settings').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && data.maxAllowedDistance) {
                    maxAllowedDistance = data.maxAllowedDistance;
                    const maxDistanceInput = document.getElementById('maxDistance');
                    if (maxDistanceInput) {
                        maxDistanceInput.value = maxAllowedDistance;
                    }
                }
            });
        }

        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            document.getElementById('currentDateTime').textContent = now.toLocaleDateString('th-TH', options);
            document.getElementById('statusTime').textContent = now.toLocaleTimeString('th-TH');
        }

        function handleLogin(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (users[username] && users[username].password === password) {
                currentUser = username;
                isAdmin = users[username].isAdmin;
                
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('mainScreen').classList.remove('hidden');
                document.getElementById('currentUser').textContent = username;
                
                if (isAdmin) {
                    document.getElementById('adminPanel').classList.remove('hidden');
                    document.getElementById('checkInOutButtons').classList.add('hidden');
                    document.getElementById('adminDashboard').classList.remove('hidden');
                    updateAdminDashboard();
                } else {
                    document.getElementById('checkInOutButtons').classList.remove('hidden');
                    document.getElementById('adminDashboard').classList.add('hidden');
                }
                
                updateTodayRecords();
                updateLastAction();
            } else {
                alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }
        }

        function handleLogout() {
            currentUser = null;
            isAdmin = false;
            document.getElementById('mainScreen').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('adminPanel').classList.add('hidden');
        }

        function startScanning(type) {
            document.getElementById('mainScreen').classList.add('hidden');
            document.getElementById('scannerScreen').classList.remove('hidden');
            
            // Initialize ZXing code reader
            codeReader = new ZXing.BrowserQRCodeReader();
            
            // Get video element
            const videoElement = document.getElementById('video');
            
            // Start scanning
            codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {
                if (result) {
                    handleQRCodeScan(result.text, type);
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('QR Code scan error:', err);
                }
            }).then((controls) => {
                videoStream = controls;
            }).catch(err => {
                console.error("Unable to start scanning", err);
                alert('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
                closeScanner();
            });
        }

        function closeScanner() {
            // Stop video stream
            if (videoStream) {
                videoStream.stop();
                videoStream = null;
            }
            
            // Reset code reader
            if (codeReader) {
                codeReader.reset();
                codeReader = null;
            }
            
            // Stop video element
            const videoElement = document.getElementById('video');
            if (videoElement.srcObject) {
                const tracks = videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            
            document.getElementById('scannerScreen').classList.add('hidden');
            document.getElementById('mainScreen').classList.remove('hidden');
        }

        function handleQRCodeScan(qrData, type) {
            closeScanner();
            
            // Parse QR code data (expecting format: "lat,lng" like "9.2005357,99.4753044")
            const coords = qrData.split(',');
            if (coords.length !== 2) {
                alert('QR Code ไม่ถูกต้อง กรุณาสแกน QR Code ที่มีพิกัดที่ถูกต้อง');
                return;
            }
            
            const targetLat = parseFloat(coords[0]);
            const targetLng = parseFloat(coords[1]);
            
            if (isNaN(targetLat) || isNaN(targetLng)) {
                alert('ข้อมูลพิกัดใน QR Code ไม่ถูกต้อง');
                return;
            }

            // Check for duplicate check-in on the same day
            const today = new Date().toLocaleDateString('th-TH');
            const todayRecords = attendanceRecords.filter(record => 
                record.user === currentUser && record.date === today
            );

            if (type === 'in') {
                // Check if user already checked in today
                const hasCheckedInToday = todayRecords.some(record => record.type === 'in');
                if (hasCheckedInToday) {
                    alert('คุณได้ลงเวลาเข้าวันนี้แล้ว ไม่สามารถลงเวลาเข้าซ้ำได้');
                    return;
                }
            }
            
            // Get user's current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        
                        const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
                        
                        if (distance <= maxAllowedDistance) {
                            recordAttendance(type, 'Valid', distance);
                        } else {
                            alert(`ไม่สามารถลงเวลาได้!\nคุณอยู่ห่างจากจุดที่กำหนด ${Math.round(distance)} เมตร\n(อนุญาตสูงสุด ${maxAllowedDistance} เมตร)`);
                        }
                        
                        updateTodayRecords();
                        updateLastAction();
                    },
                    (error) => {
                        alert('ไม่สามารถระบุตำแหน่งของคุณได้ กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่ง');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            } else {
                alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
            }
        }

        function calculateDistance(lat1, lng1, lat2, lng2) {
            // Haversine formula
            const R = 6371000; // Earth's radius in meters
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        async function recordAttendance(type, status, distance) {
            const now = new Date();
            const today = now.toLocaleDateString('th-TH');
            
            try {
                if (type === 'out') {
                    // For check-out, update existing record if exists, otherwise create new
                    const todayRecords = attendanceRecords.filter(record => 
                        record.user === currentUser && record.date === today && record.type === 'out'
                    );
                    
                    if (todayRecords.length > 0) {
                        // Update the most recent check-out record
                        const recordToUpdate = todayRecords[todayRecords.length - 1];
                        recordToUpdate.time = now.toLocaleTimeString('th-TH');
                        recordToUpdate.distance = Math.round(distance);
                        recordToUpdate.timestamp = now.getTime();
                        
                        // Update in Firebase
                        const recordsSnapshot = await database.ref('attendanceRecords').once('value');
                        const recordsData = recordsSnapshot.val();
                        
                        if (recordsData) {
                            const recordKey = Object.keys(recordsData).find(key => 
                                recordsData[key].id === recordToUpdate.id
                            );
                            
                            if (recordKey) {
                                await database.ref(`attendanceRecords/${recordKey}`).update({
                                    time: recordToUpdate.time,
                                    distance: recordToUpdate.distance,
                                    timestamp: recordToUpdate.timestamp
                                });
                            }
                        }
                        
                        alert(`อัพเดทเวลาออกสำเร็จ!\nเวลาใหม่: ${recordToUpdate.time}\nระยะทาง: ${Math.round(distance)} เมตร`);
                    } else {
                        // Create new check-out record
                        const record = {
                            id: Date.now(),
                            user: currentUser,
                            date: today,
                            time: now.toLocaleTimeString('th-TH'),
                            type: type,
                            status: status,
                            distance: Math.round(distance),
                            timestamp: now.getTime()
                        };
                        
                        await saveRecordToFirebase(record);
                        attendanceRecords.push(record);
                        alert(`ลงเวลาออกสำเร็จ!\nเวลา: ${record.time}\nระยะทาง: ${Math.round(distance)} เมตร`);
                    }
                } else {
                    // For check-in, always create new record (duplicate check already done)
                    const record = {
                        id: Date.now(),
                        user: currentUser,
                        date: today,
                        time: now.toLocaleTimeString('th-TH'),
                        type: type,
                        status: status,
                        distance: Math.round(distance),
                        timestamp: now.getTime()
                    };
                    
                    await saveRecordToFirebase(record);
                    attendanceRecords.push(record);
                    alert(`ลงเวลาเข้าสำเร็จ!\nเวลา: ${record.time}\nระยะทาง: ${Math.round(distance)} เมตร`);
                }
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
                alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
            }
        }

        function updateTodayRecords() {
            const today = new Date().toLocaleDateString('th-TH');
            const todayRecords = attendanceRecords.filter(record => 
                record.user === currentUser && record.date === today
            );
            
            const container = document.getElementById('todayRecords');
            
            if (todayRecords.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">ยังไม่มีการลงเวลาวันนี้</p>';
            } else {
                container.innerHTML = todayRecords.map(record => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <span class="font-medium ${record.type === 'in' ? 'text-green-600' : 'text-red-600'}">
                                ${record.type === 'in' ? 'เข้างาน' : 'ออกงาน'}
                            </span>
                            <span class="text-sm text-gray-500 ml-2">${record.time}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs px-2 py-1 rounded-full ${record.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${record.status === 'Valid' ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}
                            </span>
                            <div class="text-xs text-gray-500 mt-1">${record.distance}m</div>
                        </div>
                    </div>
                `).join('');
            }
        }

        function updateLastAction() {
            const userRecords = attendanceRecords.filter(record => record.user === currentUser);
            if (userRecords.length > 0) {
                const lastRecord = userRecords[userRecords.length - 1];
                document.getElementById('lastAction').innerHTML = `
                    <p class="text-sm text-gray-600">
                        การลงเวลาล่าสุด: ${lastRecord.type === 'in' ? 'เข้างาน' : 'ออกงาน'} 
                        ${lastRecord.date} ${lastRecord.time}
                        <span class="ml-2 text-xs px-2 py-1 rounded-full ${lastRecord.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${lastRecord.status === 'Valid' ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}
                        </span>
                    </p>
                `;
            }
        }

        function showAdminScreen() {
            document.getElementById('mainScreen').classList.add('hidden');
            document.getElementById('adminScreen').classList.remove('hidden');
            populateFilterOptions();
            updateAdminRecords();
        }

        function showMainScreen() {
            document.getElementById('adminScreen').classList.add('hidden');
            document.getElementById('mainScreen').classList.remove('hidden');
        }

        function populateFilterOptions() {
            const monthFilter = document.getElementById('monthFilter');
            const yearFilter = document.getElementById('yearFilter');
            
            // Clear existing options (except "ทั้งหมด" and "ทุกปี")
            monthFilter.innerHTML = '<option value="">ทั้งหมด</option>';
            yearFilter.innerHTML = '<option value="">ทุกปี</option>';
            
            // Get unique months and years from records
            const months = new Set();
            const years = new Set();
            
            attendanceRecords.forEach(record => {
                const dateParts = record.date.split('/');
                if (dateParts.length >= 3) {
                    const month = dateParts[1];
                    const year = dateParts[2];
                    months.add(month);
                    years.add(year);
                }
            });
            
            // Populate month options
            const monthNames = [
                '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];
            
            Array.from(months).sort((a, b) => parseInt(a) - parseInt(b)).forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = monthNames[parseInt(month)];
                monthFilter.appendChild(option);
            });
            
            // Populate year options
            Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)).forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            });
        }

        function updateAdminRecords() {
            const container = document.getElementById('allRecords');
            const monthFilter = document.getElementById('monthFilter').value;
            const yearFilter = document.getElementById('yearFilter').value;
            
            // Filter records based on selected month and year
            let filteredRecords = attendanceRecords;
            
            if (monthFilter || yearFilter) {
                filteredRecords = attendanceRecords.filter(record => {
                    const dateParts = record.date.split('/');
                    if (dateParts.length < 3) return false;
                    
                    const recordMonth = dateParts[1];
                    const recordYear = dateParts[2];
                    
                    const monthMatch = !monthFilter || recordMonth === monthFilter;
                    const yearMatch = !yearFilter || recordYear === yearFilter;
                    
                    return monthMatch && yearMatch;
                });
            }
            
            if (filteredRecords.length === 0) {
                container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">ไม่พบข้อมูลในช่วงเวลาที่เลือก</td></tr>';
            } else {
                container.innerHTML = filteredRecords
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(record => `
                        <tr class="border-b">
                            <td class="py-2">${record.user}</td>
                            <td class="py-2">${record.date}</td>
                            <td class="py-2">${record.time}</td>
                            <td class="py-2">
                                <span class="text-xs px-2 py-1 rounded-full ${record.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${record.type === 'in' ? 'เข้างาน' : 'ออกงาน'}
                                </span>
                            </td>
                            <td class="py-2">
                                <span class="text-xs px-2 py-1 rounded-full ${record.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${record.status === 'Valid' ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}
                                </span>
                                <div class="text-xs text-gray-500 mt-1">${record.distance}m</div>
                            </td>
                        </tr>
                    `).join('');
            }
        }

        async function saveSettings() {
            const newDistance = parseInt(document.getElementById('maxDistance').value);
            if (newDistance >= 100 && newDistance <= 5000) {
                maxAllowedDistance = newDistance;
                try {
                    await saveSettingsToFirebase();
                    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
                } catch (error) {
                    alert('ไม่สามารถบันทึกการตั้งค่าได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
                }
            } else {
                alert('กรุณาใส่ระยะทางระหว่าง 100-5000 เมตร');
            }
        }

        function updateAdminDashboard() {
            // Update total users count
            document.getElementById('totalUsers').textContent = Object.keys(users).length;
            
            // Update today's records count
            const today = new Date().toLocaleDateString('th-TH');
            const todayCount = attendanceRecords.filter(record => record.date === today).length;
            document.getElementById('todayRecordsCount').textContent = todayCount;
            
            // Generate chart for last 7 days
            generateChart();
        }

        function generateChart() {
            const chartContainer = document.getElementById('chartContainer');
            const last7Days = [];
            
            // Get last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                last7Days.push(date.toLocaleDateString('th-TH'));
            }
            
            // Count records for each day
            const dailyCounts = last7Days.map(date => {
                return attendanceRecords.filter(record => record.date === date).length;
            });
            
            const maxCount = Math.max(...dailyCounts, 1);
            
            // Generate chart bars
            chartContainer.innerHTML = last7Days.map((date, index) => {
                const height = (dailyCounts[index] / maxCount) * 100;
                const shortDate = date.split('/').slice(0, 2).join('/');
                
                return `
                    <div class="flex flex-col items-center flex-1">
                        <div class="w-full bg-blue-200 rounded-t" style="height: ${240 - height * 2.4}px;"></div>
                        <div class="w-full bg-blue-600 rounded-b flex items-end justify-center text-white text-xs font-medium" style="height: ${height * 2.4}px; min-height: 20px;">
                            ${dailyCounts[index] > 0 ? dailyCounts[index] : ''}
                        </div>
                        <div class="text-xs text-gray-600 mt-2 transform -rotate-45 origin-center">${shortDate}</div>
                    </div>
                `;
            }).join('');
        }

        function showUserManagement() {
            document.getElementById('adminScreen').classList.add('hidden');
            document.getElementById('userManagementScreen').classList.remove('hidden');
            updateUsersList();
        }

        function updateUsersList() {
            const usersList = document.getElementById('usersList');
            
            usersList.innerHTML = Object.keys(users).map(username => `
                <tr class="border-b">
                    <td class="py-3">${username}</td>
                    <td class="py-3">
                        <span class="text-xs px-2 py-1 rounded-full ${users[username].isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
                            ${users[username].isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}
                        </span>
                    </td>
                    <td class="py-3">
                        <div class="flex space-x-2">
                            <button onclick="editUserModal('${username}')" class="text-blue-600 hover:text-blue-800 text-sm">แก้ไข</button>
                            ${username !== 'admin' ? `<button onclick="deleteUser('${username}')" class="text-red-600 hover:text-red-800 text-sm">ลบ</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        async function addUser(e) {
            e.preventDefault();
            
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const isAdmin = document.getElementById('newUserRole').value === 'true';
            
            if (users[username]) {
                alert('ชื่อผู้ใช้นี้มีอยู่แล้ว');
                return;
            }
            
            users[username] = {
                password: password,
                isAdmin: isAdmin
            };
            
            try {
                await saveUsersToFirebase();
                
                // Reset form
                document.getElementById('addUserForm').reset();
                
                // Update list
                updateUsersList();
                updateAdminDashboard();
                
                alert('เพิ่มผู้ใช้สำเร็จ');
            } catch (error) {
                // Revert changes if save failed
                delete users[username];
                alert('ไม่สามารถเพิ่มผู้ใช้ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
            }
        }

        function editUserModal(username) {
            document.getElementById('editUserId').value = username;
            document.getElementById('editUsername').value = username;
            document.getElementById('editPassword').value = '';
            document.getElementById('editUserRole').value = users[username].isAdmin.toString();
            document.getElementById('editUserModal').classList.remove('hidden');
        }

        async function editUser(e) {
            e.preventDefault();
            
            const oldUsername = document.getElementById('editUserId').value;
            const newUsername = document.getElementById('editUsername').value;
            const newPassword = document.getElementById('editPassword').value;
            const isAdmin = document.getElementById('editUserRole').value === 'true';
            
            // Check if new username already exists (and it's not the same user)
            if (newUsername !== oldUsername && users[newUsername]) {
                alert('ชื่อผู้ใช้นี้มีอยู่แล้ว');
                return;
            }
            
            // Store old data for rollback
            const oldUserData = { ...users[oldUsername] };
            
            // Update user data
            const userData = {
                password: newPassword || users[oldUsername].password,
                isAdmin: isAdmin
            };
            
            try {
                // If username changed, delete old and create new
                if (newUsername !== oldUsername) {
                    delete users[oldUsername];
                    users[newUsername] = userData;
                    
                    // Update attendance records in Firebase
                    const recordsSnapshot = await database.ref('attendanceRecords').once('value');
                    const recordsData = recordsSnapshot.val();
                    
                    if (recordsData) {
                        const updates = {};
                        Object.keys(recordsData).forEach(key => {
                            if (recordsData[key].user === oldUsername) {
                                updates[key + '/user'] = newUsername;
                            }
                        });
                        
                        if (Object.keys(updates).length > 0) {
                            await database.ref('attendanceRecords').update(updates);
                        }
                    }
                } else {
                    users[oldUsername] = userData;
                }
                
                await saveUsersToFirebase();
                
                closeEditModal();
                updateUsersList();
                updateAdminDashboard();
                
                alert('แก้ไขข้อมูลผู้ใช้สำเร็จ');
            } catch (error) {
                // Rollback changes
                if (newUsername !== oldUsername) {
                    delete users[newUsername];
                    users[oldUsername] = oldUserData;
                } else {
                    users[oldUsername] = oldUserData;
                }
                
                alert('ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
            }
        }

        async function deleteUser(username) {
            if (confirm(`คุณต้องการลบผู้ใช้ "${username}" หรือไม่?`)) {
                // Store old data for rollback
                const oldUserData = { ...users[username] };
                
                try {
                    delete users[username];
                    await saveUsersToFirebase();
                    
                    updateUsersList();
                    updateAdminDashboard();
                    
                    alert('ลบผู้ใช้สำเร็จ');
                } catch (error) {
                    // Rollback changes
                    users[username] = oldUserData;
                    alert('ไม่สามารถลบผู้ใช้ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
                }
            }
        }

        function closeEditModal() {
            document.getElementById('editUserModal').classList.add('hidden');
        }

        function showQRGenerator() {
            document.getElementById('adminScreen').classList.add('hidden');
            document.getElementById('qrGeneratorScreen').classList.remove('hidden');
            // Clear previous QR code
            document.getElementById('qrCodeDisplay').classList.add('hidden');
            document.getElementById('qrGeneratorForm').reset();
        }

        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        document.getElementById('qrLatitude').value = position.coords.latitude;
                        document.getElementById('qrLongitude').value = position.coords.longitude;
                        alert('ได้รับตำแหน่งปัจจุบันแล้ว');
                    },
                    (error) => {
                        alert('ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS และอนุญาตการเข้าถึงตำแหน่ง');
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            } else {
                alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
            }
        }

        function generateQRCode(e) {
            e.preventDefault();
            
            const latitude = parseFloat(document.getElementById('qrLatitude').value);
            const longitude = parseFloat(document.getElementById('qrLongitude').value);
            const locationName = document.getElementById('qrLocationName').value;
            
            if (isNaN(latitude) || isNaN(longitude)) {
                alert('กรุณากรอกพิกัดที่ถูกต้อง');
                return;
            }
            
            // Create QR code data (format: "lat,lng")
            const qrData = `${latitude},${longitude}`;
            
            try {
                // Generate QR code using QRious
                const qrCodeContainer = document.getElementById('qrCodeContainer');
                qrCodeContainer.innerHTML = ''; // Clear previous QR code
                
                const canvas = document.createElement('canvas');
                const qr = new QRious({
                    element: canvas,
                    value: qrData,
                    size: 256,
                    level: 'M',
                    background: '#ffffff',
                    foreground: '#000000'
                });
                
                qrCodeContainer.appendChild(canvas);
                
                // Display location info
                const qrCodeInfo = document.getElementById('qrCodeInfo');
                qrCodeInfo.innerHTML = `
                    <div class="space-y-2">
                        ${locationName ? `<p class="font-medium text-gray-800">${locationName}</p>` : ''}
                        <p class="text-gray-600">ละติจูด: ${latitude}</p>
                        <p class="text-gray-600">ลองจิจูด: ${longitude}</p>
                        <p class="text-xs text-gray-500 mt-2">QR Code นี้สามารถใช้สำหรับการลงเวลาในระยะ ${maxAllowedDistance} เมตร</p>
                    </div>
                `;
                
                // Show QR code display
                document.getElementById('qrCodeDisplay').classList.remove('hidden');
                
                // Scroll to QR code
                document.getElementById('qrCodeDisplay').scrollIntoView({ behavior: 'smooth' });
                
            } catch (error) {
                console.error('Error generating QR code:', error);
                alert('เกิดข้อผิดพลาดในการสร้าง QR Code');
            }
        }

        function downloadQRCode() {
            const canvas = document.querySelector('#qrCodeContainer canvas');
            if (!canvas) {
                alert('ไม่พบ QR Code ที่จะดาวน์โหลด');
                return;
            }
            
            // Create download link
            const link = document.createElement('a');
            link.download = `QR-Code-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function printQRCode() {
            const qrCodeContainer = document.getElementById('qrCodeContainer');
            const qrCodeInfo = document.getElementById('qrCodeInfo');
            
            if (!qrCodeContainer.querySelector('canvas')) {
                alert('ไม่พบ QR Code ที่จะพิมพ์');
                return;
            }
            
            // Create print window
            const printWindow = window.open('', '_blank');
            const canvas = qrCodeContainer.querySelector('canvas');
            const locationInfo = qrCodeInfo.innerHTML;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QR Code สำหรับการลงเวลา</title>
                    <style>
                        body {
                            font-family: 'Sarabun', Arial, sans-serif;
                            text-align: center;
                            padding: 20px;
                            margin: 0;
                        }
                        .qr-container {
                            margin: 20px 0;
                        }
                        .info {
                            margin: 20px 0;
                            font-size: 14px;
                            line-height: 1.6;
                        }
                        .title {
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            color: #333;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 12px;
                            color: #666;
                            border-top: 1px solid #ddd;
                            padding-top: 15px;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="title">QR Code สำหรับการลงเวลา</div>
                    <div class="qr-container">
                        ${canvas.outerHTML}
                    </div>
                    <div class="info">
                        ${locationInfo}
                    </div>
                    <div class="footer">
                        <p>สร้างโดย: ระบบเช็คชื่อ | วันที่: ${new Date().toLocaleDateString('th-TH')}</p>
                        <p>© developed by Tle Narongphisit | CTTC19 @ CPD</p>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        // Firebase initialization complete

    
