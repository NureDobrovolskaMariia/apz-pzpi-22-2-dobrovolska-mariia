document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded for dashboard.');

    const userNameNav = document.getElementById('userNameNav');
    const userRoleNav = document.getElementById('userRoleNav');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    const userDropdownTrigger = document.getElementById('userDropdownTrigger');
    const userDropdown = document.getElementById('userDropdown');

    
    const onlineDevicesCount = document.getElementById('onlineDevicesCount');
    const activeAlertsCount = document.getElementById('activeAlertsCount');
    const avgTemperature = document.getElementById('avgTemperature');
    const avgHumidity = document.getElementById('avgHumidity');
    const avgLightLevel = document.getElementById('avgLightLevel'); 


    const deviceSelect = document.getElementById('deviceSelect');
    const sensorDataChartCanvas = document.getElementById('sensorDataChart');
    let sensorChart;

    const actionDeviceSelect = document.getElementById('actionDeviceSelect');
    const turnEggsBtn = document.getElementById('turnEggsBtn');
    const enableAutoModeBtn = document.getElementById('enableAutoModeBtn');
    const disableAutoModeBtn = document.getElementById('disableAutoModeBtn');
    const emergencyStopBtn = document.getElementById('emergencyStopBtn');
    const quickActionMessage = document.getElementById('quickActionMessage');
    const customCommandSelect = document.getElementById('customCommandSelect');
    const sendCustomCommandBtn = document.getElementById('sendCustomCommandBtn');

    const deviceListDiv = document.getElementById('deviceList');
    const latestSensorDataDiv = document.getElementById('latestSensorData');
    const unresolvedAlertsDiv = document.getElementById('unresolvedAlerts');


    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    function showMessage(element, type, text) {
        if (!element) {
            console.error("Attempted to show message but target element is null for:", text);
            return;
        }
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
            if (userDropdown && userDropdown.classList.contains('show') && !userDropdownTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/html/login.html';
    };

 
    const originalLogoutBtn = document.getElementById('logoutBtn'); 
    if (originalLogoutBtn) { 
        originalLogoutBtn.addEventListener('click', handleLogout);
    }
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', handleLogout);
    }

     async function fetchUserProfile() { 
        console.log('Fetching user profile...');
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const user = data.data.user;
                if (userNameNav) userNameNav.textContent = user.name;
                if (userRoleNav) userRoleNav.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                console.log(`User profile loaded: ${user.name} (${user.role})`);

                if (adminPanelLink) {
                    if (user.role === 'admin') {
                        adminPanelLink.style.display = 'block';
                    } else {
                        adminPanelLink.style.display = 'none';
                    }
                }
                return user;
            } else {
                console.error('Ошибка загрузки профиля (non-OK status):', data.message);
                localStorage.removeItem('jwtToken');
                window.location.href = '/html/login.html';
            }
        } catch (error) {
            console.error('Ошибка сети при загрузке профиля:', error);
            localStorage.removeItem('jwtToken');
            window.location.href = '/html/login.html';
        }
    }


     async function fetchRealTimeSummary() {
        console.log('Fetching real-time summary for dashboard cards...');
     
        const onlineDevicesCountEl = document.getElementById('onlineDevicesCount');
        const activeAlertsCountEl = document.getElementById('activeAlertsCount');
        const avgTemperatureEl = document.getElementById('avgTemperature');
        const avgHumidityEl = document.getElementById('avgHumidity');
        const avgLightLevelEl = document.getElementById('avgLightLevel');

        try {
            const response = await fetch('/api/data/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('fetchRealTimeSummary - API Response Status:', response.status);
            const data = await response.json();
            console.log('fetchRealTimeSummary - API Response Data:', JSON.stringify(data, null, 2));

            if (response.ok && data.data && data.data.summary) {
                const summary = data.data.summary;

                
                if (onlineDevicesCountEl) {
                    onlineDevicesCountEl.textContent = `${summary.onlineDevices || 0} / ${summary.totalDevices || 0}`;
                }
                console.log(`Dashboard Update: Online Devices from API = ${summary.onlineDevices || 0}, Total Devices = ${summary.totalDevices || 0}`);

         
                if (activeAlertsCountEl) {
                    try {
                        const alertsResponse = await fetch('/api/alerts?isResolved=false&limit=1', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const alertsData = await alertsResponse.json();
                        if (alertsResponse.ok && alertsData.pagination) {
                            activeAlertsCountEl.textContent = alertsData.pagination.total;
                            console.log(`Dashboard Update: Active Alerts = ${alertsData.pagination.total}`);
                        } else {
                            activeAlertsCountEl.textContent = 'N/A';
                            console.error('Failed to load active alerts for summary:', alertsData.message || 'Pagination data missing');
                        }
                    } catch (alertsError) {
                        activeAlertsCountEl.textContent = 'N/A';
                        console.error('Network error fetching active alerts:', alertsError);
                    }
                }

                let sumTemp = 0;
                let sumHum = 0;
                let sumLight = 0;
                let countTemp = 0;
                let countHum = 0;
                let countLight = 0;

                if (summary.devices && Array.isArray(summary.devices)) {
                    summary.devices.forEach(device => {
                      
                        if (device.latestData) {
                            if (typeof device.latestData.temperature === 'number' && !isNaN(device.latestData.temperature)) {
                                sumTemp += device.latestData.temperature;
                                countTemp++;
                            }
                            if (typeof device.latestData.humidity === 'number' && !isNaN(device.latestData.humidity)) {
                                sumHum += device.latestData.humidity;
                                countHum++;
                            }
                            if (typeof device.latestData.lightLevel === 'number' && !isNaN(device.latestData.lightLevel)) {
                                sumLight += device.latestData.lightLevel;
                                countLight++;
                            }
                        }
                    });
                }
                
                console.log(`Data for averaging based on available latestData: countTemp=${countTemp}, countHum=${countHum}, countLight=${countLight}`);

                if (avgTemperatureEl) {
                    avgTemperatureEl.textContent = countTemp > 0 ? `${(sumTemp / countTemp).toFixed(1)}°C` : 'N/A';
                }
                if (avgHumidityEl) {
                    avgHumidityEl.textContent = countHum > 0 ? `${(sumHum / countHum).toFixed(1)}%` : 'N/A';
                }
                if (avgLightLevelEl) {
                    avgLightLevelEl.textContent = countLight > 0 ? `${(sumLight / countLight).toFixed(0)}` : 'N/A';
                }
                
                console.log(`Dashboard Update: Avg Temp = ${avgTemperatureEl ? avgTemperatureEl.textContent : 'N/A'}, Avg Hum = ${avgHumidityEl ? avgHumidityEl.textContent : 'N/A'}, Avg Light = ${avgLightLevelEl ? avgLightLevelEl.textContent : 'N/A'}`);

            } else {
                console.error('Error loading real-time summary from API (non-OK status or unexpected data structure):', data.message || data);
                if (onlineDevicesCountEl) onlineDevicesCountEl.textContent = 'N/A';
                if (activeAlertsCountEl) activeAlertsCountEl.textContent = 'N/A';
                if (avgTemperatureEl) avgTemperatureEl.textContent = 'N/A';
                if (avgHumidityEl) avgHumidityEl.textContent = 'N/A';
                if (avgLightLevelEl) avgLightLevelEl.textContent = 'N/A';
            }
        } catch (error) {
            console.error('Network error fetching real-time summary:', error);
            if (onlineDevicesCountEl) onlineDevicesCountEl.textContent = 'N/A';
            if (activeAlertsCountEl) activeAlertsCountEl.textContent = 'N/A';
            if (avgTemperatureEl) avgTemperatureEl.textContent = 'N/A';
            if (avgHumidityEl) avgHumidityEl.textContent = 'N/A';
            if (avgLightLevelEl) avgLightLevelEl.textContent = 'N/A';
        }
    }



    async function populateDeviceSelects() {
        if (!deviceSelect || !actionDeviceSelect) {
            console.warn('Device select dropdowns not found on dashboard page.');
            return;
        }

        console.log('Populating device select dropdowns...');
        try {
            const response = await fetch('/api/devices', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const devices = data.data.devices;
                deviceSelect.innerHTML = '<option value="">Виберіть пристрій...</option>';
                actionDeviceSelect.innerHTML = '<option value="">Виберіть пристрій...</option>';
                if (devices.length > 0) {
                    devices.forEach(device => {
                        const optionText = `${device.name} (${device.deviceId})`;
                        const option1 = new Option(optionText, device.deviceId);
                        const option2 = new Option(optionText, device.deviceId);
                        deviceSelect.appendChild(option1);
                        actionDeviceSelect.appendChild(option2);
                    });
                    deviceSelect.value = devices[0].deviceId;
                    actionDeviceSelect.value = devices[0].deviceId;
                    fetchChartData(devices[0].deviceId);
                } else {
                    if (sensorChart) sensorChart.destroy();
                     const ctx = sensorDataChartCanvas.getContext('2d');
                    ctx.clearRect(0, 0, sensorDataChartCanvas.width, sensorDataChartCanvas.height);
                    ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
                    ctx.fillText('Немає пристроїв для відображення графіка.', sensorDataChartCanvas.width / 2, sensorDataChartCanvas.height / 2);
                }
            } else {
                deviceSelect.innerHTML = '<option value="">Помилка завантаження</option>';
                actionDeviceSelect.innerHTML = '<option value="">Помилка завантаження</option>';
            }
        } catch (error) {
            console.error('Ошибка сети при загрузке устройств для выбора:', error);
            deviceSelect.innerHTML = '<option value="">Помилка мережі</option>';
            actionDeviceSelect.innerHTML = '<option value="">Помилка мережі</option>';
        }
    }

    async function fetchChartData(deviceId) {
        if (!sensorDataChartCanvas) return; 
        console.log('Fetching chart data for device:', deviceId);

        if (!deviceId) {
            if (sensorChart) sensorChart.destroy();
            const ctx = sensorDataChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, sensorDataChartCanvas.width, sensorDataChartCanvas.height);
            ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
            ctx.fillText('Будь ласка, виберіть пристрій.', sensorDataChartCanvas.width / 2, sensorDataChartCanvas.height / 2);
            return;
        }
        try {
            const response = await fetch(`/api/data/${deviceId}/aggregated?period=hourly&days=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                renderChart(data.data.aggregatedData);
            } else {
                if (sensorChart) sensorChart.destroy();
                const ctx = sensorDataChartCanvas.getContext('2d');
                ctx.clearRect(0, 0, sensorDataChartCanvas.width, sensorDataChartCanvas.height);
                ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
                ctx.fillText('Помилка завантаження даних для графіка.', sensorDataChartCanvas.width / 2, sensorDataChartCanvas.height / 2);
            }
        } catch (error) {
            console.error('Ошибка сети при загрузке данных для графика:', error);
            if (sensorChart) sensorChart.destroy();
            const ctx = sensorDataChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, sensorDataChartCanvas.width, sensorDataChartCanvas.height);
            ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
            ctx.fillText('Помилка мережі під час завантаження графіка.', sensorDataChartCanvas.width / 2, sensorDataChartCanvas.height / 2);
        }
    }

    function renderChart(aggregatedData) {
        if (!sensorDataChartCanvas) return;

        console.log('Rendering chart with data:', aggregatedData);
        if (sensorChart) {
            sensorChart.destroy();
        }
        if (!aggregatedData || aggregatedData.length === 0) {
            const ctx = sensorDataChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, sensorDataChartCanvas.width, sensorDataChartCanvas.height);
            ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
            ctx.fillText('Немає даних за останні 24 години для обраного пристрою.', sensorDataChartCanvas.width / 2, sensorDataChartCanvas.height / 2);
            return;
        }
        const labels = aggregatedData.map(d => {
            const date = new Date(d._id.year, d._id.month - 1, d._id.day, d._id.hour || 0);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        const temperatures = aggregatedData.map(d => d.avgTemperature !== undefined && d.avgTemperature !== null ? d.avgTemperature.toFixed(1) : null);
        const humidities = aggregatedData.map(d => d.avgHumidity !== undefined && d.avgHumidity !== null ? d.avgHumidity.toFixed(1) : null);
        const lightLevels = aggregatedData.map(d => d.avgLightLevel !== undefined && d.avgLightLevel !== null ? d.avgLightLevel.toFixed(0) : null);

        sensorChart = new Chart(sensorDataChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Температура (°C)', data: temperatures, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: false, tension: 0.1 },
                    { label: 'Вологість (%)', data: humidities, borderColor: '#1a73e8', backgroundColor: 'rgba(26, 115, 232, 0.1)', fill: false, tension: 0.1 },
                    { label: 'Освітлення', data: lightLevels, borderColor: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.1)', fill: false, tension: 0.1, hidden: true }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } }, plugins: { legend: { display: true, position: 'top' }, tooltip: { mode: 'index', intersect: false } } }
        });
    }
    
    if (deviceSelect) {
      deviceSelect.addEventListener('change', (e) => fetchChartData(e.target.value));
    }

    async function sendQuickAction(actionType) {
        if (!actionDeviceSelect || !quickActionMessage) return;

        const selectedDeviceId = actionDeviceSelect.value;
        if (!selectedDeviceId) {
            showMessage(quickActionMessage, 'error', 'Будь ласка, виберіть пристрій для дії.');
            return;
        }
        try {
            const response = await fetch(`/api/devices/${selectedDeviceId}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: actionType }),
            });
            const data = await response.json();
            showMessage(quickActionMessage, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Дія виконана' : 'Помилка дії'));
        } catch (error) {
            showMessage(quickActionMessage, 'error', 'Помилка мережі при виконанні дії.');
        }
    }

    if (turnEggsBtn) turnEggsBtn.addEventListener('click', () => sendQuickAction('turn_eggs'));
    if (enableAutoModeBtn) enableAutoModeBtn.addEventListener('click', () => sendQuickAction('enable_auto'));
    if (disableAutoModeBtn) disableAutoModeBtn.addEventListener('click', () => sendQuickAction('disable_auto'));
    if (emergencyStopBtn) emergencyStopBtn.addEventListener('click', () => sendQuickAction('emergency_stop'));

    if (sendCustomCommandBtn && customCommandSelect && actionDeviceSelect && quickActionMessage) {

        sendCustomCommandBtn.addEventListener('click', async () => {
            const selectedDeviceId = actionDeviceSelect.value;
            const selectedCommandKey = customCommandSelect.value;
            if (!selectedDeviceId) { showMessage(quickActionMessage, 'error', 'Будь ласка, виберіть пристрій для дії.'); return; }
            if (!selectedCommandKey) { showMessage(quickActionMessage, 'error', 'Будь ласка, виберіть команду.'); return; }
            let commandPayload = {};
            if (selectedCommandKey === 'heater_on') commandPayload['heater'] = true;
            else if (selectedCommandKey === 'heater_off') commandPayload['heater'] = false;
            else if (selectedCommandKey === 'humidifier_on') commandPayload['humidifier'] = true;
            else if (selectedCommandKey === 'humidifier_off') commandPayload['humidifier'] = false;
            else { showMessage(quickActionMessage, 'error', 'Невідома команда.'); return; }
            try {
                const response = await fetch(`/api/devices/${selectedDeviceId}/command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ command: commandPayload }),
                });
                const data = await response.json();
                showMessage(quickActionMessage, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Команду надіслано' : 'Помилка команди'));
                if (response.ok) { fetchLatestSensorDataSummary(); fetchRealTimeSummary(); } // Оновлюємо дані
            } catch (error) {
                showMessage(quickActionMessage, 'error', 'Помилка мережі під час надсилання команди.');
            }
        });
    }

    async function fetchUserDevices() {
        if (!deviceListDiv) return;

        deviceListDiv.innerHTML = '<p>Завантаження даних про пристрої...</p>';
        try {
            const response = await fetch('/api/devices', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok) displayDevices(data.data.devices);
            else deviceListDiv.innerHTML = `<p class="error">Не вдалося завантажити пристрої: ${data.message}</p>`;
        } catch (error) { deviceListDiv.innerHTML = '<p class="error">Помилка мережі при завантаженні пристроїв.</p>'; }
    }

    function displayDevices(devices) {
        if (!deviceListDiv) return;

        if (!devices || devices.length === 0) { deviceListDiv.innerHTML = '<p>У вас поки немає зареєстрованих пристроїв.</p>'; return; }
        deviceListDiv.innerHTML = '';
        devices.forEach(device => {
            const item = document.createElement('div');
            item.className = `device-item ${device.status === 'online' ? 'online' : 'offline'}`;
            item.innerHTML = `<div><h3>${device.name} (${device.deviceId})</h3><p>Статус: <strong>${device.status.charAt(0).toUpperCase() + device.status.slice(1)}</strong></p><p>Остання активність: ${new Date(device.lastSeen).toLocaleString()}</p></div><div><button class="btn btn-sm secondary-btn view-device-details-btn" data-device-id="${device.deviceId}">Детальніше</button></div>`;
            deviceListDiv.appendChild(item);
        });
        document.querySelectorAll('.view-device-details-btn').forEach(btn => btn.addEventListener('click', e => window.location.href = `/html/devices.html?id=${e.target.dataset.deviceId}`));
    }

    async function fetchLatestSensorDataSummary() {
        if (!latestSensorDataDiv) return;

        latestSensorDataDiv.innerHTML = '<p>Завантаження останніх даних...</p>';
        try {
            const response = await fetch('/api/data/latest', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok) displayLatestSensorData(data.data.devices);
            else latestSensorDataDiv.innerHTML = `<p class="error">Не вдалося завантажити дані: ${data.message}</p>`;
        } catch (error) { latestSensorDataDiv.innerHTML = '<p class="error">Помилка мережі при завантаженні даних.</p>'; }
    }

    function displayLatestSensorData(devicesData) {
        if (!latestSensorDataDiv) return;

        if (!devicesData || devicesData.length === 0 || devicesData.every(d => !d.data)) { latestSensorDataDiv.innerHTML = '<p>Немає доступних даних з датчиків.</p>'; return; }
        latestSensorDataDiv.innerHTML = '';
        devicesData.forEach(entry => {
            if (entry.data) {
                const card = document.createElement('div');
                card.className = 'sensor-card';
                card.innerHTML = `<h4>${entry.device.name} (${entry.device.status})</h4><p>Температура: <strong>${entry.data.temperature.toFixed(1)}°C</strong></p><p>Вологість: <strong>${entry.data.humidity.toFixed(1)}%</strong></p><p>Освітлення: <strong>${entry.data.lightLevel}</strong></p><p class="timestamp">Оновлено: ${new Date(entry.data.timestamp).toLocaleString()}</p>`;
                latestSensorDataDiv.appendChild(card);
            }
        });
    }

    async function fetchUnresolvedAlerts() {
        if (!unresolvedAlertsDiv) return;

        unresolvedAlertsDiv.innerHTML = '<p>Завантаження сповіщень...</p>';
        try {
            const response = await fetch('/api/alerts?isResolved=false&limit=5&sort=-createdAt', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok) displayUnresolvedAlerts(data.data.alerts);
            else unresolvedAlertsDiv.innerHTML = `<p class="error">Не вдалося завантажити сповіщення: ${data.message}</p>`;
        } catch (error) { unresolvedAlertsDiv.innerHTML = '<p class="error">Помилка мережі при завантаженні сповіщень.</p>';}
    }

    function displayUnresolvedAlerts(alerts) {
        if (!unresolvedAlertsDiv) return;

        if (!alerts || alerts.length === 0) { unresolvedAlertsDiv.innerHTML = '<p>Немає активних сповіщень.</p>'; return; }
        unresolvedAlertsDiv.innerHTML = '';
        alerts.forEach(alert => {
            const item = document.createElement('div');
            item.className = `alert-item alert-item-${alert.severity.toLowerCase()} ${alert.isResolved ? 'resolved' : ''}`;
            const deviceName = alert.deviceId && alert.deviceId.name ? alert.deviceId.name : (alert.deviceId || 'Невідомий пристрій');
            item.innerHTML = `<h4>Тип: ${alert.type} (${alert.severity}) - Пристрій: ${deviceName}</h4><p>Повідомлення: ${alert.message}</p><p>Час: ${new Date(alert.createdAt).toLocaleString()}</p>${!alert.isResolved ? `<button class="btn btn-sm primary-btn resolve-alert-dashboard-btn" data-alert-id="${alert._id}">Вирішити</button>` : ''}`;
            unresolvedAlertsDiv.appendChild(item);
        });
        document.querySelectorAll('.resolve-alert-dashboard-btn').forEach(btn => btn.addEventListener('click', e => resolveAlertFromDashboard(e.target.dataset.alertId)));
    }
    
    async function resolveAlertFromDashboard(alertId) {

        try {
            const response = await fetch(`/api/alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (quickActionMessage) showMessage(quickActionMessage, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Сповіщення вирішено!' : 'Помилка вирішення сповіщення.'));
            if (response.ok) { fetchUnresolvedAlerts(); fetchRealTimeSummary(); }
        } catch (error) {
            if (quickActionMessage) showMessage(quickActionMessage, 'error', 'Помилка мережі при вирішенні сповіщення.');
        }
    }

    console.log('Starting initial data load for dashboard...');
    await fetchUserProfile();
    await fetchRealTimeSummary();
    if (deviceSelect && actionDeviceSelect) await populateDeviceSelects();
    if (latestSensorDataDiv) await fetchLatestSensorDataSummary();
    if (unresolvedAlertsDiv) await fetchUnresolvedAlerts();
    if (deviceListDiv) await fetchUserDevices();
    console.log('Initial data load complete.');

    setInterval(fetchRealTimeSummary, 30000);
    if (deviceSelect && actionDeviceSelect) setInterval(populateDeviceSelects, 300000);
    if (latestSensorDataDiv) setInterval(fetchLatestSensorDataSummary, 15000);
    if (unresolvedAlertsDiv) setInterval(fetchUnresolvedAlerts, 60000);
    if (deviceListDiv) setInterval(fetchUserDevices, 300000);
    console.log('Periodic data refresh set up.');
});