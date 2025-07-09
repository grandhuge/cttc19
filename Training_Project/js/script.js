    document.addEventListener('DOMContentLoaded', () => {
        // --- CONFIGURATION ---
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxrWS2MC7Nuxl_dCtnBRTErD2HdjQ0A_I4uEZexiajsCFl8Jy06CixleyOgPuZV6keG/exec";
        
        // --- STATE MANAGEMENT ---
        const state = {
            isAdmin: false,
            adminRole: null, // 'main_admin' or 'sub_admin'
            currentPage: 'dashboard',
            project: null,
            registrations: [],
            quizzes: [],
            passPercentage: 80,
            evaluations: [],
            plans: [],
            pageSettings: {},
            allUsersForSelection: [],
            quizResults: [],
            admins: [],
        };

        // --- DOM ELEMENTS ---
        const pageContent = document.getElementById('page-content');
        const pageTitle = document.getElementById('page-title');
        const userMenu = document.getElementById('user-menu');
        const adminMenu = document.getElementById('admin-menu');
        const adminLoginBtn = document.getElementById('admin-login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const adminUsersLink = document.getElementById('admin-users-link');
        const sidebar = document.getElementById('sidebar');
        const openSidebarBtn = document.getElementById('open-sidebar');
        const closeSidebarBtn = document.getElementById('close-sidebar');

        // --- UTILITY FUNCTIONS ---
        const showLoading = (message = 'กำลังโหลดข้อมูล...') => {
            Swal.fire({ title: message, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        };
        const hideLoading = () => Swal.close();
        const showAlert = (icon, title, text = '') => {
            Swal.fire({ icon, title, text, confirmButtonText: 'ตกลง' });
        };
        
        const fetchData = async (action, params = {}) => {
            const url = new URL(SCRIPT_URL);
            url.searchParams.append('action', action);
            for (const key in params) {
                url.searchParams.append(key, params[key]);
            }
            try {
                const response = await fetch(url, { method: 'GET', redirect: 'follow' });
                if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
                const result = await response.json();
                if (result.status === 'error') throw new Error(result.message);
                return result.data;
            } catch (error) {
                console.error(`Fetch error for action "${action}":`, error);
                showAlert('error', 'เกิดข้อผิดพลาด', `ไม่สามารถดึงข้อมูลได้: ${error.message}`);
                return null;
            }
        };

        const postData = async (action, formData) => {
            formData.append('action', action);
            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData, redirect: 'follow' });
                if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
                const result = await response.json();
                if (result.status === 'error') throw new Error(result.message);
                return result;
            } catch (error) {
                console.error(`Post error for action "${action}":`, error);
                showAlert('error', 'เกิดข้อผิดพลาดในการส่งข้อมูล', error.message);
                return null;
            }
        };

        // --- ROUTING ---
        const routes = {
            'dashboard': { render: renderDashboard, title: 'Dashboard', menu: 'user' },
            'register': { render: renderRegistrationForm, title: 'ลงทะเบียนอบรม', menu: 'user' },
            'registration-list': { render: renderRegistrationList, title: 'ตรวจสอบข้อมูลลงทะเบียน', menu: 'user' },
            'quiz': { render: renderQuizPage, title: 'ทำแบบทดสอบ', menu: 'user' },
            'quiz-results': { render: renderQuizResults, title: 'ผลคะแนนแบบทดสอบ', menu: 'user' },
            'evaluation': { render: renderEvaluationForm, title: 'ประเมินผลโครงการ', menu: 'user' },
            'evaluation-results': { render: renderEvaluationResults, title: 'สรุปผลประเมิน', menu: 'user' },
            'plan': { render: renderPlanForm, title: 'แผนการนำความรู้ไปใช้', menu: 'user' },
            'plan-summary': { render: renderPlanSummary, title: 'สรุปผู้ส่งแผน', menu: 'user' },
            'certificate': { render: renderCertificateList, title: 'ผู้มีสิทธิรับประกาศนียบัตร', menu: 'user' },
            'admin-project': { render: renderAdminProject, title: 'จัดการข้อมูลโครงการ', menu: 'admin' },
            'admin-pages': { render: renderAdminPages, title: 'จัดการเพจผู้ใช้งาน', menu: 'admin' },
            'admin-quiz': { render: renderAdminQuiz, title: 'จัดการแบบทดสอบ', menu: 'admin' },
            'admin-evaluation': { render: renderAdminEvaluation, title: 'จัดการแบบประเมิน', menu: 'admin' },
            'admin-plan': { render: renderAdminPlan, title: 'จัดการแผนการนำความรู้', menu: 'admin' },
            'admin-users': { render: renderAdminUsers, title: 'จัดการผู้ดูแล', menu: 'admin' },
        };

        const navigateTo = (hash) => {
            const page = hash.replace('#', '') || 'dashboard';
            const route = routes[page];
            
            if (route) {
                if (state.pageSettings[page] === false && !state.isAdmin) {
                    pageContent.innerHTML = `<div class="card text-center"><h2 class="text-2xl font-bold text-red-500">ปิดการเข้าถึง</h2><p class="mt-4">หน้านี้ถูกปิดการใช้งานโดยผู้ดูแลระบบ</p></div>`;
                    pageTitle.textContent = 'ไม่สามารถเข้าถึงได้';
                    return;
                }
                if (route.menu === 'admin' && !state.isAdmin) {
                    navigateTo('#dashboard');
                    return;
                }
                if (page === 'admin-users' && state.adminRole !== 'main_admin') {
                    showAlert('error', 'ไม่ได้รับอนุญาต', 'เฉพาะผู้ดูแลหลักเท่านั้นที่สามารถเข้าถึงหน้านี้ได้');
                    navigateTo('#admin-project');
                    return;
                }
                state.currentPage = page;
                pageTitle.textContent = route.title;
                route.render();
                updateActiveLink(page);
                if (sidebar.classList.contains('transform-none')) {
                   closeSidebarBtn.click();
                }
            } else {
                navigateTo('#dashboard');
            }
        };

        const updateActiveLink = (page) => {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('bg-blue-100', 'text-blue-600', 'font-semibold');
                if (link.getAttribute('href') === `#${page}`) {
                    link.classList.add('bg-blue-100', 'text-blue-600', 'font-semibold');
                }
            });
        };

        // --- RENDER FUNCTIONS ---
        async function renderDashboard() {
            pageContent.innerHTML = `<div class="card animate-pulse"><div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div><div class="h-4 bg-gray-200 rounded w-full mb-2"></div><div class="h-4 bg-gray-200 rounded w-5/6"></div></div>`;
            if (!state.project) {
                await loadInitialData();
            }
            if (state.project) {
                const p = state.project;
                pageContent.innerHTML = `
                    <div class="card">
                        <h2 class="text-3xl font-bold text-blue-700 mb-4">${p.name || 'ยังไม่มีชื่อโครงการ'}</h2>
                        <div class="space-y-4 text-lg">
                            <div><strong class="font-semibold text-gray-700">วัตถุประสงค์:</strong> <p class="text-gray-600 pl-4">${p.objective || '-'}</p></div>
                            <div><strong class="font-semibold text-gray-700">กลุ่มเป้าหมาย:</strong> <span class="text-gray-600">${p.targetAudience || '-'}</span></div>
                            <div><strong class="font-semibold text-gray-700">ระยะเวลา:</strong> <span class="text-gray-600">${p.duration || '-'}</span></div>
                            <div><strong class="font-semibold text-gray-700">สถานที่:</strong> <span class="text-gray-600">${p.location || '-'}</span></div>
                            <div><strong class="font-semibold text-gray-700">ผู้รับผิดชอบ:</strong> <span class="text-gray-600">${p.responsiblePerson || '-'}</span></div>
                            <div class="pt-4 border-t mt-4">
                                <strong class="font-semibold text-gray-700">รายละเอียดโครงการ:</strong>
                                <p class="text-gray-600 mt-2 whitespace-pre-wrap">${p.details || '-'}</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                 pageContent.innerHTML = `<div class="card text-center"><h2 class="text-2xl font-bold">ยังไม่มีข้อมูลโครงการ</h2><p class="mt-4">ผู้ดูแลระบบยังไม่ได้ตั้งค่าข้อมูลโครงการ</p></div>`;
            }
        }

        function renderRegistrationForm() {
            if (!state.project) {
                pageContent.innerHTML = `<div class="card text-center"><h2 class="text-2xl font-bold">ไม่สามารถลงทะเบียนได้</h2><p class="mt-4">ยังไม่มีข้อมูลโครงการ กรุณาติดต่อผู้ดูแลระบบ</p></div>`;
                return;
            }
            const isCpd = state.project.targetAudience === 'บุคลากรกรมส่งเสริมสหกรณ์';
            const formFields = isCpd ? getCpdFormFields() : getCoopFormFields();
            pageContent.innerHTML = `
                <div class="card max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-center">แบบฟอร์มลงทะเบียนอบรม</h2>
                    <h3 class="text-xl font-semibold mb-4 text-center text-blue-600">${state.project.name}</h3>
                    <p class="text-center mb-6 text-gray-500">สำหรับ: ${state.project.targetAudience}</p>
                    <form id="registration-form" class="space-y-6">
                        ${formFields}
                        <div class="pt-6">
                            <button type="submit" id="submit-reg-btn" class="btn btn-primary w-full justify-center disabled:bg-gray-400 disabled:cursor-not-allowed" disabled>
                                <i class="fas fa-paper-plane"></i> ส่งข้อมูลลงทะเบียน
                            </button>
                        </div>
                    </form>
                </div>
            `;
            setupRegistrationFormLogic(isCpd);
        }

        function getCpdFormFields() {
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label for="id_card" class="block font-medium mb-1">เลขบัตรประจำตัวประชาชน</label><input type="text" id="id_card" name="id_card" class="form-input" maxlength="13" required></div>
                    <div><label for="title" class="block font-medium mb-1">คำนำหน้า</label><select id="title" name="title" class="form-select" required><option value="">-- เลือก --</option><option value="นาย">นาย</option><option value="นาง">นาง</option><option value="นางสาว">นางสาว</option><option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option></select><input type="text" id="title_other" name="title_other" class="form-input mt-2 hidden" placeholder="ระบุคำนำหน้า"></div>
                    <div><label for="full_name" class="block font-medium mb-1">ชื่อ-นามสกุล</label><input type="text" id="full_name" name="full_name" class="form-input" required></div>
                    <div><label for="position" class="block font-medium mb-1">ตำแหน่ง</label><input type="text" id="position" name="position" class="form-input" required></div>
                    <div><label for="affiliation" class="block font-medium mb-1">สังกัด</label><input type="text" id="affiliation" name="affiliation" class="form-input" required></div>
                    <div><label for="province" class="block font-medium mb-1">จังหวัด</label><select id="province" name="province" class="form-select" required><option value="">-- เลือก --</option><option value="ชุมพร">ชุมพร</option><option value="นครศรีธรรมราช">นครศรีธรรมราช</option><option value="สุราษฎร์ธานี">สุราษฎร์ธานี</option><option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option></select><input type="text" id="province_other" name="province_other" class="form-input mt-2 hidden" placeholder="ระบุจังหวัด"></div>
                    <div><label for="phone" class="block font-medium mb-1">เบอร์โทรศัพท์</label><input type="tel" id="phone" name="phone" class="form-input" required pattern="[0-9]{9,10}"></div>
                    <div><label for="line_id" class="block font-medium mb-1">ไอดีไลน์</label><input type="text" id="line_id" name="line_id" class="form-input" required></div>
                </div>`;
        }

        function getCoopFormFields() {
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label for="id_card" class="block font-medium mb-1">เลขบัตรประจำตัวประชาชน</label><input type="text" id="id_card" name="id_card" class="form-input" maxlength="13" required></div>
                    <div><label for="title" class="block font-medium mb-1">คำนำหน้า</label><select id="title" name="title" class="form-select" required><option value="">-- เลือก --</option><option value="นาย">นาย</option><option value="นาง">นาง</option><option value="นางสาว">นางสาว</option><option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option></select><input type="text" id="title_other" name="title_other" class="form-input mt-2 hidden" placeholder="ระบุคำนำหน้า"></div>
                    <div><label for="full_name" class="block font-medium mb-1">ชื่อ-นามสกุล</label><input type="text" id="full_name" name="full_name" class="form-input" required></div>
                    <div><label for="birth_year" class="block font-medium mb-1">ปี พ.ศ. เกิด</label><input type="text" id="birth_year" name="birth_year" class="form-input" required pattern="[0-9]{4}"></div>
                    <div><label for="occupation" class="block font-medium mb-1">อาชีพ</label><input type="text" id="occupation" name="occupation" class="form-input" required></div>
                    <div><label for="education" class="block font-medium mb-1">ระดับการศึกษาสูงสุด</label><select id="education" name="education" class="form-select" required><option value="">-- เลือก --</option><option value="ประถมศึกษา">ประถมศึกษา</option><option value="มัธยมศึกษา">มัธยมศึกษา</option><option value="ปวช/ปวส">ปวช/ปวส</option><option value="ปริญญาตรี">ปริญญาตรี</option><option value="ปริญญาโท">ปริญญาโท</option><option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option></select><input type="text" id="education_other" name="education_other" class="form-input mt-2 hidden" placeholder="ระบุการศึกษา"></div>
                    <div><label for="status" class="block font-medium mb-1">สถานะ</label><select id="status" name="status" class="form-select" required><option value="">-- เลือก --</option><option value="ประธานกรรมการ">ประธานกรรมการ</option><option value="กรรมการ">กรรมการ</option><option value="ผู้จัดการ">ผู้จัดการ</option><option value="ฝ่ายจัดการ">ฝ่ายจัดการ</option><option value="ผู้ตรวจสอบกิจการ">ผู้ตรวจสอบกิจการ</option><option value="ประธานกลุ่ม">ประธานกลุ่ม</option><option value="ผู้นำกลุ่มสมาชิก">ผู้นำกลุ่มสมาชิก</option><option value="สมาชิก">สมาชิก</option><option value="อื่นๆ">อื่นๆ (โปรดระบุ)</option></select><input type="text" id="status_other" name="status_other" class="form-input mt-2 hidden" placeholder="ระบุสถานะ"></div>
                    <div><label for="coop_affiliation" class="block font-medium mb-1">สังกัดสหกรณ์</label><input type="text" id="coop_affiliation" name="coop_affiliation" class="form-input" required></div>
                    <div><label for="province" class="block font-medium mb-1">จังหวัด</label><input type="text" id="province" name="province" class="form-input" required></div>
                    <div><label for="address" class="block font-medium mb-1">ที่อยู่</label><textarea id="address" name="address" class="form-input" rows="3" required></textarea></div>
                    <div><label for="phone" class="block font-medium mb-1">เบอร์โทรศัพท์</label><input type="tel" id="phone" name="phone" class="form-input" required pattern="[0-9]{9,10}"></div>
                </div>`;
        }

        async function renderRegistrationList() {
             pageContent.innerHTML = `<div class="card"><p>กำลังโหลดรายชื่อผู้ลงทะเบียน...</p></div>`;
             await loadRegistrations();
             const data = state.registrations.map(r => ({
                title: r.title,
                full_name: r.full_name,
                affiliation: r.affiliation || r.coop_affiliation,
                province: r.province
             }));
             renderSortableTable('registration-list-table', data, {
                title: 'คำนำหน้า',
                full_name: 'ชื่อ-นามสกุล',
                affiliation: 'สังกัด',
                province: 'จังหวัด'
             }, 'รายชื่อผู้ลงทะเบียน', true);
        }

        async function renderQuizPage() {
            await loadAllUsersForSelection();
            pageContent.innerHTML = `
                <div class="card max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-center">ทำแบบทดสอบ</h2>
                    <div class="text-center mb-6">
                        <label for="user_selector_quiz" class="block font-medium mb-2">กรุณาเลือกชื่อของคุณเพื่อเริ่มทำแบบทดสอบ:</label>
                        <select id="user_selector_quiz" class="form-select max-w-md mx-auto">
                            <option value="">-- เลือกชื่อ-นามสกุล --</option>
                            ${state.allUsersForSelection.map(user => `<option value="${user.id_card}">${user.full_name} (${user.affiliation})</option>`).join('')}
                        </select>
                    </div>
                    <div id="quiz-container" class="hidden">
                         <div class="flex justify-center gap-4 mb-8">
                            <button id="pre-test-btn" class="btn btn-primary">แบบทดสอบก่อนอบรม</button>
                            <button id="post-test-btn" class="btn btn-secondary">แบบทดสอบหลังอบรม</button>
                        </div>
                        <div id="quiz-content"></div>
                    </div>
                </div>
            `;
            setupQuizPageLogic();
        }
        
        async function renderQuizResults() {
            pageContent.innerHTML = `<div class="card"><p>กำลังโหลดผลคะแนน...</p></div>`;
            await loadQuizResults();
            const passCount = state.quizResults.filter(r => r.evaluation === 'ผ่านเกณฑ์').length;
            const failCount = state.quizResults.length - passCount;
            const totalTesters = new Set(state.quizResults.map(r => r.full_name)).size;
            const summaryHtml = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="p-4 bg-blue-100 rounded-lg text-center"><p class="text-lg text-blue-800">ผู้ทำแบบทดสอบ</p><p class="text-3xl font-bold text-blue-600">${totalTesters}</p></div>
                    <div class="p-4 bg-green-100 rounded-lg text-center"><p class="text-lg text-green-800">ผ่านเกณฑ์</p><p class="text-3xl font-bold text-green-600">${passCount}</p></div>
                    <div class="p-4 bg-red-100 rounded-lg text-center"><p class="text-lg text-red-800">ไม่ผ่านเกณฑ์</p><p class="text-3xl font-bold text-red-600">${failCount}</p></div>
                </div>`;
            renderSortableTable('quiz-results-table', state.quizResults, {
                full_name: 'ชื่อ-นามสกุล',
                pre_test_score: 'ก่อนอบรม (คะแนน)',
                post_test_status: 'หลังอบรม',
                evaluation: 'ผลประเมิน'
            }, 'ตารางสรุปผลคะแนนแบบทดสอบ (ใช้คะแนนหลังอบรมสูงสุด)', true, summaryHtml);
        }

        async function renderEvaluationForm() {
            await Promise.all([loadAllUsersForSelection(), loadEvaluations()]);
            if (!state.evaluations || state.evaluations.length === 0) {
                pageContent.innerHTML = `<div class="card text-center"><h2 class="text-2xl font-bold">ยังไม่มีแบบประเมิน</h2><p class="mt-4">ผู้ดูแลระบบยังไม่ได้สร้างแบบประเมินความพึงพอใจ</p></div>`;
                return;
            }
            const evaluationQuestions = state.evaluations.map((item, index) => `
                <div class="py-4 border-b">
                    <p class="font-medium mb-4">${index + 1}. ${item.question}</p>
                    <div class="emoji-rating flex justify-around items-center">
                        <input type="radio" id="q${index}-rate1" name="q${index}" value="1" required><label for="q${index}-rate1" title="น้อยที่สุด">😠</label>
                        <input type="radio" id="q${index}-rate2" name="q${index}" value="2" required><label for="q${index}-rate2" title="น้อย">😟</label>
                        <input type="radio" id="q${index}-rate3" name="q${index}" value="3" required><label for="q${index}-rate3" title="ปานกลาง">😐</label>
                        <input type="radio" id="q${index}-rate4" name="q${index}" value="4" required><label for="q${index}-rate4" title="มาก">😊</label>
                        <input type="radio" id="q${index}-rate5" name="q${index}" value="5" required><label for="q${index}-rate5" title="มากที่สุด">🤩</label>
                    </div>
                </div>`).join('');
            pageContent.innerHTML = `
                <div class="card max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-center">แบบประเมินความพึงพอใจโครงการ</h2>
                    <form id="evaluation-form">
                        <div class="text-center mb-6">
                            <label for="user_selector_eval" class="block font-medium mb-2">กรุณาเลือกชื่อของคุณ:</label>
                            <select id="user_selector_eval" name="id_card" class="form-select max-w-md mx-auto" required>
                                <option value="">-- เลือกชื่อ-นามสกุล --</option>
                                ${state.allUsersForSelection.map(user => `<option value="${user.id_card}">${user.full_name} (${user.affiliation})</option>`).join('')}
                            </select>
                        </div>
                        ${evaluationQuestions}
                        <div class="mt-6"><button type="submit" class="btn btn-primary w-full justify-center">ส่งแบบประเมิน</button></div>
                    </form>
                </div>`;
            setupEvaluationFormLogic();
        }

        async function renderEvaluationResults() {
             pageContent.innerHTML = `<div class="card"><p>กำลังโหลดผลการประเมิน...</p></div>`;
             const results = await fetchData('getEvaluationResults');
             if (!results || results.length === 0) {
                 pageContent.innerHTML = `<div class="card text-center"><h2 class="text-2xl font-bold">ยังไม่มีข้อมูลผลประเมิน</h2><p class="mt-4">ยังไม่มีผู้ทำแบบประเมินความพึงพอใจ</p></div>`;
                 return;
             }
             const totalEvaluators = results.length;
             const questions = Object.keys(results[0]).filter(k => k.startsWith('q_'));
             const questionTexts = state.evaluations.map(e => e.question);
             let chartsHtml = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">`;
             questions.forEach((q_key, index) => {
                 chartsHtml += `<div class="card"><h3 class="font-semibold mb-2">${index + 1}. ${questionTexts[index] || q_key}</h3><canvas id="chart-${index}"></canvas></div>`;
             });
             chartsHtml += `</div>`;
             pageContent.innerHTML = `
                <div class="card">
                    <h2 class="text-2xl font-bold mb-4">สรุปผลการประเมินความพึงพอใจ</h2>
                    <p class="text-lg mb-6">จำนวนผู้ประเมินทั้งหมด: <span class="font-bold text-blue-600">${totalEvaluators}</span> คน</p>
                    ${chartsHtml}
                </div>`;
             setTimeout(() => {
                questions.forEach((q_key, index) => {
                    const ctx = document.getElementById(`chart-${index}`).getContext('2d');
                    const scores = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
                    results.forEach(res => { scores[res[q_key]]++; });
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['😠 น้อยที่สุด', '😟 น้อย', '😐 ปานกลาง', '😊 มาก', '🤩 มากที่สุด'],
                            datasets: [{
                                label: 'จำนวนผู้ประเมิน',
                                data: Object.values(scores),
                                backgroundColor: ['rgba(239, 68, 68, 0.6)','rgba(249, 115, 22, 0.6)','rgba(234, 179, 8, 0.6)','rgba(132, 204, 22, 0.6)','rgba(34, 197, 94, 0.6)'],
                                borderColor: ['rgba(239, 68, 68, 1)','rgba(249, 115, 22, 1)','rgba(234, 179, 8, 1)','rgba(132, 204, 22, 1)','rgba(34, 197, 94, 1)'],
                                borderWidth: 1
                            }]
                        },
                        options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
                    });
                });
             }, 100);
        }

        async function renderPlanForm() {
            await Promise.all([loadAllUsersForSelection(), loadPlans()]);
            if (!state.plans || state.plans.length === 0) {
                pageContent.innerHTML = `<div class="card text-center"><h2 class="text-2xl font-bold">ยังไม่มีหัวข้อแผน</h2><p class="mt-4">ผู้ดูแลระบบยังไม่ได้ตั้งค่าคำถามสำหรับแผนการนำความรู้ไปใช้</p></div>`;
                return;
            }
            const planQuestions = state.plans.map((item, index) => `<div class="mb-6"><label for="plan_q${index}" class="block font-medium mb-2">${index + 1}. ${item.question}</label><textarea id="plan_q${index}" name="plan_q${index}" class="form-input" rows="5" required></textarea></div>`).join('');
            pageContent.innerHTML = `
                <div class="card max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-center">แผนการนำความรู้ไปใช้</h2>
                     <form id="plan-form">
                        <div class="text-center mb-6">
                            <label for="user_selector_plan" class="block font-medium mb-2">กรุณาเลือกชื่อของคุณ:</label>
                            <select id="user_selector_plan" name="id_card" class="form-select max-w-md mx-auto" required>
                                <option value="">-- เลือกชื่อ-นามสกุล --</option>
                                ${state.allUsersForSelection.map(user => `<option value="${user.id_card}">${user.full_name} (${user.affiliation})</option>`).join('')}
                            </select>
                        </div>
                        ${planQuestions}
                        <div class="mt-6"><button type="submit" class="btn btn-primary w-full justify-center">ส่งแผน</button></div>
                    </form>
                </div>`;
            setupPlanFormLogic();
        }

        async function renderPlanSummary() {
            pageContent.innerHTML = `<div class="card"><p>กำลังโหลดข้อมูล...</p></div>`;
            const [registrations, submittedPlans] = await Promise.all([fetchData('getRegistrations'), fetchData('getSubmittedPlans')]);
            if (!registrations) {
                pageContent.innerHTML = `<div class="card text-center"><p>ไม่สามารถโหลดข้อมูลผู้ลงทะเบียนได้</p></div>`;
                return;
            }
            const submittedIds = new Set(submittedPlans.map(p => p.id_card));
            const summaryData = registrations.map(reg => ({
                full_name: reg.full_name,
                status: submittedIds.has(reg.id_card) ? '<span class="text-green-600 font-semibold"><i class="fas fa-check-circle"></i> ส่งแล้ว</span>' : '<span class="text-red-600 font-semibold"><i class="fas fa-times-circle"></i> ยังไม่ส่ง</span>'
            }));
            renderSortableTable('plan-summary-table', summaryData, { full_name: 'ชื่อ-นามสกุล', status: 'สถานะการส่งแผน' }, 'สรุปการส่งแผนการนำความรู้ไปใช้', true);
        }

        async function renderCertificateList() {
            pageContent.innerHTML = `<div class="card"><p>กำลังโหลดรายชื่อผู้มีสิทธิรับประกาศนียบัตร...</p></div>`;
            const [quizResults, registrations] = await Promise.all([fetchData('getQuizResults'), fetchData('getRegistrations')]);
            if (!quizResults || !registrations) {
                pageContent.innerHTML = `<div class="card text-center"><p>ไม่สามารถโหลดข้อมูลได้</p></div>`;
                return;
            }
            state.quizResults = quizResults;
            state.registrations = registrations;
            const eligibleUserIds = new Set(state.quizResults.filter(r => r.evaluation === 'ผ่านเกณฑ์').map(r => r.id_card));
            const eligibleUsersData = state.registrations.filter(reg => eligibleUserIds.has(reg.id_card)).map(reg => ({
                title: reg.title,
                full_name: reg.full_name,
                affiliation: reg.affiliation || reg.coop_affiliation || '-',
                province: reg.province
            }));
            const headers = { title: 'คำนำหน้า', full_name: 'ชื่อ-นามสกุล', affiliation: 'สังกัด', province: 'จังหวัด' };
            renderSortableTable('certificate-table', eligibleUsersData, headers, 'รายชื่อผู้มีสิทธิรับประกาศนียบัตร', true);
            const exportButton = `<div class="text-right mt-4"><button id="export-csv-btn" class="btn btn-primary"><i class="fas fa-file-csv"></i> Export to CSV</button></div>`;
            if (pageContent.querySelector('.card')) {
                 pageContent.querySelector('.card').insertAdjacentHTML('beforeend', exportButton);
                 document.getElementById('export-csv-btn').addEventListener('click', () => exportToCSV(eligibleUsersData, 'certificate_list.csv'));
            }
        }

        // ADMIN PAGES
        async function renderAdminProject() {
            await loadInitialData();
            const p = state.project || {};
            pageContent.innerHTML = `
                <div class="card">
                    <h2 class="text-2xl font-bold mb-6">จัดการข้อมูลโครงการ</h2>
                    <form id="project-form" class="space-y-4">
                        <input type="hidden" name="id" value="${p.id || 'project_details'}">
                        <div><label for="name" class="block font-medium mb-1">ชื่อโครงการ</label><input type="text" id="name" name="name" class="form-input" value="${p.name || ''}" required></div>
                        <div><label for="objective" class="block font-medium mb-1">วัตถุประสงค์</label><textarea id="objective" name="objective" class="form-input" rows="3" required>${p.objective || ''}</textarea></div>
                        <div><label for="targetAudience" class="block font-medium mb-1">กลุ่มเป้าหมาย</label><select id="targetAudience" name="targetAudience" class="form-select" required><option value="บุคลากรกรมส่งเสริมสหกรณ์" ${p.targetAudience === 'บุคลากรกรมส่งเสริมสหกรณ์' ? 'selected' : ''}>บุคลากรกรมส่งเสริมสหกรณ์</option><option value="บุคลากรสหกรณ์" ${p.targetAudience === 'บุคลากรสหกรณ์' ? 'selected' : ''}>บุคลากรสหกรณ์</option></select></div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label for="duration" class="block font-medium mb-1">ระยะเวลา</label><input type="text" id="duration" name="duration" class="form-input" value="${p.duration || ''}" required></div>
                            <div><label for="location" class="block font-medium mb-1">สถานที่</label><input type="text" id="location" name="location" class="form-input" value="${p.location || ''}" required></div>
                        </div>
                        <div><label for="responsiblePerson" class="block font-medium mb-1">ผู้รับผิดชอบโครงการ</label><input type="text" id="responsiblePerson" name="responsiblePerson" class="form-input" value="${p.responsiblePerson || ''}" required></div>
                        <div><label for="details" class="block font-medium mb-1">รายละเอียดโครงการ</label><textarea id="details" name="details" class="form-input" rows="5" required>${p.details || ''}</textarea></div>
                        <div class="pt-4 flex gap-4"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> บันทึกข้อมูลโครงการ</button></div>
                    </form>
                </div>`;
            setupAdminProjectLogic();
        }
        
        async function renderAdminPages() {
            await loadPageSettings();
            const pageKeys = Object.keys(routes).filter(key => routes[key].menu === 'user');
            const toggles = pageKeys.map(key => {
                const isEnabled = state.pageSettings[key] !== false;
                return `
                    <div class="flex justify-between items-center p-4 border rounded-lg ${isEnabled ? 'bg-green-50' : 'bg-red-50'}">
                        <span class="font-medium">${routes[key].title}</span>
                        <label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" value="${key}" class="sr-only peer page-toggle" ${isEnabled ? 'checked' : ''}><div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div></label>
                    </div>`;
            }).join('');
            pageContent.innerHTML = `
                <div class="card">
                    <h2 class="text-2xl font-bold mb-6">จัดการการแสดงผลเพจผู้ใช้งาน</h2>
                    <p class="mb-4 text-gray-600">เลือกเปิด/ปิดการเข้าถึงหน้าต่างๆ สำหรับผู้เข้าอบรม</p>
                    <div id="page-toggles" class="space-y-3">${toggles}</div>
                </div>`;
            setupAdminPagesLogic();
        }

        async function renderAdminQuiz() {
            await loadQuizzes();
            const questionsList = state.quizzes.map((q, index) => `
                <div class="p-4 border rounded-lg mb-3">
                    <p class="font-semibold">${index + 1}. ${q.question}</p>
                    <ul class="list-disc list-inside pl-4 mt-2">${q.options.map((opt, i) => `<li class="${i === q.answer ? 'text-green-600 font-bold' : ''}">${opt}</li>`).join('')}</ul>
                    <div class="text-right mt-2"><button class="text-blue-600 hover:text-blue-800 mr-2 edit-quiz-btn" data-index="${index}"><i class="fas fa-edit"></i> แก้ไข</button><button class="text-red-600 hover:text-red-800 delete-quiz-btn" data-index="${index}"><i class="fas fa-trash"></i> ลบ</button></div>
                </div>`).join('');
            pageContent.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1">
                        <div class="card sticky top-24">
                            <h3 class="text-xl font-bold mb-4" id="quiz-form-title">เพิ่มคำถามใหม่</h3>
                            <form id="quiz-form" class="space-y-3">
                                <input type="hidden" id="quiz-id" name="id">
                                <div><label for="question" class="block font-medium mb-1">คำถาม</label><textarea id="question" name="question" class="form-input" rows="3" required></textarea></div>
                                <div><label class="block font-medium mb-1">ตัวเลือก</label><input type="text" name="option_0" class="form-input mb-2" placeholder="ตัวเลือก 1" required><input type="text" name="option_1" class="form-input mb-2" placeholder="ตัวเลือก 2" required><input type="text" name="option_2" class="form-input mb-2" placeholder="ตัวเลือก 3" required><input type="text" name="option_3" class="form-input" placeholder="ตัวเลือก 4" required></div>
                                <div><label for="answer" class="block font-medium mb-1">คำตอบที่ถูกต้อง</label><select id="answer" name="answer" class="form-select" required><option value="">-- เลือก --</option><option value="0">ตัวเลือก 1</option><option value="1">ตัวเลือก 2</option><option value="2">ตัวเลือก 3</option><option value="3">ตัวเลือก 4</option></select></div>
                                <div class="pt-2 flex gap-2"><button type="submit" class="btn btn-primary flex-grow justify-center"><i class="fas fa-save"></i> บันทึก</button><button type="button" id="clear-quiz-form" class="btn btn-secondary"><i class="fas fa-times"></i> ยกเลิก</button></div>
                            </form>
                        </div>
                    </div>
                    <div class="lg:col-span-2">
                        <div class="card">
                            <h3 class="text-xl font-bold mb-4">คลังคำถาม</h3>
                            <div class="mb-4"><label for="passPercentage" class="block font-medium mb-1">เกณฑ์การผ่าน (ร้อยละ)</label><div class="flex items-center gap-2"><input type="number" id="passPercentage" name="passPercentage" class="form-input w-32" value="${state.passPercentage}" min="0" max="100"><button id="save-pass-percentage" class="btn btn-primary"><i class="fas fa-check"></i></button></div></div>
                            <div id="questions-list">${questionsList || '<p>ยังไม่มีคำถามในระบบ</p>'}</div>
                        </div>
                    </div>
                </div>`;
            setupAdminQuizLogic();
        }
        
        async function renderAdminGenericCRUD(pageConfig) {
            const { formTitle, formFields, listTitle, sheetName, stateKey } = pageConfig;
            await loadGenericData(sheetName, stateKey);
            const itemsList = state[stateKey].map((item, index) => `
                 <div class="flex justify-between items-center p-3 border rounded-lg mb-2">
                    <span>${index + 1}. ${item.question}</span>
                    <div><button class="text-blue-600 hover:text-blue-800 mr-2 edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button><button class="text-red-600 hover:text-red-800 delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button></div>
                </div>`).join('');
            pageContent.innerHTML = `
                 <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1">
                        <div class="card sticky top-24">
                            <h3 class="text-xl font-bold mb-4" id="form-title">${formTitle}</h3>
                            <form id="crud-form" class="space-y-3">
                                <input type="hidden" id="item-id" name="id">
                                ${formFields}
                                <div class="pt-2 flex gap-2"><button type="submit" class="btn btn-primary flex-grow justify-center"><i class="fas fa-save"></i> บันทึก</button><button type="button" id="clear-form" class="btn btn-secondary"><i class="fas fa-times"></i> ยกเลิก</button></div>
                            </form>
                        </div>
                    </div>
                    <div class="lg:col-span-2">
                        <div class="card">
                            <h3 class="text-xl font-bold mb-4">${listTitle}</h3>
                            <div id="items-list">${itemsList || '<p>ยังไม่มีข้อมูล</p>'}</div>
                        </div>
                    </div>
                </div>`;
            setupAdminGenericCRUDLogic(pageConfig);
        }

        function renderAdminEvaluation() {
            renderAdminGenericCRUD({
                formTitle: 'เพิ่ม/แก้ไขประเด็น',
                formFields: `<div><label for="question" class="block font-medium mb-1">ประเด็นการประเมิน</label><textarea id="question" name="question" class="form-input" rows="3" required></textarea></div>`,
                listTitle: 'รายการประเด็นการประเมิน',
                sheetName: 'evaluations',
                stateKey: 'evaluations'
            });
        }

        function renderAdminPlan() {
             renderAdminGenericCRUD({
                formTitle: 'เพิ่ม/แก้ไขคำถาม',
                formFields: `<div><label for="question" class="block font-medium mb-1">คำถาม</p><textarea id="question" name="question" class="form-input" rows="4" required></textarea></div>`,
                listTitle: 'รายการคำถาม',
                sheetName: 'plans',
                stateKey: 'plans'
            });
        }
        
        async function renderAdminUsers() {
            await loadAdmins();
            const adminsList = state.admins.map((admin, index) => `
                <div class="flex justify-between items-center p-3 border rounded-lg mb-2">
                    <span class="font-mono">${admin.username}</span>
                    <div>
                        <button class="text-blue-600 hover:text-blue-800 mr-2 edit-admin-btn" data-index="${index}"><i class="fas fa-edit"></i> แก้ไข</button>
                        <button class="text-red-600 hover:text-red-800 delete-admin-btn" data-index="${index}"><i class="fas fa-trash"></i> ลบ</button>
                    </div>
                </div>`).join('');

            pageContent.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1">
                        <div class="card sticky top-24">
                            <h3 class="text-xl font-bold mb-4" id="admin-form-title">เพิ่มผู้ดูแลใหม่</h3>
                            <form id="admin-user-form" class="space-y-3">
                                <input type="hidden" id="admin-id" name="id">
                                <div><label for="admin-username" class="block font-medium mb-1">Username</label><input type="text" id="admin-username" name="username" class="form-input" required></div>
                                <div><label for="admin-password" class="block font-medium mb-1">Password</label><input type="password" id="admin-password" name="password" class="form-input" required></div>
                                <div class="pt-2 flex gap-2">
                                    <button type="submit" class="btn btn-primary flex-grow justify-center"><i class="fas fa-save"></i> บันทึก</button>
                                    <button type="button" id="clear-admin-form" class="btn btn-secondary"><i class="fas fa-times"></i> ยกเลิก</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="lg:col-span-2">
                        <div class="card">
                            <h3 class="text-xl font-bold mb-4">รายชื่อผู้ดูแล</h3>
                            <div id="admins-list">${adminsList || '<p>ยังไม่มีผู้ดูแลอื่น</p>'}</div>
                        </div>
                    </div>
                </div>`;
            setupAdminUsersLogic();
        }

        // --- LOGIC SETUP FUNCTIONS ---
        function setupRegistrationFormLogic(isCpd) {
            const form = document.getElementById('registration-form');
            const idCardInput = document.getElementById('id_card');
            const submitBtn = document.getElementById('submit-reg-btn');
            const inputs = form.querySelectorAll('input, select, textarea');
            ['title', 'province', 'education', 'status'].forEach(fieldName => {
                const select = document.getElementById(fieldName);
                const otherInput = document.getElementById(`${fieldName}_other`);
                if (select && otherInput) {
                    select.addEventListener('change', () => {
                        otherInput.classList.toggle('hidden', select.value !== 'อื่นๆ');
                        otherInput.required = select.value === 'อื่นๆ';
                        if (select.value !== 'อื่นๆ') otherInput.value = '';
                        validateForm();
                    });
                }
            });
            idCardInput.addEventListener('input', () => { idCardInput.value = idCardInput.value.replace(/\D/g, ''); });
            idCardInput.addEventListener('blur', async () => {
                if (idCardInput.value.length === 13) {
                    showLoading('กำลังตรวจสอบข้อมูล...');
                    const existingUser = await fetchData('checkUser', { id_card: idCardInput.value });
                    hideLoading();
                    if (existingUser) {
                        Swal.fire({
                            title: 'พบข้อมูลในระบบ', text: "ต้องการดึงข้อมูลมาแสดงหรือไม่?", icon: 'info',
                            showCancelButton: true, confirmButtonText: 'ใช่, ดึงข้อมูล', cancelButtonText: 'ไม่, กรอกใหม่'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                Object.keys(existingUser).forEach(key => {
                                    const field = form.querySelector(`[name="${key}"]`);
                                    if (field) {
                                        if (field.tagName === 'SELECT') {
                                            const optionExists = [...field.options].some(opt => opt.value === existingUser[key]);
                                            if (optionExists) {
                                                field.value = existingUser[key];
                                            } else {
                                                field.value = 'อื่นๆ';
                                                const otherInput = document.getElementById(`${key}_other`);
                                                if (otherInput) {
                                                    otherInput.value = existingUser[key];
                                                    otherInput.classList.remove('hidden');
                                                    otherInput.required = true;
                                                }
                                            }
                                            field.dispatchEvent(new Event('change'));
                                        } else { field.value = existingUser[key]; }
                                    }
                                });
                                validateForm();
                            }
                        });
                    }
                }
            });
            const validateForm = () => {
                let isValid = true;
                inputs.forEach(input => {
                    if (input.required && !input.value.trim()) isValid = false;
                    if (input.pattern && !new RegExp(input.pattern).test(input.value)) isValid = false;
                });
                submitBtn.disabled = !isValid;
            };
            inputs.forEach(input => {
                input.addEventListener('input', validateForm);
                input.addEventListener('change', validateForm);
            });
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading('กำลังส่งข้อมูล...');
                const formData = new FormData(form);
                formData.append('user_type', isCpd ? 'cpd' : 'coop');
                formData.append('timestamp', new Date().toISOString());
                ['title', 'province', 'education', 'status'].forEach(fieldName => {
                    if (formData.get(fieldName) === 'อื่นๆ') {
                        formData.set(fieldName, formData.get(`${fieldName}_other`));
                    }
                    formData.delete(`${fieldName}_other`);
                });
                const result = await postData('addRegistration', formData);
                hideLoading();
                if (result && result.status === 'success') {
                    showAlert('success', 'ลงทะเบียนสำเร็จ!', 'ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว');
                    form.reset();
                    submitBtn.disabled = true;
                    await loadRegistrations();
                }
            });
        }
        
        function setupQuizPageLogic() {
            const userSelector = document.getElementById('user_selector_quiz');
            const quizContainer = document.getElementById('quiz-container');
            const preTestBtn = document.getElementById('pre-test-btn');
            const postTestBtn = document.getElementById('post-test-btn');
            const quizContent = document.getElementById('quiz-content');
            let selectedUserId = null;
            userSelector.addEventListener('change', async (e) => {
                selectedUserId = e.target.value;
                quizContent.innerHTML = '';
                if (selectedUserId) {
                    quizContainer.classList.remove('hidden');
                    showLoading('ตรวจสอบสถานะการทำแบบทดสอบ...');
                    const testStatus = await fetchData('getTestStatus', { id_card: selectedUserId });
                    hideLoading();
                    postTestBtn.disabled = false;
                    postTestBtn.textContent = 'แบบทดสอบหลังอบรม';
                    postTestBtn.classList.remove('disabled:bg-gray-400', 'cursor-not-allowed');
                    preTestBtn.disabled = false;
                    preTestBtn.textContent = 'แบบทดสอบก่อนอบรม';
                    preTestBtn.classList.remove('disabled:bg-gray-400', 'cursor-not-allowed');
                    if(testStatus) {
                        if (testStatus.preTestTaken) {
                            preTestBtn.disabled = true;
                            preTestBtn.textContent = 'ทำแบบทดสอบก่อนอบรมแล้ว';
                            preTestBtn.classList.add('disabled:bg-gray-400', 'cursor-not-allowed');
                        }
                    }
                } else {
                    quizContainer.classList.add('hidden');
                }
            });
            preTestBtn.addEventListener('click', () => startQuiz('pre'));
            postTestBtn.addEventListener('click', () => startQuiz('post'));
            async function startQuiz(type) {
                showLoading('กำลังโหลดแบบทดสอบ...');
                await loadQuizzes();
                hideLoading();
                if (!state.quizzes || state.quizzes.length === 0) {
                    quizContent.innerHTML = `<p class="text-center text-red-500">ยังไม่มีคำถามในระบบ กรุณาติดต่อผู้ดูแล</p>`;
                    return;
                }
                const quizHtml = `
                    <h3 class="text-xl font-semibold mb-4 text-center">${type === 'pre' ? 'แบบทดสอบก่อนอบรม' : 'แบบทดสอบหลังอบรม'}</h3>
                    <form id="quiz-form-active">
                        ${state.quizzes.map((q, index) => `<div class="mb-6 p-4 border rounded-lg"><p class="font-medium mb-3">${index + 1}. ${q.question}</p><div class="space-y-2">${q.options.map((opt, i) => `<div><input type="radio" id="q${index}_opt${i}" name="q${index}" value="${i}" required class="mr-2"><label for="q${index}_opt${i}">${opt}</label></div>`).join('')}</div></div>`).join('')}
                        <button type="submit" class="btn btn-primary w-full justify-center mt-4">ส่งคำตอบ</button>
                    </form>`;
                quizContent.innerHTML = quizHtml;
                document.getElementById('quiz-form-active').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const answers = {};
                    for (let [key, value] of formData.entries()) { answers[key] = parseInt(value); }
                    let score = 0;
                    state.quizzes.forEach((q, index) => { if (answers[`q${index}`] === q.answer) { score++; } });
                    const totalQuestions = state.quizzes.length;
                    const percentage = (score / totalQuestions) * 100;
                    showLoading('กำลังบันทึกคะแนน...');
                    const submissionData = new FormData();
                    submissionData.append('id_card', selectedUserId);
                    submissionData.append('test_type', type);
                    submissionData.append('score', score);
                    submissionData.append('total_questions', totalQuestions);
                    submissionData.append('timestamp', new Date().toISOString());
                    const result = await postData('submitQuiz', submissionData);
                    hideLoading();
                    if (result && result.status === 'success') {
                         Swal.fire({
                            title: 'ส่งคำตอบเรียบร้อย!',
                            html: `คุณได้คะแนน <strong>${score}</strong> จาก ${totalQuestions} ข้อ<br>คิดเป็น <strong>${percentage.toFixed(2)}%</strong>`,
                            icon: 'success',
                            confirmButtonText: 'ตกลง'
                        }).then(() => {
                            quizContent.innerHTML = '';
                            userSelector.dispatchEvent(new Event('change'));
                        });
                    }
                });
            }
        }

        function setupEvaluationFormLogic() {
            const form = document.getElementById('evaluation-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading('กำลังส่งแบบประเมิน...');
                const formData = new FormData(form);
                const result = await postData('submitEvaluation', formData);
                hideLoading();
                if (result && result.status === 'success') {
                    showAlert('success', 'ขอบคุณสำหรับความคิดเห็น', 'เราได้บันทึกแบบประเมินของคุณแล้ว');
                    form.reset();
                }
            });
        }
        
        function setupPlanFormLogic() {
            const form = document.getElementById('plan-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading('กำลังส่งแผน...');
                const formData = new FormData(form);
                const result = await postData('submitPlan', formData);
                hideLoading();
                if (result && result.status === 'success') {
                    showAlert('success', 'บันทึกแผนสำเร็จ', 'เราได้บันทึกข้อมูลแผนของคุณแล้ว');
                    form.reset();
                }
            });
        }

        function setupAdminProjectLogic() {
            const form = document.getElementById('project-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading('กำลังบันทึกข้อมูลโครงการ...');
                const formData = new FormData(form);
                const result = await postData('saveProject', formData);
                hideLoading();
                if (result && result.status === 'success') {
                    showAlert('success', 'บันทึกสำเร็จ', 'ข้อมูลโครงการได้รับการอัปเดตแล้ว');
                    state.project = result.data;
                }
            });
        }
        
        function setupAdminPagesLogic() {
            const container = document.getElementById('page-toggles');
            container.addEventListener('change', async (e) => {
                if (e.target.classList.contains('page-toggle')) {
                    const pageKey = e.target.value;
                    const isEnabled = e.target.checked;
                    state.pageSettings[pageKey] = isEnabled;
                    showLoading('กำลังบันทึกการตั้งค่า...');
                    const formData = new FormData();
                    formData.append('settings', JSON.stringify(state.pageSettings));
                    const result = await postData('savePageSettings', formData);
                    hideLoading();
                    if (result && result.status === 'success') {
                        Swal.fire({ toast: true, icon: 'success', title: 'บันทึกการตั้งค่าแล้ว', position: 'top-end', showConfirmButton: false, timer: 2000 });
                        const parentDiv = e.target.closest('.flex');
                        parentDiv.classList.toggle('bg-green-50', isEnabled);
                        parentDiv.classList.toggle('bg-red-50', !isEnabled);
                        updateMenuVisibility();
                    } else {
                        e.target.checked = !isEnabled;
                        state.pageSettings[pageKey] = !isEnabled;
                        showAlert('error', 'บันทึกไม่สำเร็จ');
                    }
                }
            });
        }

        function setupAdminQuizLogic() {
            const form = document.getElementById('quiz-form');
            const formTitle = document.getElementById('quiz-form-title');
            const idInput = document.getElementById('quiz-id');
            const clearBtn = document.getElementById('clear-quiz-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading('กำลังบันทึกคำถาม...');
                const formData = new FormData(form);
                const action = formData.get('id') ? 'updateQuiz' : 'addQuiz';
                const result = await postData(action, formData);
                hideLoading();
                if (result && result.status === 'success') {
                    showAlert('success', 'บันทึกสำเร็จ');
                    form.reset();
                    idInput.value = '';
                    formTitle.textContent = 'เพิ่มคำถามใหม่';
                    await renderAdminQuiz();
                }
            });
            clearBtn.addEventListener('click', () => {
                form.reset();
                idInput.value = '';
                formTitle.textContent = 'เพิ่มคำถามใหม่';
            });
            document.getElementById('questions-list').addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-quiz-btn');
                if (editBtn) {
                    const index = editBtn.dataset.index;
                    const quiz = state.quizzes[index];
                    formTitle.textContent = 'แก้ไขคำถาม';
                    idInput.value = quiz.id;
                    form.question.value = quiz.question;
                    quiz.options.forEach((opt, i) => { form[`option_${i}`].value = opt; });
                    form.answer.value = quiz.answer;
                    form.scrollIntoView({ behavior: 'smooth' });
                }
                const deleteBtn = e.target.closest('.delete-quiz-btn');
                if (deleteBtn) {
                    const index = deleteBtn.dataset.index;
                    const quiz = state.quizzes[index];
                    Swal.fire({
                        title: 'ต้องการลบคำถามนี้?', text: `"${quiz.question}"`, icon: 'warning',
                        showCancelButton: true, confirmButtonText: 'ใช่, ลบเลย', cancelButtonText: 'ยกเลิก'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            showLoading('กำลังลบ...');
                            const formData = new FormData();
                            formData.append('id', quiz.id);
                            const res = await postData('deleteQuiz', formData);
                            hideLoading();
                            if (res && res.status === 'success') {
                                showAlert('success', 'ลบคำถามแล้ว');
                                await renderAdminQuiz();
                            }
                        }
                    });
                }
            });
            document.getElementById('save-pass-percentage').addEventListener('click', async () => {
                const percentage = document.getElementById('passPercentage').value;
                showLoading('กำลังบันทึก...');
                const formData = new FormData();
                formData.append('passPercentage', percentage);
                const result = await postData('savePassPercentage', formData);
                hideLoading();
                if (result && result.status === 'success') {
                    state.passPercentage = parseInt(percentage);
                    showAlert('success', 'บันทึกเกณฑ์การผ่านสำเร็จ');
                }
            });
        }
        
        function setupAdminGenericCRUDLogic(pageConfig) {
            const { sheetName, stateKey } = pageConfig;
            const form = document.getElementById('crud-form');
            const formTitle = document.getElementById('form-title');
            const idInput = document.getElementById('item-id');
            const clearBtn = document.getElementById('clear-form');
            const listContainer = document.getElementById('items-list');
            const renderFunction = stateKey === 'evaluations' ? renderAdminEvaluation : renderAdminPlan;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading('กำลังบันทึก...');
                const formData = new FormData(form);
                const action = formData.get('id') ? `update${capitalize(sheetName)}` : `add${capitalize(sheetName)}`;
                const result = await postData(action, formData);
                hideLoading();
                if (result && result.status === 'success') {
                    showAlert('success', 'บันทึกสำเร็จ');
                    form.reset();
                    idInput.value = '';
                    formTitle.textContent = pageConfig.formTitle;
                    await renderFunction();
                }
            });
            clearBtn.addEventListener('click', () => {
                form.reset();
                idInput.value = '';
                formTitle.textContent = pageConfig.formTitle;
            });
            listContainer.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-btn');
                if (editBtn) {
                    const index = editBtn.dataset.index;
                    const item = state[stateKey][index];
                    formTitle.textContent = 'แก้ไขรายการ';
                    idInput.value = item.id;
                    form.question.value = item.question;
                    form.scrollIntoView({ behavior: 'smooth' });
                }
                const deleteBtn = e.target.closest('.delete-btn');
                if (deleteBtn) {
                    const index = deleteBtn.dataset.index;
                    const item = state[stateKey][index];
                    Swal.fire({
                        title: 'ต้องการลบรายการนี้?', text: `"${item.question}"`, icon: 'warning',
                        showCancelButton: true, confirmButtonText: 'ใช่, ลบเลย', cancelButtonText: 'ยกเลิก'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            showLoading('กำลังลบ...');
                            const formData = new FormData();
                            formData.append('id', item.id);
                            const res = await postData(`delete${capitalize(sheetName)}`, formData);
                            hideLoading();
                            if (res && res.status === 'success') {
                                showAlert('success', 'ลบรายการแล้ว');
                                await renderFunction();
                            }
                        }
                    });
                }
            });
        }
        
        function setupAdminUsersLogic() {
            const form = document.getElementById('admin-user-form');
            const formTitle = document.getElementById('admin-form-title');
            const idInput = document.getElementById('admin-id');
            const clearBtn = document.getElementById('clear-admin-form');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading('กำลังบันทึกผู้ดูแล...');
                const formData = new FormData(form);
                const action = formData.get('id') ? 'updateAdmin' : 'addAdmin';
                const result = await postData(action, formData);
                hideLoading();
                if (result && result.status === 'success') {
                    showAlert('success', 'บันทึกสำเร็จ');
                    form.reset();
                    idInput.value = '';
                    formTitle.textContent = 'เพิ่มผู้ดูแลใหม่';
                    await renderAdminUsers();
                }
            });

            clearBtn.addEventListener('click', () => {
                form.reset();
                idInput.value = '';
                formTitle.textContent = 'เพิ่มผู้ดูแลใหม่';
            });

            document.getElementById('admins-list').addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-admin-btn');
                if (editBtn) {
                    const index = editBtn.dataset.index;
                    const admin = state.admins[index];
                    formTitle.textContent = 'แก้ไขผู้ดูแล';
                    idInput.value = admin.id;
                    form.username.value = admin.username;
                    form.password.value = admin.password;
                    form.scrollIntoView({ behavior: 'smooth' });
                }
                const deleteBtn = e.target.closest('.delete-admin-btn');
                if (deleteBtn) {
                    const index = deleteBtn.dataset.index;
                    const admin = state.admins[index];
                    Swal.fire({
                        title: 'ต้องการลบผู้ดูแลนี้?', text: `Username: "${admin.username}"`, icon: 'warning',
                        showCancelButton: true, confirmButtonText: 'ใช่, ลบเลย', cancelButtonText: 'ยกเลิก'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            showLoading('กำลังลบ...');
                            const formData = new FormData();
                            formData.append('id', admin.id);
                            const res = await postData('deleteAdmin', formData);
                            hideLoading();
                            if (res && res.status === 'success') {
                                showAlert('success', 'ลบผู้ดูแลแล้ว');
                                await renderAdminUsers();
                            }
                        }
                    });
                }
            });
        }

        // --- DATA LOADING FUNCTIONS ---
        async function loadInitialData() {
            showLoading('กำลังโหลดข้อมูลโครงการ...');
            const data = await fetchData('getInitialData');
            hideLoading();
            if (data) {
                state.project = data.project || null;
                state.pageSettings = data.pageSettings || {};
                updateMenuVisibility();
            }
        }
        
        async function loadRegistrations() {
            const data = await fetchData('getRegistrations');
            if (data) state.registrations = data;
        }
        
        async function loadAllUsersForSelection() {
            if (state.allUsersForSelection.length > 0) return;
            const data = await fetchData('getRegistrations');
            if (data) {
                state.allUsersForSelection = data.map(r => ({
                    id_card: r.id_card,
                    full_name: r.full_name,
                    affiliation: r.affiliation || r.coop_affiliation || 'ไม่มีสังกัด'
                })).sort((a, b) => a.full_name.localeCompare(b.full_name, 'th'));
            }
        }

        async function loadQuizzes() {
            const data = await fetchData('getQuizzes');
            if (data) {
                state.quizzes = data.quizzes || [];
                state.passPercentage = data.passPercentage || 80;
            }
        }
        
        async function loadQuizResults() {
             const data = await fetchData('getQuizResults');
             if (data) state.quizResults = data.sort((a,b) => a.full_name.localeCompare(b.full_name, 'th'));
        }
        
        async function loadEvaluations() { await loadGenericData('evaluations', 'evaluations'); }
        async function loadPlans() { await loadGenericData('plans', 'plans'); }
        async function loadAdmins() {
            const data = await fetchData('getAdmins');
            if(data) state.admins = data;
        }
        async function loadPageSettings() {
            const data = await fetchData('getPageSettings');
            if (data) state.pageSettings = data;
        }
        async function loadGenericData(sheetName, stateKey) {
            const data = await fetchData(`get${capitalize(sheetName)}`);
            if (data) state[stateKey] = data;
        }

        // --- HELPER FUNCTIONS ---
        function renderSortableTable(tableId, data, headers, title, searchable, headerHtml = '') {
            if (!data || data.length === 0) {
                pageContent.innerHTML = `<div class="card text-center"><h2 class="text-2xl font-bold">${title}</h2><p class="mt-4">ไม่มีข้อมูลที่จะแสดง</p></div>`;
                return;
            }
            const headerKeys = Object.keys(headers);
            const tableContainer = document.createElement('div');
            tableContainer.className = 'card';
            let searchInput = searchable ? `<div class="mb-4"><input type="text" id="${tableId}-search" class="form-input max-w-sm" placeholder="ค้นหา..."></div>` : '';
            tableContainer.innerHTML = `
                <h2 class="text-2xl font-bold mb-4">${title}</h2>
                ${headerHtml}${searchInput}
                <div class="overflow-x-auto">
                    <table id="${tableId}" class="w-full text-left">
                        <thead><tr class="bg-gray-100">${headerKeys.map(key => `<th class="p-3" data-sort="${key}">${headers[key]} <i class="fas fa-sort text-gray-400"></i></th>`).join('')}</tr></thead>
                        <tbody></tbody>
                    </table>
                </div>`;
            pageContent.innerHTML = '';
            pageContent.appendChild(tableContainer);
            const tableBody = tableContainer.querySelector('tbody');
            const searchBox = document.getElementById(`${tableId}-search`);
            let currentSort = { key: headerKeys[0], asc: true };
            function drawTable(filteredData) {
                tableBody.innerHTML = filteredData.map(row => `<tr class="border-b hover:bg-gray-50">${headerKeys.map(key => `<td class="p-3">${row[key] || '-'}</td>`).join('')}</tr>`).join('');
            }
            function sortData(key) {
                currentSort.key === key ? currentSort.asc = !currentSort.asc : (currentSort.key = key, currentSort.asc = true);
                data.sort((a, b) => {
                    let valA = a[currentSort.key], valB = b[currentSort.key];
                    if (typeof valA === 'string') return currentSort.asc ? valA.localeCompare(valB, 'th') : valB.localeCompare(valA, 'th');
                    return currentSort.asc ? valA - valB : valB - valA;
                });
                tableContainer.querySelectorAll('thead th i').forEach(i => i.className = 'fas fa-sort text-gray-400');
                tableContainer.querySelector(`th[data-sort="${key}"] i`).className = `fas ${currentSort.asc ? 'fa-sort-up' : 'fa-sort-down'}`;
                filterAndDraw();
            }
            function filterAndDraw() {
                let filteredData = data;
                if (searchable && searchBox.value) {
                    const searchTerm = searchBox.value.toLowerCase();
                    filteredData = data.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm)));
                }
                drawTable(filteredData);
            }
            if (searchable) searchBox.addEventListener('input', filterAndDraw);
            tableContainer.querySelectorAll('thead th').forEach(th => th.addEventListener('click', () => sortData(th.dataset.sort)));
            drawTable(data);
        }

        function exportToCSV(data, filename) {
            if (data.length === 0) { showAlert('info', 'ไม่มีข้อมูลสำหรับ Export'); return; }
            const headers = Object.keys(data[0]);
            const csvRows = [ headers.join(','), ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(',')) ];
            const csvString = csvRows.join('\r\n');
            const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function updateMenuVisibility() {
            document.querySelectorAll('#user-menu .nav-link').forEach(link => {
                const pageKey = link.getAttribute('href').substring(1);
                link.style.display = state.pageSettings[pageKey] === false ? 'none' : 'flex';
            });
        }
        
        function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

        // --- ADMIN AUTHENTICATION ---
        const handleLogin = async () => {
            const { value: formValues } = await Swal.fire({
                title: 'เข้าสู่ระบบผู้ดูแล',
                html: `<input id="swal-input1" class="swal2-input" placeholder="Username" autocomplete="off"><input id="swal-input2" type="password" class="swal2-input" placeholder="Password" autocomplete="off">`,
                focusConfirm: false,
                preConfirm: () => [document.getElementById('swal-input1').value, document.getElementById('swal-input2').value],
                showCancelButton: true,
                confirmButtonText: 'เข้าสู่ระบบ',
                cancelButtonText: 'ยกเลิก'
            });
            if (formValues) {
                const [username, password] = formValues;
                showLoading('กำลังเข้าสู่ระบบ...');
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                const result = await postData('login', formData);
                hideLoading();
                if (result && result.status === 'success') {
                    state.isAdmin = true;
                    state.adminRole = result.data.role;
                    updateAdminUI();
                    showAlert('success', 'เข้าสู่ระบบสำเร็จ');
                    navigateTo('#admin-project');
                } else {
                    showAlert('error', 'ข้อมูลไม่ถูกต้อง', result ? result.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
                }
            }
        };

        const handleLogout = () => {
            state.isAdmin = false;
            state.adminRole = null;
            updateAdminUI();
            showAlert('success', 'ออกจากระบบเรียบร้อย');
            navigateTo('#dashboard');
        };

        const updateAdminUI = () => {
            adminMenu.classList.toggle('hidden', !state.isAdmin);
            adminLoginBtn.classList.toggle('hidden', state.isAdmin);
            logoutBtn.classList.toggle('hidden', !state.isAdmin);
            adminUsersLink.classList.toggle('hidden', state.adminRole !== 'main_admin');
            document.querySelectorAll('#user-menu .nav-link').forEach(link => { link.style.display = 'flex'; });
        };

        // --- EVENT LISTENERS ---
        window.addEventListener('hashchange', () => navigateTo(window.location.hash));
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                navigateTo(e.target.closest('.nav-link').getAttribute('href'));
            }
        });
        adminLoginBtn.addEventListener('click', handleLogin);
        logoutBtn.addEventListener('click', handleLogout);
        openSidebarBtn.addEventListener('click', () => sidebar.classList.remove('-translate-x-full'));
        closeSidebarBtn.addEventListener('click', () => sidebar.classList.add('-translate-x-full'));

        // --- INITIALIZATION ---
        const init = async () => {
            await loadInitialData();
            navigateTo(window.location.hash);
        };
        init();
    });