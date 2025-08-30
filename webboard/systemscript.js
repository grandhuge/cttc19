        // Configuration
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzHjdr_3JHM5Ct1i01WTTup5CKWwzOh2LWOftygtWF15aqiiCeOtNsZY6K5l_DXfqxL/exec';
        
        // Global variables
        let isAdmin = false;
        let editingCommentId = null;
        let editingTopicId = null;
        let currentTopicId = null;
        let showingTopics = true;
        let topics = [];
        let comments = [];
        let currentSort = 'likes';
        let userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');

        // Profanity filter
        const profanityWords = ['ห่า', 'เหี้ย', 'ชิบหาย', 'ควาย', 'ไอ้', 'เวร', 'บ้า', 'โง่', 'ระยำ', 'แม่ง'];

        function checkProfanity(text) {
            const violations = [];
            const lowerText = text.toLowerCase();
            profanityWords.forEach(word => {
                if (lowerText.includes(word.toLowerCase())) {
                    violations.push(word);
                }
            });
            return violations;
        }

        function filterProfanity(text) {
            let filteredText = text;
            profanityWords.forEach(word => {
                const regex = new RegExp(word, 'gi');
                filteredText = filteredText.replace(regex, '*'.repeat(word.length));
            });
            return filteredText;
        }

        // API Functions with SweetAlert2
        let loadingAlert = null;

        function showLoading() {
            loadingAlert = Swal.fire({
                title: '🔄 กำลังโหลดข้อมูล',
                html: `
                    <div class="text-center">
                        <div class="mb-4">
                            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                        <div id="swal-status" class="text-gray-600 mb-4">เริ่มต้นการโหลด...</div>
                        <div class="w-full bg-gray-200 rounded-full h-3 mb-3">
                            <div id="swal-progress" class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">ความคืบหน้า</span>
                            <span id="swal-percent" class="font-semibold text-blue-600">0%</span>
                        </div>
                        <div class="mt-4 space-y-2 text-left">
                            <div id="swal-step1" class="flex items-center text-sm text-gray-500">
                                <div class="w-4 h-4 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-gray-300 hidden"></div>
                                </div>
                                <span>โหลดข้อมูลหัวข้อ</span>
                            </div>
                            <div id="swal-step2" class="flex items-center text-sm text-gray-500">
                                <div class="w-4 h-4 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-gray-300 hidden"></div>
                                </div>
                                <span>โหลดความคิดเห็น</span>
                            </div>
                            <div id="swal-step3" class="flex items-center text-sm text-gray-500">
                                <div class="w-4 h-4 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-gray-300 hidden"></div>
                                </div>
                                <span>จัดเรียงข้อมูล</span>
                            </div>
                            <div id="swal-step4" class="flex items-center text-sm text-gray-500">
                                <div class="w-4 h-4 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-gray-300 hidden"></div>
                                </div>
                                <span>แสดงผลข้อมูล</span>
                            </div>
                        </div>
                    </div>
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                customClass: {
                    popup: 'rounded-2xl'
                }
            });
        }

        function hideLoading() {
            if (loadingAlert) {
                Swal.close();
                loadingAlert = null;
            }
        }

        function updateProgress(percent, status, step = null) {
            if (!loadingAlert) return;
            
            const progressBar = document.getElementById('swal-progress');
            const progressPercent = document.getElementById('swal-percent');
            const loadingStatus = document.getElementById('swal-status');
            
            if (progressBar) progressBar.style.width = percent + '%';
            if (progressPercent) progressPercent.textContent = Math.round(percent) + '%';
            if (loadingStatus) loadingStatus.textContent = status;
            
            // Update step indicators
            if (step) {
                const stepElement = document.getElementById(`swal-step${step}`);
                if (stepElement) {
                    // Mark as active
                    stepElement.classList.remove('text-gray-500');
                    stepElement.classList.add('text-blue-600');
                    
                    const circle = stepElement.querySelector('.w-4.h-4');
                    const dot = stepElement.querySelector('.w-2.h-2');
                    
                    if (circle) {
                        circle.classList.remove('border-gray-300');
                        circle.classList.add('border-blue-500', 'bg-blue-50');
                    }
                    if (dot) {
                        dot.classList.remove('bg-gray-300', 'hidden');
                        dot.classList.add('bg-blue-500');
                    }
                    
                    // Mark previous steps as completed
                    for (let i = 1; i < step; i++) {
                        const prevStep = document.getElementById(`swal-step${i}`);
                        if (prevStep) {
                            prevStep.classList.remove('text-gray-500', 'text-blue-600');
                            prevStep.classList.add('text-green-600');
                            
                            const prevCircle = prevStep.querySelector('.w-4.h-4');
                            const prevDot = prevStep.querySelector('.w-2.h-2');
                            
                            if (prevCircle) {
                                prevCircle.classList.remove('border-gray-300', 'border-blue-500', 'bg-blue-50');
                                prevCircle.classList.add('border-green-500', 'bg-green-50');
                            }
                            if (prevDot) {
                                prevDot.classList.remove('bg-gray-300', 'bg-blue-500', 'hidden');
                                prevDot.classList.add('bg-green-500');
                            }
                        }
                    }
                }
            }
        }

        function makeRequest(action, data = {}) {
            return new Promise((resolve, reject) => {
                const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
                
                window[callbackName] = function(response) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.error || 'Unknown error'));
                    }
                };

                const params = new URLSearchParams({
                    action: action,
                    callback: callbackName,
                    ...data
                });

                const script = document.createElement('script');
                script.src = `${APPS_SCRIPT_URL}?${params.toString()}`;
                script.onerror = () => {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    reject(new Error('Network error'));
                };
                
                document.body.appendChild(script);
            });
        }

        async function loadData() {
            try {
                showLoading();
                
                // Step 1: Load topics
                updateProgress(10, 'กำลังโหลดข้อมูลหัวข้อ...', 1);
                await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UX
                
                const topicsData = await makeRequest('getTopics');
                updateProgress(35, 'โหลดข้อมูลหัวข้อเสร็จสิ้น');
                
                // Step 2: Load comments
                updateProgress(40, 'กำลังโหลดความคิดเห็น...', 2);
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const commentsData = await makeRequest('getComments');
                updateProgress(70, 'โหลดความคิดเห็นเสร็จสิ้น');
                
                // Step 3: Process data
                updateProgress(75, 'กำลังจัดเรียงข้อมูล...', 3);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                topics = topicsData || [];
                comments = commentsData || [];
                updateCommentCounts();
                
                updateProgress(90, 'จัดเรียงข้อมูลเสร็จสิ้น');
                
                // Step 4: Render UI
                updateProgress(95, 'กำลังแสดงผลข้อมูล...', 4);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                renderTopics();
                if (isAdmin) renderAdminTopics();
                
                updateProgress(100, 'โหลดข้อมูลเสร็จสมบูรณ์!');
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error('Error loading data:', error);
                hideLoading();
                Swal.fire({
                    icon: 'error',
                    title: '❌ เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
            } finally {
                hideLoading();
            }
        }

        async function saveToDatabase(action, data) {
            try {
                showLoading();
                updateProgress(20, 'กำลังบันทึกข้อมูล...', 1);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                const result = await makeRequest(action, data);
                updateProgress(60, 'บันทึกข้อมูลเสร็จสิ้น', 2);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                updateProgress(80, 'กำลังโหลดข้อมูลใหม่...', 3);
                await loadDataQuiet(); // Reload data without showing full loading
                
                updateProgress(100, 'ดำเนินการเสร็จสมบูรณ์!', 4);
                await new Promise(resolve => setTimeout(resolve, 300));
                
                return result;
            } catch (error) {
                console.error('Error saving data:', error);
                hideLoading();
                Swal.fire({
                    icon: 'error',
                    title: '❌ เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                throw error;
            } finally {
                hideLoading();
            }
        }

        async function loadDataQuiet() {
            // Load data without showing progress (for internal use)
            const [topicsData, commentsData] = await Promise.all([
                makeRequest('getTopics'),
                makeRequest('getComments')
            ]);
            
            topics = topicsData || [];
            comments = commentsData || [];
            updateCommentCounts();
            renderTopics();
            if (isAdmin) renderAdminTopics();
        }

        function updateCommentCounts() {
            topics.forEach(topic => {
                topic.commentCount = comments.filter(c => c.topicId === topic.id).length;
            });
        }

        function selectTopic(topicId) {
            currentTopicId = topicId;
            showingTopics = false;
            const topic = topics.find(t => t.id === topicId);
            
            document.getElementById('currentTopicTitle').textContent = topic.title;
            document.getElementById('currentTopicDescription').textContent = topic.description;
            
            // Show/hide appropriate sections
            document.getElementById('topicsList').parentElement.classList.add('hidden');
            document.getElementById('currentTopicDisplay').classList.remove('hidden');
            document.getElementById('postForm').classList.remove('hidden');
            document.getElementById('sortOptions').classList.remove('hidden');
            document.getElementById('commentsContainer').classList.remove('hidden');
            
            renderComments();
        }

        function backToTopics() {
            showingTopics = true;
            currentTopicId = null;
            
            // Show/hide appropriate sections
            document.getElementById('topicsList').parentElement.classList.remove('hidden');
            document.getElementById('currentTopicDisplay').classList.add('hidden');
            document.getElementById('postForm').classList.add('hidden');
            document.getElementById('sortOptions').classList.add('hidden');
            document.getElementById('commentsContainer').classList.add('hidden');
            
            renderTopics();
        }

        function renderTopics() {
            const container = document.getElementById('topicsList');
            const visibleTopics = topics.filter(t => t.isVisible || isAdmin);
            
            container.innerHTML = visibleTopics.map(topic => `
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 topic-hover cursor-pointer"
                     onclick="selectTopic(${topic.id})">
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="text-lg font-semibold text-gray-800">${topic.title}</h3>
                        ${!topic.isVisible ? '<span class="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">ซ่อน</span>' : ''}
                    </div>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${topic.description}</p>
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>💬 ${topic.commentCount} ความคิดเห็น</span>
                        <span>${formatTime(new Date(topic.createdAt))}</span>
                    </div>
                </div>
            `).join('');
        }

        function renderAdminTopics() {
            if (!isAdmin) return;
            
            const container = document.getElementById('adminTopicsList');
            container.innerHTML = topics.map(topic => `
                <div class="bg-gray-50 rounded-xl p-4 border">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h4 class="font-semibold text-gray-800">${topic.title}</h4>
                                <span class="px-2 py-1 rounded-full text-xs ${topic.isVisible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                                    ${topic.isVisible ? '👁️ แสดง' : '🙈 ซ่อน'}
                                </span>
                                <span class="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                                    💬 ${topic.commentCount}
                                </span>
                            </div>
                            <p class="text-gray-600 text-sm">${topic.description}</p>
                        </div>
                        <div class="flex items-center space-x-2 ml-4">
                            <button onclick="toggleTopicVisibility(${topic.id})" 
                                    class="px-3 py-1 rounded-lg text-sm transition-colors ${topic.isVisible ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}">
                                ${topic.isVisible ? '🙈 ซ่อน' : '👁️ แสดง'}
                            </button>
                            <button onclick="editTopic(${topic.id})" 
                                    class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                                ✏️ แก้ไข
                            </button>
                            <button onclick="deleteTopic(${topic.id})" 
                                    class="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm">
                                🗑️ ลบ
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        let isSubmitting = false;
        
        async function addComment() {
            if (isSubmitting) return;
            
            if (!currentTopicId) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ แจ้งเตือน',
                    text: 'กรุณาเลือกหัวข้อก่อนแสดงความคิดเห็น',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }

            const authorName = document.getElementById('authorName').value.trim();
            const commentText = document.getElementById('commentText').value.trim();
            
            isSubmitting = true;
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '⏳ กำลังโพสต์...';
            submitBtn.disabled = true;

            if (!authorName || !commentText) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ข้อมูลไม่ครบถ้วน',
                    text: 'กรุณากรอกชื่อและความคิดเห็นให้ครบถ้วน',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            if (authorName.length > 50) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ชื่อยาวเกินไป',
                    text: 'ชื่อต้องไม่เกิน 50 ตัวอักษร',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            if (commentText.length > 1000) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ความคิดเห็นยาวเกินไป',
                    text: 'ความคิดเห็นต้องไม่เกิน 1000 ตัวอักษร',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            // Check for duplicate comments
            const recentComments = comments.filter(c => 
                c.topicId === currentTopicId && 
                c.author === authorName && 
                c.text === commentText &&
                (Date.now() - new Date(c.timestamp).getTime()) < 60000 // Within 1 minute
            );
            
            if (recentComments.length > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ความคิดเห็นซ้ำ',
                    text: 'คุณเพิ่งโพสต์ความคิดเห็นนี้ไปแล้ว กรุณารอสักครู่ก่อนโพสต์ซ้ำ',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }

            // Check for profanity
            const nameViolations = checkProfanity(authorName);
            const textViolations = checkProfanity(commentText);
            
            let finalAuthor = authorName;
            let finalText = commentText;
            let isFiltered = false;
            
            if (nameViolations.length > 0 || textViolations.length > 0) {
                const allViolations = [...nameViolations, ...textViolations];
                
                const result = await Swal.fire({
                    icon: 'warning',
                    title: '⚠️ พบคำที่ไม่เหมาะสม',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">พบคำที่ไม่เหมาะสม: <strong class="text-red-600">${allViolations.join(', ')}</strong></p>
                            <p>คุณต้องการให้ระบบกรองคำเหล่านี้เป็น * หรือไม่?</p>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: '✅ กรองคำ',
                    cancelButtonText: '❌ ยกเลิก',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                
                if (result.isConfirmed) {
                    finalAuthor = filterProfanity(authorName);
                    finalText = filterProfanity(commentText);
                    isFiltered = true;
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: '📝 แก้ไขข้อความ',
                        text: 'กรุณาแก้ไขข้อความให้เหมาะสมก่อนโพสต์',
                        confirmButtonText: 'ตกลง',
                        customClass: {
                            popup: 'rounded-2xl'
                        }
                    });
                    return;
                }
            }

            try {
                await saveToDatabase('addComment', {
                    topicId: currentTopicId,
                    author: finalAuthor,
                    text: finalText,
                    isFiltered: isFiltered
                });
                
                // Clear form
                document.getElementById('authorName').value = '';
                document.getElementById('commentText').value = '';
                updateCharacterCount();
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: '✅ โพสต์สำเร็จ!',
                    text: 'ความคิดเห็นของคุณถูกเพิ่มเรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                
                renderComments();
                
            } catch (error) {
                // Error already handled in saveToDatabase
            }
        }

        async function toggleLike(commentId) {
            const comment = comments.find(c => c.id === commentId);
            const likeKey = `comment_${commentId}`;
            const hasLiked = userLikes[likeKey] || false;
            
            try {
                await saveToDatabase('toggleLike', {
                    commentId: commentId,
                    increment: !hasLiked
                });
                
                // Update local state
                userLikes[likeKey] = !hasLiked;
                localStorage.setItem('userLikes', JSON.stringify(userLikes));
                
                // Add animation
                const likeBtn = document.querySelector(`[data-comment-id="${commentId}"] .like-btn`);
                if (likeBtn) {
                    likeBtn.classList.add('like-animation');
                    setTimeout(() => likeBtn.classList.remove('like-animation'), 300);
                }
                
                renderComments();
                
            } catch (error) {
                // Error already handled in saveToDatabase
            }
        }

        function sortComments(sortBy) {
            currentSort = sortBy;
            
            document.getElementById('sortLikes').className = sortBy === 'likes' 
                ? 'px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                : 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors';
            
            document.getElementById('sortTime').className = sortBy === 'time' 
                ? 'px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                : 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors';

            renderComments();
        }

        function formatTime(timestamp) {
            const now = new Date();
            const date = new Date(timestamp);
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return 'เมื่อสักครู่';
            if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
            if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
            return `${days} วันที่แล้ว`;
        }

        function getRankIcon(index) {
            if (index === 0) return '🥇';
            if (index === 1) return '🥈';
            if (index === 2) return '🥉';
            return '💬';
        }

        function renderComments() {
            if (!currentTopicId) return;
            
            const container = document.getElementById('commentsContainer');
            const topicComments = comments.filter(c => c.topicId === currentTopicId);
            
            const sortedComments = [...topicComments].sort((a, b) => {
                if (currentSort === 'likes') {
                    return b.likes - a.likes;
                } else {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                }
            });

            container.innerHTML = sortedComments.map((comment, index) => {
                const likeKey = `comment_${comment.id}`;
                const isLiked = userLikes[likeKey] || false;
                const rankIcon = currentSort === 'likes' ? getRankIcon(index) : '💬';
                
                return `
                    <div data-comment-id="${comment.id}" class="bg-white rounded-2xl shadow-lg p-6 comment-hover transition-all duration-300">
                        <div class="flex items-start space-x-4">
                            <div class="text-2xl">${rankIcon}</div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center space-x-3">
                                        <div>
                                            <h3 class="font-semibold text-gray-800">${comment.author}</h3>
                                            <p class="text-sm text-gray-500">${formatTime(comment.timestamp)}</p>
                                        </div>
                                        ${comment.isFiltered ? '<span class="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs">🛡️ กรองแล้ว</span>' : ''}
                                    </div>
                                    ${currentSort === 'likes' && index < 3 ? 
                                        `<div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            อันดับ ${index + 1}
                                        </div>` : ''
                                    }
                                </div>
                                <p class="text-gray-700 mb-4 leading-relaxed">${comment.text}</p>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        <button onclick="toggleLike(${comment.id})" 
                                                class="like-btn flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                                    isLiked 
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }">
                                            <span class="text-lg">${isLiked ? '❤️' : '🤍'}</span>
                                            <span class="font-medium">${comment.likes}</span>
                                            <span class="text-sm">ถูกใจ</span>
                                        </button>
                                        <div class="text-sm text-gray-500">
                                            ${comment.likes > 0 ? `มีคน ${comment.likes} คนถูกใจความคิดเห็นนี้` : 'ยังไม่มีคนถูกใจ'}
                                        </div>
                                    </div>
                                    ${isAdmin ? `
                                        <div class="flex items-center space-x-2">
                                            <button onclick="editComment(${comment.id})" 
                                                    class="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm">
                                                <span>✏️</span>
                                                <span>แก้ไข</span>
                                            </button>
                                            <button onclick="deleteComment(${comment.id})" 
                                                    class="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm">
                                                <span>🗑️</span>
                                                <span>ลบ</span>
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Topic Management Functions
        function showAddTopicModal() {
            editingTopicId = null;
            document.getElementById('topicModalTitle').textContent = '📝 เพิ่มหัวข้อใหม่';
            document.getElementById('topicTitle').value = '';
            document.getElementById('topicDescription').value = '';
            document.getElementById('topicVisible').checked = true;
            document.getElementById('topicModal').classList.remove('hidden');
        }

        function editTopic(topicId) {
            const topic = topics.find(t => t.id === topicId);
            if (!topic) return;
            
            editingTopicId = topicId;
            document.getElementById('topicModalTitle').textContent = '✏️ แก้ไขหัวข้อ';
            document.getElementById('topicTitle').value = topic.title;
            document.getElementById('topicDescription').value = topic.description;
            document.getElementById('topicVisible').checked = topic.isVisible;
            document.getElementById('topicModal').classList.remove('hidden');
        }

        function hideTopicModal() {
            document.getElementById('topicModal').classList.add('hidden');
            editingTopicId = null;
        }

        async function saveTopic() {
            const title = document.getElementById('topicTitle').value.trim();
            const description = document.getElementById('topicDescription').value.trim();
            const isVisible = document.getElementById('topicVisible').checked;
            
            if (!title || !description) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ข้อมูลไม่ครบถ้วน',
                    text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            if (title.length > 100) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ชื่อหัวข้อยาวเกินไป',
                    text: 'ชื่อหัวข้อต้องไม่เกิน 100 ตัวอักษร',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            if (description.length > 500) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ คำอธิบายยาวเกินไป',
                    text: 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            try {
                if (editingTopicId) {
                    await saveToDatabase('updateTopic', {
                        id: editingTopicId,
                        title: title,
                        description: description,
                        isVisible: isVisible
                    });
                } else {
                    await saveToDatabase('addTopic', {
                        title: title,
                        description: description,
                        isVisible: isVisible
                    });
                }
                
                hideTopicModal();
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: '✅ บันทึกสำเร็จ!',
                    text: editingTopicId ? 'แก้ไขหัวข้อเรียบร้อยแล้ว' : 'เพิ่มหัวข้อใหม่เรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                
                renderTopics();
                
            } catch (error) {
                // Error already handled in saveToDatabase
            }
        }

        async function toggleTopicVisibility(topicId) {
            const topic = topics.find(t => t.id === topicId);
            if (!topic) return;
            
            try {
                await saveToDatabase('updateTopic', {
                    id: topicId,
                    title: topic.title,
                    description: topic.description,
                    isVisible: !topic.isVisible
                });
                
                renderTopics();
                
            } catch (error) {
                // Error already handled in saveToDatabase
            }
        }

        async function deleteTopic(topicId) {
            const topic = topics.find(t => t.id === topicId);
            if (!topic) return;
            
            const result = await Swal.fire({
                icon: 'warning',
                title: '⚠️ ยืนยันการลบ',
                html: `
                    <div class="text-left">
                        <p class="mb-2">คุณแน่ใจหรือไม่ที่จะลบหัวข้อ:</p>
                        <p class="font-semibold text-red-600 mb-3">"${topic.title}"</p>
                        <p class="text-sm text-gray-600">⚠️ ความคิดเห็นทั้งหมดในหัวข้อนี้จะถูกลบด้วย</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '🗑️ ลบ',
                cancelButtonText: '❌ ยกเลิก',
                confirmButtonColor: '#dc2626',
                customClass: {
                    popup: 'rounded-2xl'
                }
            });
            
            if (result.isConfirmed) {
                try {
                    await saveToDatabase('deleteTopic', { id: topicId });
                    
                    if (currentTopicId === topicId) {
                        backToTopics();
                    }
                    
                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: '✅ ลบสำเร็จ!',
                        text: 'ลบหัวข้อเรียบร้อยแล้ว',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'rounded-2xl'
                        }
                    });
                    
                    renderTopics();
                    
                } catch (error) {
                    // Error already handled in saveToDatabase
                }
            }
        }

        // Admin functions
        function showAdminLogin() {
            document.getElementById('adminLoginModal').classList.remove('hidden');
            document.getElementById('adminUsername').focus();
        }

        function hideAdminLogin() {
            document.getElementById('adminLoginModal').classList.add('hidden');
            document.getElementById('adminUsername').value = '';
            document.getElementById('adminPassword').value = '';
            document.getElementById('loginError').classList.add('hidden');
        }

        function adminLogin() {
            const username = document.getElementById('adminUsername').value.trim();
            const password = document.getElementById('adminPassword').value.trim();
            
            if (!username || !password) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ข้อมูลไม่ครบถ้วน',
                    text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            if (username === 'admin' && password === 'Tle019') {
                isAdmin = true;
                document.getElementById('adminStatus').classList.remove('hidden');
                document.getElementById('adminLoginBtn').classList.add('hidden');
                document.getElementById('adminLogoutBtn').classList.remove('hidden');
                document.getElementById('adminTopicPanel').classList.remove('hidden');
                hideAdminLogin();
                renderTopics();
                renderAdminTopics();
                if (currentTopicId) renderComments();
                
                Swal.fire({
                    icon: 'success',
                    title: '✅ เข้าสู่ระบบสำเร็จ!',
                    text: 'ยินดีต้อนรับผู้ดูแลระบบ',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '❌ เข้าสู่ระบบไม่สำเร็จ',
                    text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
                    confirmButtonText: 'ลองใหม่',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
            }
        }

        async function adminLogout() {
            const result = await Swal.fire({
                icon: 'question',
                title: '🚪 ออกจากระบบ',
                text: 'คุณแน่ใจหรือไม่ที่จะออกจากระบบผู้ดูแล?',
                showCancelButton: true,
                confirmButtonText: '✅ ออกจากระบบ',
                cancelButtonText: '❌ ยกเลิก',
                customClass: {
                    popup: 'rounded-2xl'
                }
            });
            
            if (result.isConfirmed) {
                isAdmin = false;
                document.getElementById('adminStatus').classList.add('hidden');
                document.getElementById('adminLoginBtn').classList.remove('hidden');
                document.getElementById('adminLogoutBtn').classList.add('hidden');
                document.getElementById('adminTopicPanel').classList.add('hidden');
                renderTopics();
                if (currentTopicId) renderComments();
                
                Swal.fire({
                    icon: 'success',
                    title: '✅ ออกจากระบบแล้ว',
                    text: 'ขอบคุณที่ใช้งานระบบ',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
            }
        }

        function editComment(commentId) {
            const comment = comments.find(c => c.id === commentId);
            if (!comment) return;
            
            editingCommentId = commentId;
            document.getElementById('editAuthorName').value = comment.author;
            document.getElementById('editCommentText').value = comment.text;
            document.getElementById('editCommentModal').classList.remove('hidden');
        }

        function hideEditModal() {
            document.getElementById('editCommentModal').classList.add('hidden');
            editingCommentId = null;
        }

        async function saveEditComment() {
            if (!editingCommentId) return;
            
            const newAuthor = document.getElementById('editAuthorName').value.trim();
            const newText = document.getElementById('editCommentText').value.trim();
            
            if (!newAuthor || !newText) {
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ ข้อมูลไม่ครบถ้วน',
                    text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                return;
            }
            
            // Check for profanity in edited content
            const nameViolations = checkProfanity(newAuthor);
            const textViolations = checkProfanity(newText);
            
            let finalAuthor = newAuthor;
            let finalText = newText;
            let isFiltered = false;
            
            if (nameViolations.length > 0 || textViolations.length > 0) {
                const allViolations = [...nameViolations, ...textViolations];
                
                const result = await Swal.fire({
                    icon: 'warning',
                    title: '⚠️ พบคำที่ไม่เหมาะสม',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">พบคำที่ไม่เหมาะสม: <strong class="text-red-600">${allViolations.join(', ')}</strong></p>
                            <p>คุณต้องการให้ระบบกรองคำเหล่านี้เป็น * หรือไม่?</p>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: '✅ กรองคำ',
                    cancelButtonText: '❌ ยกเลิก',
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                
                if (result.isConfirmed) {
                    finalAuthor = filterProfanity(newAuthor);
                    finalText = filterProfanity(newText);
                    isFiltered = true;
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: '📝 แก้ไขข้อความ',
                        text: 'กรุณาแก้ไขข้อความให้เหมาะสมก่อนบันทึก',
                        confirmButtonText: 'ตกลง',
                        customClass: {
                            popup: 'rounded-2xl'
                        }
                    });
                    return;
                }
            }
            
            try {
                await saveToDatabase('updateComment', {
                    id: editingCommentId,
                    author: finalAuthor,
                    text: finalText,
                    isFiltered: isFiltered
                });
                
                hideEditModal();
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: '✅ แก้ไขสำเร็จ!',
                    text: 'แก้ไขความคิดเห็นเรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-2xl'
                    }
                });
                
                renderComments();
                
            } catch (error) {
                // Error already handled in saveToDatabase
            }
        }

        async function deleteComment(commentId) {
            const result = await Swal.fire({
                icon: 'warning',
                title: '⚠️ ยืนยันการลบ',
                text: 'คุณแน่ใจหรือไม่ที่จะลบความคิดเห็นนี้?',
                showCancelButton: true,
                confirmButtonText: '🗑️ ลบ',
                cancelButtonText: '❌ ยกเลิก',
                confirmButtonColor: '#dc2626',
                customClass: {
                    popup: 'rounded-2xl'
                }
            });
            
            if (result.isConfirmed) {
                try {
                    await saveToDatabase('deleteComment', { id: commentId });
                    
                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: '✅ ลบสำเร็จ!',
                        text: 'ลบความคิดเห็นเรียบร้อยแล้ว',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'rounded-2xl'
                        }
                    });
                    
                    renderComments();
                    
                } catch (error) {
                    // Error already handled in saveToDatabase
                }
            }
        }

        // Character counter functions
        function updateCharacterCount() {
            const nameInput = document.getElementById('authorName');
            const commentInput = document.getElementById('commentText');
            const nameCount = document.getElementById('nameCount');
            const commentCount = document.getElementById('commentCount');
            
            if (nameInput && nameCount) {
                nameCount.textContent = nameInput.value.length;
                if (nameInput.value.length > 40) {
                    nameCount.parentElement.classList.add('text-orange-500');
                } else {
                    nameCount.parentElement.classList.remove('text-orange-500');
                }
            }
            
            if (commentInput && commentCount) {
                commentCount.textContent = commentInput.value.length;
                if (commentInput.value.length > 800) {
                    commentCount.parentElement.classList.add('text-orange-500');
                } else {
                    commentCount.parentElement.classList.remove('text-orange-500');
                }
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Hide comment-related sections initially
            document.getElementById('currentTopicDisplay').classList.add('hidden');
            document.getElementById('postForm').classList.add('hidden');
            document.getElementById('sortOptions').classList.add('hidden');
            document.getElementById('commentsContainer').classList.add('hidden');
            
            // Add character counter event listeners
            const nameInput = document.getElementById('authorName');
            const commentInput = document.getElementById('commentText');
            
            if (nameInput) {
                nameInput.addEventListener('input', updateCharacterCount);
                nameInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('commentText').focus();
                    }
                });
            }
            if (commentInput) {
                commentInput.addEventListener('input', updateCharacterCount);
                commentInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        addComment();
                    }
                });
            }
            
            // Load initial data
            loadData();
        });
    