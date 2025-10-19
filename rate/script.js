        // Global variables
        let isAdminLoggedIn = false;
        let currentFormConfig = null;
        let editingQuestionId = null;
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyiGCEJk38fqZPt4Z8SmoFOdHFxf_b-wwZLt2QtNxNWxs7gy8jE6wU3p7Ze2JHjpHmm/exec";

        // Default form configuration
        const defaultFormConfig = {
            title: "แบบประเมินความพึงพอใจ",
            description: "ระบบจัดเก็บและวิเคราะห์ความพึงพอใจของผู้เข้าร่วมอบรม",
            questions: [
                {
                    id: "gender",
                    text: "เพศ",
                    type: "select",
                    required: true,
                    order: 1,
                    options: ["ชาย", "หญิง", "ไม่ระบุ"]
                },
                {
                    id: "age_group",
                    text: "ช่วงอายุ",
                    type: "select",
                    required: true,
                    order: 2,
                    options: ["ต่ำกว่า 25 ปี", "25-35 ปี", "36-45 ปี", "46-55 ปี", "มากกว่า 55 ปี"]
                },
                {
                    id: "education",
                    text: "ระดับการศึกษา",
                    type: "select",
                    required: true,
                    order: 3,
                    options: ["ต่ำกว่าปริญญาตรี", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"]
                },
                {
                    id: "department",
                    text: "หน่วยงาน/แผนก",
                    type: "text",
                    required: false,
                    order: 4
                },
                {
                    id: "content",
                    text: "ความพึงพอใจในเนื้อหาการฝึกอบรม",
                    type: "rating",
                    required: true,
                    order: 5
                },
                {
                    id: "instructor", 
                    text: "ความพึงพอใจในวิทยากร",
                    type: "rating",
                    required: true,
                    order: 6
                },
                {
                    id: "facility",
                    text: "ความพึงพอใจด้านสถานที่และการอำนวยความสะดวก", 
                    type: "rating",
                    required: true,
                    order: 7
                },
                {
                    id: "duration",
                    text: "ความเหมาะสมด้านระยะเวลาในการจัดอบรม",
                    type: "rating", 
                    required: true,
                    order: 8
                },
                {
                    id: "comments",
                    text: "ความคิดเห็นและข้อเสนอแนะเพิ่มเติม",
                    type: "textarea",
                    required: false,
                    order: 9
                }
            ]
        };

        // Tab functionality
        function showTab(tabName) {
            // Hide all tab panes
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.nav-tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab pane
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
            
            // Load dashboard data when dashboard tab is clicked
            if (tabName === 'dashboard') {
                loadDashboardData();
            }
        }

        // Form submission
        document.getElementById('evaluationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            // Collect all form data dynamically based on current form config
            const data = {
                timestamp: new Date().toISOString()
            };
            
            // Add data from current form configuration
            if (currentFormConfig && currentFormConfig.questions) {
                currentFormConfig.questions.forEach(question => {
                    const value = formData.get(question.id);
                    data[question.id] = value || '';
                });
            } else {
                // Fallback to default fields if config not loaded
                data.gender = formData.get('gender') || '';
                data.age_group = formData.get('age_group') || '';
                data.education = formData.get('education') || '';
                data.department = formData.get('department') || '';
                data.content = formData.get('content') || '';
                data.instructor = formData.get('instructor') || '';
                data.facility = formData.get('facility') || '';
                data.duration = formData.get('duration') || '';
                data.comments = formData.get('comments') || '';
            }
            
            // Validate required fields
            const requiredFields = currentFormConfig ? 
                currentFormConfig.questions.filter(q => q.required) :
                [
                    { id: 'gender', text: 'เพศ' },
                    { id: 'age_group', text: 'ช่วงอายุ' },
                    { id: 'education', text: 'ระดับการศึกษา' },
                    { id: 'content', text: 'ความพึงพอใจในเนื้อหา' },
                    { id: 'instructor', text: 'ความพึงพอใจในวิทยากร' },
                    { id: 'facility', text: 'ความพึงพอใจด้านสถานที่' },
                    { id: 'duration', text: 'ความเหมาะสมด้านระยะเวลา' }
                ];
            
            const missingFields = requiredFields.filter(field => !data[field.id]);
            if (missingFields.length > 0) {
                const fieldNames = missingFields.map(f => f.text || f.id).join(', ');
                showModal('errorModal', `กรุณากรอกข้อมูลให้ครบถ้วน: ${fieldNames}`);
                return;
            }
            
            submitEvaluation(data);
        });

        function submitEvaluation(data) {
            showLoading(true);
            
            // Create JSONP callback
            const callbackName = 'callback_' + Math.round(100000 * Math.random());
            window[callbackName] = function(response) {
                showLoading(false);
                if (response.success) {
                    showModal('successModal');
                    document.getElementById('evaluationForm').reset();
                } else {
                    showModal('errorModal', response.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
                }
                // Clean up
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            // Create script element for JSONP
            const script = document.createElement('script');
            const params = new URLSearchParams({
                action: 'submit',
                callback: callbackName,
                ...data
            });
            script.src = SCRIPT_URL + '?' + params.toString();
            
            // Handle errors
            script.onerror = function() {
                showLoading(false);
                showModal('errorModal', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        }

        // Dashboard functionality
        function loadDashboardData() {
            showLoading(true);
            
            const callbackName = 'callback_' + Math.round(100000 * Math.random());
            window[callbackName] = function(response) {
                showLoading(false);
                if (response.success) {
                    updateDashboard(response.data);
                } else {
                    console.error('Failed to load dashboard data');
                }
                // Clean up
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            const script = document.createElement('script');
            const params = new URLSearchParams({
                action: 'getData',
                callback: callbackName
            });
            script.src = SCRIPT_URL + '?' + params.toString();
            
            script.onerror = function() {
                showLoading(false);
                console.error('Failed to load dashboard data');
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        }

        function updateDashboard(data) {
            // Update statistics
            document.getElementById('totalResponses').textContent = data.totalResponses || 0;
            document.getElementById('avgScore').textContent = (data.averageScore || 0).toFixed(1);
            document.getElementById('satisfactionRate').textContent = Math.round(data.satisfactionRate || 0) + '%';
            
            // Update charts
            updateAverageChart(data.categoryAverages || {});
            updateDistributionChart(data.distribution || {});
            
            // Update demographic charts
            updateGenderChart(data.demographics?.gender || {});
            updateAgeChart(data.demographics?.age_group || {});
            updateEducationChart(data.demographics?.education || {});
        }

        function updateAverageChart(averages) {
            const canvas = document.getElementById('averageChart');
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const categories = ['เนื้อหา', 'วิทยากร', 'สถานที่', 'ระยะเวลา'];
            const values = [
                averages.content || 0,
                averages.instructor || 0,
                averages.facility || 0,
                averages.duration || 0
            ];
            
            const barWidth = 60;
            const barSpacing = 80;
            const maxHeight = 150;
            const startX = 50;
            const startY = canvas.height - 50;
            
            // Draw bars
            values.forEach((value, index) => {
                const barHeight = (value / 5) * maxHeight;
                const x = startX + index * barSpacing;
                const y = startY - barHeight;
                
                // Draw bar
                ctx.fillStyle = '#667eea';
                ctx.fillRect(x, y, barWidth, barHeight);
                
                // Draw value on top
                ctx.fillStyle = '#333';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(value.toFixed(1), x + barWidth/2, y - 5);
                
                // Draw category label
                ctx.fillText(categories[index], x + barWidth/2, startY + 20);
            });
            
            // Draw y-axis labels
            ctx.textAlign = 'right';
            for (let i = 0; i <= 5; i++) {
                const y = startY - (i / 5) * maxHeight;
                ctx.fillText(i.toString(), startX - 10, y + 5);
            }
        }

        function updateDistributionChart(distribution) {
            const canvas = document.getElementById('distributionChart');
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const scores = ['1', '2', '3', '4', '5'];
            const values = [
                distribution['1'] || 0,
                distribution['2'] || 0,
                distribution['3'] || 0,
                distribution['4'] || 0,
                distribution['5'] || 0
            ];
            
            const total = values.reduce((sum, val) => sum + val, 0);
            if (total === 0) return;
            
            const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];
            const barWidth = 60;
            const barSpacing = 80;
            const maxHeight = 150;
            const startX = 50;
            const startY = canvas.height - 50;
            
            // Draw bars
            values.forEach((value, index) => {
                const percentage = (value / total) * 100;
                const barHeight = (percentage / 100) * maxHeight;
                const x = startX + index * barSpacing;
                const y = startY - barHeight;
                
                // Draw bar
                ctx.fillStyle = colors[index];
                ctx.fillRect(x, y, barWidth, barHeight);
                
                // Draw percentage on top
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(percentage.toFixed(1) + '%', x + barWidth/2, y - 5);
                
                // Draw score label
                ctx.fillText(scores[index], x + barWidth/2, startY + 20);
            });
        }

        // Demographic chart functions
        function updateGenderChart(genderData) {
            const canvas = document.getElementById('genderChart');
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const data = [
                { label: 'ชาย', value: genderData['ชาย'] || 0, color: '#667eea' },
                { label: 'หญิง', value: genderData['หญิง'] || 0, color: '#764ba2' },
                { label: 'ไม่ระบุ', value: genderData['ไม่ระบุ'] || 0, color: '#f093fb' }
            ];
            
            drawPieChart(ctx, data, canvas.width, canvas.height);
        }

        function updateAgeChart(ageData) {
            const canvas = document.getElementById('ageChart');
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const data = [
                { label: 'ต่ำกว่า 25 ปี', value: ageData['ต่ำกว่า 25 ปี'] || 0, color: '#ff6b6b' },
                { label: '25-35 ปี', value: ageData['25-35 ปี'] || 0, color: '#4ecdc4' },
                { label: '36-45 ปี', value: ageData['36-45 ปี'] || 0, color: '#45b7d1' },
                { label: '46-55 ปี', value: ageData['46-55 ปี'] || 0, color: '#f9ca24' },
                { label: 'มากกว่า 55 ปี', value: ageData['มากกว่า 55 ปี'] || 0, color: '#6c5ce7' }
            ];
            
            drawBarChart(ctx, data, canvas.width, canvas.height);
        }

        function updateEducationChart(educationData) {
            const canvas = document.getElementById('educationChart');
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const data = [
                { label: 'ต่ำกว่าปริญญาตรี', value: educationData['ต่ำกว่าปริญญาตรี'] || 0, color: '#ff7675' },
                { label: 'ปริญญาตรี', value: educationData['ปริญญาตรี'] || 0, color: '#74b9ff' },
                { label: 'ปริญญาโท', value: educationData['ปริญญาโท'] || 0, color: '#00b894' },
                { label: 'ปริญญาเอก', value: educationData['ปริญญาเอก'] || 0, color: '#fdcb6e' }
            ];
            
            drawPieChart(ctx, data, canvas.width, canvas.height);
        }

        function drawPieChart(ctx, data, width, height) {
            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.min(width, height) / 3;
            // Responsive radius based on screen size
            const radius = window.innerWidth < 768 ? maxRadius * 0.8 : maxRadius;
            
            const total = data.reduce((sum, item) => sum + item.value, 0);
            if (total === 0) {
                // Draw "No data" message
                ctx.fillStyle = '#666';
                const fontSize = window.innerWidth < 576 ? '14px' : '16px';
                ctx.font = `${fontSize} Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('ไม่มีข้อมูล', centerX, centerY);
                return;
            }
            
            let currentAngle = -Math.PI / 2; // Start from top
            
            data.forEach((item, index) => {
                if (item.value > 0) {
                    const sliceAngle = (item.value / total) * 2 * Math.PI;
                    
                    // Draw slice
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                    ctx.closePath();
                    ctx.fillStyle = item.color;
                    ctx.fill();
                    
                    // Draw border for better visibility
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Draw label with responsive positioning
                    const labelAngle = currentAngle + sliceAngle / 2;
                    const labelDistance = window.innerWidth < 768 ? radius + 20 : radius + 30;
                    const labelX = centerX + Math.cos(labelAngle) * labelDistance;
                    const labelY = centerY + Math.sin(labelAngle) * labelDistance;
                    
                    ctx.fillStyle = '#333';
                    const fontSize = window.innerWidth < 576 ? '10px' : window.innerWidth < 768 ? '11px' : '12px';
                    ctx.font = `${fontSize} Arial`;
                    ctx.textAlign = 'center';
                    
                    // Responsive label display
                    if (window.innerWidth < 576) {
                        // Show only percentage on very small screens
                        ctx.fillText(`${((item.value/total)*100).toFixed(0)}%`, labelX, labelY);
                    } else if (window.innerWidth < 768) {
                        // Show short label + percentage on small screens
                        const shortLabel = item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label;
                        ctx.fillText(shortLabel, labelX, labelY);
                        ctx.fillText(`${((item.value/total)*100).toFixed(1)}%`, labelX, labelY + 12);
                    } else {
                        // Show full label on larger screens
                        ctx.fillText(item.label, labelX, labelY);
                        ctx.fillText(`${item.value} (${((item.value/total)*100).toFixed(1)}%)`, labelX, labelY + 15);
                    }
                    
                    currentAngle += sliceAngle;
                }
            });
        }

        function drawBarChart(ctx, data, width, height) {
            // Responsive margins
            const margin = window.innerWidth < 576 ? 25 : window.innerWidth < 768 ? 30 : 40;
            const chartWidth = width - 2 * margin;
            const chartHeight = height - 2 * margin;
            
            const maxValue = Math.max(...data.map(d => d.value));
            if (maxValue === 0) {
                // Draw "No data" message
                ctx.fillStyle = '#666';
                const fontSize = window.innerWidth < 576 ? '14px' : '16px';
                ctx.font = `${fontSize} Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('ไม่มีข้อมูล', width / 2, height / 2);
                return;
            }
            
            const barWidth = chartWidth / data.length * 0.7;
            const barSpacing = chartWidth / data.length * 0.3;
            
            data.forEach((item, index) => {
                const barHeight = (item.value / maxValue) * chartHeight;
                const x = margin + index * (barWidth + barSpacing) + barSpacing / 2;
                const y = height - margin - barHeight;
                
                // Draw bar with gradient effect
                const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
                gradient.addColorStop(0, item.color);
                gradient.addColorStop(1, item.color + '80'); // Add transparency
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, barHeight);
                
                // Draw bar border
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, barWidth, barHeight);
                
                // Draw value on top with responsive font
                ctx.fillStyle = '#333';
                const valueFontSize = window.innerWidth < 576 ? '10px' : window.innerWidth < 768 ? '11px' : '12px';
                ctx.font = `${valueFontSize} Arial`;
                ctx.textAlign = 'center';
                if (barHeight > 20) { // Only show value if bar is tall enough
                    ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
                }
                
                // Draw label with responsive handling
                ctx.save();
                ctx.translate(x + barWidth / 2, height - margin + 10);
                
                const labelFontSize = window.innerWidth < 576 ? '9px' : window.innerWidth < 768 ? '10px' : '11px';
                ctx.font = `${labelFontSize} Arial`;
                
                if (window.innerWidth < 576) {
                    // Vertical text on very small screens
                    ctx.rotate(-Math.PI / 2);
                    ctx.textAlign = 'right';
                    const shortLabel = item.label.length > 6 ? item.label.substring(0, 6) + '...' : item.label;
                    ctx.fillText(shortLabel, 0, 0);
                } else if (window.innerWidth < 768) {
                    // Angled text on small screens
                    ctx.rotate(-Math.PI / 3);
                    ctx.textAlign = 'right';
                    const shortLabel = item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label;
                    ctx.fillText(shortLabel, 0, 0);
                } else {
                    // Angled text on larger screens
                    ctx.rotate(-Math.PI / 4);
                    ctx.textAlign = 'right';
                    ctx.fillText(item.label, 0, 0);
                }
                
                ctx.restore();
            });
        }

        // Admin tab functionality
        function showAdminTab(tabName) {
            // Hide all admin tab panes
            const adminTabPanes = document.querySelectorAll('.admin-tab-pane');
            adminTabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Remove active class from all admin tabs
            const adminTabs = document.querySelectorAll('.admin-tab');
            adminTabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected admin tab pane
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked admin tab
            event.target.classList.add('active');
            
            // Load form config when form builder tab is clicked
            if (tabName === 'formBuilder') {
                loadFormConfig();
            }
        }

        // Admin functionality
        function adminLogin() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username === 'admin' && password === 'Tle019') {
                isAdminLoggedIn = true;
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                loadFormConfig();
            } else {
                showModal('errorModal', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }
        }

        function adminLogout() {
            isAdminLoggedIn = false;
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        }

        // Form configuration management
        function loadFormConfig() {
            showLoading(true);
            
            const callbackName = 'callback_' + Math.round(100000 * Math.random());
            window[callbackName] = function(response) {
                showLoading(false);
                if (response.success && response.data) {
                    currentFormConfig = response.data;
                } else {
                    // Use default config if no saved config found
                    currentFormConfig = JSON.parse(JSON.stringify(defaultFormConfig));
                }
                renderFormBuilder();
                // Clean up
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            const script = document.createElement('script');
            const params = new URLSearchParams({
                action: 'getFormConfig',
                callback: callbackName
            });
            script.src = SCRIPT_URL + '?' + params.toString();
            
            script.onerror = function() {
                showLoading(false);
                // Use default config on error
                currentFormConfig = JSON.parse(JSON.stringify(defaultFormConfig));
                renderFormBuilder();
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        }

        function renderFormBuilder() {
            // Update form title and description
            document.getElementById('formTitle').value = currentFormConfig.title;
            document.getElementById('formDescription').value = currentFormConfig.description;
            
            // Render questions list
            const questionsList = document.getElementById('questionsList');
            questionsList.innerHTML = '';
            
            // Sort questions by order
            const sortedQuestions = [...currentFormConfig.questions].sort((a, b) => a.order - b.order);
            
            sortedQuestions.forEach((question, index) => {
                const questionElement = createQuestionElement(question, index + 1);
                questionsList.appendChild(questionElement);
            });
        }

        function createQuestionElement(question, number) {
            const div = document.createElement('div');
            div.className = 'question-editor';
            div.dataset.questionId = question.id;
            
            div.innerHTML = `
                <div class="question-header">
                    <div class="question-number">${number}</div>
                    <div class="question-content">
                        <div class="question-text">${question.text}</div>
                        <span class="question-type">${getQuestionTypeLabel(question.type)}</span>
                        ${question.required ? '<span class="question-type" style="background: #dc3545; color: white; margin-left: 5px;">จำเป็น</span>' : ''}
                    </div>
                    <div class="question-actions">
                        <button class="btn-icon btn-move drag-handle" title="ลากเพื่อเรียงลำดับ">⋮⋮</button>
                        <button class="btn-icon btn-edit" onclick="editQuestion('${question.id}')" title="แก้ไข">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteQuestion('${question.id}')" title="ลบ">🗑️</button>
                    </div>
                </div>
                <div id="edit-form-${question.id}" class="question-form" style="display: none;">
                    <div class="form-group">
                        <label class="form-label">ข้อความคำถาม</label>
                        <input type="text" id="question-text-${question.id}" class="form-input" value="${question.text}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ประเภทคำถาม</label>
                            <select id="question-type-${question.id}" class="form-input">
                                <option value="rating" ${question.type === 'rating' ? 'selected' : ''}>คะแนน (Emoji)</option>
                                <option value="textarea" ${question.type === 'textarea' ? 'selected' : ''}>ข้อความยาว</option>
                                <option value="text" ${question.type === 'text' ? 'selected' : ''}>ข้อความสั้น</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">จำเป็นต้องตอบ</label>
                            <select id="question-required-${question.id}" class="form-input">
                                <option value="true" ${question.required ? 'selected' : ''}>ใช่</option>
                                <option value="false" ${!question.required ? 'selected' : ''}>ไม่</option>
                            </select>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 15px;">
                        <button class="btn btn-success" onclick="saveQuestion('${question.id}')">💾 บันทึก</button>
                        <button class="btn" onclick="cancelEdit('${question.id}')" style="background: #6c757d; color: white; margin-left: 10px;">❌ ยกเลิก</button>
                    </div>
                </div>
            `;
            
            return div;
        }

        function getQuestionTypeLabel(type) {
            const labels = {
                'rating': 'คะแนน (Emoji)',
                'textarea': 'ข้อความยาว', 
                'text': 'ข้อความสั้น',
                'select': 'เลือกตัวเลือก'
            };
            return labels[type] || type;
        }

        function addQuestion() {
            const newQuestion = {
                id: 'question_' + Date.now(),
                text: 'คำถามใหม่',
                type: 'rating',
                required: false,
                order: currentFormConfig.questions.length + 1
            };
            
            currentFormConfig.questions.push(newQuestion);
            renderFormBuilder();
            
            // Auto-edit the new question
            setTimeout(() => {
                editQuestion(newQuestion.id);
            }, 100);
        }

        function editQuestion(questionId) {
            // Cancel any existing edit
            if (editingQuestionId) {
                cancelEdit(editingQuestionId);
            }
            
            editingQuestionId = questionId;
            const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
            const editForm = document.getElementById(`edit-form-${questionId}`);
            
            questionElement.classList.add('editing');
            editForm.style.display = 'block';
        }

        function cancelEdit(questionId) {
            const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
            const editForm = document.getElementById(`edit-form-${questionId}`);
            
            questionElement.classList.remove('editing');
            editForm.style.display = 'none';
            editingQuestionId = null;
        }

        function saveQuestion(questionId) {
            const question = currentFormConfig.questions.find(q => q.id === questionId);
            if (!question) return;
            
            const newText = document.getElementById(`question-text-${questionId}`).value.trim();
            const newType = document.getElementById(`question-type-${questionId}`).value;
            const newRequired = document.getElementById(`question-required-${questionId}`).value === 'true';
            
            if (!newText) {
                showModal('errorModal', 'กรุณากรอกข้อความคำถาม');
                return;
            }
            
            question.text = newText;
            question.type = newType;
            question.required = newRequired;
            
            cancelEdit(questionId);
            renderFormBuilder();
        }

        function deleteQuestion(questionId) {
            if (currentFormConfig.questions.length <= 1) {
                showModal('errorModal', 'ต้องมีคำถามอย่างน้อย 1 ข้อ');
                return;
            }
            
            // Simple confirmation using custom modal would be better, but for now use this approach
            const questionText = currentFormConfig.questions.find(q => q.id === questionId)?.text || '';
            const confirmDelete = confirm(`ต้องการลบคำถาม "${questionText}" หรือไม่?`);
            
            if (confirmDelete) {
                currentFormConfig.questions = currentFormConfig.questions.filter(q => q.id !== questionId);
                // Reorder questions
                currentFormConfig.questions.forEach((q, index) => {
                    q.order = index + 1;
                });
                renderFormBuilder();
            }
        }

        function saveFormConfig() {
            // Update form title and description from inputs
            currentFormConfig.title = document.getElementById('formTitle').value.trim();
            currentFormConfig.description = document.getElementById('formDescription').value.trim();
            
            if (!currentFormConfig.title) {
                showModal('errorModal', 'กรุณากรอกชื่อฟอร์ม');
                return;
            }
            
            showLoading(true);
            
            const callbackName = 'callback_' + Math.round(100000 * Math.random());
            window[callbackName] = function(response) {
                showLoading(false);
                if (response.success) {
                    showModal('successModal', 'บันทึกการตั้งค่าฟอร์มเรียบร้อยแล้ว');
                    updateEvaluationForm();
                } else {
                    showModal('errorModal', response.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
                }
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            const script = document.createElement('script');
            const params = new URLSearchParams({
                action: 'saveFormConfig',
                callback: callbackName,
                config: JSON.stringify(currentFormConfig)
            });
            script.src = SCRIPT_URL + '?' + params.toString();
            
            script.onerror = function() {
                showLoading(false);
                showModal('errorModal', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        }

        function resetToDefault() {
            const confirmReset = confirm('ต้องการรีเซ็ตฟอร์มเป็นค่าเริ่มต้นหรือไม่? การตั้งค่าปัจจุบันจะหายไป');
            
            if (confirmReset) {
                currentFormConfig = JSON.parse(JSON.stringify(defaultFormConfig));
                renderFormBuilder();
            }
        }

        function previewForm() {
            const previewContent = document.getElementById('previewContent');
            previewContent.innerHTML = generateFormPreview();
            showModal('previewModal');
        }

        function generateFormPreview() {
            let html = `
                <div style="max-height: 400px; overflow-y: auto; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
                    <h3 style="text-align: center; color: #333; margin-bottom: 20px;">${currentFormConfig.title}</h3>
                    <p style="text-align: center; color: #666; margin-bottom: 30px;">${currentFormConfig.description}</p>
            `;
            
            const sortedQuestions = [...currentFormConfig.questions].sort((a, b) => a.order - b.order);
            
            sortedQuestions.forEach((question, index) => {
                html += `<div style="margin-bottom: 25px;">`;
                html += `<label style="display: block; font-weight: 600; margin-bottom: 10px; color: #333;">`;
                html += `${index + 1}. ${question.text}`;
                if (question.required) {
                    html += ` <span style="color: #dc3545;">*</span>`;
                }
                html += `</label>`;
                
                if (question.type === 'rating') {
                    html += `
                        <div style="display: flex; gap: 15px; justify-content: center; margin: 15px 0;">
                            <div style="text-align: center; padding: 10px;">
                                <div style="font-size: 2rem; margin-bottom: 5px;">😀</div>
                                <div style="font-size: 12px; color: #666;">ดีเยี่ยม<br>(5)</div>
                            </div>
                            <div style="text-align: center; padding: 10px;">
                                <div style="font-size: 2rem; margin-bottom: 5px;">🙂</div>
                                <div style="font-size: 12px; color: #666;">ดี<br>(4)</div>
                            </div>
                            <div style="text-align: center; padding: 10px;">
                                <div style="font-size: 2rem; margin-bottom: 5px;">😐</div>
                                <div style="font-size: 12px; color: #666;">ปานกลาง<br>(3)</div>
                            </div>
                            <div style="text-align: center; padding: 10px;">
                                <div style="font-size: 2rem; margin-bottom: 5px;">🙁</div>
                                <div style="font-size: 12px; color: #666;">ควรปรับปรุง<br>(2)</div>
                            </div>
                            <div style="text-align: center; padding: 10px;">
                                <div style="font-size: 2rem; margin-bottom: 5px;">😞</div>
                                <div style="font-size: 12px; color: #666;">แย่<br>(1)</div>
                            </div>
                        </div>
                    `;
                } else if (question.type === 'textarea') {
                    html += `<textarea style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; min-height: 80px;" placeholder="กรอก${question.text.toLowerCase()}..."></textarea>`;
                } else if (question.type === 'text') {
                    html += `<input type="text" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;" placeholder="กรอก${question.text.toLowerCase()}...">`;
                }
                
                html += `</div>`;
            });
            
            html += `
                    <div style="text-align: center; margin-top: 30px;">
                        <button style="padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600;">📤 ส่งแบบประเมิน</button>
                    </div>
                </div>
            `;
            
            return html;
        }

        function updateEvaluationForm() {
            if (!currentFormConfig) return;
            
            // Update form title in the evaluation tab
            const evaluationTab = document.getElementById('evaluation');
            const formTitle = evaluationTab.querySelector('h2');
            if (formTitle) {
                formTitle.textContent = currentFormConfig.title;
            }
            
            // Update header description
            const headerDesc = document.querySelector('.header p');
            if (headerDesc) {
                headerDesc.textContent = currentFormConfig.description;
            }
            
            // Regenerate the entire form based on current config
            generateEvaluationForm();
        }

        function generateEvaluationForm() {
            const form = document.getElementById('evaluationForm');
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Clear existing form groups (except submit button)
            const formGroups = form.querySelectorAll('.form-group');
            formGroups.forEach(group => group.remove());
            
            // Get the containers
            const demographicContainer = form.querySelector('div[style*="border-left: 4px solid #667eea"]');
            const satisfactionContainer = form.querySelector('div[style*="border-left: 4px solid #28a745"]');
            
            // Sort questions by order
            const sortedQuestions = [...currentFormConfig.questions].sort((a, b) => a.order - b.order);
            
            sortedQuestions.forEach((question, index) => {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';
                
                if (question.type === 'rating') {
                    formGroup.innerHTML = `
                        <label class="form-label" for="${question.id}-rating">${index + 1}. ${question.text}</label>
                        <div class="emoji-rating">
                            <label class="emoji-option">
                                <input type="radio" name="${question.id}" value="5" ${question.required ? 'required' : ''}>
                                <div class="emoji-container">😀</div>
                                <div class="emoji-label">ดีเยี่ยม<br>(5)</div>
                            </label>
                            <label class="emoji-option">
                                <input type="radio" name="${question.id}" value="4">
                                <div class="emoji-container">🙂</div>
                                <div class="emoji-label">ดี<br>(4)</div>
                            </label>
                            <label class="emoji-option">
                                <input type="radio" name="${question.id}" value="3">
                                <div class="emoji-container">😐</div>
                                <div class="emoji-label">ปานกลาง<br>(3)</div>
                            </label>
                            <label class="emoji-option">
                                <input type="radio" name="${question.id}" value="2">
                                <div class="emoji-container">🙁</div>
                                <div class="emoji-label">ควรปรับปรุง<br>(2)</div>
                            </label>
                            <label class="emoji-option">
                                <input type="radio" name="${question.id}" value="1">
                                <div class="emoji-container">😞</div>
                                <div class="emoji-label">แย่<br>(1)</div>
                            </label>
                        </div>
                    `;
                    // Add rating questions to satisfaction container
                    satisfactionContainer.appendChild(formGroup);
                } else if (question.type === 'select') {
                    const options = question.options || [];
                    const optionsHtml = options.map(option => `<option value="${option}">${option}</option>`).join('');
                    formGroup.innerHTML = `
                        <label class="form-label" for="${question.id}">${index + 1}. ${question.text}</label>
                        <select id="${question.id}" name="${question.id}" class="form-input" ${question.required ? 'required' : ''}>
                            <option value="">-- เลือก${question.text.toLowerCase()} --</option>
                            ${optionsHtml}
                        </select>
                    `;
                    // Add demographic questions to demographic container
                    demographicContainer.appendChild(formGroup);
                } else if (question.type === 'textarea') {
                    formGroup.innerHTML = `
                        <label class="form-label" for="${question.id}">${index + 1}. ${question.text}</label>
                        <textarea id="${question.id}" name="${question.id}" class="form-textarea" placeholder="กรอก${question.text.toLowerCase()}..." ${question.required ? 'required' : ''}></textarea>
                    `;
                    // Add textarea questions to satisfaction container
                    satisfactionContainer.appendChild(formGroup);
                } else if (question.type === 'text') {
                    formGroup.innerHTML = `
                        <label class="form-label" for="${question.id}">${index + 1}. ${question.text}</label>
                        <input type="text" id="${question.id}" name="${question.id}" class="form-input" placeholder="กรอก${question.text.toLowerCase()}..." ${question.required ? 'required' : ''}>
                    `;
                    // Add text questions to demographic container
                    demographicContainer.appendChild(formGroup);
                }
            });
        }

        function exportData() {
            if (!isAdminLoggedIn) {
                showModal('errorModal', 'กรุณาเข้าสู่ระบบก่อน');
                return;
            }
            
            showLoading(true);
            
            const callbackName = 'callback_' + Math.round(100000 * Math.random());
            window[callbackName] = function(response) {
                showLoading(false);
                if (response.success) {
                    // Create and download CSV
                    const csv = convertToCSV(response.data);
                    downloadCSV(csv, 'evaluation_data.csv');
                } else {
                    showModal('errorModal', 'ไม่สามารถส่งออกข้อมูลได้');
                }
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            const script = document.createElement('script');
            const params = new URLSearchParams({
                action: 'export',
                callback: callbackName
            });
            script.src = SCRIPT_URL + '?' + params.toString();
            
            script.onerror = function() {
                showLoading(false);
                showModal('errorModal', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        }

        function convertToCSV(data) {
            if (!data || data.length === 0) return '';
            
            const headers = ['วันที่', 'เนื้อหา', 'วิทยากร', 'สถานที่', 'ระยะเวลา', 'ความคิดเห็น'];
            const csvContent = [headers.join(',')];
            
            data.forEach(row => {
                const csvRow = [
                    row.timestamp || '',
                    row.content || '',
                    row.instructor || '',
                    row.facility || '',
                    row.duration || '',
                    '"' + (row.comments || '').replace(/"/g, '""') + '"'
                ];
                csvContent.push(csvRow.join(','));
            });
            
            return csvContent.join('\n');
        }

        function downloadCSV(csv, filename) {
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        // Utility functions
        function showModal(modalId, message = '') {
            if (message && modalId === 'errorModal') {
                document.getElementById('errorMessage').textContent = message;
            }
            document.getElementById(modalId).style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        function showLoading(show) {
            document.getElementById('loadingOverlay').style.display = show ? 'block' : 'none';
        }

        // Close modals when clicking outside
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Responsive canvas sizing
        function resizeCanvases() {
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const container = canvas.parentElement;
                const containerWidth = container.clientWidth - 40; // Account for padding
                const aspectRatio = canvas.height / canvas.width;
                
                // Set responsive dimensions
                if (window.innerWidth < 576) {
                    canvas.width = Math.min(containerWidth, 250);
                    canvas.height = canvas.width * aspectRatio;
                } else if (window.innerWidth < 768) {
                    canvas.width = Math.min(containerWidth, 300);
                    canvas.height = canvas.width * aspectRatio;
                } else {
                    canvas.width = Math.min(containerWidth, 400);
                    canvas.height = Math.min(canvas.width * aspectRatio, 250);
                }
            });
            
            // Redraw charts after resize
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        }

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvases();
            }, 250);
        });

        // Handle orientation change
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                resizeCanvases();
            }, 500);
        });

        // Touch and swipe support for mobile navigation
        let touchStartX = 0;
        let touchEndX = 0;

        function handleSwipe() {
            const swipeThreshold = 50;
            const swipeDistance = touchEndX - touchStartX;
            
            if (Math.abs(swipeDistance) > swipeThreshold) {
                const tabs = ['evaluation', 'dashboard', 'admin'];
                const activeTab = document.querySelector('.nav-tab.active');
                const currentIndex = Array.from(document.querySelectorAll('.nav-tab')).indexOf(activeTab);
                
                if (swipeDistance > 0 && currentIndex > 0) {
                    // Swipe right - go to previous tab
                    showTab(tabs[currentIndex - 1]);
                } else if (swipeDistance < 0 && currentIndex < tabs.length - 1) {
                    // Swipe left - go to next tab
                    showTab(tabs[currentIndex + 1]);
                }
            }
        }

        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        // Prevent zoom on double tap for iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Initialize dashboard on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Set initial canvas sizes
            resizeCanvases();
            
            loadDashboardData();
            // Load form config to update the evaluation form
            loadFormConfigForEvaluation();
            
            // Add viewport meta tag if not present
            if (!document.querySelector('meta[name="viewport"]')) {
                const viewport = document.createElement('meta');
                viewport.name = 'viewport';
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                document.head.appendChild(viewport);
            }
        });

        // Load form config for evaluation form (without admin login)
        function loadFormConfigForEvaluation() {
            const callbackName = 'callback_' + Math.round(100000 * Math.random());
            window[callbackName] = function(response) {
                if (response.success && response.data) {
                    currentFormConfig = response.data;
                    updateEvaluationForm();
                } else {
                    // Use default config if no saved config found
                    currentFormConfig = JSON.parse(JSON.stringify(defaultFormConfig));
                }
                // Clean up
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            const script = document.createElement('script');
            const params = new URLSearchParams({
                action: 'getFormConfig',
                callback: callbackName
            });
            script.src = SCRIPT_URL + '?' + params.toString();
            
            script.onerror = function() {
                // Use default config on error
                currentFormConfig = JSON.parse(JSON.stringify(defaultFormConfig));
                document.head.removeChild(script);
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        }