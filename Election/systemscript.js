        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAMY49YYOfOq4vmgV6-0B6Nw0YMbeNDKqY",
            authDomain: "cttc19suratthani.firebaseapp.com",
            databaseURL: "https://cttc19suratthani-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "cttc19suratthani",
            storageBucket: "cttc19suratthani.firebasestorage.app",
            messagingSenderId: "400782042259",
            appId: "1:400782042259:web:b96da29d0d2933568c9966",
            measurementId: "G-2MYZYPM7DJ"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        let currentUser=null,isAdmin=!1,electionOpen=!1,maxCommitteeMembers=3,editingCandidateId=null,editingVoterId=null,resultsChart=null,sortOrder={field:null,ascending:!0},isLoading=!1;

        // Firebase Database Functions
        function saveToFirebase() {
            if (isLoading) return;
            
            try {
                const data = {
                    candidates: candidates,
                    voters: voters,
                    votes: votes,
                    electionOpen: electionOpen,
                    maxCommitteeMembers: maxCommitteeMembers,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP
                };
                
                database.ref('electionSystem').set(data);
                console.log('Data saved to Firebase');
            } catch (error) {
                console.error('Error saving to Firebase:', error);
                showAlert('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
            }
        }

        function loadFromFirebase() {
            isLoading = true;
            showAlert('กำลังโหลดข้อมูล...', 'info');
            
            database.ref('electionSystem').once('value')
                .then((snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        if (Array.isArray(data.candidates)) candidates = data.candidates;
                        if (Array.isArray(data.voters)) voters = data.voters;
                        if (Array.isArray(data.votes)) votes = data.votes;
                        if (typeof data.electionOpen === 'boolean') electionOpen = data.electionOpen;
                        if (typeof data.maxCommitteeMembers === 'number' && data.maxCommitteeMembers > 0) {
                            maxCommitteeMembers = data.maxCommitteeMembers;
                        }

                        // Update UI elements
                        const toggleElement = document.getElementById('electionToggle');
                        const maxCommitteeInput = document.getElementById('maxCommitteeInput');
                        if (toggleElement) toggleElement.checked = electionOpen;
                        if (maxCommitteeInput) maxCommitteeInput.value = maxCommitteeMembers;

                        console.log('Data loaded from Firebase');
                        showAlert('โหลดข้อมูลสำเร็จ', 'success');
                    } else {
                        // Initialize with default data if no data exists
                        initializeDefaultData();
                        showAlert('เริ่มต้นระบบใหม่', 'info');
                    }
                    
                    // Update all UI components
                    updateElectionStatus();
                    updateDashboard();
                    if (isAdmin) {
                        renderCandidatesTable();
                        renderVotersTable();
                        renderResults();
                    }
                    renderVotingCandidates();
                })
                .catch((error) => {
                    console.error('Error loading from Firebase:', error);
                    showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูล กำลังใช้ข้อมูลเริ่มต้น', 'warning');
                    initializeDefaultData();
                })
                .finally(() => {
                    isLoading = false;
                });
        }

        function initializeDefaultData() {
            candidates = [];
            voters = [];
            votes = [];
            electionOpen = false;
            maxCommitteeMembers = 3;
        }

        // Real-time listeners for live updates
        function setupRealtimeListeners() {
            // Listen for election status changes
            database.ref('electionSystem/electionOpen').on('value', (snapshot) => {
                if (!isLoading && snapshot.exists()) {
                    const newStatus = snapshot.val();
                    if (newStatus !== electionOpen) {
                        electionOpen = newStatus;
                        updateElectionStatus();
                        const toggleElement = document.getElementById('electionToggle');
                        if (toggleElement && toggleElement.checked !== electionOpen) {
                            toggleElement.checked = electionOpen;
                        }
                    }
                }
            });

            // Listen for votes changes (for real-time results)
            database.ref('electionSystem/votes').on('value', (snapshot) => {
                if (!isLoading && snapshot.exists()) {
                    const newVotes = snapshot.val();
                    if (JSON.stringify(newVotes) !== JSON.stringify(votes)) {
                        votes = Array.isArray(newVotes) ? newVotes : [];
                        updateVoteCounts();
                        if (isAdmin) {
                            updateDashboard();
                            renderResults();
                            renderVotersTable();
                        }
                    }
                }
            });

            // Listen for candidates changes
            database.ref('electionSystem/candidates').on('value', (snapshot) => {
                if (!isLoading && snapshot.exists()) {
                    const newCandidates = snapshot.val();
                    if (JSON.stringify(newCandidates) !== JSON.stringify(candidates)) {
                        candidates = Array.isArray(newCandidates) ? newCandidates : [];
                        renderVotingCandidates();
                        if (isAdmin) {
                            renderCandidatesTable();
                            updateDashboard();
                            renderResults();
                        }
                    }
                }
            });

            // Listen for voters changes
            database.ref('electionSystem/voters').on('value', (snapshot) => {
                if (!isLoading && snapshot.exists()) {
                    const newVoters = snapshot.val();
                    if (JSON.stringify(newVoters) !== JSON.stringify(voters)) {
                        voters = Array.isArray(newVoters) ? newVoters : [];
                        if (isAdmin) {
                            renderVotersTable();
                            updateDashboard();
                        }
                    }
                }
            });
        }

        function updateVoteCounts() {
            // Reset vote counts
            candidates.forEach(candidate => {
                candidate.votes = 0;
            });

            // Count votes from votes array
            votes.forEach(vote => {
                if (vote.president) {
                    const candidate = candidates.find(c => c.id === vote.president);
                    if (candidate) candidate.votes = (candidate.votes || 0) + 1;
                }
                
                if (vote.committee && Array.isArray(vote.committee)) {
                    vote.committee.forEach(committeeId => {
                        const candidate = candidates.find(c => c.id === committeeId);
                        if (candidate) candidate.votes = (candidate.votes || 0) + 1;
                    });
                }
            });

            // Update voters hasVoted status
            const voterIds = votes.map(vote => vote.voterId);
            voters.forEach(voter => {
                voter.hasVoted = voterIds.includes(voter.id);
            });
        }

        // Connection status monitoring
        function monitorConnection() {
            const connectedRef = database.ref('.info/connected');
            connectedRef.on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    console.log('Connected to Firebase');
                    document.getElementById('connectionStatus')?.remove();
                } else {
                    console.log('Disconnected from Firebase');
                    showConnectionStatus();
                }
            });
        }

        function showConnectionStatus() {
            if (document.getElementById('connectionStatus')) return;
            
            const statusDiv = document.createElement('div');
            statusDiv.id = 'connectionStatus';
            statusDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:white;text-align:center;padding:8px;z-index:1002;font-size:14px;font-weight:600;';
            statusDiv.innerHTML = '⚠️ การเชื่อมต่อขาดหาย - ข้อมูลอาจไม่เป็นปัจจุบัน';
            document.body.appendChild(statusDiv);
        }

        // Global Variables
        let candidates = [];
        let voters = [];
        let votes = [];

        // Utility Functions
        function showAlert(e,t="info"){const n=document.getElementById("alertContainer")||createAlertContainer(),a="alert-"+Date.now(),o={success:"alert-success",error:"alert-error",warning:"alert-warning",info:"alert-info"},r=document.createElement("div");r.id=a,r.className=`alert ${o[t]}`,r.innerHTML=`<div class="flex justify-between items-center"><span>${e}</span><button onclick="removeAlert('${a}')" style="margin-left:8px;font-size:18px;font-weight:bold">&times;</button></div>`,n.appendChild(r),setTimeout(()=>removeAlert(a),5e3)}function createAlertContainer(){const e=document.createElement("div");return e.id="alertContainer",e.style.cssText="position:fixed;top:20px;right:20px;z-index:1001;",document.body.appendChild(e),e}function removeAlert(e){const t=document.getElementById(e);t&&t.remove()}function updateElectionStatus(){const e=document.getElementById("electionStatus");electionOpen?(e.className="status status-open",e.textContent="ระบบเปิด"):(e.className="status status-closed",e.textContent="ระบบปิด")}function updateDashboard(){document.getElementById("totalCandidates").textContent=candidates.length,document.getElementById("totalVoters").textContent=voters.length;const e=voters.filter(e=>e.hasVoted).length;document.getElementById("votedCount").textContent=e;const t=voters.length>0?Math.round(e/voters.length*100):0;document.getElementById("turnoutRate").textContent=t+"%";const n=candidates.filter(e=>"president"===e.position).length,a=candidates.filter(e=>"committee"===e.position).length;document.getElementById("presidentCandidatesCount").textContent=n,document.getElementById("committeeCandidatesCount").textContent=a;const o=voters.length-e;document.getElementById("remainingVoters").textContent=o;const r=candidates.reduce((e,t)=>e+(t.votes||0),0);document.getElementById("totalVotesCount").textContent=r;const s=votes.filter(e=>e.abstainPresident).length,i=votes.filter(e=>e.abstainCommittee).length;document.getElementById("abstainCount").textContent=s+i;const c=document.getElementById("dashboardElectionStatus");electionOpen?(c.className="status status-open",c.textContent="เปิดรับคะแนน"):(c.className="status status-closed",c.textContent="ปิดระบบ"),document.getElementById("dashboardMaxCommittee").textContent=maxCommitteeMembers,document.getElementById("lastUpdateTime").textContent=(new Date).toLocaleString("th-TH"),updateTopCandidates()}function updateTopCandidates(){const e=document.getElementById("topCandidates"),t=[...candidates].filter(e=>(e.votes||0)>0).sort((e,t)=>(t.votes||0)-(e.votes||0)).slice(0,3);if(0===t.length)return void(e.innerHTML='<p style="color:#6b7280;font-size:12px">ยังไม่มีคะแนนเสียง</p>');e.innerHTML=t.map((e,t)=>{const n=["🥇","🥈","🥉"],a=["text-yellow","#6b7280","#ea580c"];return`<div class="flex justify-between items-center p-4" style="background:white;border-radius:8px;border:1px solid #e5e7eb"><div class="flex items-center space-x-2"><span style="font-size:20px">${n[t]||"🏅"}</span><div><div class="font-bold">${e.name}</div><div class="text-sm" style="color:#6b7280">${"president"===e.position?"🏆 ประธาน":"👥 กรรมการ"}</div></div></div><div class="text-right"><div class="font-bold" style="color:${a[t]}">${e.votes||0}</div><div class="text-sm" style="color:#6b7280">คะแนน</div></div></div>`}).join("")}document.getElementById("loginBtn").addEventListener("click",()=>{isAdmin?logout():document.getElementById("loginModal").classList.add("show")}),document.getElementById("adminLoginBtn").addEventListener("click",()=>{const e=document.getElementById("adminUsername").value,t=document.getElementById("adminPassword").value;"admin"===e&&"Tle019"===t?(isAdmin=!0,currentUser="admin",document.getElementById("loginModal").classList.remove("show"),document.getElementById("voterInterface").classList.add("hidden"),document.getElementById("adminInterface").classList.remove("hidden"),document.getElementById("loginBtn").textContent="ออกจากระบบ",showAlert("เข้าสู่ระบบผู้ดูแลสำเร็จ","success"),updateDashboard(),renderCandidatesTable(),renderVotersTable(),renderResults()):showAlert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง","error"),document.getElementById("adminUsername").value="",document.getElementById("adminPassword").value=""}),document.getElementById("cancelLoginBtn").addEventListener("click",()=>{document.getElementById("loginModal").classList.remove("show"),document.getElementById("adminUsername").value="",document.getElementById("adminPassword").value=""});function logout(){isAdmin=!1,currentUser=null,document.getElementById("adminInterface").classList.add("hidden"),document.getElementById("voterInterface").classList.remove("hidden"),document.getElementById("loginBtn").textContent="เข้าสู่ระบบ",showAlert("ออกจากระบบแล้ว","info"),resetVoterInterface()}document.getElementById("authForm").addEventListener("submit",e=>{if(e.preventDefault(),!electionOpen)return void showAlert("ระบบเลือกตั้งยังไม่เปิด","warning");const t=document.getElementById("memberNumber").value.trim(),n=document.getElementById("nationalId").value.trim();if(!t||!n)return void showAlert("กรุณากรอกข้อมูลให้ครบถ้วน","warning");const a=voters.find(e=>e.memberNumber===t&&e.nationalId===n);return a?a.hasVoted?void showAlert("คุณได้ลงคะแนนเสียงแล้ว","warning"):(currentUser=a,document.getElementById("authForm").classList.add("hidden"),document.getElementById("votingForm").classList.remove("hidden"),document.getElementById("maxCommitteeCount").textContent=maxCommitteeMembers,renderVotingCandidates(),void showAlert("ยืนยันตัวตนสำเร็จ","success")):void showAlert("ไม่พบข้อมูลผู้มีสิทธิ์ลงคะแนน","error")});function renderVotingCandidates(){const e=document.getElementById("presidentCandidates"),t=document.getElementById("committeeCandidates");e.innerHTML="",t.innerHTML="",[...candidates].sort((e,t)=>(e.number||0)-(t.number||0)).forEach(n=>{const a=createCandidateCard(n);"president"===n.position?e.appendChild(a):t.appendChild(a)}),updateVotingStatus()}function createCandidateCard(e){const t=document.createElement("div");t.className="candidate-card";const n="president"===e.position?"radio":"checkbox",a="president"===e.position?"president":"committee";return t.innerHTML=`<label class="flex items-center" style="cursor:pointer"><input type="${n}" name="${a}" value="${e.id}" class="${n}" style="margin-right:16px"><div class="candidate-info"><div class="candidate-number">${e.number||"N/A"}</div>${e.image?`<img src="${e.image}" alt="${e.name}" class="candidate-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="candidate-avatar" style="display:none">👤</div>`:'<div class="candidate-avatar">👤</div>'}<div class="candidate-details"><h4>${e.name}</h4><p>หมายเลข ${e.number||"ไม่ระบุ"}</p><p style="color:#4f46e5;font-weight:600">${"president"===e.position?"🏆 ตำแหน่งประธาน":"👥 ตำแหน่งกรรมการ"}</p></div></div></label>`,t}function updateVotingStatus(){const e=document.querySelector('input[name="president"]:checked'),t=document.querySelectorAll('input[name="committee"]:checked'),n=document.getElementById("abstainPresident").checked,a=document.getElementById("abstainCommittee").checked,o=document.getElementById("submitVoteBtn");let r="✅ ส่งคะแนนเสียง";(e||t.length>0||n||a)&&(r=`✅ ส่งคะแนนเสียง (${(e?1:0)+t.length+(n?1:0)+(a?1:0)} รายการ)`),o.innerHTML=r}document.getElementById("abstainPresident").addEventListener("change",e=>{const t=e.target.checked;document.querySelectorAll('input[name="president"]').forEach(e=>{e.disabled=t,t&&(e.checked=!1);const n=e.closest(".candidate-card");n&&(n.style.opacity=t?"0.5":"1")}),updateVotingStatus()}),document.getElementById("abstainCommittee").addEventListener("change",e=>{const t=e.target.checked;document.querySelectorAll('input[name="committee"]').forEach(e=>{e.disabled=t,t&&(e.checked=!1);const n=e.closest(".candidate-card");n&&(n.style.opacity=t?"0.5":"1")}),updateVotingStatus()}),document.addEventListener("change",e=>{"committee"===e.target.name?(document.querySelectorAll('input[name="committee"]:checked').length>maxCommitteeMembers&&(e.target.checked=!1,showAlert(`เลือกกรรมการได้สูงสุด ${maxCommitteeMembers} คน`,"warning")),updateVotingStatus()):"president"===e.target.name&&updateVotingStatus()}),document.getElementById("submitVoteBtn").addEventListener("click",()=>{const e=document.getElementById("abstainPresident").checked,t=document.getElementById("abstainCommittee").checked,n=document.querySelector('input[name="president"]:checked'),a=Array.from(document.querySelectorAll('input[name="committee"]:checked')),o=candidates.filter(e=>"president"===e.position),r=candidates.filter(e=>"committee"===e.position);if(o.length>0&&!n&&!e)return void showAlert("⚠️ กรุณาเลือกประธานกรรมการหรือเลือกงดออกเสียง","warning");if(r.length>0&&0===a.length&&!t)return void showAlert("⚠️ กรุณาเลือกกรรมการหรือเลือกงดออกเสียง","warning");if(!n&&0===a.length&&!e&&!t)return void showAlert("❌ กรุณาเลือกผู้สมัครหรือเลือกงดออกเสียง","warning");const s={president:n?parseInt(n.value):null,committee:a.map(e=>parseInt(e.value)),abstainPresident:e,abstainCommittee:t};showVoteConfirmation(s)});function showVoteConfirmation(e){const t=document.getElementById("confirmPresidentSelection");if(e.abstainPresident)t.innerHTML='<div class="flex items-center space-x-2"><span style="font-size:24px">🚫</span><span class="font-bold text-red">งดออกเสียง</span></div>';else if(e.president){const n=candidates.find(t=>t.id===e.president);t.innerHTML=`<div class="flex items-center space-x-2 p-4" style="background:white;border-radius:8px;border:1px solid #f59e0b"><div class="candidate-number">${n.number||"N/A"}</div><div class="flex-1"><div class="font-bold">${n.name}</div><div class="text-sm" style="color:#6b7280">หมายเลข ${n.number||"ไม่ระบุ"}</div></div><span style="font-size:24px">✅</span></div>`}else t.innerHTML='<div class="flex items-center space-x-2"><span style="font-size:24px">➖</span><span style="color:#6b7280">ไม่ได้เลือก</span></div>';const n=document.getElementById("confirmCommitteeSelection");if(e.abstainCommittee)n.innerHTML='<div class="flex items-center space-x-2"><span style="font-size:24px">🚫</span><span class="font-bold text-red">งดออกเสียง</span></div>';else if(e.committee&&e.committee.length>0){const t=e.committee.map(e=>{const t=candidates.find(t=>t.id===e);return`<div class="flex items-center space-x-2 p-4 mb-2" style="background:white;border-radius:8px;border:1px solid #059669"><div class="candidate-number">${t.number||"N/A"}</div><div class="flex-1"><div class="font-bold">${t.name}</div><div class="text-sm" style="color:#6b7280">หมายเลข ${t.number||"ไม่ระบุ"}</div></div><span style="font-size:24px">✅</span></div>`}).join("");n.innerHTML=t}else n.innerHTML='<div class="flex items-center space-x-2"><span style="font-size:24px">➖</span><span style="color:#6b7280">ไม่ได้เลือก</span></div>';document.getElementById("voteConfirmationModal").classList.add("show"),window.pendingVoteData=e}document.getElementById("confirmVoteBtn").addEventListener("click",()=>{window.pendingVoteData&&(document.getElementById("voteConfirmationModal").classList.remove("show"),submitVote(window.pendingVoteData),window.pendingVoteData=null)}),document.getElementById("cancelVoteBtn").addEventListener("click",()=>{document.getElementById("voteConfirmationModal").classList.remove("show"),window.pendingVoteData=null});function submitVote(e){try{if(!currentUser||!currentUser.id)return void showAlert("เกิดข้อผิดพลาดในการยืนยันตัวตน","error");if(currentUser.hasVoted)return void showAlert("คุณได้ลงคะแนนเสียงแล้ว","warning");if(votes.push({voterId:currentUser.id,...e,timestamp:new Date}),e.president){const t=candidates.find(t=>t.id===e.president);t&&(t.votes=(t.votes||0)+1)}e.committee&&Array.isArray(e.committee)&&e.committee.forEach(e=>{const t=candidates.find(t=>t.id===e);t&&(t.votes=(t.votes||0)+1)});const t=voters.find(e=>e.id===currentUser.id);t&&(t.hasVoted=!0),currentUser.hasVoted=!0,document.getElementById("votingForm").classList.add("hidden"),document.getElementById("voteSuccess").classList.remove("hidden"),showAlert("ลงคะแนนเสียงสำเร็จ","success"),isAdmin&&(updateDashboard(),renderResults(),renderVotersTable()),saveData(),setTimeout(()=>{resetVoterInterface(),currentUser=null},3e3)}catch(e){console.error("Error submitting vote:",e),showAlert("เกิดข้อผิดพลาดในการลงคะแนน กรุณาลองใหม่","error")}}function resetVoterInterface(){document.getElementById("authForm").classList.remove("hidden"),document.getElementById("votingForm").classList.add("hidden"),document.getElementById("voteSuccess").classList.add("hidden"),document.getElementById("memberNumber").value="",document.getElementById("nationalId").value="",document.getElementById("abstainPresident").checked=!1,document.getElementById("abstainCommittee").checked=!1,document.querySelectorAll('input[name="president"], input[name="committee"]').forEach(e=>{e.checked=!1,e.disabled=!1;const t=e.closest(".candidate-card");t&&(t.style.opacity="1")});const e=document.getElementById("submitVoteBtn");e&&(e.innerHTML="✅ ส่งคะแนนเสียง")}function showTab(e){document.querySelectorAll(".tab-btn").forEach(e=>{e.classList.remove("active")}),document.querySelector(`[data-tab="${e}"]`).classList.add("active"),document.querySelectorAll(".tab-content").forEach(e=>{e.classList.remove("active")}),document.getElementById(e+"Tab").classList.add("active"),"results"===e&&renderResults()}document.querySelectorAll(".tab-btn").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.tab;showTab(t)})}),document.getElementById("addCandidateBtn").addEventListener("click",()=>{editingCandidateId=null,document.getElementById("candidateModalTitle").textContent="เพิ่มผู้สมัคร",document.getElementById("candidateNumber").value="",document.getElementById("candidateName").value="",document.getElementById("candidatePosition").value="",document.getElementById("candidateImage").value="",document.getElementById("candidateModal").classList.add("show")}),document.getElementById("saveCandidateBtn").addEventListener("click",()=>{const e=parseInt(document.getElementById("candidateNumber").value),t=document.getElementById("candidateName").value.trim(),n=document.getElementById("candidatePosition").value,a=document.getElementById("candidateImage").value.trim();if(!e||!t||!n)return void showAlert("กรุณากรอกข้อมูลที่จำเป็น","warning");if(candidates.find(t=>t.number===e&&t.id!==editingCandidateId))return void showAlert("หมายเลขผู้สมัครซ้ำ กรุณาเลือกหมายเลขอื่น","error");if(editingCandidateId){const o=candidates.find(e=>e.id===editingCandidateId);o&&(o.number=e,o.name=t,o.position=n,o.image=a,showAlert("แก้ไขข้อมูลผู้สมัครสำเร็จ","success"))}else{const o=Math.max(...candidates.map(e=>e.id),0)+1;candidates.push({id:o,number:e,name:t,position:n,image:a,votes:0}),showAlert("เพิ่มผู้สมัครสำเร็จ","success")}document.getElementById("candidateModal").classList.remove("show"),renderCandidatesTable(),updateDashboard(),saveData()}),document.getElementById("cancelCandidateBtn").addEventListener("click",()=>{document.getElementById("candidateModal").classList.remove("show")});function renderCandidatesTable(){const e=document.getElementById("candidatesTable");e.innerHTML="",[...candidates].sort((e,t)=>(e.number||0)-(t.number||0)).forEach(t=>{const n=document.createElement("tr");n.innerHTML=`<td><div class="candidate-number">${t.number||"N/A"}</div></td><td>${t.image?`<img src="${t.image}" alt="${t.name}" class="candidate-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="candidate-avatar" style="display:none">👤</div>`:'<div class="candidate-avatar">👤</div>'}</td><td><div class="font-bold">${t.name}</div><div class="text-sm" style="color:#6b7280">หมายเลข ${t.number||"ไม่ระบุ"}</div></td><td><span style="padding:4px 12px;font-size:12px;font-weight:600;border-radius:20px;${t.position==="president"?"background:#fef3c7;color:#d97706":"background:#dbeafe;color:#2563eb"}">${t.position==="president"?"🏆 ประธานกรรมการ":"👥 กรรมการ"}</span></td><td><button onclick="editCandidate(${t.id})" class="btn" style="background:#dbeafe;color:#2563eb;padding:4px 12px;font-size:12px;margin-right:8px">✏️ แก้ไข</button><button onclick="deleteCandidate(${t.id})" class="btn" style="background:#fee2e2;color:#dc2626;padding:4px 12px;font-size:12px">🗑️ ลบ</button></td>`,e.appendChild(n)})}function editCandidate(e){const t=candidates.find(t=>t.id===e);t&&(editingCandidateId=e,document.getElementById("candidateModalTitle").textContent="แก้ไขผู้สมัคร",document.getElementById("candidateNumber").value=t.number,document.getElementById("candidateName").value=t.name,document.getElementById("candidatePosition").value=t.position,document.getElementById("candidateImage").value=t.image,document.getElementById("candidateModal").classList.add("show"))}function deleteCandidate(e){const candidate=candidates.find(c=>c.id===e);if(!candidate)return;showDeleteConfirmation(`คุณต้องการลบผู้สมัคร "${candidate.name}" หรือไม่?`,`หมายเลข ${candidate.number||"ไม่ระบุ"} - ${candidate.position==="president"?"ประธานกรรมการ":"กรรมการ"}`,()=>{candidates=candidates.filter(t=>t.id!==e);renderCandidatesTable();updateDashboard();saveData();showAlert("ลบผู้สมัครสำเร็จ","success")})}document.getElementById("addVoterBtn").addEventListener("click",()=>{editingVoterId=null,document.getElementById("voterModalTitle").textContent="เพิ่มผู้มีสิทธิ์",document.getElementById("voterMemberNumber").value="",document.getElementById("voterNationalId").value="",document.getElementById("voterName").value="",document.getElementById("voterModal").classList.add("show")}),document.getElementById("saveVoterBtn").addEventListener("click",()=>{const e=document.getElementById("voterMemberNumber").value.trim(),t=document.getElementById("voterNationalId").value.trim(),n=document.getElementById("voterName").value.trim();if(!e||!t)return void showAlert("กรุณากรอกข้อมูลที่จำเป็น","warning");if(13!==t.length)return void showAlert("เลขบัตรประจำตัวประชาชนต้องมี 13 หลัก","warning");if(voters.find(n=>n.memberNumber===e||n.nationalId===t&&n.id!==editingVoterId))return void showAlert("หมายเลขสมาชิกหรือเลขบัตรประจำตัวประชาชนซ้ำ","error");if(editingVoterId){const a=voters.find(e=>e.id===editingVoterId);a&&(a.memberNumber=e,a.nationalId=t,a.name=n,showAlert("แก้ไขข้อมูลผู้มีสิทธิ์สำเร็จ","success"))}else{const a=Math.max(...voters.map(e=>e.id),0)+1;voters.push({id:a,memberNumber:e,nationalId:t,name:n,hasVoted:!1}),showAlert("เพิ่มผู้มีสิทธิ์สำเร็จ","success")}document.getElementById("voterModal").classList.remove("show"),renderVotersTable(),updateDashboard(),saveData()}),document.getElementById("cancelVoterBtn").addEventListener("click",()=>{document.getElementById("voterModal").classList.remove("show")});function renderVotersTable(){const e=document.getElementById("votersTable");e.innerHTML="",voters.forEach(t=>{const n=document.createElement("tr");n.innerHTML=`<td class="font-bold">${t.memberNumber}</td><td>${t.name||"-"}</td><td><span style="padding:4px 8px;font-size:12px;font-weight:600;border-radius:20px;${t.hasVoted?"background:#d1fae5;color:#065f46":"background:#f3f4f6;color:#374151"}">${t.hasVoted?"ลงคะแนนแล้ว":"ยังไม่ลงคะแนน"}</span></td><td><button onclick="editVoter(${t.id})" style="color:#2563eb;margin-right:12px;background:none;border:none;cursor:pointer">แก้ไข</button><button onclick="deleteVoter(${t.id})" style="color:#dc2626;background:none;border:none;cursor:pointer">ลบ</button></td>`,e.appendChild(n)})}function editVoter(e){const t=voters.find(t=>t.id===e);t&&(editingVoterId=e,document.getElementById("voterModalTitle").textContent="แก้ไขผู้มีสิทธิ์",document.getElementById("voterMemberNumber").value=t.memberNumber,document.getElementById("voterNationalId").value=t.nationalId,document.getElementById("voterName").value=t.name,document.getElementById("voterModal").classList.add("show"))}function deleteVoter(e){const voter=voters.find(v=>v.id===e);if(!voter)return;showDeleteConfirmation(`คุณต้องการลบผู้มีสิทธิ์ "${voter.name||voter.memberNumber}" หรือไม่?`,`หมายเลขสมาชิก: ${voter.memberNumber} - ${voter.hasVoted?"ลงคะแนนแล้ว":"ยังไม่ลงคะแนน"}`,()=>{voters=voters.filter(t=>t.id!==e);renderVotersTable();updateDashboard();saveData();showAlert("ลบผู้มีสิทธิ์สำเร็จ","success")})}function sortResults(e){"field"===sortOrder.field?sortOrder.ascending=!sortOrder.ascending:(sortOrder.field=e,sortOrder.ascending=!0),renderResults()}function renderResults(){const e=document.getElementById("resultsTable");e.innerHTML="";const t=document.getElementById("positionFilter").value;let n=[...candidates];"all"!==t&&(n=candidates.filter(e=>e.position===t)),"name"===sortOrder.field?n.sort((e,t)=>{const n=e.name.localeCompare(t.name,"th");return sortOrder.ascending?n:-n}):"votes"===sortOrder.field?n.sort((e,t)=>{const n=(e.votes||0)-(t.votes||0);return sortOrder.ascending?n:-n}):n.sort((e,t)=>(t.votes||0)-(e.votes||0));const a=getWinner("president"),o=getWinners("committee");n.forEach((t,n)=>{const r="president"===t.position&&a&&t.id===a.id||"committee"===t.position&&o.some(e=>e.id===t.id),s=document.createElement("tr");s.className=r?"bg-yellow":"",s.innerHTML=`<td><div style="width:32px;height:32px;background:#f3f4f6;color:#6b7280;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${n+1}</div></td><td><div class="flex items-center space-x-2"><div class="candidate-number" style="width:32px;height:32px;font-size:12px">${t.number||"N/A"}</div><div><div class="font-bold">${t.name}</div><div class="text-sm" style="color:#6b7280">หมายเลข ${t.number||"ไม่ระบุ"}</div></div></div></td><td><span style="padding:4px 12px;font-size:12px;font-weight:600;border-radius:20px;${t.position==="president"?"background:#fef3c7;color:#d97706":"background:#dbeafe;color:#2563eb"}">${t.position==="president"?"🏆 ประธานกรรมการ":"👥 กรรมการ"}</span></td><td><span class="text-xl font-bold" style="color:${r?"#d97706":"#2563eb"}">${t.votes||0}</span></td><td>${r?'<span style="padding:4px 12px;font-size:12px;font-weight:600;border-radius:20px;background:#fef3c7;color:#d97706">🏆 ได้รับเลือก</span>':'<span style="padding:2px 8px;font-size:10px;font-weight:600;border-radius:20px;background:#f3f4f6;color:#6b7280">-</span>'}</td>`,e.appendChild(s)}),updateWinnerSummary(),updateVotingStatistics(),updateResultsChart()}function getWinner(e){const t=candidates.filter(t=>t.position===e);return 0===t.length?null:t.reduce((e,t)=>(t.votes||0)>(e.votes||0)?t:e)}function getWinners(e){const t=candidates.filter(t=>t.position===e);return 0===t.length?[]:t.sort((e,t)=>(t.votes||0)-(e.votes||0)).slice(0,maxCommitteeMembers).filter(e=>(e.votes||0)>0)}function updateWinnerSummary(){const e=document.getElementById("winnerSummary"),t=getWinner("president"),n=getWinners("committee");let a="";t&&t.votes>0&&(a+=`<div class="flex justify-between items-center p-4" style="background:white;border-radius:8px;border:1px solid #f59e0b"><div class="flex items-center space-x-2"><span style="font-size:24px">🏆</span><div><div class="font-bold">ประธานกรรมการ</div><div class="text-sm" style="color:#6b7280">${t.name} (${t.votes} คะแนน)</div></div></div></div>`),n.length>0&&(a+=`<div class="p-4" style="background:white;border-radius:8px;border:1px solid #f59e0b"><div class="flex items-center space-x-2 mb-2"><span style="font-size:24px">👥</span><div class="font-bold">กรรมการ</div></div><div class="space-y-2">${n.map((e,t)=>`<div class="text-sm" style="color:#6b7280">${t+1}. ${e.name} (${e.votes} คะแนน)</div>`).join("")}</div></div>`),a||(a='<p style="color:#6b7280;font-size:12px">ยังไม่มีผู้ได้รับเลือก</p>'),e.innerHTML=a}function updateVotingStatistics(){const e=candidates.filter(e=>"president"===e.position).reduce((e,t)=>e+(t.votes||0),0),t=candidates.filter(e=>"committee"===e.position).reduce((e,t)=>e+(t.votes||0),0),n=votes.filter(e=>e.abstainPresident).length,a=votes.filter(e=>e.abstainCommittee).length;document.getElementById("totalPresidentVotes").textContent=e,document.getElementById("totalCommitteeVotes").textContent=t,document.getElementById("abstainPresidentVotes").textContent=n,document.getElementById("abstainCommitteeVotes").textContent=a}function exportResults(){try{const e=new Date,t=e.toLocaleString("th-TH"),n=getWinner("president"),a=getWinners("committee");let o="ufeff";o+="รายงานผลการเลือกตั้งกรรมการสหกรณ์\n",o+=`วันที่ออกรายงาน: ${t}\n\n`,o+="สรุปผลการเลือกตั้ง\n",o+="ตำแหน่ง,ชื่อผู้ได้รับเลือก,คะแนนที่ได้รับ\n",n&&n.votes>0&&(o+=`ประธานกรรมการ,"${n.name}",${n.votes}\n`),a.forEach((e,t)=>{o+=`กรรมการคนที่ ${t+1},"${e.name}",${e.votes}\n`}),o+="\n",o+="รายละเอียดผลคะแนนทั้งหมด\n",o+="หมายเลข,ชื่อผู้สมัคร,ตำแหน่ง,คะแนนที่ได้รับ,สถานะ\n",[...candidates].sort((e,t)=>(t.votes||0)-(e.votes||0)).forEach(e=>{const t="president"===e.position&&n&&e.id===n.id||"committee"===e.position&&a.some(t=>t.id===e.id),r="president"===e.position?"ประธานกรรมการ":"กรรมการ",s=t?"ได้รับเลือก":"-";o+=`${e.number||"ไม่ระบุ"},"${e.name}","${r}",${e.votes||0},"${s}"\n`}),o+="\n",o+="สถิติการลงคะแนน\n",o+="รายการ,จำนวน\n",o+=`ผู้มีสิทธิ์ลงคะแนนทั้งหมด,${voters.length}\n`,o+=`ผู้ลงคะแนนแล้ว,${voters.filter(e=>e.hasVoted).length}\n`,o+=`อัตราการลงคะแนน,${voters.length>0?Math.round(voters.filter(e=>e.hasVoted).length/voters.length*100):0}%\n`,o+=`คะแนนรวมประธาน,${candidates.filter(e=>"president"===e.position).reduce((e,t)=>e+(t.votes||0),0)}\n`,o+=`คะแนนรวมกรรมการ,${candidates.filter(e=>"committee"===e.position).reduce((e,t)=>e+(t.votes||0),0)}\n`,o+=`งดออกเสียงประธาน,${votes.filter(e=>e.abstainPresident).length}\n`,o+=`งดออกเสียงกรรมการ,${votes.filter(e=>e.abstainCommittee).length}\n`;const r=new Blob([o],{type:"text/csv;charset=utf-8;"}),s=document.createElement("a"),i=URL.createObjectURL(r);s.setAttribute("href",i),s.setAttribute("download",`ผลการเลือกตั้ง_${e.getFullYear()}-${(e.getMonth()+1).toString().padStart(2,"0")}-${e.getDate().toString().padStart(2,"0")}.csv`),s.style.visibility="hidden",document.body.appendChild(s),s.click(),document.body.removeChild(s),showAlert("ส่งออกผลคะแนนสำเร็จ","success")}catch(e){console.error("Export error:",e),showAlert("เกิดข้อผิดพลาดในการส่งออกข้อมูล","error")}}function updateResultsChart(){const e=document.getElementById("resultsChart");if(!e)return;const t=e.getContext("2d");resultsChart&&resultsChart.destroy();const n=[...candidates].sort((e,t)=>(e.number||0)-(t.number||0));if(0===n.length)return t.fillStyle="#9CA3AF",t.font="16px sans-serif",t.textAlign="center",void t.fillText("ยังไม่มีข้อมูลผู้สมัคร",t.canvas.width/2,t.canvas.height/2);const a=n.map(e=>{const t=e.name.length>12?e.name.substring(0,12)+"...":e.name;return`${e.number||"N/A"}. ${t}`}),o=n.map(e=>e.votes||0),r=n.map(e=>"president"===e.position?"#F59E0B":"#3B82F6");resultsChart=createChart(t,a,o,r)}function createChart(e,t,n,a){const o=e.canvas,r=o.width,s=o.height,i=Math.max(...n),c=60,d=40,l=30,u=30,m=r-c-u,g=s-d-l,f=m/t.length,h=i>0?g/i:0;e.clearRect(0,0,r,s),e.fillStyle="#f3f4f6",e.fillRect(0,0,r,s),e.strokeStyle="#e5e7eb",e.lineWidth=1;for(let t=0;t<=5;t++){const n=d+t*g/5;e.beginPath(),e.moveTo(c,n),e.lineTo(c+m,n),e.stroke()}e.fillStyle="#374151",e.font="12px sans-serif",e.textAlign="right";for(let t=0;t<=5;t++){const n=Math.round(i*(5-t)/5),a=d+t*g/5;e.fillText(n.toString(),c-5,a+4)}n.forEach((o,r)=>{const s=c+r*f+f/4,i=d+g-o*h,u=f/2,p=o*h;e.fillStyle=a[r]+"80",e.fillRect(s,i,u,p),e.strokeStyle=a[r],e.lineWidth=2,e.strokeRect(s,i,u,p),e.fillStyle="#374151",e.font="10px sans-serif",e.textAlign="center";const v=t[r];e.save(),e.translate(s+u/2,d+g+15),e.rotate(-Math.PI/4),e.fillText(v,-v.length*2,0),e.restore(),o>0&&(e.fillStyle="#374151",e.font="bold 12px sans-serif",e.textAlign="center",e.fillText(o.toString(),s+u/2,i-5))}),e.fillStyle="#374151",e.font="bold 14px sans-serif",e.textAlign="center",e.fillText("จำนวนคะแนน",c/2,s/2),e.save(),e.translate(r/2,s-5),e.fillText("ผู้สมัคร",0,0),e.restore()}document.getElementById("voterNationalId").addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").substring(0,13)}),document.getElementById("nationalId").addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").substring(0,13)}),document.getElementById("positionFilter").addEventListener("change",()=>{renderResults()}),document.addEventListener("click",e=>{e.target.classList.contains("modal")&&e.target.classList.remove("show")}),document.addEventListener("keydown",e=>{"Escape"===e.key&&document.querySelectorAll(".modal.show").forEach(e=>{e.classList.remove("show")})}),document.addEventListener("DOMContentLoaded",(function(){
            loadFromFirebase();
            setupRealtimeListeners();
            monitorConnection();
        }));
        
        if (document.readyState !== 'loading') {
            loadFromFirebase();
            setupRealtimeListeners();
            monitorConnection();
        }

        // Delete Confirmation Functions
        function showDeleteConfirmation(message, details, onConfirm) {
            document.getElementById('deleteConfirmationMessage').textContent = message;
            document.getElementById('deleteConfirmationDetails').textContent = details;
            document.getElementById('deleteConfirmationModal').classList.add('show');
            
            // Store the callback function
            window.pendingDeleteAction = onConfirm;
        }

        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            if (window.pendingDeleteAction) {
                window.pendingDeleteAction();
                window.pendingDeleteAction = null;
            }
            document.getElementById('deleteConfirmationModal').classList.remove('show');
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            window.pendingDeleteAction = null;
            document.getElementById('deleteConfirmationModal').classList.remove('show');
        });

        function saveData(){
            saveToFirebase();
        }document.getElementById("electionToggle").addEventListener("change",e=>{electionOpen=e.target.checked,updateElectionStatus(),saveData(),showAlert(electionOpen?"เปิดระบบเลือกตั้งแล้ว":"ปิดระบบเลือกตั้งแล้ว","info")}),document.getElementById("updateMaxCommittee").addEventListener("click",()=>{const e=parseInt(document.getElementById("maxCommitteeInput").value);e>=1&&e<=10?(maxCommitteeMembers=e,document.getElementById("maxCommitteeCount").textContent=maxCommitteeMembers,saveData(),showAlert(`อัปเดตจำนวนกรรมการสูงสุดเป็น ${maxCommitteeMembers} คน`,"success")):showAlert("จำนวนกรรมการต้องอยู่ระหว่าง 1-10 คน","warning")});const style=document.createElement("style");style.textContent=`#electionToggle:checked + .toggle-slider{background:#4f46e5}#electionToggle:checked + .toggle-slider:before{transform:translateX(20px)}.toggle-slider:before{content:"";position:absolute;height:20px;width:20px;left:2px;top:2px;background:white;border-radius:50%;transition:0.4s}`,document.head.appendChild(style);
    