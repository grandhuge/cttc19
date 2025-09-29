        // Global variables
        let allData = [];
        let filteredData = [];
        let currentPage = 1;
        const rowsPerPage = 31;
        let sortColumn = 'date';
        let sortDirection = 'desc'; // Changed to desc for latest first
        let uniqueEmployees = [];
        let uniqueMonths = [];
        let employeeStats = {};
        
        // Elements
        const employeeSelect = document.getElementById('employeeSelect');
        const monthSelect = document.getElementById('monthSelect');
        const reportContainer = document.getElementById('reportContainer');
        const reportBody = document.getElementById('reportBody');
        const loader = document.getElementById('loader');
        const noData = document.getElementById('noData');
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        const resultCount = document.getElementById('resultCount');
        const currentPageEl = document.getElementById('currentPage');
        const totalPagesEl = document.getElementById('totalPages');
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        const printBtn = document.getElementById('printBtn');
        const nameHeader = document.getElementById('nameHeader');
        const dateHeader = document.getElementById('dateHeader');
        const workHeader = document.getElementById('workHeader');
        const printTitle = document.getElementById('printTitle');
        const printSubtitle = document.getElementById('printSubtitle');
        const dashboardContainer = document.getElementById('dashboardContainer');
        const dashboardBody = document.getElementById('dashboardBody');
        const totalEmployeesEl = document.getElementById('totalEmployees');
        const totalReportsEl = document.getElementById('totalReports');
        const totalMonthsEl = document.getElementById('totalMonths');
        
        // Thai month names
        const thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        
        // Format date function
        function formatDate(dateStr) {
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    return dateStr; // Return original if invalid
                }
                
                // Convert to Thai Buddhist Era (BE) year
                const thaiYear = date.getFullYear() + 543;
                return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${thaiYear}`;
            } catch (e) {
                return dateStr;
            }
        }
        
        // Extract month from date
        function extractMonth(dateStr) {
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    return null;
                }
                return `${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
            } catch (e) {
                return null;
            }
        }
        
        // Sort data function
        function sortData(data, column, direction) {
            return [...data].sort((a, b) => {
                let valueA, valueB;
                
                if (column === 'name') {
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                } else if (column === 'date') {
                    valueA = new Date(a.date);
                    valueB = new Date(b.date);
                    
                    // Handle invalid dates
                    if (isNaN(valueA.getTime())) valueA = new Date(0);
                    if (isNaN(valueB.getTime())) valueB = new Date(0);
                } else if (column === 'work') {
                    valueA = a.work.toLowerCase();
                    valueB = b.work.toLowerCase();
                }
                
                if (direction === 'asc') {
                    return valueA > valueB ? 1 : -1;
                } else {
                    return valueA < valueB ? 1 : -1;
                }
            });
        }
        
        // Update sort headers
        function updateSortHeaders() {
            // Reset all headers
            nameHeader.className = nameHeader.className.replace(/ sort-(asc|desc)/g, '');
            dateHeader.className = dateHeader.className.replace(/ sort-(asc|desc)/g, '');
            workHeader.className = workHeader.className.replace(/ sort-(asc|desc)/g, '');
            
            // Set active header
            if (sortColumn === 'name') {
                nameHeader.classList.add(`sort-${sortDirection}`);
            } else if (sortColumn === 'date') {
                dateHeader.classList.add(`sort-${sortDirection}`);
            } else if (sortColumn === 'work') {
                workHeader.classList.add(`sort-${sortDirection}`);
            }
        }
        
        // Filter data function
        function filterData() {
            const selectedEmployee = employeeSelect.value;
            const selectedMonth = monthSelect.value;
            
            filteredData = allData.filter(item => {
                const monthMatch = !selectedMonth || extractMonth(item.date) === selectedMonth;
                const employeeMatch = !selectedEmployee || item.name === selectedEmployee;
                return monthMatch && employeeMatch;
            });
            
            // Sort the filtered data
            filteredData = sortData(filteredData, sortColumn, sortDirection);
            
            // Reset to first page
            currentPage = 1;
            
            // Update the display
            updateDisplay();
        }
        
        // Update display function
        function updateDisplay() {
            // Update pagination info
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            resultCount.textContent = filteredData.length;
            currentPageEl.textContent = currentPage;
            totalPagesEl.textContent = totalPages;
            
            // Enable/disable pagination buttons
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
            
            // Clear the table
            reportBody.innerHTML = '';
            
            // Show appropriate container
            if (filteredData.length === 0) {
                reportContainer.classList.add('hidden');
                noData.classList.remove('hidden');
                return;
            } else {
                reportContainer.classList.remove('hidden');
                noData.classList.add('hidden');
            }
            
            // Calculate start and end indices for current page
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
            
            // Check if we should hide the name column
            const selectedEmployee = employeeSelect.value;
            const hideNameColumn = !!selectedEmployee;
            
            if (hideNameColumn) {
                nameHeader.classList.add('hidden');
            } else {
                nameHeader.classList.remove('hidden');
            }
            
            // Populate the table
            for (let i = startIndex; i < endIndex; i++) {
                const item = filteredData[i];
                const row = document.createElement('tr');
                row.className = i % 2 === 0 ? 'bg-white' : 'bg-green-50';
                
                if (!hideNameColumn) {
                    const nameCell = document.createElement('td');
                    nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                    nameCell.textContent = item.name;
                    row.appendChild(nameCell);
                }
                
                const dateCell = document.createElement('td');
                dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                dateCell.textContent = formatDate(item.date);
                row.appendChild(dateCell);
                
                const workCell = document.createElement('td');
                workCell.className = 'px-6 py-4 text-sm text-gray-900';
                workCell.textContent = item.work;
                row.appendChild(workCell);
                
                reportBody.appendChild(row);
            }
        }
        
        // Generate employee statistics
        function generateEmployeeStats() {
            employeeStats = {};
            
            // Initialize stats for each employee
            uniqueEmployees.forEach(employee => {
                employeeStats[employee] = {
                    name: employee,
                    count: 0,
                    latestReport: null,
                    firstReport: null
                };
            });
            
            // Calculate stats
            allData.forEach(item => {
                const employee = item.name;
                const date = new Date(item.date);
                
                if (employeeStats[employee]) {
                    employeeStats[employee].count++;
                    
                    // Update latest report
                    if (!employeeStats[employee].latestReport || date > new Date(employeeStats[employee].latestReport)) {
                        employeeStats[employee].latestReport = item.date;
                    }
                    
                    // Update first report
                    if (!employeeStats[employee].firstReport || date < new Date(employeeStats[employee].firstReport)) {
                        employeeStats[employee].firstReport = item.date;
                    }
                }
            });
            
            // Update dashboard
            updateDashboard();
        }
        
        // Update dashboard
        function updateDashboard() {
            // Update summary stats
            totalEmployeesEl.textContent = uniqueEmployees.length;
            totalReportsEl.textContent = allData.length;
            totalMonthsEl.textContent = uniqueMonths.length;
            
            // Clear dashboard table
            dashboardBody.innerHTML = '';
            
            // Sort employees by report count (descending)
            const sortedEmployees = Object.values(employeeStats).sort((a, b) => b.count - a.count);
            
            // Populate dashboard table
            sortedEmployees.forEach(stat => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-green-50';
                
                const nameCell = document.createElement('td');
                nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900';
                nameCell.textContent = stat.name;
                row.appendChild(nameCell);
                
                const countCell = document.createElement('td');
                countCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                countCell.textContent = stat.count;
                row.appendChild(countCell);
                
                const latestCell = document.createElement('td');
                latestCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                latestCell.textContent = formatDate(stat.latestReport);
                row.appendChild(latestCell);
                
                const firstCell = document.createElement('td');
                firstCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                firstCell.textContent = formatDate(stat.firstReport);
                row.appendChild(firstCell);
                
                dashboardBody.appendChild(row);
            });
            
            // Show dashboard
            dashboardContainer.classList.remove('hidden');
        }
        
        // Fetch data from Google Sheets
        function fetchData() {
            loader.classList.remove('hidden');
            reportContainer.classList.add('hidden');
            noData.classList.add('hidden');
            errorContainer.classList.add('hidden');
            dashboardContainer.classList.add('hidden');
            
            const script = document.createElement('script');
            const callbackName = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
            const url = 'https://script.google.com/macros/s/AKfycbzm5m482WedUhofw-4YlSHpJRQA_cQrN5s-JJ4siUyOnMZ9nkDqaVxUYVQmfjYVm4ZWkg/exec';
            
            window[callbackName] = function(data) {
                loader.classList.add('hidden');
                
                if (!data || !Array.isArray(data) || data.length === 0) {
                    errorContainer.classList.remove('hidden');
                    errorMessage.textContent = 'ไม่พบข้อมูลหรือข้อมูลไม่ถูกต้อง';
                    return;
                }
                
                // Skip the header row
                allData = data.slice(1).map(row => ({
                    timestamp: row[0],
                    name: row[1],
                    date: row[2],
                    work: row[3]
                }));
                
                // Extract unique employees
                uniqueEmployees = [...new Set(allData.map(item => item.name))].sort();
                
                // Extract unique months
                const months = allData.map(item => extractMonth(item.date))
                    .filter(month => month !== null);
                uniqueMonths = [...new Set(months)].sort((a, b) => {
                    // Parse month and year
                    const [monthA, yearA] = a.split(' ');
                    const [monthB, yearB] = b.split(' ');
                    
                    // Compare years first
                    if (yearA !== yearB) {
                        return parseInt(yearA) - parseInt(yearB);
                    }
                    
                    // Then compare months
                    return thaiMonths.indexOf(monthA) - thaiMonths.indexOf(monthB);
                });
                
                // Generate employee statistics
                generateEmployeeStats();
                
                // Populate dropdowns
                populateDropdowns();
                
                // Initial filter and display
                filterData();
                
                // Clean up the callback
                delete window[callbackName];
            };
            
            script.src = `${url}?id=1GXh1KFQbi1yQL26WEY_vwDurqJJP48tql0X6spGO45w&sheet=การตอบแบบฟอร์ม 1&callback=${callbackName}`;
            document.body.appendChild(script);
            
            // Handle timeout
            setTimeout(() => {
                if (document.body.contains(script)) {
                    loader.classList.add('hidden');
                    errorContainer.classList.remove('hidden');
                    errorMessage.textContent = 'การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง';
                    document.body.removeChild(script);
                    delete window[callbackName];
                }
            }, 15000);
        }
        
        // Populate dropdowns function
        function populateDropdowns() {
            // Clear existing options (except the first one)
            while (employeeSelect.options.length > 1) {
                employeeSelect.remove(1);
            }
            
            while (monthSelect.options.length > 1) {
                monthSelect.remove(1);
            }
            
            // Add employee options
            uniqueEmployees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee;
                option.textContent = employee;
                employeeSelect.appendChild(option);
            });
            
            // Add month options
            uniqueMonths.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month;
                monthSelect.appendChild(option);
            });
        }
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', () => {
            // Fetch data on load
            fetchData();
            
            // Filter change events
            employeeSelect.addEventListener('change', filterData);
            monthSelect.addEventListener('change', filterData);
            
            // Pagination events
            prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    updateDisplay();
                }
            });
            
            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(filteredData.length / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    updateDisplay();
                }
            });
            
            // Sort events
            nameHeader.addEventListener('click', () => {
                if (sortColumn === 'name') {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = 'name';
                    sortDirection = 'asc';
                }
                updateSortHeaders();
                filterData();
            });
            
            dateHeader.addEventListener('click', () => {
                if (sortColumn === 'date') {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = 'date';
                    sortDirection = 'desc'; // Default to desc for dates
                }
                updateSortHeaders();
                filterData();
            });
            
            workHeader.addEventListener('click', () => {
                if (sortColumn === 'work') {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = 'work';
                    sortDirection = 'asc';
                }
                updateSortHeaders();
                filterData();
            });
            
            // Print button event
            printBtn.addEventListener('click', () => {
                // Update print title
                const selectedEmployee = employeeSelect.value;
                const selectedMonth = monthSelect.value;
                
                if (selectedEmployee) {
                    printTitle.textContent = `รายงานการปฏิบัติงานของ ${selectedEmployee}`;
                } else {
                    printTitle.textContent = 'รายงานการปฏิบัติงานจ้างเหมาบริการ';
                }
                
                if (selectedMonth) {
                    printSubtitle.textContent = `ประจำเดือน ${selectedMonth}`;
                } else {
                    printSubtitle.textContent = '';
                }
                
                window.print();
            });
        });
    