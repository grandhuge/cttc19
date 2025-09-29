    // Global variables
    let allData = [];
    let processedData = [];
    let filteredData = [];
    let uniquePeriods = [];
    let uniquePositions = [];
    let categoryChart = null;
    let positionChart = null;
    let employeeComparisonChart = null;
    let currentSortColumn = 'employeeName';
    let currentSortDirection = 'asc';
    let selectedEmployee = null;
    let currentSearchCriteria = { searchTerm: '', period: 'all', position: 'all' };
    let currentDashboardCriteria = { period: 'all', position: 'all' };
    let currentComparisonCriteria = { period: 'all' };
    
    // DOM Elements
    const loadingElement = document.getElementById('loading');
    const searchInput = document.getElementById('search-input');
    const evaluationPeriodSelect = document.getElementById('evaluation-period');
    const positionFilterSelect = document.getElementById('position-filter');
    const searchButton = document.getElementById('search-button');
    const resultsTable = document.getElementById('results-table');
    const noResultsElement = document.getElementById('no-results');
    const printButton = document.getElementById('print-button');
    const dashboardPeriodSelect = document.getElementById('dashboard-period');
    const dashboardPositionSelect = document.getElementById('dashboard-position');
    const dashboardFilterButton = document.getElementById('dashboard-filter-button');
    const comparisonPeriodSelect = document.getElementById('comparison-period');
    const comparisonFilterButton = document.getElementById('comparison-filter-button');
    const averageScoreElement = document.getElementById('average-score');
    const highestScoreElement = document.getElementById('highest-score');
    const highestNameElement = document.getElementById('highest-name');
    const totalEvaluationsElement = document.getElementById('total-evaluations');
    const totalEmployeesElement = document.getElementById('total-employees');
    const employeeTabsContainer = document.getElementById('employee-tabs');
    const commentsModal = document.getElementById('comments-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = document.getElementById('close-modal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    const sortableHeaders = document.querySelectorAll('.sortable');
    const searchCriteriaElement = document.getElementById('search-criteria');
    const dashboardCriteriaElement = document.getElementById('dashboard-criteria');
    const comparisonCriteriaElement = document.getElementById('comparison-criteria');
    const selectedEmployeeNameElement = document.getElementById('selected-employee-name');

    // Fetch data from Google Sheets
    async function fetchData() {
      try {
        const url = 'https://script.google.com/macros/s/AKfycbz3R_xXpkDcR4GgvMa1zwbGyaXgxVQ8Da1uf44uyX6jv-CYeSxqPCbtQcl4G9WFs_TS/exec';
        const response = await fetch(url);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
        return [];
      }
    }

    // Process raw data
    function processData(rawData) {
      if (!rawData || !rawData.length) return [];
      
      // Skip header row
      const dataRows = rawData.slice(1);
      
      // Extract unique periods and positions
      const periods = new Set();
      const positions = new Set();
      
      // Process each row
      const processed = dataRows.map(row => {
        // Extract timestamp and period
        const timestamp = row[0];
        const period = row[1];
        periods.add(period);
        
        // Extract employee name, nickname and position
        const fullName = row[2];
        let employeeName = fullName;
        let nickname = '';
        let position = '';
        
        // Parse name format: "Name (Nickname) Position"
        const nicknameMatch = fullName.match(/(.+?)\s*\((.+?)\)\s*พนักงาน(.+)/);
        if (nicknameMatch) {
          employeeName = nicknameMatch[1].trim();
          nickname = nicknameMatch[2].trim();
          position = nicknameMatch[3].trim();
          positions.add(position);
        }
        
        // Calculate category scores based on position
        let categoryScores = [0, 0, 0, 0];
        
        // Extract comments (column AR, index 43)
        const comments = row[43] || '';
        
        // Calculate scores based on position
        if (position.includes('ขับรถยนต์')) {
          // พนักงานขับรถยนต์: ด้านที่ 1-2 อยู่ในคอลัมน์ D:M (index 3-12)
          categoryScores[0] = calculateCategoryAverage(row, 3, 7);   // Category 1 (D-H)
          categoryScores[1] = calculateCategoryAverage(row, 8, 12);  // Category 2 (I-M)
        } else if (position.includes('ทำความสะอาด')) {
          // พนักงานทำความสะอาด: ด้านที่ 1-2 อยู่ในคอลัมน์ N:W (index 13-22)
          categoryScores[0] = calculateCategoryAverage(row, 13, 17); // Category 1 (N-R)
          categoryScores[1] = calculateCategoryAverage(row, 18, 22); // Category 2 (S-W)
        } else if (position.includes('รักษาความปลอดภัย')) {
          // พนักงานรักษาความปลอดภัย: ด้านที่ 1-2 อยู่ในคอลัมน์ X:AG (index 23-32)
          categoryScores[0] = calculateCategoryAverage(row, 23, 27); // Category 1 (X-AB)
          categoryScores[1] = calculateCategoryAverage(row, 28, 32); // Category 2 (AC-AG)
        }
        
        // ทุกตำแหน่ง: ด้านที่ 3-4 อยู่ในคอลัมน์ AH:AQ (index 33-42)
        categoryScores[2] = calculateCategoryAverage(row, 33, 37); // Category 3 (AH-AL)
        categoryScores[3] = calculateCategoryAverage(row, 38, 42); // Category 4 (AM-AQ)
        
        // Calculate total score
        const totalScore = categoryScores.reduce((sum, score) => sum + score, 0) / 4;
        
        return {
          timestamp,
          period,
          employeeName,
          nickname,
          position,
          categoryScores,
          totalScore,
          comments
        };
      });
      
      uniquePeriods = [...periods].sort();
      uniquePositions = [...positions].sort();
      
      return processed;
    }
    
    // Calculate average score for a category
    function calculateCategoryAverage(row, startIndex, endIndex) {
      let sum = 0;
      let count = 0;
      
      for (let i = startIndex; i <= endIndex; i++) {
        const score = parseFloat(row[i]);
        if (!isNaN(score)) {
          sum += score;
          count++;
        }
      }
      
      return count > 0 ? sum / count : 0;
    }
    
    // Aggregate data by employee
    function aggregateByEmployee(data) {
      const employeeMap = new Map();
      
      data.forEach(item => {
        const key = `${item.employeeName}-${item.position}-${item.period}`;
        
        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            employeeName: item.employeeName,
            nickname: item.nickname,
            position: item.position,
            periods: [item.period],
            evaluations: 1,
            categoryScores: [...item.categoryScores],
            totalScore: item.totalScore,
            comments: [item.comments].filter(Boolean),
            period: item.period
          });
        } else {
          const existing = employeeMap.get(key);
          existing.evaluations++;
          
          // Update category scores
          for (let i = 0; i < 4; i++) {
            existing.categoryScores[i] = (existing.categoryScores[i] * (existing.evaluations - 1) + item.categoryScores[i]) / existing.evaluations;
          }
          
          // Update total score
          existing.totalScore = (existing.totalScore * (existing.evaluations - 1) + item.totalScore) / existing.evaluations;
          
          // Add comments
          if (item.comments) {
            existing.comments.push(item.comments);
          }
        }
      });
      
      return Array.from(employeeMap.values());
    }
    
    // Filter data based on search criteria
    function filterData(data, searchTerm, period, position) {
      return data.filter(item => {
        const matchesSearch = searchTerm === '' || 
          item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.position.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesPeriod = period === 'all' || item.periods.includes(period) || item.period === period;
        const matchesPosition = position === 'all' || item.position === position;
        
        return matchesSearch && matchesPeriod && matchesPosition;
      });
    }
    
    // Sort data based on column and direction
    function sortData(data, column, direction) {
      return [...data].sort((a, b) => {
        let valueA, valueB;
        
        // Determine which values to compare based on column
        switch (column) {
          case 'employeeName':
            valueA = a.employeeName;
            valueB = b.employeeName;
            break;
          case 'nickname':
            valueA = a.nickname;
            valueB = b.nickname;
            break;
          case 'position':
            valueA = a.position;
            valueB = b.position;
            break;
          case 'category1':
            valueA = a.categoryScores[0];
            valueB = b.categoryScores[0];
            break;
          case 'category2':
            valueA = a.categoryScores[1];
            valueB = b.categoryScores[1];
            break;
          case 'category3':
            valueA = a.categoryScores[2];
            valueB = b.categoryScores[2];
            break;
          case 'category4':
            valueA = a.categoryScores[3];
            valueB = b.categoryScores[3];
            break;
          case 'totalScore':
            valueA = a.totalScore;
            valueB = b.totalScore;
            break;
          case 'evaluations':
            valueA = a.evaluations;
            valueB = b.evaluations;
            break;
          default:
            valueA = a.employeeName;
            valueB = b.employeeName;
        }
        
        // Compare values based on direction
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return direction === 'asc' 
            ? valueA.localeCompare(valueB, 'th') 
            : valueB.localeCompare(valueA, 'th');
        } else {
          return direction === 'asc' 
            ? valueA - valueB 
            : valueB - valueA;
        }
      });
    }
    
    // Update sort indicators in table headers
    function updateSortIndicators() {
      sortableHeaders.forEach(header => {
        const column = header.getAttribute('data-sort');
        
        // Remove all sort classes
        header.classList.remove('sort-asc', 'sort-desc');
        
        // Add appropriate sort class if this is the current sort column
        if (column === currentSortColumn) {
          header.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
      });
    }
    
    // Render results table
    function renderResultsTable(data) {
      resultsTable.innerHTML = '';
      
      if (data.length === 0) {
        noResultsElement.classList.remove('hidden');
        return;
      }
      
      noResultsElement.classList.add('hidden');
      
      data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        
        // Format scores to 2 decimal places
        const formattedCategoryScores = item.categoryScores.map(score => score.toFixed(2));
        const formattedTotalScore = item.totalScore.toFixed(2);
        
        // Create score cells with color coding
        const scoreCells = formattedCategoryScores.map(score => {
          const scoreNum = parseFloat(score);
          let colorClass = 'bg-gray-100';
          
          if (scoreNum >= 4) colorClass = 'bg-green-100 text-green-800';
          else if (scoreNum >= 3.5) colorClass = 'bg-blue-100 text-blue-800';
          else if (scoreNum >= 3) colorClass = 'bg-yellow-100 text-yellow-800';
          else colorClass = 'bg-red-100 text-red-800';
          
          return `<td class="px-4 py-3 text-center ${colorClass} font-medium">${score}</td>`;
        });
        
        // Total score color coding
        const totalScoreNum = parseFloat(formattedTotalScore);
        let totalScoreClass = 'bg-gray-100';
        
        if (totalScoreNum >= 4) totalScoreClass = 'bg-green-100 text-green-800';
        else if (totalScoreNum >= 3.5) totalScoreClass = 'bg-blue-100 text-blue-800';
        else if (totalScoreNum >= 3) totalScoreClass = 'bg-yellow-100 text-yellow-800';
        else totalScoreClass = 'bg-red-100 text-red-800';
        
        row.innerHTML = `
          <td class="px-4 py-3 whitespace-nowrap">${item.employeeName}</td>
          <td class="px-4 py-3">${item.nickname}</td>
          <td class="px-4 py-3">${item.position}</td>
          ${scoreCells.join('')}
          <td class="px-4 py-3 text-center font-medium ${totalScoreClass}">${formattedTotalScore}</td>
          <td class="px-4 py-3 text-center">${item.evaluations}</td>
          <td class="px-4 py-3 text-center no-print">
            ${item.comments.length > 0 ? 
              `<button class="view-comments bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-xs" 
                data-name="${item.employeeName}" 
                data-comments="${encodeURIComponent(JSON.stringify(item.comments))}">
                ดูข้อเสนอแนะ
              </button>` : 
              '<span class="text-gray-400">ไม่มีข้อเสนอแนะ</span>'}
          </td>
        `;
        
        resultsTable.appendChild(row);
      });
      
      // Add event listeners to comment buttons
      document.querySelectorAll('.view-comments').forEach(button => {
        button.addEventListener('click', function() {
          const name = this.getAttribute('data-name');
          const comments = JSON.parse(decodeURIComponent(this.getAttribute('data-comments')));
          
          showCommentsModal(name, comments);
        });
      });
      
      // Update search criteria for printing
      updateSearchCriteria();
    }
    
    // Update search criteria display for printing
    function updateSearchCriteria() {
      let criteriaText = 'เงื่อนไขการค้นหา: ';
      
      if (currentSearchCriteria.searchTerm) {
        criteriaText += `คำค้นหา "${currentSearchCriteria.searchTerm}" `;
      }
      
      criteriaText += `รอบการประเมิน: ${currentSearchCriteria.period === 'all' ? 'ทั้งหมด' : currentSearchCriteria.period} `;
      criteriaText += `ตำแหน่ง: ${currentSearchCriteria.position === 'all' ? 'ทั้งหมด' : currentSearchCriteria.position}`;
      
      searchCriteriaElement.textContent = criteriaText;
    }
    
    // Update dashboard criteria display for printing
    function updateDashboardCriteria() {
      let criteriaText = 'เงื่อนไขการกรอง: ';
      
      criteriaText += `รอบการประเมิน: ${currentDashboardCriteria.period === 'all' ? 'ทั้งหมด' : currentDashboardCriteria.period} `;
      criteriaText += `ตำแหน่ง: ${currentDashboardCriteria.position === 'all' ? 'ทั้งหมด' : currentDashboardCriteria.position}`;
      
      dashboardCriteriaElement.textContent = criteriaText;
    }
    
    // Update comparison criteria display for printing
    function updateComparisonCriteria() {
      let criteriaText = 'เงื่อนไขการกรอง: ';
      
      criteriaText += `รอบการประเมิน: ${currentComparisonCriteria.period === 'all' ? 'ทั้งหมด' : currentComparisonCriteria.period}`;
      
      comparisonCriteriaElement.textContent = criteriaText;
    }
    
    // Show comments modal
    function showCommentsModal(name, comments) {
      modalTitle.textContent = `ข้อเสนอแนะสำหรับ ${name}`;
      
      modalContent.innerHTML = comments.map((comment, index) => 
        `<div class="mb-3 pb-3 ${index < comments.length - 1 ? 'border-b border-gray-200' : ''}">
          <p class="text-gray-800">${comment}</p>
        </div>`
      ).join('');
      
      commentsModal.classList.remove('hidden');
    }
    
    // Close comments modal
    function closeModal() {
      commentsModal.classList.add('hidden');
    }
    
    // Update dashboard statistics
    function updateDashboardStats(data) {
      // Calculate average score
      const totalScores = data.reduce((sum, item) => sum + item.totalScore, 0);
      const averageScore = data.length > 0 ? totalScores / data.length : 0;
      averageScoreElement.textContent = averageScore.toFixed(2);
      
      // Find highest score
      if (data.length > 0) {
        const highestScoreItem = data.reduce((prev, current) => 
          prev.totalScore > current.totalScore ? prev : current
        );
        
        highestScoreElement.textContent = highestScoreItem.totalScore.toFixed(2);
        highestNameElement.textContent = `${highestScoreItem.employeeName} (${highestScoreItem.nickname})`;
      } else {
        highestScoreElement.textContent = '0.00';
        highestNameElement.textContent = '-';
      }
      
      // Count total evaluations
      const totalEvaluations = data.reduce((sum, item) => sum + item.evaluations, 0);
      totalEvaluationsElement.textContent = totalEvaluations;
      
      // Count total employees
      totalEmployeesElement.textContent = data.length;
      
      // Update charts
      updateCategoryChart(data);
      updatePositionChart(data);
      
      // Update dashboard criteria for printing
      updateDashboardCriteria();
    }
    
    // Update category chart
    function updateCategoryChart(data) {
      // Calculate average scores for each category
      const categoryAverages = [0, 0, 0, 0];
      
      data.forEach(item => {
        for (let i = 0; i < 4; i++) {
          categoryAverages[i] += item.categoryScores[i];
        }
      });
      
      if (data.length > 0) {
        for (let i = 0; i < 4; i++) {
          categoryAverages[i] /= data.length;
        }
      }
      
      // Create or update chart
      const ctx = document.getElementById('category-chart').getContext('2d');
      
      if (categoryChart) {
        categoryChart.data.datasets[0].data = categoryAverages.map(score => score.toFixed(2));
        categoryChart.update();
      } else {
        categoryChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['ด้านที่ 1', 'ด้านที่ 2', 'ด้านที่ 3', 'ด้านที่ 4'],
            datasets: [{
              label: 'คะแนนเฉลี่ย',
              data: categoryAverages.map(score => score.toFixed(2)),
              backgroundColor: [
                'rgba(168, 224, 99, 0.7)',
                'rgba(86, 171, 47, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)'
              ],
              borderColor: [
                'rgba(168, 224, 99, 1)',
                'rgba(86, 171, 47, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                  stepSize: 1
                }
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }
    }
    
    // Update position chart
    function updatePositionChart(data) {
      // Group data by position
      const positionGroups = {};
      
      data.forEach(item => {
        if (!positionGroups[item.position]) {
          positionGroups[item.position] = {
            count: 1,
            totalScore: item.totalScore
          };
        } else {
          positionGroups[item.position].count++;
          positionGroups[item.position].totalScore += item.totalScore;
        }
      });
      
      // Calculate average score for each position
      const positions = Object.keys(positionGroups);
      const averageScores = positions.map(position => {
        const group = positionGroups[position];
        return (group.totalScore / group.count).toFixed(2);
      });
      
      // Create or update chart
      const ctx = document.getElementById('position-chart').getContext('2d');
      
      if (positionChart) {
        positionChart.data.labels = positions;
        positionChart.data.datasets[0].data = averageScores;
        positionChart.update();
      } else {
        positionChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: positions,
            datasets: [{
              label: 'คะแนนเฉลี่ย',
              data: averageScores,
              backgroundColor: 'rgba(86, 171, 47, 0.7)',
              borderColor: 'rgba(86, 171, 47, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                  stepSize: 1
                }
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }
    }
    
    // Update employee comparison chart
    function updateEmployeeComparisonChart(data, period = 'all') {
      // Filter data by period if specified
      let filteredData = data;
      if (period !== 'all') {
        filteredData = data.filter(item => item.periods.includes(period) || item.period === period);
      }
      
      // Sort employees by total score
      const sortedEmployees = [...filteredData].sort((a, b) => b.totalScore - a.totalScore);
      
      // Take top 10 employees
      const topEmployees = sortedEmployees.slice(0, 10);
      
      // Create employee tabs
      employeeTabsContainer.innerHTML = '';
      
      topEmployees.forEach((employee, index) => {
        const tab = document.createElement('button');
        tab.className = `px-4 py-2 rounded-full text-sm font-medium ${index === 0 ? 'tab-active' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        tab.textContent = `${employee.nickname || employee.employeeName}`;
        tab.dataset.index = index;
        
        tab.addEventListener('click', function() {
          document.querySelectorAll('#employee-tabs button').forEach(btn => {
            btn.classList.remove('tab-active');
            btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
          });
          
          this.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
          this.classList.add('tab-active');
          
          selectedEmployee = topEmployees[this.dataset.index];
          updateEmployeeDetailChart(selectedEmployee);
        });
        
        employeeTabsContainer.appendChild(tab);
      });
      
      // Show first employee by default
      if (topEmployees.length > 0) {
        selectedEmployee = topEmployees[0];
        updateEmployeeDetailChart(selectedEmployee);
      }
      
      // Update comparison criteria for printing
      updateComparisonCriteria();
    }
    
    // Update employee detail chart
    function updateEmployeeDetailChart(employee) {
      if (!employee) return;
      
      const ctx = document.getElementById('employee-comparison-chart').getContext('2d');
      
      if (employeeComparisonChart) {
        employeeComparisonChart.destroy();
      }
      
      // Calculate average scores for comparison
      const averageScores = [0, 0, 0, 0];
      let filteredData = processedData;
      
      // Filter by period if specified
      if (currentComparisonCriteria.period !== 'all') {
        filteredData = processedData.filter(item => 
          item.periods.includes(currentComparisonCriteria.period) || 
          item.period === currentComparisonCriteria.period
        );
      }
      
      filteredData.forEach(item => {
        for (let i = 0; i < 4; i++) {
          averageScores[i] += item.categoryScores[i];
        }
      });
      
      if (filteredData.length > 0) {
        for (let i = 0; i < 4; i++) {
          averageScores[i] /= filteredData.length;
        }
      }
      
      // Update selected employee name for printing
      selectedEmployeeNameElement.textContent = `พนักงาน: ${employee.employeeName} (${employee.nickname}) ตำแหน่ง: ${employee.position}`;
      
      employeeComparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['ด้านที่ 1', 'ด้านที่ 2', 'ด้านที่ 3', 'ด้านที่ 4'],
          datasets: [
            {
              label: `${employee.employeeName} (${employee.nickname})`,
              data: employee.categoryScores.map(score => score.toFixed(2)),
              backgroundColor: 'rgba(86, 171, 47, 0.2)',
              borderColor: 'rgba(86, 171, 47, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(86, 171, 47, 1)',
              pointRadius: 4
            },
            {
              label: 'คะแนนเฉลี่ยทั้งหมด',
              data: averageScores.map(score => score.toFixed(2)),
              backgroundColor: 'rgba(255, 206, 86, 0.2)',
              borderColor: 'rgba(255, 206, 86, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(255, 206, 86, 1)',
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 5,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
    
    // Print report
    function printReport() {
      window.print();
    }
    
    // Populate filter dropdowns
    function populateFilterDropdowns() {
      // Evaluation period dropdown
      evaluationPeriodSelect.innerHTML = '<option value="all">ทั้งหมด</option>';
      dashboardPeriodSelect.innerHTML = '<option value="all">ทั้งหมด</option>';
      comparisonPeriodSelect.innerHTML = '<option value="all">ทั้งหมด</option>';
      
      uniquePeriods.forEach(period => {
        const option1 = document.createElement('option');
        option1.value = period;
        option1.textContent = period;
        evaluationPeriodSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = period;
        option2.textContent = period;
        dashboardPeriodSelect.appendChild(option2);
        
        const option3 = document.createElement('option');
        option3.value = period;
        option3.textContent = period;
        comparisonPeriodSelect.appendChild(option3);
      });
      
      // Position dropdown
      positionFilterSelect.innerHTML = '<option value="all">ทั้งหมด</option>';
      dashboardPositionSelect.innerHTML = '<option value="all">ทั้งหมด</option>';
      
      uniquePositions.forEach(position => {
        const option1 = document.createElement('option');
        option1.value = position;
        option1.textContent = position;
        positionFilterSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = position;
        option2.textContent = position;
        dashboardPositionSelect.appendChild(option2);
      });
    }
    
    // Scroll to section
    function scrollToSection(sectionId) {
      const section = document.getElementById(sectionId);
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
      });
    }
    
    // Handle sorting when a column header is clicked
    function handleSort(column) {
      // If clicking the same column, toggle direction
      if (column === currentSortColumn) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        // If clicking a new column, set it as current and default to ascending
        currentSortColumn = column;
        currentSortDirection = 'asc';
      }
      
      // Update sort indicators
      updateSortIndicators();
      
      // Sort and render data
      const sortedData = sortData(filteredData, currentSortColumn, currentSortDirection);
      renderResultsTable(sortedData);
    }
    
    // Initialize the application
    async function init() {
      try {
        // Fetch and process data
        allData = await fetchData();
        processedData = aggregateByEmployee(processData(allData));
        filteredData = [...processedData]; // Initialize filtered data with all data
        
        // Populate filter dropdowns
        populateFilterDropdowns();
        
        // Initial render with default sorting
        const sortedData = sortData(filteredData, currentSortColumn, currentSortDirection);
        renderResultsTable(sortedData);
        updateSortIndicators();
        updateDashboardStats(processedData);
        updateEmployeeComparisonChart(processedData);
        
        // Hide loading indicator
        loadingElement.classList.add('hidden');
        
        // Add event listeners for sorting
        sortableHeaders.forEach(header => {
          header.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            handleSort(column);
          });
        });
        
        // Add event listeners for search and filter
        searchButton.addEventListener('click', function() {
          const searchTerm = searchInput.value;
          const period = evaluationPeriodSelect.value;
          const position = positionFilterSelect.value;
          
          // Update current search criteria
          currentSearchCriteria = { searchTerm, period, position };
          
          filteredData = filterData(processedData, searchTerm, period, position);
          const sortedData = sortData(filteredData, currentSortColumn, currentSortDirection);
          renderResultsTable(sortedData);
        });
        
        dashboardFilterButton.addEventListener('click', function() {
          const period = dashboardPeriodSelect.value;
          const position = dashboardPositionSelect.value;
          
          // Update current dashboard criteria
          currentDashboardCriteria = { period, position };
          
          const filteredDashboardData = filterData(processedData, '', period, position);
          updateDashboardStats(filteredDashboardData);
        });
        
        comparisonFilterButton.addEventListener('click', function() {
          const period = comparisonPeriodSelect.value;
          
          // Update current comparison criteria
          currentComparisonCriteria = { period };
          
          updateEmployeeComparisonChart(processedData, period);
        });
        
        printButton.addEventListener('click', printReport);
        
        closeModalButton.addEventListener('click', closeModal);
        modalCloseButton.addEventListener('click', closeModal);
        
        // Close modal when clicking outside
        commentsModal.addEventListener('click', function(event) {
          if (event.target === commentsModal) {
            closeModal();
          }
        });
        
        // Scroll to top button
        window.addEventListener('scroll', function() {
          if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
          } else {
            scrollTopBtn.classList.remove('visible');
          }
        });
        
        scrollTopBtn.addEventListener('click', function() {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
        
      } catch (error) {
        console.error('Error initializing application:', error);
        loadingElement.classList.add('hidden');
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    }
    
    // Start the application
    init();
  