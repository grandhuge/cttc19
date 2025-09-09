        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAMY49YYOfOq4vmgV6-0B6Nw0YMbeNDKqY",
            authDomain: "cttc19suratthani.firebaseapp.com",
            databaseURL: "https://cttc19suratthani-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "cttc19suratthani",
            storageBucket: "cttc19suratthani.firebasestorage.app",
            messagingSenderId: "400782042259",
            appId: "1:400782042259:web:cf519c219aa831ea8c9966",
            measurementId: "G-81NQBJEKS9"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Global variables
        let html5QrCode;
        let isScanning = false;
        let isAdminLoggedIn = false;
        let scanCooldown = false;

        // Data variables
        let workSchedules = {};
        let employees = [];
        let attendanceRecords = [];

        // Firebase functions
        function loadDataFromFirebase() {
            // Load work schedules
            database.ref('workSchedules').on('value', (snapshot) => {
                workSchedules = snapshot.val() || {};
                updatePositionDropdowns();
                updateSchedulesTable();
            });

            // Load employees
            database.ref('employees').on('value', (snapshot) => {
                const data = snapshot.val() || {};
                employees = Object.keys(data).map(key => ({ ...data[key], id: key }));
                updateEmployeeTable();
                updateSummaryCards();
                updatePositionFilter();
            });

            // Load attendance records
            database.ref('attendanceRecords').on('value', (snapshot) => {
                const data = snapshot.val() || {};
                attendanceRecords = Object.keys(data).map(key => ({ ...data[key], recordId: key }));
                updateReportsTable();
                updateSummaryCards();
            });
        }

        function saveWorkScheduleToFirebase(position, schedule) {
            return database.ref('workSchedules/' + position).set(schedule);
        }

        function deleteWorkScheduleFromFirebase(position) {
            return database.ref('workSchedules/' + position).remove();
        }

        function saveEmployeeToFirebase(employee) {
            const employeeRef = database.ref('employees').push();
            return employeeRef.set({
                name: employee.name,
                position: employee.position,
                photo: employee.photo
            }).then(() => {
                return employeeRef.key;
            });
        }

        function updateEmployeeInFirebase(employeeId, employee) {
            return database.ref('employees/' + employeeId).update({
                name: employee.name,
                position: employee.position,
                photo: employee.photo
            });
        }

        function deleteEmployeeFromFirebase(employeeId) {
            // Delete employee and their attendance records
            const updates = {};
            updates['employees/' + employeeId] = null;
            
            // Also delete attendance records for this employee
            attendanceRecords.forEach(record => {
                if (record.employeeId === employeeId && record.recordId) {
                    updates['attendanceRecords/' + record.recordId] = null;
                }
            });
            
            return database.ref().update(updates);
        }

        function saveAttendanceToFirebase(record) {
            const attendanceRef = database.ref('attendanceRecords').push();
            return attendanceRef.set(record);
        }

        function updateAttendanceInFirebase(recordId, updates) {
            return database.ref('attendanceRecords/' + recordId).update(updates);
        }

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            loadDataFromFirebase();
            
            // Set default dates for reports
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            document.getElementById('start-date').value = firstDay.toISOString().split('T')[0];
            document.getElementById('end-date').value = today.toISOString().split('T')[0];
        });



        // Tab switching
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            
            // Stop scanning when switching tabs
            if (isScanning) {
                stopScanning();
            }
            
            // If switching to admin tab and logged in, show default employees tab
            if (tabName === 'admin' && isAdminLoggedIn) {
                showAdminTab('employees');
            }
        }

        // Admin sub-tab switching
        function showAdminTab(tabName) {
            // Hide all admin tabs
            document.querySelectorAll('.admin-tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.admin-nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected admin tab
            document.getElementById('admin-' + tabName).classList.add('active');
            event.target.classList.add('active');
            
            // Update data when switching to specific tabs
            if (tabName === 'employees') {
                updateEmployeeTable();
                updateSummaryCards();
            } else if (tabName === 'schedules') {
                updateSchedulesTable();
            } else if (tabName === 'reports') {
                updateReportsTable();
                updatePositionFilter();
            }
        }

        // QR Code scanning functions
        function startScanning() {
            const qrReader = document.getElementById('qr-reader');
            
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("qr-reader");
            }
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };
            
            html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanError
            ).then(() => {
                isScanning = true;
                document.getElementById('start-scan').style.display = 'none';
                document.getElementById('stop-scan').style.display = 'inline-block';
                document.getElementById('stop-scan').classList.add('scanning-indicator');
                
                // Show scan log container and add initial message
                document.getElementById('scan-log-container').style.display = 'block';
                addToScanLog('🎥 เริ่มระบบสแกน QR Code - พร้อมรับการสแกนต่อเนื่อง', 'success');
                
                showStatusMessage('กำลังสแกน QR Code อย่างต่อเนื่อง...', 'warning');
            }).catch(err => {
                console.error('Error starting scanner:', err);
                showStatusMessage('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้อง', 'error');
            });
        }

        function stopScanning() {
            if (html5QrCode && isScanning) {
                html5QrCode.stop().then(() => {
                    isScanning = false;
                    document.getElementById('start-scan').style.display = 'inline-block';
                    document.getElementById('stop-scan').style.display = 'none';
                    document.getElementById('stop-scan').classList.remove('scanning-indicator');
                    
                    // Add stop message to log
                    addToScanLog('⏹️ หยุดระบบสแกน QR Code แล้ว', 'warning');
                    
                    showStatusMessage('หยุดการสแกนแล้ว', 'warning');
                }).catch(err => {
                    console.error('Error stopping scanner:', err);
                });
            }
        }

        function onScanSuccess(decodedText, decodedResult) {
            // Check if in cooldown period
            if (scanCooldown) {
                return;
            }
            
            console.log('QR Code scanned:', decodedText);
            
            // Find employee by ID
            const employee = employees.find(emp => emp.id === decodedText);
            
            if (employee) {
                processAttendance(employee);
            } else {
                // Show popup for unknown employee
                showScanPopup(`ไม่พบข้อมูลพนักงาน รหัส: ${decodedText}`, 'error', { photo: '❓' });
                addToScanLog('ไม่พบข้อมูลพนักงาน รหัส: ' + decodedText, 'error');
            }
            
            // Set cooldown period
            scanCooldown = true;
            setTimeout(() => {
                scanCooldown = false;
            }, 5000); // 5 seconds cooldown
        }

        function onScanError(errorMessage) {
            // Ignore scan errors (they happen frequently during scanning)
        }

        function processAttendance(employee) {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
            
            // Get work schedule for employee position
            const schedule = workSchedules[employee.position];
            
            // Check existing records for today
            let todayRecord = attendanceRecords.find(record => 
                record.employeeId === employee.id && record.date === today
            );
            
            let action = '';
            let statusMessage = '';
            let messageType = 'success';
            let popupMessage = '';
            
            if (!todayRecord) {
                // First scan - Time In
                const newRecord = {
                    employeeId: employee.id,
                    date: today,
                    timeIn: currentTime,
                    timeOut: null
                };
                
                // Save to Firebase
                saveAttendanceToFirebase(newRecord).then(() => {
                    console.log('Attendance record saved to Firebase');
                }).catch((error) => {
                    console.error('Error saving attendance:', error);
                });
                
                action = 'ลงเวลาเข้างาน';
                
                // Check if late
                if (schedule && currentTime > schedule.startTime) {
                    const lateMinutes = calculateTimeDifference(schedule.startTime, currentTime);
                    statusMessage = `${employee.name} ลงเวลาเข้างานสำเร็จ (สาย ${lateMinutes} นาที)`;
                    popupMessage = `${employee.name} ${employee.position} ลงเวลาเข้างาน ${currentTime} สำเร็จ (สาย ${lateMinutes} นาที)`;
                    messageType = 'warning';
                } else {
                    statusMessage = `${employee.name} ลงเวลาเข้างานสำเร็จ (ตรงเวลา)`;
                    popupMessage = `${employee.name} ${employee.position} ลงเวลาเข้างาน ${currentTime} สำเร็จ`;
                }
            } else {
                // Second scan and beyond - Update Time Out (always update to latest scan)
                if (todayRecord.recordId) {
                    updateAttendanceInFirebase(todayRecord.recordId, { timeOut: currentTime }).then(() => {
                        console.log('Attendance record updated in Firebase');
                    }).catch((error) => {
                        console.error('Error updating attendance:', error);
                    });
                }
                
                action = 'อัปเดตเวลาออกงาน';
                
                // Check if early departure
                if (schedule && currentTime < schedule.endTime) {
                    const earlyMinutes = calculateTimeDifference(currentTime, schedule.endTime);
                    statusMessage = `${employee.name} อัปเดตเวลาออกงาน ${currentTime} (ออกก่อนเวลา ${earlyMinutes} นาที)`;
                    popupMessage = `${employee.name} ${employee.position} อัปเดตเวลาออกงาน ${currentTime} (ออกก่อนเวลา ${earlyMinutes} นาที)`;
                    messageType = 'warning';
                } else {
                    statusMessage = `${employee.name} อัปเดตเวลาออกงาน ${currentTime} สำเร็จ`;
                    popupMessage = `${employee.name} ${employee.position} อัปเดตเวลาออกงาน ${currentTime} สำเร็จ`;
                }
            }
            
            // Show popup notification
            showScanPopup(popupMessage, messageType, employee);
            
            // Add to scan log
            addToScanLog(statusMessage, messageType, employee, currentTime, action);
        }



        // Popup notification function
        function showScanPopup(message, type, employee) {
            // Create popup overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            `;
            
            // Create popup content
            const popup = document.createElement('div');
            popup.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                max-width: 400px;
                width: 90%;
                text-align: center;
                animation: popupSlideIn 0.3s ease-out;
            `;
            
            // Add animation keyframes
            if (!document.getElementById('popup-styles')) {
                const style = document.createElement('style');
                style.id = 'popup-styles';
                style.textContent = `
                    @keyframes popupSlideIn {
                        from {
                            transform: scale(0.7) translateY(-50px);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1) translateY(0);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Set popup content based on type
            let icon = '✅';
            let bgColor = '#d4edda';
            let borderColor = '#28a745';
            
            if (type === 'warning') {
                icon = '⚠️';
                bgColor = '#fff3cd';
                borderColor = '#ffc107';
            } else if (type === 'error') {
                icon = '❌';
                bgColor = '#f8d7da';
                borderColor = '#dc3545';
            }
            
            popup.innerHTML = `
                <div style="
                    background: ${bgColor};
                    border: 3px solid ${borderColor};
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 20px;
                ">
                    <div style="font-size: 3rem; margin-bottom: 15px;">${icon}</div>
                    <div style="font-size: 2rem; margin-bottom: 10px;">${employee.photo}</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #333; line-height: 1.4;">
                        ${message}
                    </div>
                </div>
                <button onclick="this.closest('.popup-overlay').remove()" style="
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">ตกลง</button>
            `;
            
            overlay.className = 'popup-overlay';
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            
            // Auto close after 3 seconds
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 3000);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
        }

        // Scan log management
        let scanLogEntries = [];

        function addToScanLog(message, type, employee = null, time = null, action = null) {
            const now = new Date();
            const timestamp = now.toLocaleTimeString('th-TH');
            
            let icon = '✅';
            let bgColor = '#d4edda';
            let textColor = '#155724';
            
            if (type === 'error') {
                icon = '❌';
                bgColor = '#f8d7da';
                textColor = '#721c24';
            } else if (type === 'warning') {
                icon = '⚠️';
                bgColor = '#fff3cd';
                textColor = '#856404';
            }
            
            const logEntry = {
                id: Date.now(),
                timestamp: timestamp,
                message: message,
                type: type,
                employee: employee,
                time: time,
                action: action,
                icon: icon,
                bgColor: bgColor,
                textColor: textColor
            };
            
            // Add to beginning of array (newest first)
            scanLogEntries.unshift(logEntry);
            
            // Keep only last 50 entries
            if (scanLogEntries.length > 50) {
                scanLogEntries = scanLogEntries.slice(0, 50);
            }
            
            updateScanLogDisplay();
            
            // Show scan log container when scanning starts
            document.getElementById('scan-log-container').style.display = 'block';
        }

        function updateScanLogDisplay() {
            const scanLogDiv = document.getElementById('scan-log');
            
            if (scanLogEntries.length === 0) {
                scanLogDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">ยังไม่มีประวัติการสแกน</div>';
                return;
            }
            
            let html = '';
            scanLogEntries.forEach(entry => {
                html += `
                    <div style="
                        background: ${entry.bgColor};
                        color: ${entry.textColor};
                        padding: 12px 15px;
                        margin: 8px 0;
                        border-radius: 8px;
                        border-left: 4px solid ${entry.textColor};
                        display: flex;
                        align-items: center;
                        animation: slideInRight 0.3s ease-out;
                    ">
                        <div style="font-size: 1.2rem; margin-right: 10px;">${entry.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; margin-bottom: 4px;">
                                ${entry.message}
                            </div>
                            <div style="font-size: 0.85rem; opacity: 0.8;">
                                เวลา: ${entry.timestamp}
                                ${entry.employee ? ` | รหัส: ${entry.employee.id} | ตำแหน่ง: ${entry.employee.position}` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            scanLogDiv.innerHTML = html;
            
            // Auto scroll to top to show newest entry
            scanLogDiv.scrollTop = 0;
        }

        function clearScanLog() {
            if (confirm('ต้องการล้างประวัติการสแกนทั้งหมดหรือไม่?')) {
                scanLogEntries = [];
                updateScanLogDisplay();
            }
        }

        function showStatusMessage(message, type) {
            // Keep the simple status message for non-scanning operations
            const statusDiv = document.getElementById('status-message');
            statusDiv.textContent = message;
            statusDiv.className = `status-message ${type}`;
            statusDiv.style.display = 'block';
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }



        // Admin functions
        function adminLogin() {
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (username === 'admin' && password === 'Tle019') {
                isAdminLoggedIn = true;
                document.getElementById('admin-login').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
                
                // Show default employees tab
                showAdminTab('employees');
                
                // Update all data
                updateEmployeeTable();
                updateSummaryCards();
                updateSchedulesTable();
                updateReportsTable();
                updatePositionFilter();
            } else {
                alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }
        }

        function adminLogout() {
            isAdminLoggedIn = false;
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
        }

        function addEmployee() {
            const name = document.getElementById('new-employee-name').value;
            const position = document.getElementById('new-employee-position').value;
            const photo = document.getElementById('new-employee-photo').value;
            
            if (name && position) {
                const newEmployee = {
                    name: name,
                    position: position,
                    photo: photo
                };
                
                saveEmployeeToFirebase(newEmployee).then((employeeId) => {
                    // Clear form
                    document.getElementById('new-employee-name').value = '';
                    document.getElementById('new-employee-position').value = '';
                    document.getElementById('new-employee-photo').value = '👤';
                    
                    alert('เพิ่มพนักงานสำเร็จ รหัสพนักงาน: ' + employeeId);
                }).catch((error) => {
                    console.error('Error adding employee:', error);
                    alert('เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
                });
            } else {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            }
        }

        // Work schedule management functions

        function addWorkSchedule() {
            const positionName = document.getElementById('new-position-name').value;
            const startTime = document.getElementById('new-start-time').value;
            const endTime = document.getElementById('new-end-time').value;
            const breakTime = parseInt(document.getElementById('new-break-time').value) || 60;
            
            if (positionName && startTime && endTime) {
                if (workSchedules[positionName]) {
                    alert('ตำแหน่งนี้มีอยู่แล้ว');
                    return;
                }
                
                const schedule = {
                    startTime: startTime,
                    endTime: endTime,
                    breakTime: breakTime
                };
                
                saveWorkScheduleToFirebase(positionName, schedule).then(() => {
                    // Clear form
                    document.getElementById('new-position-name').value = '';
                    document.getElementById('new-start-time').value = '';
                    document.getElementById('new-end-time').value = '';
                    document.getElementById('new-break-time').value = '';
                    
                    alert('เพิ่มตำแหน่งงานสำเร็จ');
                }).catch((error) => {
                    console.error('Error adding work schedule:', error);
                    alert('เกิดข้อผิดพลาดในการเพิ่มตำแหน่งงาน');
                });
            } else {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            }
        }

        function deleteWorkSchedule(positionName) {
            if (confirm('ต้องการลบตำแหน่งงานนี้หรือไม่?')) {
                deleteWorkScheduleFromFirebase(positionName).then(() => {
                    alert('ลบตำแหน่งงานสำเร็จ');
                }).catch((error) => {
                    console.error('Error deleting work schedule:', error);
                    alert('เกิดข้อผิดพลาดในการลบตำแหน่งงาน');
                });
            }
        }

        function updateSchedulesTable() {
            const tbody = document.querySelector('#schedules-table tbody');
            tbody.innerHTML = '';
            
            Object.entries(workSchedules).forEach(([position, schedule]) => {
                const workHours = calculateScheduleWorkHours(schedule.startTime, schedule.endTime, schedule.breakTime);
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${position}</td>
                    <td>${schedule.startTime}</td>
                    <td>${schedule.endTime}</td>
                    <td>${workHours}</td>
                    <td>${schedule.breakTime}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteWorkSchedule('${position}')">🗑️ ลบ</button>
                    </td>
                `;
            });
            
            // Update position dropdowns
            updatePositionDropdowns();
        }

        function updatePositionDropdowns() {
            // Update add employee position dropdown
            const addPositionSelect = document.getElementById('new-employee-position');
            if (addPositionSelect) {
                const currentValue = addPositionSelect.value;
                addPositionSelect.innerHTML = '<option value="">เลือกตำแหน่ง</option>';
                Object.keys(workSchedules).forEach(position => {
                    const option = document.createElement('option');
                    option.value = position;
                    option.textContent = position;
                    addPositionSelect.appendChild(option);
                });
                addPositionSelect.value = currentValue;
            }
            
            // Update position filter and other dropdowns
            updatePositionFilter();
        }

        function updatePositionFilter() {
            const positionFilter = document.getElementById('position-filter');
            if (!positionFilter) return;
            
            // Get unique positions from employees
            const positions = [...new Set(employees.map(emp => emp.position))];
            
            // Clear existing options except the first one
            positionFilter.innerHTML = '<option value="">ทุกตำแหน่ง</option>';
            
            // Add position options
            positions.sort().forEach(position => {
                const option = document.createElement('option');
                option.value = position;
                option.textContent = position;
                positionFilter.appendChild(option);
            });
        }

        function calculateScheduleWorkHours(startTime, endTime, breakTime) {
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            
            let startMinutes = startHour * 60 + startMin;
            let endMinutes = endHour * 60 + endMin;
            
            // Handle overnight shifts
            if (endMinutes < startMinutes) {
                endMinutes += 24 * 60; // Add 24 hours
            }
            
            const totalMinutes = endMinutes - startMinutes - breakTime;
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            return `${hours}:${minutes.toString().padStart(2, '0')}`;
        }

        function calculateTimeDifference(time1, time2) {
            const [hour1, min1] = time1.split(':').map(Number);
            const [hour2, min2] = time2.split(':').map(Number);
            
            let minutes1 = hour1 * 60 + min1;
            let minutes2 = hour2 * 60 + min2;
            
            // Handle overnight shifts
            if (minutes2 < minutes1) {
                minutes2 += 24 * 60;
            }
            
            return Math.abs(minutes2 - minutes1);
        }

        function editEmployee(employeeId) {
            const employee = employees.find(emp => emp.id === employeeId);
            if (!employee) return;
            
            // Populate edit form
            document.getElementById('edit-employee-id').value = employee.id;
            document.getElementById('edit-employee-name').value = employee.name;
            document.getElementById('edit-employee-photo').value = employee.photo;
            
            // Populate position dropdown
            const positionSelect = document.getElementById('edit-employee-position');
            positionSelect.innerHTML = '<option value="">เลือกตำแหน่ง</option>';
            Object.keys(workSchedules).forEach(position => {
                const option = document.createElement('option');
                option.value = position;
                option.textContent = position;
                if (position === employee.position) {
                    option.selected = true;
                }
                positionSelect.appendChild(option);
            });
            
            // Show modal
            document.getElementById('edit-employee-modal').style.display = 'block';
        }

        function closeEditModal() {
            document.getElementById('edit-employee-modal').style.display = 'none';
        }

        function saveEmployeeEdit() {
            const employeeId = document.getElementById('edit-employee-id').value;
            const name = document.getElementById('edit-employee-name').value;
            const position = document.getElementById('edit-employee-position').value;
            const photo = document.getElementById('edit-employee-photo').value;
            
            if (!name || !position) {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน');
                return;
            }
            
            const updatedEmployee = {
                name: name,
                position: position,
                photo: photo
            };
            
            updateEmployeeInFirebase(employeeId, updatedEmployee).then(() => {
                closeEditModal();
                alert('แก้ไขข้อมูลพนักงานสำเร็จ');
            }).catch((error) => {
                console.error('Error updating employee:', error);
                alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูลพนักงาน');
            });
        }

        function deleteEmployee(employeeId) {
            if (confirm('ต้องการลบพนักงานคนนี้หรือไม่? (ข้อมูลการเข้า-ออกงานจะถูกลบด้วย)')) {
                deleteEmployeeFromFirebase(employeeId).then(() => {
                    alert('ลบพนักงานสำเร็จ');
                }).catch((error) => {
                    console.error('Error deleting employee:', error);
                    alert('เกิดข้อผิดพลาดในการลบพนักงาน');
                });
            }
        }

        function updateEmployeeTable() {
            const tbody = document.querySelector('#employees-table tbody');
            const today = new Date().toISOString().split('T')[0];
            
            tbody.innerHTML = '';
            
            employees.forEach(employee => {
                const todayRecord = attendanceRecords.find(record => 
                    record.employeeId === employee.id && record.date === today
                );
                
                const schedule = workSchedules[employee.position];
                let status = '❌ ยังไม่มาทำงาน';
                
                if (todayRecord) {
                    if (todayRecord.timeOut) {
                        status = '✅ ทำงานครบ';
                    } else {
                        status = '🟡 กำลังทำงาน';
                    }
                    
                    // Check if late based on position schedule
                    if (schedule && todayRecord.timeIn > schedule.startTime) {
                        status += ' (สาย)';
                    } else if (!schedule && todayRecord.timeIn > '09:00') {
                        status += ' (สาย)';
                    }
                }
                
                const scheduleText = schedule ? `${schedule.startTime}-${schedule.endTime}` : 'ไม่ได้กำหนด';
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${employee.id}</td>
                    <td>${employee.photo} ${employee.name}</td>
                    <td>${employee.position}<br><small style="color: #666;">เวลาทำงาน: ${scheduleText}</small></td>
                    <td>${status}</td>
                    <td>
                        <button class="btn" onclick="editEmployee('${employee.id}')" style="background: linear-gradient(45deg, #2196F3, #1976D2); margin-right: 5px;">✏️ แก้ไข</button>
                        <button class="btn btn-danger" onclick="deleteEmployee('${employee.id}')">🗑️ ลบ</button>
                    </td>
                `;
            });
        }

        function updateSummaryCards() {
            const today = new Date().toISOString().split('T')[0];
            const todayRecords = attendanceRecords.filter(record => record.date === today);
            
            document.getElementById('total-employees').textContent = employees.length;
            document.getElementById('present-today').textContent = todayRecords.length;
            
            // Count late employees based on their position schedule
            const lateCount = todayRecords.filter(record => {
                const employee = employees.find(emp => emp.id === record.employeeId);
                if (!employee) return false;
                
                const schedule = workSchedules[employee.position];
                if (schedule) {
                    return record.timeIn > schedule.startTime;
                } else {
                    return record.timeIn > '09:00'; // Default late time
                }
            }).length;
            
            document.getElementById('late-today').textContent = lateCount;
        }

        // Reports functions
        function updateReportsTable() {
            const tbody = document.querySelector('#reports-table tbody');
            tbody.innerHTML = '';
            
            const sortedRecords = [...attendanceRecords].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            sortedRecords.forEach(record => {
                const employee = employees.find(emp => emp.id === record.employeeId);
                if (!employee) return;
                
                const schedule = workSchedules[employee.position];
                const workHours = calculateWorkHours(record.timeIn, record.timeOut);
                let status = '🟡 กำลังทำงาน';
                
                if (record.timeOut) {
                    status = '✅ ทำงานครบ';
                    
                    // Check if left early
                    if (schedule && record.timeOut < schedule.endTime) {
                        status += ' (ออกก่อนเวลา)';
                    }
                } else {
                    status = '🟡 กำลังทำงาน';
                }
                
                // Check if late based on position schedule
                if (schedule && record.timeIn > schedule.startTime) {
                    status += ' (สาย)';
                } else if (!schedule && record.timeIn > '09:00') {
                    status += ' (สาย)';
                }
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${formatDate(record.date)}</td>
                    <td>${employee.name}</td>
                    <td>${employee.position}</td>
                    <td>${record.timeIn}${schedule ? `<br><small style="color: #666;">กำหนด: ${schedule.startTime}</small>` : ''}</td>
                    <td>${record.timeOut || '-'}${schedule ? `<br><small style="color: #666;">กำหนด: ${schedule.endTime}</small>` : ''}</td>
                    <td>${workHours}</td>
                    <td>${status}</td>
                `;
            });
        }

        function calculateWorkHours(timeIn, timeOut) {
            if (!timeOut) return '-';
            
            const [inHour, inMin] = timeIn.split(':').map(Number);
            const [outHour, outMin] = timeOut.split(':').map(Number);
            
            let inMinutes = inHour * 60 + inMin;
            let outMinutes = outHour * 60 + outMin;
            
            // Handle overnight shifts
            if (outMinutes < inMinutes) {
                outMinutes += 24 * 60;
            }
            
            const diffMinutes = outMinutes - inMinutes;
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            
            return `${hours}:${minutes.toString().padStart(2, '0')}`;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH');
        }

        function filterReports() {
            const searchTerm = document.getElementById('search-employee').value.toLowerCase();
            const positionFilter = document.getElementById('position-filter').value;
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            const rows = document.querySelectorAll('#reports-table tbody tr');
            
            rows.forEach(row => {
                const employeeName = row.cells[1].textContent.toLowerCase();
                const employeePosition = row.cells[2].textContent;
                const recordDate = row.cells[0].textContent;
                
                // Convert Thai date back to ISO format for comparison
                const dateParts = recordDate.split('/');
                const isoDate = `${parseInt(dateParts[2]) - 543}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                
                const matchesSearch = !searchTerm || employeeName.includes(searchTerm);
                const matchesPosition = !positionFilter || employeePosition === positionFilter;
                const matchesDateRange = (!startDate || isoDate >= startDate) && 
                    (!endDate || isoDate <= endDate);
                
                row.style.display = matchesSearch && matchesPosition && matchesDateRange ? '' : 'none';
            });
        }

        function exportToExcel() {
            const table = document.getElementById('reports-table');
            const wb = XLSX.utils.table_to_book(table, { sheet: "รายงานการเข้า-ออกงาน" });
            XLSX.writeFile(wb, `รายงานการเข้า-ออกงาน_${new Date().toISOString().split('T')[0]}.xlsx`);
        }



        function exportToPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add Thai font support (simplified)
            doc.setFont('helvetica');
            doc.setFontSize(16);
            doc.text('รายงานการเข้า-ออกงาน', 20, 20);
            
            doc.setFontSize(12);
            let y = 40;
            
            const visibleRows = Array.from(document.querySelectorAll('#reports-table tbody tr'))
                .filter(row => row.style.display !== 'none');
            
            visibleRows.forEach(row => {
                const cells = Array.from(row.cells);
                const text = cells.map(cell => cell.textContent).join(' | ');
                doc.text(text, 20, y);
                y += 10;
                
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
            });
            
            doc.save(`รายงานการเข้า-ออกงาน_${new Date().toISOString().split('T')[0]}.pdf`);
        }

        // Table sorting functionality
        let sortStates = {}; // Track sort state for each table

        function sortTable(tableId, columnIndex) {
            const table = document.getElementById(tableId);
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const headers = table.querySelectorAll('th');
            
            // Initialize sort state for this table if not exists
            if (!sortStates[tableId]) {
                sortStates[tableId] = {};
            }
            
            // Determine sort direction
            const currentSort = sortStates[tableId][columnIndex] || 'none';
            let newSort = 'asc';
            if (currentSort === 'asc') {
                newSort = 'desc';
            } else if (currentSort === 'desc') {
                newSort = 'asc';
            }
            
            // Clear all sort indicators
            headers.forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Set new sort indicator
            headers[columnIndex].classList.add(`sort-${newSort}`);
            
            // Sort rows
            rows.sort((a, b) => {
                let aValue = a.cells[columnIndex].textContent.trim();
                let bValue = b.cells[columnIndex].textContent.trim();
                
                // Handle different data types
                if (isDate(aValue) && isDate(bValue)) {
                    // Date comparison
                    aValue = parseThaiDate(aValue);
                    bValue = parseThaiDate(bValue);
                } else if (isTime(aValue) && isTime(bValue)) {
                    // Time comparison
                    aValue = parseTime(aValue);
                    bValue = parseTime(bValue);
                } else if (isNumber(aValue) && isNumber(bValue)) {
                    // Number comparison
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                } else {
                    // String comparison (case insensitive)
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }
                
                if (aValue < bValue) return newSort === 'asc' ? -1 : 1;
                if (aValue > bValue) return newSort === 'asc' ? 1 : -1;
                return 0;
            });
            
            // Update sort state
            sortStates[tableId] = {};
            sortStates[tableId][columnIndex] = newSort;
            
            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
        }

        function isDate(str) {
            // Check if string looks like a Thai date (dd/mm/yyyy)
            return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str);
        }

        function isTime(str) {
            // Check if string looks like time (HH:MM)
            return /^\d{1,2}:\d{2}/.test(str);
        }

        function isNumber(str) {
            // Check if string is a number
            return !isNaN(parseFloat(str)) && isFinite(str);
        }

        function parseThaiDate(dateStr) {
            // Convert Thai date (dd/mm/yyyy) to Date object
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                const year = parseInt(parts[2]) - 543; // Convert Buddhist year to Gregorian
                return new Date(year, month, day);
            }
            return new Date(dateStr);
        }

        function parseTime(timeStr) {
            // Convert time string to minutes for comparison
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                const hours = parseInt(parts[0]);
                const minutes = parseInt(parts[1]);
                return hours * 60 + minutes;
            }
            return 0;
        }