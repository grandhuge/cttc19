        let participants = [];
        let roomCounter = 1;
        let displayRoomCounter = 1; // For display purposes only
        let existingData = null;
        let isUpdateMode = false;
        let usedRoomNumbers = new Set();

        // Department options
        const departments = [
            'ฝ่ายบริหารทั่วไป',
            'กลุ่มพัฒนาบุคลากร',
            'กลุ่มพัฒนาบุคลากรสหกรณ์',
            'กลุ่มเผยแพร่และประชาสัมพันธ์',
            'กลุ่มแผนพัฒนาการถ่ายทอดเทคโนโลยีการสหกรณ์',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 1',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 2',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 3',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 4',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 5',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 6',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 7',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 8',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 9',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 10',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 11',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 12',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 13',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 14',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 15',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 16',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 17',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 18',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 19',
            'ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 20',
			'กองประสานงานโครงการพระราชดำริ'
        ];

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            loadDepartments();
            loadUsedRoomNumbers();
            setupModalEvents();
        });

        function loadDepartments() {
            const departmentSelect = document.getElementById('departmentSelect');
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                departmentSelect.appendChild(option);
            });
        }

        function loadUsedRoomNumbers() {
            // JSONP callback for getting used room numbers
            window.handleUsedRoomsResponse = function(response) {
                if (response.status === 'success' && response.usedRooms) {
                    usedRoomNumbers = new Set(response.usedRooms);
                    roomCounter = getNextAvailableRoomNumber();
                }
            };

            // Request used room numbers
            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbzb1A8UwW30W8Lji3uxHY-WOQPk29DeytLk7rGmZrqWlAuojh0OVjN0tsicBtRoYy2S/exec?callback=handleUsedRoomsResponse&action=getUsedRooms`;
            document.head.appendChild(script);
            script.onload = () => document.head.removeChild(script);
        }

        function getNextAvailableRoomNumber() {
            let roomNum = 1;
            while (usedRoomNumbers.has(roomNum.toString())) {
                roomNum++;
            }
            return roomNum;
        }

        // Handle department selection
        document.getElementById('departmentSelect').addEventListener('change', function() {
            const selectedDept = this.value;
            if (selectedDept) {
                checkExistingData(selectedDept);
                document.getElementById('coordinatorSection').style.display = 'block';
                document.getElementById('participantCountSection').style.display = 'block';
            } else {
                document.getElementById('coordinatorSection').style.display = 'none';
                document.getElementById('participantCountSection').style.display = 'none';
                document.getElementById('existingDataAlert').style.display = 'none';
                document.getElementById('participantForms').innerHTML = '';
                document.getElementById('submitSection').style.display = 'none';
            }
        });

        // Phone number formatting
        document.getElementById('coordinatorPhone').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 3 && value.length <= 6) {
                value = value.replace(/(\d{3})(\d+)/, '$1-$2');
            } else if (value.length > 6) {
                value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
            }
            e.target.value = value;
        });

        function checkExistingData(department) {
            // JSONP callback for checking existing data
            window.handleExistingDataResponse = function(response) {
                if (response.status === 'success' && response.data && response.data.length > 0) {
                    existingData = response.data;
                    isUpdateMode = true;
                    document.getElementById('existingDataAlert').style.display = 'block';
                    document.getElementById('submitButtonText').textContent = 'อัพเดทข้อมูลการลงทะเบียน';
                    
                    // Auto-fill participant count
                    document.getElementById('participantCount').value = existingData.length;
                    document.getElementById('participantCount').dispatchEvent(new Event('change'));
                } else {
                    existingData = null;
                    isUpdateMode = false;
                    document.getElementById('existingDataAlert').style.display = 'none';
                    document.getElementById('submitButtonText').textContent = 'ส่งข้อมูลการลงทะเบียน';
                }
            };

            // Request existing data
            const script = document.createElement('script');
            const params = new URLSearchParams({
                callback: 'handleExistingDataResponse',
                action: 'checkExisting',
                department: department
            });
            script.src = `https://script.google.com/macros/s/AKfycbzb1A8UwW30W8Lji3uxHY-WOQPk29DeytLk7rGmZrqWlAuojh0OVjN0tsicBtRoYy2S/exec?${params}`;
            document.head.appendChild(script);
            script.onload = () => document.head.removeChild(script);
        }

        // Handle participant count change
        document.getElementById('participantCount').addEventListener('change', function() {
            const count = parseInt(this.value);
            if (count > 0) {
                generateParticipantForms(count);
                document.getElementById('submitSection').style.display = 'block';
            } else {
                document.getElementById('participantForms').innerHTML = '';
                document.getElementById('submitSection').style.display = 'none';
            }
        });

        function generateParticipantForms(count) {
            const formsContainer = document.getElementById('participantForms');
            const selectedDept = document.getElementById('departmentSelect').value;
            formsContainer.innerHTML = '';

            for (let i = 1; i <= count; i++) {
                const existingParticipant = existingData && existingData[i-1] ? existingData[i-1] : null;
                
                const formHTML = `
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 sm:p-8 rounded-2xl card-shadow">
                        <h4 class="text-lg sm:text-xl font-bold high-contrast-text mb-6 flex items-center">
                            <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">${i}</span>
                            ผู้เข้าร่วมคนที่ ${i}
                        </h4>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-base font-semibold high-contrast-text mb-3">
                                    <span class="text-red-600">*</span> คำนำหน้า
                                </label>
                                <select name="prefix_${i}" class="w-full input-large border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 focus-ring transition-all duration-200" required>
                                    <option value="">เลือกคำนำหน้า</option>
                                    <option value="นาย" ${existingParticipant && existingParticipant.prefix === 'นาย' ? 'selected' : ''}>นาย</option>
                                    <option value="นาง" ${existingParticipant && existingParticipant.prefix === 'นาง' ? 'selected' : ''}>นาง</option>
                                    <option value="นางสาว" ${existingParticipant && existingParticipant.prefix === 'นางสาว' ? 'selected' : ''}>นางสาว</option>
                                    <option value="อื่นๆ" ${existingParticipant && !['นาย', 'นาง', 'นางสาว'].includes(existingParticipant.prefix) ? 'selected' : ''}>อื่นๆ ระบุ</option>
                                </select>
                                <input type="text" name="other_prefix_${i}" placeholder="ระบุคำนำหน้าอื่นๆ" 
                                       value="${existingParticipant && !['นาย', 'นาง', 'นางสาว'].includes(existingParticipant.prefix) ? existingParticipant.prefix : ''}"
                                       class="w-full input-large border-2 border-gray-300 rounded-xl mt-3 focus:ring-4 focus:ring-blue-500 focus:border-blue-500 focus-ring transition-all duration-200" 
                                       style="display: ${existingParticipant && !['นาย', 'นาง', 'นางสาว'].includes(existingParticipant.prefix) ? 'block' : 'none'};">
                            </div>
                            <div>
                                <label class="block text-base font-semibold high-contrast-text mb-3">
                                    <span class="text-red-600">*</span> ชื่อ
                                </label>
                                <input type="text" name="firstname_${i}" value="${existingParticipant ? existingParticipant.firstname : ''}" 
                                       class="w-full input-large border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 focus-ring transition-all duration-200" required>
                            </div>
                            <div>
                                <label class="block text-base font-semibold high-contrast-text mb-3">
                                    <span class="text-red-600">*</span> นามสกุล
                                </label>
                                <input type="text" name="lastname_${i}" value="${existingParticipant ? existingParticipant.lastname : ''}" 
                                       class="w-full input-large border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 focus-ring transition-all duration-200" required>
                            </div>
                            <div>
                                <label class="block text-base font-semibold high-contrast-text mb-3">สังกัด</label>
                                <input type="text" name="department_${i}" value="${selectedDept}" readonly
                                       class="w-full input-large border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-600">
                            </div>
                            <div class="lg:col-span-2">
                                <label class="block text-base font-semibold high-contrast-text mb-3">
                                    <span class="text-red-600">*</span> ประเภทอาหาร
                                </label>
                                <select name="food_type_${i}" class="w-full input-large border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 focus-ring transition-all duration-200" required>
                                    <option value="">เลือกประเภทอาหาร</option>
                                    <option value="ไทย" ${existingParticipant && existingParticipant.food_type === 'ไทย' ? 'selected' : ''}>อาหารไทย</option>
                                    <option value="มุสลิม" ${existingParticipant && existingParticipant.food_type === 'มุสลิม' ? 'selected' : ''}>อาหารมุสลิม (ฮาลาล)</option>
                                    <option value="เจ" ${existingParticipant && existingParticipant.food_type === 'เจ' ? 'selected' : ''}>อาหารเจ</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;
                formsContainer.innerHTML += formHTML;
            }

            // Add event listeners for prefix changes
            for (let i = 1; i <= count; i++) {
                const prefixSelect = document.querySelector(`select[name="prefix_${i}"]`);
                const otherPrefixInput = document.querySelector(`input[name="other_prefix_${i}"]`);
                
                prefixSelect.addEventListener('change', function() {
                    if (this.value === 'อื่นๆ') {
                        otherPrefixInput.style.display = 'block';
                        otherPrefixInput.required = true;
                    } else {
                        otherPrefixInput.style.display = 'none';
                        otherPrefixInput.required = false;
                        otherPrefixInput.value = '';
                    }
                });
            }
        }

        function setupModalEvents() {
            // Summary modal events
            document.getElementById('viewSummaryBtn').addEventListener('click', function() {
                document.getElementById('summaryModal').style.display = 'flex';
                loadSummaryData();
            });

            document.getElementById('closeSummaryModal').addEventListener('click', function() {
                document.getElementById('summaryModal').style.display = 'none';
            });

            // Confirmation modal events
            document.getElementById('confirmYes').addEventListener('click', function() {
                document.getElementById('confirmModal').style.display = 'none';
                proceedWithSubmission();
            });

            document.getElementById('confirmNo').addEventListener('click', function() {
                document.getElementById('confirmModal').style.display = 'none';
            });
        }

function maskPhone(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, ''); // ลบตัวอักษรที่ไม่ใช่ตัวเลข
    if (digits.length < 7) return phone; // ถ้าเบอร์สั้นเกินไปไม่ต้องแปลง

    const visiblePart = digits.slice(0, digits.length - 4);
    return `${visiblePart}XXXX`;
}

        function loadSummaryData() {
            // JSONP callback for getting summary data
            window.handleSummaryResponse = function(response) {
                const summaryContent = document.getElementById('summaryContent');
                
                if (response.status === 'success' && response.summary) {
                    const summary = response.summary;
                    let totalParticipants = 0;
                    
                    let summaryHTML = `
                        <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl mb-6">
                            <h4 class="text-xl font-bold mb-2">สรุปภาพรวม</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="text-3xl font-bold">${summary.totalDepartments}</div>
                                    <div class="text-sm opacity-90">หน่วยงานที่ลงทะเบียน</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-3xl font-bold">${summary.totalParticipants}</div>
                                    <div class="text-sm opacity-90">ผู้เข้าร่วมทั้งหมด</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h4 class="text-lg font-semibold text-gray-800">รายละเอียดการลงทะเบียนแต่ละหน่วยงาน</h4>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-blue-50">
                                        <tr>
                                            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">ลำดับ</th>
                                            <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">หน่วยงาน (สังกัด)</th>
                                            <th class="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">จำนวนผู้เข้าร่วมโครงการ</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                    `;
                    
                    summary.departments.forEach((dept, index) => {
                        totalParticipants += dept.participantCount;
                        summaryHTML += `
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-sm text-gray-600">${index + 1}</td>
                                <td class="px-6 py-4">
                                    <div class="text-sm font-medium text-gray-800">${dept.department}</div>
                                    <div class="text-xs text-gray-500 mt-1">ผู้ประสานงาน: ${dept.coordinator}</div>
                                    <div class="text-xs text-gray-500">โทร: ${maskPhone(dept.phone)}</div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        ${dept.participantCount} คน
                                    </span>
                                </td>
                            </tr>
                        `;
                    });
                    
                    summaryHTML += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                    summaryContent.innerHTML = summaryHTML;
                } else {
                    summaryContent.innerHTML = `
                        <div class="text-center py-8">
                            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            <p class="text-gray-600 text-lg">ยังไม่มีข้อมูลการลงทะเบียน</p>
                        </div>
                    `;
                }
            };

            // Request summary data
            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbzb1A8UwW30W8Lji3uxHY-WOQPk29DeytLk7rGmZrqWlAuojh0OVjN0tsicBtRoYy2S/exec?callback=handleSummaryResponse&action=getSummary`;
            document.head.appendChild(script);
            script.onload = () => document.head.removeChild(script);
        }

        // Handle form submission
        document.getElementById('registrationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }

            // Show confirmation modal
            document.getElementById('confirmModal').style.display = 'flex';
        });

        function validateForm() {
            const requiredFields = document.querySelectorAll('#registrationForm [required]');
            for (let field of requiredFields) {
                if (!field.value.trim()) {
                    // Create custom alert for better UX
                    showCustomAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
                    field.focus();
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
            }
            
            // Validate phone number format
            const phoneField = document.getElementById('coordinatorPhone');
            const phonePattern = /^\d{3}-\d{3}-\d{4}$/;
            if (!phonePattern.test(phoneField.value)) {
                showCustomAlert('กรุณากรอกเบอร์โทรให้ถูกต้อง (รูปแบบ: 08X-XXX-XXXX)', 'warning');
                phoneField.focus();
                return false;
            }
            
            return true;
        }

        function showCustomAlert(message, type = 'info') {
            const alertDiv = document.createElement('div');
            const bgColor = type === 'warning' ? 'warning-bg' : type === 'success' ? 'success-bg' : 'high-contrast-bg';
            
            alertDiv.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-xl card-shadow-lg z-50 max-w-md`;
            alertDiv.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-base font-medium">${message}</span>
                </div>
            `;
            
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }

        function proceedWithSubmission() {
            const formData = new FormData(document.getElementById('registrationForm'));
            const count = parseInt(document.getElementById('participantCount').value);
            const selectedDept = document.getElementById('departmentSelect').value;
            participants = [];

            // Add coordinator info
            const coordinatorInfo = {
                name: formData.get('coordinatorName') || document.getElementById('coordinatorName').value,
                phone: formData.get('coordinatorPhone') || document.getElementById('coordinatorPhone').value
            };

            for (let i = 1; i <= count; i++) {
                const prefix = formData.get(`prefix_${i}`) === 'อื่นๆ' ? formData.get(`other_prefix_${i}`) : formData.get(`prefix_${i}`);
                const participant = {
                    id: i,
                    prefix: prefix,
                    firstname: formData.get(`firstname_${i}`),
                    lastname: formData.get(`lastname_${i}`),
                    department: selectedDept,
                    food_type: formData.get(`food_type_${i}`),
                    coordinator: coordinatorInfo
                };
                participants.push(participant);
            }

            // Show room pairing section
            document.getElementById('roomPairingSection').style.display = 'block';
            setupRoomPairing();
            
            // Scroll to room pairing section
            document.getElementById('roomPairingSection').scrollIntoView({ behavior: 'smooth' });
        }

        function setupRoomPairing() {
            const participantsPool = document.getElementById('participantsPool');
            const roomAssignments = document.getElementById('roomAssignments');
            
            // Clear previous content
            participantsPool.innerHTML = '';
            roomAssignments.innerHTML = '';
            
            // Reset counters
            roomCounter = getNextAvailableRoomNumber();
            displayRoomCounter = 1;

            // Add participants to pool
            participants.forEach(participant => {
                const participantCard = createParticipantCard(participant);
                participantsPool.appendChild(participantCard);
            });

            // Calculate maximum number of rooms based on participant count
            // Formula: Math.floor(participantCount/2) + 1
            const participantCount = participants.length;
            const maxRooms = Math.floor(participantCount / 2) + 1;

            console.log(`Creating ${maxRooms} rooms for ${participantCount} participants`);

            // Create initial rooms based on calculated maximum
            for (let i = 0; i < maxRooms; i++) {
                console.log(`Creating room ${i + 1} of ${maxRooms}`);
                createNewRoom();
            }

            // Setup drag and drop
            setupDragAndDrop();
        }

        function createParticipantCard(participant) {
            const card = document.createElement('div');
            card.className = 'participant-card bg-white p-4 sm:p-5 rounded-xl card-shadow mb-4 border-l-4 border-blue-500 hover:border-blue-600 transition-all duration-200';
            card.draggable = true;
            card.dataset.participantId = participant.id;
            card.innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-blue-100 rounded-full p-2 mr-3">
                        <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <div class="text-lg font-bold high-contrast-text">${participant.prefix}${participant.firstname} ${participant.lastname}</div>
                        <div class="text-sm text-gray-600 mt-1">${participant.department}</div>
                    </div>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                    </svg>
                    <span>อาหาร: ${participant.food_type}</span>
                </div>
                <div class="mt-2 text-xs text-blue-600 font-medium">
                    <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                    </svg>
                    ลากเพื่อจัดห้อง
                </div>
            `;
            return card;
        }

        function createNewRoom() {
            const roomAssignments = document.getElementById('roomAssignments');
            const roomCard = document.createElement('div');
            
            // Store current values before incrementing
            const currentRoomCounter = roomCounter;
            const currentDisplayCounter = displayRoomCounter;
            
            roomCard.className = 'room-card text-white card-shadow-lg drop-zone relative overflow-hidden';
            roomCard.dataset.roomId = currentRoomCounter; // Actual room number for database
            roomCard.dataset.displayId = currentDisplayCounter; // Display room number
            roomCard.dataset.room = currentRoomCounter;
            roomCard.dataset.displayRoom = currentDisplayCounter;
            
            roomCard.innerHTML = `
                <div class="relative z-10 p-6">
                    <div class="flex items-center mb-4">
                        <div class="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"></path>
                            </svg>
                        </div>
                        <h5 class="text-xl font-bold">ห้องที่ ${currentDisplayCounter}</h5>
                    </div>
                    <div class="room-content min-h-32">
                        <div class="empty-room-placeholder text-center py-4">
                            <div class="mb-4">
                                <svg class="w-16 h-16 mx-auto opacity-70" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <p class="text-white opacity-90 text-lg font-semibold mb-2">ลากผู้เข้าร่วมมาที่นี่</p>
                            <p class="text-white opacity-70 text-base">สูงสุด 2 คน</p>
                            <div class="mt-3 flex justify-center space-x-2">
                                <div class="w-3 h-3 bg-white opacity-40 rounded-full"></div>
                                <div class="w-3 h-3 bg-white opacity-40 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="absolute inset-0 border-3 border-dashed border-white border-opacity-0 transition-all duration-300 pointer-events-none drop-zone-overlay"></div>
            `;
            
            roomAssignments.appendChild(roomCard);
            console.log(`Created room with ID: ${currentRoomCounter}, Display: ${currentDisplayCounter}`);
            
            // Mark room number as used and get next available
            usedRoomNumbers.add(currentRoomCounter.toString());
            roomCounter = getNextAvailableRoomNumber();
            displayRoomCounter++;
        }

        function setupDragAndDrop() {
            // Drag start
            document.addEventListener('dragstart', function(e) {
                if (e.target.classList.contains('participant-card')) {
                    e.target.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', e.target.dataset.participantId);
                }
            });

            // Drag end
            document.addEventListener('dragend', function(e) {
                if (e.target.classList.contains('participant-card')) {
                    e.target.classList.remove('dragging');
                }
                // Remove all drag-over effects
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });

            // Drag over
            document.addEventListener('dragover', function(e) {
                e.preventDefault();
                const dropZone = findDropZone(e.target);
                if (dropZone) {
                    // Remove drag-over from all other zones
                    document.querySelectorAll('.drag-over').forEach(el => {
                        if (el !== dropZone) el.classList.remove('drag-over');
                    });
                    dropZone.classList.add('drag-over');
                    
                    // Update overlay
                    const overlay = dropZone.querySelector('.drop-zone-overlay');
                    if (overlay) {
                        overlay.style.borderOpacity = '0.8';
                        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                }
            });

            // Drag leave
            document.addEventListener('dragleave', function(e) {
                const dropZone = findDropZone(e.target);
                if (dropZone && !dropZone.contains(e.relatedTarget)) {
                    dropZone.classList.remove('drag-over');
                    const overlay = dropZone.querySelector('.drop-zone-overlay');
                    if (overlay) {
                        overlay.style.borderOpacity = '0';
                        overlay.style.backgroundColor = 'transparent';
                    }
                }
            });

            // Drop
            document.addEventListener('drop', function(e) {
                e.preventDefault();
                const dropZone = findDropZone(e.target);
                
                if (dropZone) {
                    dropZone.classList.remove('drag-over');
                    const overlay = dropZone.querySelector('.drop-zone-overlay');
                    if (overlay) {
                        overlay.style.borderOpacity = '0';
                        overlay.style.backgroundColor = 'transparent';
                    }
                    
                    const participantId = e.dataTransfer.getData('text/plain');
                    const participantCard = document.querySelector(`[data-participant-id="${participantId}"]`);
                    
                    if (participantCard) {
                        // Check if room has space (max 2 people)
                        const currentOccupants = dropZone.querySelectorAll('.participant-card').length;
                        
                        if (currentOccupants < 2) {
                            // Add to room content area
                            const roomContent = dropZone.querySelector('.room-content') || dropZone;
                            roomContent.appendChild(participantCard);
                            
                            // Update room display
                            updateRoomDisplay(dropZone);
                            
                            // Create new room if needed
                            checkAndCreateNewRoom();
                        } else {
                            showCustomAlert('ห้องนี้เต็มแล้ว (สูงสุด 2 คน)', 'warning');
                        }
                    }
                }
            });
        }

        function findDropZone(element) {
            // Check if element itself is a drop zone
            if (element.classList.contains('drop-zone')) {
                return element;
            }
            
            // Check if element is inside a drop zone
            let parent = element.parentElement;
            while (parent) {
                if (parent.classList.contains('drop-zone')) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            
            return null;
        }

        function updateRoomDisplay(dropZone) {
            const participants = dropZone.querySelectorAll('.participant-card');
            const roomCard = dropZone.closest('.room-card, .single-room, #participantsPool');
            const roomContent = dropZone.querySelector('.room-content') || dropZone.closest('.room-content');
            
            // Apply compact style when room has 2 participants
            participants.forEach(card => {
                if (participants.length === 2) {
                    card.classList.add('compact');
                } else {
                    card.classList.remove('compact');
                }
            });
            
            if (participants.length === 0 && roomCard && (roomCard.classList.contains('room-card') || roomCard.classList.contains('single-room'))) {
                // Reset to empty room display
                const displayRoomNum = roomCard.dataset.displayId;
                if (roomContent) {
                    roomContent.innerHTML = `
                        <div class="empty-room-placeholder text-center py-4">
                            <div class="mb-4">
                                <svg class="w-16 h-16 mx-auto opacity-70" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <p class="text-white opacity-90 text-lg font-semibold mb-2">ลากผู้เข้าร่วมมาที่นี่</p>
                            <p class="text-white opacity-70 text-base">สูงสุด 2 คน</p>
                            <div class="mt-3 flex justify-center space-x-2">
                                <div class="w-3 h-3 bg-white opacity-40 rounded-full"></div>
                                <div class="w-3 h-3 bg-white opacity-40 rounded-full"></div>
                            </div>
                        </div>
                    `;
                }
                // Reset room type
                if (roomCard.classList.contains('single-room')) {
                    roomCard.classList.remove('single-room');
                    roomCard.classList.add('room-card');
                    const title = roomCard.querySelector('h5');
                    title.textContent = `ห้องที่ ${displayRoomNum}`;
                }
            } else if (participants.length === 1 && roomCard && roomCard.classList.contains('room-card')) {
                // Hide empty placeholder
                const placeholder = roomContent ? roomContent.querySelector('.empty-room-placeholder') : null;
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                // Check if this is the last room and if there are unpaired participants
                const allParticipants = document.querySelectorAll('#participantsPool .participant-card');
                if (allParticipants.length === 0) {
                    roomCard.classList.remove('room-card');
                    roomCard.classList.add('single-room');
                    const title = roomCard.querySelector('h5');
                    const displayRoomNum = roomCard.dataset.displayId;
                    title.textContent = `ห้องเดี่ยวที่ ${displayRoomNum}`;
                }
            } else if (participants.length >= 1) {
                // Hide empty placeholder when room has participants
                const placeholder = roomContent ? roomContent.querySelector('.empty-room-placeholder') : null;
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
            }
            
            // Update pool empty state
            updatePoolEmptyState();
        }
        
        function updatePoolEmptyState() {
            const poolParticipants = document.querySelectorAll('#participantsPool .participant-card');
            const emptyState = document.getElementById('poolEmptyState');
            
            if (poolParticipants.length === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
            }
        }

        function checkAndCreateNewRoom() {
            // Disable automatic room creation since we pre-create all needed rooms
            // This function is kept for compatibility but does nothing
            return;
        }

        // Finalize room assignments
        document.getElementById('finalizeRooms').addEventListener('click', function() {
            const unassignedParticipants = document.querySelectorAll('#participantsPool .participant-card');
            
            if (unassignedParticipants.length > 0) {
                showCustomAlert('กรุณาจัดห้องพักให้ผู้เข้าร่วมทุกคนก่อนยืนยัน', 'warning');
                document.getElementById('participantsPool').scrollIntoView({ behavior: 'smooth' });
                return;
            }

            const roomData = [];
            const rooms = document.querySelectorAll('#roomAssignments [data-room]');
            
            rooms.forEach(room => {
                const roomId = room.dataset.room;
                const participantCards = room.querySelectorAll('.participant-card');
                
                if (participantCards.length > 0) {
                    const roomParticipants = Array.from(participantCards).map(card => {
                        const participantId = card.dataset.participantId;
                        return participants.find(p => p.id == participantId);
                    });
                    
                    roomData.push({
                        roomNumber: roomId,
                        participants: roomParticipants,
                        roomType: participantCards.length === 1 ? 'single' : 'double'
                    });
                }
            });

            // Send data to Google Sheets
            sendToGoogleSheets(roomData);
        });

        function sendToGoogleSheets(roomData) {
            // Show loading modal
            document.getElementById('loadingModal').style.display = 'flex';

            const data = {
                timestamp: new Date().toISOString(),
                participants: participants,
                rooms: roomData,
                isUpdate: isUpdateMode,
                department: document.getElementById('departmentSelect').value
            };

            // JSONP callback function
            window.handleResponse = function(response) {
                document.getElementById('loadingModal').style.display = 'none';
                
                if (response.status === 'success') {
                    document.getElementById('successMessage').style.display = 'block';
                    document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
                    
                    // Reset form after successful submission
                    setTimeout(() => {
                        if (confirm('ต้องการลงทะเบียนหน่วยงานอื่นหรือไม่?')) {
                            location.reload();
                        }
                    }, 2000);
                } else {
                    alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + response.message);
                }
            };

            // Create JSONP request
            const script = document.createElement('script');
            const params = new URLSearchParams({
                callback: 'handleResponse',
                data: JSON.stringify(data)
            });
            script.src = `https://script.google.com/macros/s/AKfycbzb1A8UwW30W8Lji3uxHY-WOQPk29DeytLk7rGmZrqWlAuojh0OVjN0tsicBtRoYy2S/exec?${params}`;
            document.head.appendChild(script);
            
            // Clean up
            script.onload = () => document.head.removeChild(script);
        }
    