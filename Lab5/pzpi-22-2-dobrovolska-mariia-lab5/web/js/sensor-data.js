// server/web/js/sensor-data.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded for sensor-data page.');

    // Елементи навігації та загальні елементи
    const userNameNav = document.getElementById('userNameNav');
    const userRoleNav = document.getElementById('userRoleNav');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    const userDropdownTrigger = document.getElementById('userDropdownTrigger');
    const userDropdown = document.getElementById('userDropdown');

    // Елементи вкладок
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Вкладка "Останні дані"
    const latestDataDisplay = document.getElementById('latestDataDisplay');

    // Вкладка "Дані пристрою"
    const deviceDataSelect = document.getElementById('deviceDataSelect');
    const deviceDataPeriodFilter = document.getElementById('deviceDataPeriodFilter');
    const deviceDataTypeFilter = document.getElementById('deviceDataTypeFilter');
    const deviceSpecificChartCanvas = document.getElementById('deviceSpecificChart');
    const deviceSpecificDataTableHeader = document.getElementById('deviceSpecificDataTableHeader');
    const deviceSpecificDataTableBody = document.getElementById('deviceSpecificDataTableBody');
    const prevDeviceDataPageBtn = document.getElementById('prevDeviceDataPage');
    const currentDeviceDataPageSpan = document.getElementById('currentDeviceDataPage');
    const nextDeviceDataPageBtn = document.getElementById('nextDeviceDataPage');
    let deviceSpecificChartInstance;
    let currentDeviceDataPage = 1;
    const deviceDataLimit = 15; // Кількість записів на сторінці для "Дані пристрою"

    // Вкладка "Агреговані дані"
    const aggregatedDeviceSelect = document.getElementById('aggregatedDeviceSelect');
    const aggregatedPeriodSelect = document.getElementById('aggregatedPeriodSelect');
    const aggregatedDataDisplay = document.getElementById('aggregatedDataDisplay');

    // Вкладка "Статистика даних"
    const statsDeviceSelect = document.getElementById('statsDeviceSelect');
    const statsPeriodSelect = document.getElementById('statsPeriodSelect');
    const dataStatisticsDisplay = document.getElementById('dataStatisticsDisplay');

    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    // --- Допоміжні функції ---
    function showMessage(element, type, text) {
        if (!element) return;
        element.textContent = text;
        element.className = `message-area ${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 5000);
    }

    if (userDropdownTrigger) {
        userDropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        window.addEventListener('click', (e) => {
            if (userDropdown.classList.contains('show') && !userDropdownTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', () => {
            localStorage.removeItem('jwtToken');
            window.location.href = '/html/login.html';
        });
    }

    // --- Завантаження профілю для навігації ---
    async function fetchUserProfileForNav() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const user = data.data.user;
                userNameNav.textContent = user.name;
                userRoleNav.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                if (user.role === 'admin') adminPanelLink.style.display = 'block';
                else adminPanelLink.style.display = 'none';
            } else {
                localStorage.removeItem('jwtToken');
                window.location.href = '/html/login.html';
            }
        } catch (error) {
            console.error('Network error fetching profile for nav:', error);
            localStorage.removeItem('jwtToken');
            window.location.href = '/html/login.html';
        }
    }

    // --- Логіка перемикання вкладок ---
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            tabLinks.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            link.classList.add('active');
            const targetTabId = link.dataset.tab + 'Tab';
            document.getElementById(targetTabId).classList.add('active');
            loadTabData(link.dataset.tab); // Завантажити дані для активної вкладки
        });
    });

    function loadTabData(tabId) {
        switch (tabId) {
            case 'latest-data':
                fetchLatestDataForAllDevices();
                break;
            case 'device-data':
                // Завантажується при виборі пристрою/фільтрів
                updateDeviceSpecificDataView();
                break;
            case 'aggregated-data':
                // Завантажується при виборі пристрою/фільтрів
                updateAggregatedDataView();
                break;
            case 'data-statistics':
                // Завантажується при виборі пристрою/фільтрів
                updateDataStatisticsView();
                break;
        }
    }

    // --- Завантаження списку пристроїв для селекторів ---
    let userDevices = [];
    async function populateDeviceSelectors() {
        try {
            const response = await fetch('/api/devices', { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                userDevices = data.data.devices;
                const defaultOption = '<option value="">-- Виберіть пристрій --</option>';
                
                deviceDataSelect.innerHTML = defaultOption;
                aggregatedDeviceSelect.innerHTML = defaultOption;
                statsDeviceSelect.innerHTML = defaultOption;

                userDevices.forEach(device => {
                    const option = `<option value="${device.deviceId}">${device.name} (${device.deviceId})</option>`;
                    deviceDataSelect.innerHTML += option;
                    aggregatedDeviceSelect.innerHTML += option;
                    statsDeviceSelect.innerHTML += option;
                });
            } else {
                console.error('Failed to load devices for selectors:', data.message);
            }
        } catch (error) {
            console.error('Network error loading devices for selectors:', error);
        }
    }

    // --- Логіка вкладки "Останні дані" ---
    async function fetchLatestDataForAllDevices() {
        latestDataDisplay.innerHTML = '<p>Завантаження останніх даних...</p>';
        try {
            const response = await fetch('/api/data/latest', { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                displayLatestDataCards(data.data.devices);
            } else {
                latestDataDisplay.innerHTML = `<p class="error">Помилка завантаження: ${data.message}</p>`;
            }
        } catch (error) {
            latestDataDisplay.innerHTML = `<p class="error">Мережева помилка: ${error.message}</p>`;
        }
    }

    function displayLatestDataCards(devicesData) {
        if (!devicesData || devicesData.length === 0) {
            latestDataDisplay.innerHTML = '<p>Немає пристроїв або даних для відображення.</p>';
            return;
        }
        latestDataDisplay.innerHTML = ''; // Очистити попередні дані
        devicesData.forEach(deviceEntry => {
            const card = document.createElement('div');
            card.className = 'sensor-card';
            let content = `<h4>${deviceEntry.device.name} (${deviceEntry.device.status})</h4>`;
            if (deviceEntry.data) {
                content += `
                    <p>Температура: <strong>${deviceEntry.data.temperature.toFixed(1)}°C</strong></p>
                    <p>Вологість: <strong>${deviceEntry.data.humidity.toFixed(1)}%</strong></p>
                    <p>Освітлення: <strong>${deviceEntry.data.lightLevel}</strong></p>
                    <p class="timestamp">Оновлено: ${new Date(deviceEntry.data.timestamp).toLocaleString()}</p>
                `;
            } else {
                content += '<p>Немає останніх даних.</p>';
            }
            card.innerHTML = content;
            latestDataDisplay.appendChild(card);
        });
    }

    // --- Логіка вкладки "Дані пристрою" ---
    deviceDataSelect.addEventListener('change', () => { currentDeviceDataPage = 1; updateDeviceSpecificDataView(); });
    deviceDataPeriodFilter.addEventListener('change', () => { currentDeviceDataPage = 1; updateDeviceSpecificDataView(); });
    deviceDataTypeFilter.addEventListener('change', () => { currentDeviceDataPage = 1; updateDeviceSpecificDataView(); });
    prevDeviceDataPageBtn.addEventListener('click', () => {
        if (currentDeviceDataPage > 1) {
            currentDeviceDataPage--;
            updateDeviceSpecificDataView(false); // не скидувати графік
        }
    });
    nextDeviceDataPageBtn.addEventListener('click', () => {
        currentDeviceDataPage++;
        updateDeviceSpecificDataView(false); // не скидувати графік
    });


    async function updateDeviceSpecificDataView(renderChart = true) {
        const deviceId = deviceDataSelect.value;
        const periodFilter = deviceDataPeriodFilter.value; // 'hourly', 'daily', 'monthly'
        const dataTypeFilter = deviceDataTypeFilter.value; // 'all', 'temperature', ...

        if (!deviceId) {
            deviceSpecificDataTableBody.innerHTML = '<tr><td colspan="4">Виберіть пристрій.</td></tr>';
            if (deviceSpecificChartInstance) deviceSpecificChartInstance.destroy();
            return;
        }

        // Для графіка завжди використовуємо агреговані дані
        if (renderChart) {
            let aggPeriod = 'hourly';
            let aggDays = 1;
            if (periodFilter === 'daily') { aggDays = 7; aggPeriod = 'daily';}
            else if (periodFilter === 'monthly') { aggDays = 30; aggPeriod = 'daily'; } // для місяця теж агрегуємо по днях
            
            fetchAndRenderDeviceSpecificChart(deviceId, aggPeriod, aggDays);
        }
        
        // Для таблиці - детальні дані з пагінацією
        fetchDeviceSpecificTableData(deviceId, periodFilter, dataTypeFilter);
    }
    
    async function fetchAndRenderDeviceSpecificChart(deviceId, aggregationPeriod, days) {
        try {
            const response = await fetch(`/api/data/${deviceId}/aggregated?period=${aggregationPeriod}&days=${days}`, { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                renderDeviceDataChart(data.data.aggregatedData, aggregationPeriod);
            } else {
                if (deviceSpecificChartInstance) deviceSpecificChartInstance.destroy();
                console.error('Error loading chart data:', data.message);
            }
        } catch (error) {
            if (deviceSpecificChartInstance) deviceSpecificChartInstance.destroy();
            console.error('Network error loading chart data:', error);
        }
    }

    function renderDeviceDataChart(aggregatedData, period) {
        if (deviceSpecificChartInstance) {
            deviceSpecificChartInstance.destroy();
        }
        if (!aggregatedData || aggregatedData.length === 0) {
            const ctx = deviceSpecificChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, deviceSpecificChartCanvas.width, deviceSpecificChartCanvas.height);
            ctx.fillText('Немає даних для графіка за вибраний період.', deviceSpecificChartCanvas.width/2, deviceSpecificChartCanvas.height/2);
            return;
        }

        const labels = aggregatedData.map(d => {
            const date = new Date(d._id.year, d._id.month - 1, d._id.day, d._id.hour || 0);
            return period === 'hourly' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
        });

        deviceSpecificChartInstance = new Chart(deviceSpecificChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Температура (°C)',
                        data: aggregatedData.map(d => d.avgTemperature?.toFixed(1)),
                        borderColor: '#dc3545', fill: false, tension: 0.1
                    },
                    {
                        label: 'Вологість (%)',
                        data: aggregatedData.map(d => d.avgHumidity?.toFixed(1)),
                        borderColor: '#1a73e8', fill: false, tension: 0.1
                    },
                    {
                        label: 'Освітлення',
                        data: aggregatedData.map(d => d.avgLightLevel?.toFixed(0)),
                        borderColor: '#ffc107', fill: false, tension: 0.1, hidden: true
                    }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } } }
        });
    }
    
    async function fetchDeviceSpecificTableData(deviceId, periodFilter, dataTypeFilter) {
        deviceSpecificDataTableBody.innerHTML = `<tr><td colspan="4">Завантаження даних...</td></tr>`;
        let startDate, endDate = new Date();
        switch(periodFilter) {
            case 'hourly': // last 24 hours
                startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'daily': // last 7 days
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly': // last 30 days
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        const queryParams = new URLSearchParams({
            page: currentDeviceDataPage,
            limit: deviceDataLimit,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        try {
            const response = await fetch(`/api/data/${deviceId}?${queryParams.toString()}`, { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                displayDeviceSpecificTable(data.data.sensorData, dataTypeFilter, data.pagination);
            } else {
                deviceSpecificDataTableBody.innerHTML = `<tr><td colspan="4">Помилка: ${data.message}</td></tr>`;
            }
        } catch (error) {
            deviceSpecificDataTableBody.innerHTML = `<tr><td colspan="4">Мережева помилка: ${error.message}</td></tr>`;
        }
    }

    function displayDeviceSpecificTable(sensorData, dataTypeFilter, pagination) {
        deviceSpecificDataTableHeader.innerHTML = ''; // Clear previous headers
        deviceSpecificDataTableBody.innerHTML = ''; // Clear previous data

        if (!sensorData || sensorData.length === 0) {
            deviceSpecificDataTableBody.innerHTML = `<tr><td colspan="4">Немає даних за вибраний період.</td></tr>`;
            currentDeviceDataPageSpan.textContent = `Сторінка ${pagination.page} з ${pagination.pages}`;
            prevDeviceDataPageBtn.disabled = pagination.page === 1;
            nextDeviceDataPageBtn.disabled = pagination.page === pagination.pages || pagination.pages === 0;
            return;
        }

        let headers = ['Час'];
        if (dataTypeFilter === 'all' || dataTypeFilter === 'temperature') headers.push('Температура (°C)');
        if (dataTypeFilter === 'all' || dataTypeFilter === 'humidity') headers.push('Вологість (%)');
        if (dataTypeFilter === 'all' || dataTypeFilter === 'lightLevel') headers.push('Освітлення');
        
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            deviceSpecificDataTableHeader.appendChild(th);
        });


        sensorData.forEach(record => {
            const row = document.createElement('tr');
            let rowContent = `<td>${new Date(record.timestamp).toLocaleString()}</td>`;
            if (dataTypeFilter === 'all' || dataTypeFilter === 'temperature') rowContent += `<td>${record.temperature.toFixed(1)}</td>`;
            if (dataTypeFilter === 'all' || dataTypeFilter === 'humidity') rowContent += `<td>${record.humidity.toFixed(1)}</td>`;
            if (dataTypeFilter === 'all' || dataTypeFilter === 'lightLevel') rowContent += `<td>${record.lightLevel}</td>`;
            row.innerHTML = rowContent;
            deviceSpecificDataTableBody.appendChild(row);
        });
        
        currentDeviceDataPageSpan.textContent = `Сторінка ${pagination.page} з ${pagination.pages}`;
        prevDeviceDataPageBtn.disabled = pagination.page === 1;
        nextDeviceDataPageBtn.disabled = pagination.page === pagination.pages;
    }


    // --- Логіка вкладки "Агреговані дані" ---
    aggregatedDeviceSelect.addEventListener('change', updateAggregatedDataView);
    aggregatedPeriodSelect.addEventListener('change', updateAggregatedDataView);

    async function updateAggregatedDataView() {
        const deviceId = aggregatedDeviceSelect.value;
        const period = aggregatedPeriodSelect.value.split('(')[0].trim(); // hourly, daily, weekly
        let days = 1;
        if (period === 'daily') days = 7;
        else if (period === 'weekly') days = 30;

        if (!deviceId) {
            aggregatedDataDisplay.innerHTML = '<p>Виберіть пристрій.</p>';
            return;
        }
        aggregatedDataDisplay.innerHTML = '<p>Завантаження агрегованих даних...</p>';

        try {
            const response = await fetch(`/api/data/${deviceId}/aggregated?period=${period}&days=${days}`, { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                displayAggregatedDataCards(data.data.aggregatedData, period);
            } else {
                aggregatedDataDisplay.innerHTML = `<p class="error">Помилка: ${data.message}</p>`;
            }
        } catch (error) {
            aggregatedDataDisplay.innerHTML = `<p class="error">Мережева помилка: ${error.message}</p>`;
        }
    }

    function displayAggregatedDataCards(aggregatedData, periodText) {
        if (!aggregatedData || aggregatedData.length === 0) {
            aggregatedDataDisplay.innerHTML = `<p>Немає агрегованих даних за період "${periodText}".</p>`;
            return;
        }
        aggregatedDataDisplay.innerHTML = `<h3>Агреговані дані (період: ${periodText})</h3>`;
        
        const table = document.createElement('table');
        table.className = 'device-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Період</th>
                    <th>Середня t°C</th>
                    <th>Мін t°C</th>
                    <th>Макс t°C</th>
                    <th>Середня H%</th>
                    <th>Мін H%</th>
                    <th>Макс H%</th>
                    <th>Середнє світло</th>
                    <th>Записів</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        aggregatedData.forEach(item => {
            const periodLabel = item._id.hour !== undefined ? 
                `${item._id.day}/${item._id.month}/${item._id.year} ${String(item._id.hour).padStart(2, '0')}:00` :
                (item._id.week !== undefined ? 
                    `Тиждень ${item._id.week}/${item._id.year}` : 
                    `${item._id.day}/${item._id.month}/${item._id.year}`);

            const row = `
                <tr>
                    <td>${periodLabel}</td>
                    <td>${item.avgTemperature?.toFixed(1) ?? 'N/A'}</td>
                    <td>${item.minTemperature?.toFixed(1) ?? 'N/A'}</td>
                    <td>${item.maxTemperature?.toFixed(1) ?? 'N/A'}</td>
                    <td>${item.avgHumidity?.toFixed(1) ?? 'N/A'}</td>
                    <td>${item.minHumidity?.toFixed(1) ?? 'N/A'}</td>
                    <td>${item.maxHumidity?.toFixed(1) ?? 'N/A'}</td>
                    <td>${item.avgLightLevel?.toFixed(0) ?? 'N/A'}</td>
                    <td>${item.dataPoints}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        aggregatedDataDisplay.appendChild(table);
    }

    // --- Логіка вкладки "Статистика даних" ---
    statsDeviceSelect.addEventListener('change', updateDataStatisticsView);
    statsPeriodSelect.addEventListener('change', updateDataStatisticsView);

    async function updateDataStatisticsView() {
        const deviceId = statsDeviceSelect.value;
        const days = statsPeriodSelect.value;

        if (!deviceId) {
            dataStatisticsDisplay.innerHTML = '<p>Виберіть пристрій.</p>';
            return;
        }
        dataStatisticsDisplay.innerHTML = '<p>Завантаження статистики...</p>';

        try {
            const response = await fetch(`/api/data/${deviceId}/statistics?days=${days}`, { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.data.statistics) {
                displayStatisticsCards(data.data.statistics, days);
            } else {
                dataStatisticsDisplay.innerHTML = `<p class="error">Помилка: ${data.message || 'Немає даних для статистики'}</p>`;
            }
        } catch (error) {
            dataStatisticsDisplay.innerHTML = `<p class="error">Мережева помилка: ${error.message}</p>`;
        }
    }
    
    function displayStatisticsCards(stats, periodDays) {
        dataStatisticsDisplay.innerHTML = `<h3>Статистика за ${periodDays} днів</h3>`;
        const grid = document.createElement('div');
        grid.className = 'summary-grid'; // Reuse summary-grid styling

        function createStatCard(title, value, unit = '') {
            const card = document.createElement('div');
            card.className = 'summary-card'; // Reuse summary-card styling
            card.innerHTML = `<h3>${title}</h3><p>${value !== null && value !== undefined ? value.toFixed(1) + unit : 'N/A'}</p>`;
            return card;
        }
        
        if (stats._id === null) { // _id is null when aggregation is over all matched docs
            grid.appendChild(createStatCard('Всього записів', stats.totalDataPoints || 0, ''));
            grid.appendChild(createStatCard('Середня Температура', stats.avgTemperature, '°C'));
            grid.appendChild(createStatCard('Мін. Температура', stats.minTemperature, '°C'));
            grid.appendChild(createStatCard('Макс. Температура', stats.maxTemperature, '°C'));
            grid.appendChild(createStatCard('Середня Вологість', stats.avgHumidity, '%'));
            grid.appendChild(createStatCard('Мін. Вологість', stats.minHumidity, '%'));
            grid.appendChild(createStatCard('Макс. Вологість', stats.maxHumidity, '%'));
            grid.appendChild(createStatCard('Середнє Освітлення', stats.avgLightLevel, ''));
            grid.appendChild(createStatCard('Відхилення Темп.', stats.temperatureStdDev, '°C'));
            grid.appendChild(createStatCard('Відхилення Вол.', stats.humidityStdDev, '%'));

            dataStatisticsDisplay.appendChild(grid);

            const firstReadingP = document.createElement('p');
            firstReadingP.innerHTML = `<strong>Перший запис за період:</strong> ${stats.firstReading ? new Date(stats.firstReading).toLocaleString() : 'N/A'}`;
            dataStatisticsDisplay.appendChild(firstReadingP);

            const lastReadingP = document.createElement('p');
            lastReadingP.innerHTML = `<strong>Останній запис за період:</strong> ${stats.lastReading ? new Date(stats.lastReading).toLocaleString() : 'N/A'}`;
            dataStatisticsDisplay.appendChild(lastReadingP);

        } else {
             dataStatisticsDisplay.innerHTML = `<p>Немає статистики для відображення за ${periodDays} днів.</p>`;
        }
    }


    // --- Початкове завантаження ---
    await fetchUserProfileForNav();
    await populateDeviceSelectors();
    loadTabData('latest-data'); // Завантажити дані для вкладки за замовчуванням

});