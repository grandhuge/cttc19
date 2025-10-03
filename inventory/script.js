        // ---!!! สำคัญมาก !!!---
        // ให้นำ URL ของ Web App ที่ได้จากการ Deploy (New deployment) ล่าสุด
        // มาวางแทนที่ "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL" ด้านล่างนี้
        // คุณต้องทำขั้นตอนนี้ใหม่ทุกครั้งที่มีการแก้ไขโค้ด Code.gs
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-OGkkjOeELI1mWcnQL4arYcB9wbLcy4PuiksO_l1JMuCd-_2I1OQTkEBNdnCoUGDb-A/exec";
        
        let inventoryData = [];
        let inventoryChart = null;
        let currentPage = 1;
        const itemsPerPage = 400; // จำนวนการ์ดต่อหน้า
        let currentFilters = { status: 'all', searchTerm: '' };
        let isLoggedIn = false;

        const themes = [
            { name: 'Default', color1: '#1E9AFE', color2: '#60DFCD', shadow: 'rgba(30, 154, 254, 0.5)' },
            { name: 'Mint', color1: '#3EADCF', color2: '#ABE9CD', shadow: 'rgba(62, 173, 207, 0.5)' },
            { name: 'Orchid', color1: '#B58ECC', color2: '#5DE6DE', shadow: 'rgba(181, 142, 204, 0.5)' },
            { name: 'Sunset', color1: '#7EE8FA', color2: '#EEC0C6', shadow: 'rgba(126, 232, 250, 0.5)' },
            { name: 'Grape', color1: '#0652C5', color2: '#D4418E', shadow: 'rgba(6, 82, 197, 0.5)' },
            { name: 'Vaporwave', color1: '#B621FE', color2: '#1FD1F9', shadow: 'rgba(182, 33, 254, 0.5)' },
        ];

        document.addEventListener('DOMContentLoaded', () => {
            // ตรวจสอบว่าได้เปลี่ยน URL แล้วหรือยัง
            if (SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
                Swal.fire({
                    icon: 'error',
                    title: 'ตั้งค่าไม่สมบูรณ์',
                    text: 'กรุณาใส่ Web App URL ของคุณในไฟล์ index.html',
                    footer: 'คุณจะได้รับ URL นี้หลังจากทำการ Deploy (New deployment) ใน Google Apps Script'
                });
                return;
            }

            fetchData();
            document.getElementById('inventory-form').addEventListener('submit', handleFormSubmit);
            document.getElementById('closeModal').addEventListener('click', closeDetailsModal);
            
            document.getElementById('image').addEventListener('change', function(event) {
                const [file] = event.target.files;
                const preview = document.getElementById('image-preview');
                if (file) {
                    preview.src = URL.createObjectURL(file);
                    preview.classList.remove('hidden');
                } else {
                    preview.classList.add('hidden');
                }
            });

            // Add event listeners for filter controls
            document.getElementById('searchInput').addEventListener('input', (e) => {
                currentPage = 1;
                currentFilters.searchTerm = e.target.value;
                filterAndRender();
            });

            document.getElementById('statusFilter').addEventListener('change', (e) => {
                currentPage = 1;
                currentFilters.status = e.target.value;
                filterAndRender();
            });
            
            // --- THEME CHANGER LOGIC ---
            const themeMenuButton = document.getElementById('theme-menu-button');
            const themeMenu = document.getElementById('theme-menu');
            themeMenuButton.addEventListener('click', () => {
                themeMenu.classList.toggle('hidden');
            });
            document.addEventListener('click', function(event) {
                if (!themeMenuButton.contains(event.target) && !themeMenu.contains(event.target)) {
                    themeMenu.classList.add('hidden');
                }
            });

            const themeContainer = document.getElementById('theme-menu');
            themes.forEach(theme => {
                const swatch = document.createElement('div');
                swatch.className = 'flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer';
                swatch.onclick = () => {
                    setTheme(theme.color1, theme.color2, theme.shadow);
                    localStorage.setItem('inventoryTheme', JSON.stringify(theme));
                    themeMenu.classList.add('hidden');
                };
                swatch.innerHTML = `
                    <div class="w-6 h-6 rounded-full mr-3 border" style="background: linear-gradient(135deg, ${theme.color1}, ${theme.color2})"></div>
                    <span>${theme.name}</span>
                `;
                themeContainer.appendChild(swatch);
            });

            const savedTheme = localStorage.getItem('inventoryTheme');
            if (savedTheme) {
                const theme = JSON.parse(savedTheme);
                setTheme(theme.color1, theme.color2, theme.shadow);
            }
        });

        function setTheme(color1, color2, shadow) {
            const root = document.documentElement;
            root.style.setProperty('--theme-color-1', color1);
            root.style.setProperty('--theme-color-2', color2);
            root.style.setProperty('--theme-shadow-color', shadow);
        }

        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
            document.getElementById(pageId).classList.remove('hidden');
        }
        
        // --- LOGIN LOGIC ---
        function handleOpenForm(rowId = null) {
            if (isLoggedIn) {
                openForm(rowId);
            } else {
                promptLogin(() => openForm(rowId));
            }
        }

        function handleDeleteItem(rowId, itemName) {
            if (isLoggedIn) {
                deleteItem(rowId, itemName);
            } else {
                promptLogin(() => deleteItem(rowId, itemName));
            }
        }
        
        function handleFormSubmit(e) {
            e.preventDefault();
             if (isLoggedIn) {
                submitFormData(e);
            } else {
                promptLogin(() => submitFormData(e));
            }
        }

        async function promptLogin(onSuccessCallback) {
            const { value: formValues } = await Swal.fire({
                title: 'กรุณาเข้าสู่ระบบ',
                html: `
                    <input id="swal-input-user" class="swal2-input" placeholder="ชื่อผู้ใช้" value="admin">
                    <input id="swal-input-pass" type="password" class="swal2-input" placeholder="รหัสผ่าน" value="">
                `,
                focusConfirm: false,
                confirmButtonText: 'เข้าสู่ระบบ',
                showCancelButton: true,
                cancelButtonText: 'ยกเลิก',
                preConfirm: () => {
                    return {
                        username: document.getElementById('swal-input-user').value,
                        password: document.getElementById('swal-input-pass').value
                    }
                }
            });

            if (formValues) {
                Swal.fire({ title: 'กำลังตรวจสอบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                
                const payload = { action: 'login', data: formValues };
                try {
                    const response = await fetch(SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                    });
                    const result = await response.json();
                    const loginResult = result.data;

                    if (loginResult.success) {
                        isLoggedIn = true;
                        document.getElementById('logoutButton').classList.remove('hidden');
                        Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ!', showConfirmButton: false, timer: 1500 });
                        if (onSuccessCallback) onSuccessCallback();
                    } else {
                        Swal.fire('ผิดพลาด!', loginResult.message, 'error');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    Swal.fire('ผิดพลาด!', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
                }
            }
        }
        
        function logout() {
            isLoggedIn = false;
            document.getElementById('logoutButton').classList.add('hidden');
            Swal.fire({ icon: 'success', title: 'ออกจากระบบแล้ว', showConfirmButton: false, timer: 1500 });
        }


        // --- DATA FETCH AND RENDER ---
        async function fetchData() {
            Swal.fire({
                title: 'กำลังโหลดข้อมูล...',
                text: 'กรุณารอสักครู่',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            try {
                const response = await fetch(`${SCRIPT_URL}?action=read`);
                if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);
                const result = await response.json();
                if (result.success) {
                    inventoryData = result.data;
                    renderDashboard();
                    filterAndRender(); // Setup initial view with pagination
                    Swal.close();
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                Swal.fire('ผิดพลาด!', 'ไม่สามารถดึงข้อมูลได้ อาจเป็นเพราะ URL ไม่ถูกต้อง หรือยังไม่ได้ Deploy สคริปต์เวอร์ชันล่าสุด', 'error');
            }
        }

        function renderDashboard() {
            const counts = { total: 0, usable: 0, damaged: 0, repair: 0, dispose: 0 };
            inventoryData.forEach(item => {
                const qty = parseInt(item.quantity) || 0;
                counts.total += qty;
                if (item.status === 'ใช้งานได้') counts.usable += qty;
                else if (item.status === 'ชำรุด') counts.damaged += qty;
                else if (item.status === 'รอซ่อม') counts.repair += qty;
                else if (item.status === 'รอจำหน่าย') counts.dispose += qty;
            });

            document.getElementById('total-count').textContent = counts.total;
            document.getElementById('usable-count').textContent = counts.usable;
            document.getElementById('damaged-count').textContent = counts.damaged;
            document.getElementById('repair-count').textContent = counts.repair;
            document.getElementById('dispose-count').textContent = counts.dispose;

            const ctx = document.getElementById('inventoryChart').getContext('2d');
            const chartData = {
                labels: ['ใช้งานได้', 'รอซ่อม', 'ชำรุด', 'รอจำหน่าย'],
                datasets: [{
                    label: 'จำนวน',
                    data: [counts.usable, counts.repair, counts.damaged, counts.dispose],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            };

            if (inventoryChart) {
                inventoryChart.destroy();
            }

            inventoryChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'ภาพรวมสถานะครุภัณฑ์',
                            font: {
                                size: 18
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }
        
        function renderReportCards(dataToRender) {
            const container = document.getElementById('report-container');
            container.innerHTML = '';
            if (!dataToRender || dataToRender.length === 0) {
                 container.innerHTML = '<p class="col-span-full text-center text-gray-500">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>';
                 return;
            }
            dataToRender.forEach(item => {
                const card = `
                <div class="card bg-white rounded-xl shadow-md overflow-hidden p-4 flex flex-col justify-between">
                    <div>
                        <img class="w-full h-32 object-cover rounded-md" src="${item.image || 'https://placehold.co/600x400/E2E8F0/4A5568?text=ไม่มีรูปภาพ'}" alt="${item.itemName}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/FECACA/991B1B?text=โหลดรูปไม่ได้';">
                        <div class="py-4">
                            <div class="font-bold text-lg mb-1 truncate">${item.itemName}</div>
                            <p class="text-gray-600 text-sm truncate">${item.inventoryId}</p>
                            <span class="status-badge mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold text-white" data-status="${item.status}">${item.status}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button onclick="openDetailsModal('${item.rowId}')" class="flex-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg"><i class="fas fa-eye"></i></button>
                        <button onclick="handleOpenForm('${item.rowId}')" class="flex-1 text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg"><i class="fas fa-edit"></i></button>
                        <button onclick="handleDeleteItem('${item.rowId}', '${item.itemName}')" class="flex-1 text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
                container.innerHTML += card;
            });
            
            document.querySelectorAll('.status-badge').forEach(badge => {
                const status = badge.dataset.status;
                if (status === 'ใช้งานได้') badge.style.backgroundColor = '#4CAF50';
                else if (status === 'ชำรุด') badge.style.backgroundColor = '#F44336';
                else if (status === 'รอซ่อม') badge.style.backgroundColor = '#FFC107';
                else if (status === 'รอจำหน่าย') badge.style.backgroundColor = '#9E9E9E';
            });
        }
        
        function applyFilterAndSwitchPage(status) {
            currentPage = 1; // Reset to first page
            currentFilters.status = status;
            currentFilters.searchTerm = '';
            document.getElementById('statusFilter').value = status;
            document.getElementById('searchInput').value = '';
            filterAndRender();
            showPage('reportPage');
        }

        function filterAndRender() {
            let filteredData = inventoryData;
            if (currentFilters.status !== 'all') {
                filteredData = filteredData.filter(item => item.status === currentFilters.status);
            }
            const searchTerm = currentFilters.searchTerm.toLowerCase();
            if (searchTerm) {
                filteredData = filteredData.filter(item => 
                    item.itemName.toLowerCase().includes(searchTerm) ||
                    item.inventoryId.toLowerCase().includes(searchTerm) ||
                    (item.brandmodel && item.brandmodel.toLowerCase().includes(searchTerm)) ||
                    (item.responsiblePerson && item.responsiblePerson.toLowerCase().includes(searchTerm))
                );
            }
            setupPagination(filteredData);
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedItems = filteredData.slice(start, end);
            renderReportCards(paginatedItems);
        }
        
        function setupPagination(items) {
            const paginationContainer = document.getElementById('pagination-container');
            paginationContainer.innerHTML = '';
            const pageCount = Math.ceil(items.length / itemsPerPage);

            if (pageCount <= 1) return;

            const prevButton = document.createElement('button');
            prevButton.innerHTML = `<i class="fas fa-chevron-left"></i>`;
            prevButton.className = 'px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed';
            prevButton.disabled = currentPage === 1;
            prevButton.onclick = () => changePage(currentPage - 1);
            paginationContainer.appendChild(prevButton);

            for (let i = 1; i <= pageCount; i++) {
                const pageButton = document.createElement('button');
                pageButton.innerText = i;
                pageButton.className = `px-4 py-2 rounded-lg border border-gray-300 ${currentPage === i ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 hover:bg-gray-100'}`;
                pageButton.onclick = () => changePage(i);
                paginationContainer.appendChild(pageButton);
            }

            const nextButton = document.createElement('button');
            nextButton.innerHTML = `<i class="fas fa-chevron-right"></i>`;
            nextButton.className = 'px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed';
            nextButton.disabled = currentPage === pageCount;
            nextButton.onclick = () => changePage(currentPage + 1);
            paginationContainer.appendChild(nextButton);
        }

        function changePage(page) {
            currentPage = page;
            filterAndRender();
        }

        function getStatusBadgeStyle(status) {
            let bgColor = 'bg-gray-500';
            let textColor = 'text-white';
            if (status === 'ใช้งานได้') { bgColor = 'bg-green-100'; textColor = 'text-green-800'; }
            else if (status === 'ชำรุด') { bgColor = 'bg-red-100'; textColor = 'text-red-800'; }
            else if (status === 'รอซ่อม') { bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; }
            else if (status === 'รอจำหน่าย') { bgColor = 'bg-gray-200'; textColor = 'text-gray-800'; }
            return `${bgColor} ${textColor}`;
        }

        function openDetailsModal(rowId) {
            const item = inventoryData.find(d => d.rowId == rowId);
            if (!item) return;
            document.getElementById('modal-title').textContent = item.itemName;
            document.getElementById('modal-img').src = item.image || 'https://placehold.co/600x400/E2E8F0/4A5568?text=ไม่มีรูปภาพ';
            document.getElementById('modal-id').textContent = item.inventoryId;
            const statusSpan = document.getElementById('modal-status');
            statusSpan.textContent = item.status;
            statusSpan.className = `font-semibold px-2 py-1 rounded-full text-xs ${getStatusBadgeStyle(item.status)}`;
            
            document.getElementById('modal-quantity').textContent = item.quantity;
            document.getElementById('modal-date').textContent = new Date(item.purchaseDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('modal-location').textContent = item.location;
            document.getElementById('modal-brandmodel').textContent = item.brandmodel || '-';
            document.getElementById('modal-person').textContent = item.responsiblePerson;

            document.getElementById('detailsModal').classList.remove('hidden');
        }

        function closeDetailsModal() {
            document.getElementById('detailsModal').classList.add('hidden');
        }

        function openForm(rowId = null) {
            const form = document.getElementById('inventory-form');
            form.reset();
            const preview = document.getElementById('image-preview');
            preview.classList.add('hidden');
            preview.src = '';
             document.getElementById('inventory-form').reset();
             document.getElementById('image-preview').classList.add('hidden');
             document.getElementById('rowId').value = '';

            if (rowId) {
                const item = inventoryData.find(d => d.rowId == rowId);
                if (item) {
                    document.getElementById('form-title').textContent = 'แก้ไขข้อมูลครุภัณฑ์';
                    document.getElementById('rowId').value = item.rowId;
                    document.getElementById('inventoryId').value = item.inventoryId;
                    document.getElementById('itemName').value = item.itemName;
                    document.getElementById('quantity').value = item.quantity;
                    document.getElementById('purchaseDate').value = item.purchaseDate; // Already in YYYY-MM-DD
                    document.getElementById('location').value = item.location;
                    document.getElementById('brandmodel').value = item.brandmodel || '';
                    document.getElementById('responsiblePerson').value = item.responsiblePerson;
                    document.getElementById('status').value = item.status;
                    if(item.image) {
                        preview.src = item.image;
                        preview.classList.remove('hidden');
                    }
                }
            } else {
                document.getElementById('form-title').textContent = 'เพิ่มข้อมูลครุภัณฑ์';
            }
            showPage('formPage');
        }
        
        async function submitFormData(e) {
            const fileInput = document.getElementById('image');
            const file = fileInput.files[0];

            Swal.fire({
                title: 'กำลังบันทึกข้อมูล...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const formData = {
                rowId: document.getElementById('rowId').value,
                inventoryId: document.getElementById('inventoryId').value,
                itemName: document.getElementById('itemName').value,
                quantity: document.getElementById('quantity').value,
                purchaseDate: document.getElementById('purchaseDate').value,
                location: document.getElementById('location').value,
                brandmodel: document.getElementById('brandmodel').value,
                responsiblePerson: document.getElementById('responsiblePerson').value,
                status: document.getElementById('status').value,
            };
            
            if (file) {
                 try {
                    const base64 = await fileToBase64(file);
                    formData.imageFile = base64;
                    formData.imageName = file.name;
                    formData.imageMimeType = file.type;
                    postData(formData);
                 } catch(error) {
                    console.error(error);
                    Swal.fire('ผิดพลาด!', 'ไม่สามารถแปลงไฟล์รูปภาพได้', 'error');
                 }
            } else {
                postData(formData);
            }
        }
        
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });
        }

        async function postData(formData) {
            const action = formData.rowId ? 'update' : 'create';
            const payload = { action, data: formData };
            
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' } // Use text/plain for Apps Script POST
                });
                if (!response.ok) {
                    throw new Error(`Network response was not ok, status: ${response.status}`);
                }
                const result = await response.json();
                if (result.success) {
                    Swal.fire('สำเร็จ!', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
                    fetchData();
                    showPage('reportPage');
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
            } catch (error) {
                console.error('Error saving data:', error);
                Swal.fire('ผิดพลาด!', `ไม่สามารถบันทึกข้อมูลได้: ${error.message}`, 'error');
            }
        }

        function deleteItem(rowId, itemName) {
            Swal.fire({
                title: `ต้องการลบ '${itemName}'?`,
                text: "ข้อมูลจะถูกลบอย่างถาวร!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'ใช่, ลบเลย!',
                cancelButtonText: 'ยกเลิก'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'กำลังลบข้อมูล...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });
                    
                    const payload = { action: 'delete', data: { rowId } };

                    try {
                         const response = await fetch(SCRIPT_URL, {
                            method: 'POST',
                            body: JSON.stringify(payload),
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                        });
                        if (!response.ok) {
                            throw new Error(`Network response was not ok, status: ${response.status}`);
                        }
                        const res = await response.json();
                        if (res.success) {
                            Swal.fire('ลบแล้ว!', 'ข้อมูลถูกลบเรียบร้อย', 'success');
                            fetchData();
                        } else {
                             throw new Error(res.message || 'Unknown error');
                        }
                    } catch (error) {
                       Swal.fire('ผิดพลาด!', `ไม่สามารถลบข้อมูลได้: ${error.message}`, 'error');
                    }
                }
            })
        }
        
        function printReport() {
            // Get filtered data (without pagination)
            let filteredData = inventoryData;
            if (currentFilters.status !== 'all') {
                filteredData = filteredData.filter(item => item.status === currentFilters.status);
            }
            const searchTerm = currentFilters.searchTerm.toLowerCase();
            if (searchTerm) {
                filteredData = filteredData.filter(item => 
                    item.itemName.toLowerCase().includes(searchTerm) ||
                    item.inventoryId.toLowerCase().includes(searchTerm) ||
                    (item.brandmodel && item.brandmodel.toLowerCase().includes(searchTerm)) ||
                    (item.responsiblePerson && item.responsiblePerson.toLowerCase().includes(searchTerm))
                );
            }

            if (filteredData.length === 0) {
                Swal.fire('ไม่มีข้อมูล', 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขสำหรับพิมพ์', 'warning');
                return;
            }
            
            let printWindow = window.open('', '_blank');
            
            let tableRows = '';
            filteredData.forEach((item, index) => {
                let statusGood = '';
                let statusRepair = '';
                let statusUnusable = '';
                let statusDispose = '';

                switch(item.status) {
                    case 'ใช้งานได้': statusGood = '✓'; break;
                    case 'รอซ่อม': statusRepair = '✓'; break;
                    case 'ชำรุด': statusUnusable = '✓'; break;
                    case 'รอจำหน่าย': statusDispose = '✓'; break;
                }

                tableRows += `
                    <tr>
                        <td>${index + 1}</td>
                        <td style="text-align: left; padding-left: 5px;">${item.itemName || ''}</td>
                        <td>${item.inventoryId || ''}</td>
                        <td>${statusGood}</td>
                        <td>${statusRepair}</td>
                        <td>${statusUnusable}</td>
                        <td>${statusDispose}</td>
                        <td></td>
                    </tr>
                `;
            });
            
            const brandmodels = [...new Set(filteredData.map(item => item.brandmodel))].filter(Boolean).join(', ');
            const responsiblePeople = [...new Set(filteredData.map(item => item.responsiblePerson))].filter(Boolean).join(', ');
            const locations = [...new Set(filteredData.map(item => item.location))].filter(Boolean).join(', ');

            const printContent = `
                <html>
                <head>
                    <title>รายงานครุภัณฑ์</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            font-family: 'Sarabun', sans-serif; 
                            margin: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                            font-size: 14px;
                        }
                        th, td {
                            border: 1px solid black;
                            padding: 4px;
                            text-align: center;
                            vertical-align: middle;
                            height: 28px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        .header-info {
                            display: grid;
                            grid-template-columns: 1fr 1fr 1fr;
                            margin-bottom: 10px;
                            font-size: 14px;
                        }
                        .main-title {
                            text-align: center;
                            font-weight: bold;
                            font-size: 16px;
                        }
                        @media print {
                            @page {
                                size: A4 landscape;
                                margin: 1cm;
                            }
                            body {
                                -webkit-print-color-adjust: exact;
                                margin: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="main-title">แบบสำรวจครุภัณฑ์ ประจำปีงบประมาณ 2568</div>
                    <br>
                    <div class="header-info">
                        <span><b>ยี่ห้อ/รุ่น:</b> ${brandmodels || '-'}</span>
                        <span><b>สถานที่เก็บ:</b> ${locations || '-'}</span>
                        <span><b>ผู้รับผิดชอบ:</b> ${responsiblePeople || '-'}</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th rowspan="3" style="width: 5%;">ลำดับ</th>
                                <th rowspan="3" style="width: 30%;">รายการครุภัณฑ์</th>
                                <th rowspan="3" style="width: 15%;">เลขครุภัณฑ์</th>
                                <th colspan="4">สภาพครุภัณฑ์</th>
                                <th rowspan="3" style="width: 15%;">หมายเหตุ</th>
                            </tr>
                            <tr>
                                <th rowspan="2">ใช้ได้ดี</th>
                                <th colspan="2">ชำรุด</th>
                                <th rowspan="2">เสื่อมคุณภาพ<br>(ขอจำหน่าย)</th>
                            </tr>
                            <tr>
                                <th>รอซ่อม</th>
                                <th>ใช้ไม่ได้</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    