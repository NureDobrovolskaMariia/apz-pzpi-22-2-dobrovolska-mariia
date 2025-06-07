
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded for devices page.');


    const userNameNav = document.getElementById('userNameNav');
    const userRoleNav = document.getElementById('userRoleNav');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const logoutBtn = document.getElementById('logoutBtn'); 
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    const userDropdownTrigger = document.getElementById('userDropdownTrigger');
    const userDropdown = document.getElementById('userDropdown');

    const token = localStorage.getItem('jwtToken');

    if (!token) {
        console.warn('Devices: No JWT token found. Redirecting to login.');
        window.location.href = '/html/login.html';
        return;
    }


    function showMessage(element, type, text) {
        if (!element) {
            console.error("Attempted to show message but target element is null:", text);
            return;
        }
        element.textContent = text;
        element.className = `message-area ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    if (userDropdownTrigger && userDropdown) {
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


    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/html/login.html';
    };
    if (logoutBtn) { 
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', handleLogout);
    }

    async function fetchUserProfileForNav() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const user = data.data.user;
                if (userNameNav) userNameNav.textContent = user.name;
                if (userRoleNav) userRoleNav.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                if (adminPanelLink) {
                    adminPanelLink.style.display = user.role === 'admin' ? 'block' : 'none';
                }
            } else {
                console.error('Помилка завантаження профілю для навігації:', data.message);
              
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні профілю для навігації:', error);
        }
    }
    await fetchUserProfileForNav();

    // Елементи сторінки "Пристрої"
    const deviceListSection = document.getElementById('deviceListSection');
    const deviceDetailsSection = document.getElementById('deviceDetailsSection');
    const devicesTableBody = document.getElementById('devicesTableBody');
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    const statusFilter = document.getElementById('statusFilter');
    const searchDevice = document.getElementById('searchDevice');
    const backToDevicesListBtn = document.getElementById('backToDevicesListBtn');

    // Елементи форми додавання пристрою (для add-device.html, але можуть бути null тут)
    const addDeviceForm = document.getElementById('addDeviceForm');
    const deviceNameInput = document.getElementById('deviceName');
    const deviceLocationInput = document.getElementById('deviceLocation');
    const deviceTypeSelect = document.getElementById('deviceType');
    const generatedDeviceIdInput = document.getElementById('generatedDeviceId');
    const generateIdBtn = document.getElementById('generateIdBtn');
    const addDeviceMessageDiv = document.getElementById('addDeviceMessage');

    // Елементи деталей пристрою
    const detailDeviceName = document.getElementById('detailDeviceName');
    const detailDeviceId = document.getElementById('detailDeviceId');
    const detailDeviceType = document.getElementById('detailDeviceType');
    const detailDeviceStatus = document.getElementById('detailDeviceStatus');
    const detailDeviceLocation = document.getElementById('detailDeviceLocation');
    const detailLastSeen = document.getElementById('detailLastSeen');
    const detailFirmware = document.getElementById('detailFirmware');
    const detailTemperature = document.getElementById('detailTemperature');
    const detailHumidity = document.getElementById('detailHumidity');
    const detailLightLevel = document.getElementById('detailLightLevel');
    const detailTargetTemperature = document.getElementById('detailTargetTemperature');
    const detailTargetHumidity = document.getElementById('detailTargetHumidity');
    const detailAutoMode = document.getElementById('detailAutoMode');
    const detailHeater = document.getElementById('detailHeater');
    const detailHumidifier = document.getElementById('detailHumidifier');
    const detailFan = document.getElementById('detailFan');
    const detailTurner = document.getElementById('detailTurner');

    // Елементи статистики пристрою
    const statDeviceAge = document.getElementById('statDeviceAge');
    const statUptimePercentage = document.getElementById('statUptimePercentage');
    const statAvgTemperature = document.getElementById('statAvgTemperature');
    const statAvgHumidity = document.getElementById('statAvgHumidity');
    const statAlertsLastWeek = document.getElementById('statAlertsLastWeek');
    const statUnresolvedAlerts = document.getElementById('statUnresolvedAlerts');

    // Елементи графіка деталей пристрою
    const deviceDetailChartCanvas = document.getElementById('deviceDetailChart');
    const chartPeriodSelect = document.getElementById('chartPeriodSelect');
    let deviceDetailChartInstance;

    // Елементи форми оновлення пристрою
    const updateDeviceForm = document.getElementById('updateDeviceForm');
    const editDeviceNameInput = document.getElementById('editDeviceName');
    const editDeviceLocationInput = document.getElementById('editDeviceLocation');
    const targetTempInput = document.getElementById('targetTempInput');
    const targetHumInput = document.getElementById('targetHumInput');
    const autoModeCheckbox = document.getElementById('autoModeCheckbox');
    const turningEnabledCheckbox = document.getElementById('turningEnabledCheckbox');
    const deviceUpdateMessage = document.getElementById('deviceUpdateMessage');

    // Елементи форми надсилання команди
    const sendCommandForm = document.getElementById('sendCommandForm');
    const commandSelect = document.getElementById('commandSelect');
    const sendCommandMessage = document.getElementById('sendCommandMessage');

    // Елементи експорту даних
    const exportStartDateInput = document.getElementById('exportStartDate');
    const exportEndDateInput = document.getElementById('exportEndDate');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportMessage = document.getElementById('exportMessage');

    // Елементи видалення пристрою
    const deleteDeviceBtn = document.getElementById('deleteDeviceBtn');
    const deleteDeviceMessage = document.getElementById('deleteDeviceMessage');

    let currentDeviceForDetails = null;

    // Функції для списку пристроїв
    async function fetchDevices() {
        console.log('fetchDevices: Starting to fetch devices list...');
        const status = statusFilter ? statusFilter.value : '';
        const search = searchDevice ? searchDevice.value : '';
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        if (search) queryParams.append('search', search);
        
        if (!devicesTableBody) return; 
        devicesTableBody.innerHTML = `<tr><td colspan="6">Завантаження пристроїв...</td></tr>`;

        try {
            const response = await fetch(`/api/devices?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                displayDevicesInTable(data.data.devices);
            } else {
                devicesTableBody.innerHTML = `<tr><td colspan="6" class="error">Помилка завантаження пристроїв: ${data.message || 'Невідома помилка'}</td></tr>`;
            }
        } catch (error) {
            devicesTableBody.innerHTML = `<tr><td colspan="6" class="error">Мережева помилка при завантаженні пристроїв.</td></tr>`;
        }
    }

    function displayDevicesInTable(devices) {
        if (!devicesTableBody) return;
        devicesTableBody.innerHTML = '';
        if (!devices || devices.length === 0) {
            devicesTableBody.innerHTML = '<tr><td colspan="6">У вас поки немає зареєстрованих пристроїв.</td></tr>';
            return;
        }
        devices.forEach(device => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${device.name}</td>
                <td>${device.deviceId}</td>
                <td>${device.type || 'N/A'}</td>
                <td><span class="status-indicator status-${device.status || 'unknown'}">${(device.status || 'невідомо').charAt(0).toUpperCase() + (device.status || 'невідомо').slice(1)}</span></td>
                <td>${device.location || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm primary-btn view-details-btn" data-device-id="${device.deviceId}">Деталі</button>
                    <button class="btn btn-sm secondary-btn delete-device-list-btn" data-device-id="${device.deviceId}">Видалити</button>
                </td>
            `;
            devicesTableBody.appendChild(row);
        });

        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const deviceId = e.target.dataset.deviceId;
                showDeviceDetails(deviceId);
            });
        });
        document.querySelectorAll('.delete-device-list-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const deviceId = e.target.dataset.deviceId;
                const deviceName = e.target.closest('tr').querySelector('td:first-child').textContent;
                if (confirm(`Ви впевнені, що хочете видалити пристрій ${deviceName} (${deviceId})? Цю дію не можна скасувати.`)) {
                    await deleteDevice(deviceId);
                    fetchDevices();
                }
            });
        });
    }

    if (statusFilter) statusFilter.addEventListener('change', fetchDevices);
    if (searchDevice) searchDevice.addEventListener('input', fetchDevices);
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', () => {
            window.location.href = '/html/add-device.html';
        });
    }

  
    if (addDeviceForm) {
        if (generateIdBtn) {
            generateIdBtn.addEventListener('click', async () => {
                try {
                    const profileResponse = await fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
                    const profileData = await profileResponse.json();
                    if (profileResponse.ok && profileData.data.user) {
                        const userId = profileData.data.user._id;
                        const today = new Date();
                        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
                        const randomChars = Math.random().toString(36).substring(2, 5);
                        const newDeviceId = `${dateStr}-${userId}-${randomChars}`;
                        if (generatedDeviceIdInput) generatedDeviceIdInput.value = newDeviceId;
                        if (addDeviceMessageDiv) showMessage(addDeviceMessageDiv, 'success', 'ID пристрою згенеровано.');
                    } else {
                        if (addDeviceMessageDiv) showMessage(addDeviceMessageDiv, 'error', 'Не вдалося отримати ID користувача для генерації ID пристрою.');
                    }
                } catch (error) {
                    if (addDeviceMessageDiv) showMessage(addDeviceMessageDiv, 'error', 'Сталася помилка мережі при генерації ID пристрою.');
                }
            });
        }

        addDeviceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const deviceName = deviceNameInput ? deviceNameInput.value : 'Default Name';
            const deviceLocation = deviceLocationInput ? deviceLocationInput.value : 'Default Location';
            const deviceType = deviceTypeSelect ? deviceTypeSelect.value : 'chicken_incubator';
            const deviceId = generatedDeviceIdInput ? generatedDeviceIdInput.value : '';

            if (!deviceId) {
                if (addDeviceMessageDiv) showMessage(addDeviceMessageDiv, 'error', 'Будь ласка, згенеруйте ID пристрою.');
                return;
            }
            try {
                const response = await fetch('/api/devices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ deviceId, name: deviceName, location: deviceLocation, type: deviceType }),
                });
                const data = await response.json();
                if (response.ok) {
                    if (addDeviceMessageDiv) showMessage(addDeviceMessageDiv, 'success', data.message || 'Пристрій успішно зареєстровано!');
                    addDeviceForm.reset();
                    if (generatedDeviceIdInput) generatedDeviceIdInput.value = '';
                    setTimeout(() => { window.location.href = '/html/devices.html'; }, 2000);
                } else {
                    if (addDeviceMessageDiv) showMessage(addDeviceMessageDiv, 'error', data.message || 'Помилка реєстрації пристрою.');
                }
            } catch (error) {
                if (addDeviceMessageDiv) showMessage(addDeviceMessageDiv, 'error', 'Сталася помилка мережі при реєстрації пристрою.');
            }
        });
    }

    // Функції для сторінки деталей пристрою
    async function showDeviceDetails(deviceId) {
        currentDeviceForDetails = deviceId;
        if (deviceListSection) deviceListSection.style.display = 'none';
        if (deviceDetailsSection) deviceDetailsSection.style.display = 'block';
        if (detailDeviceName) detailDeviceName.textContent = `Завантаження деталей для ${deviceId}...`;
        
        await fetchSingleDeviceData(deviceId);
        await fetchDeviceStats(deviceId);
        if (deviceDetailChartCanvas) await fetchAndRenderDeviceChart(deviceId, chartPeriodSelect ? chartPeriodSelect.value : 'hourly');
    }

    if (backToDevicesListBtn) {
        backToDevicesListBtn.addEventListener('click', () => {
            if (deviceDetailsSection) deviceDetailsSection.style.display = 'none';
            if (deviceListSection) deviceListSection.style.display = 'block';
            fetchDevices();
        });
    }

    async function fetchSingleDeviceData(deviceId) {
        
        try {
            const response = await fetch(`/api/devices/${deviceId}`, { headers: { 'Authorization': `Bearer ${token}` }});
            const data = await response.json();
            if (response.ok) {
                const device = data.data.device;
                const latestData = data.data.latestData;

                if (detailDeviceName) detailDeviceName.textContent = device.name;
                if (detailDeviceId) detailDeviceId.textContent = device.deviceId;
                if (detailDeviceType) detailDeviceType.textContent = device.type || 'N/A';
                if (detailDeviceStatus) detailDeviceStatus.innerHTML = `<span class="status-indicator status-${device.status || 'unknown'}">${(device.status || 'невідомо').charAt(0).toUpperCase() + (device.status || 'невідомо').slice(1)}</span>`;
                if (detailDeviceLocation) detailDeviceLocation.textContent = device.location || 'N/A';
                if (detailLastSeen) detailLastSeen.textContent = device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'N/A';
                if (detailFirmware) detailFirmware.textContent = device.firmware || 'N/A';

                const naText = 'Немає даних';
                if (latestData) {
                    if (detailTemperature) detailTemperature.textContent = typeof latestData.temperature === 'number' ? `${latestData.temperature.toFixed(1)}°C` : naText;
                    if (detailHumidity) detailHumidity.textContent = typeof latestData.humidity === 'number' ? `${latestData.humidity.toFixed(1)}%` : naText;
                    if (detailLightLevel) detailLightLevel.textContent = typeof latestData.lightLevel === 'number' ? latestData.lightLevel : naText;
                    if (detailTargetTemperature) detailTargetTemperature.textContent = typeof latestData.targetTemperature === 'number' ? `${latestData.targetTemperature.toFixed(1)}°C` : naText;
                    if (detailTargetHumidity) detailTargetHumidity.textContent = typeof latestData.targetHumidity === 'number' ? `${latestData.targetHumidity.toFixed(1)}%` : naText;
                    if (detailAutoMode) detailAutoMode.textContent = latestData.autoMode ? 'Увімкнено' : 'Вимкнено';
                    if (detailHeater) detailHeater.textContent = latestData.deviceStatus && latestData.deviceStatus.heater ? 'Увімкнено' : 'Вимкнено';
                    if (detailHumidifier) detailHumidifier.textContent = latestData.deviceStatus && latestData.deviceStatus.humidifier ? 'Увімкнено' : 'Вимкнено';
                    if (detailFan) detailFan.textContent = latestData.deviceStatus && latestData.deviceStatus.fan ? 'Увімкнено' : 'Вимкнено';
                    if (detailTurner) detailTurner.textContent = latestData.deviceStatus && latestData.deviceStatus.turner ? 'Увімкнено' : 'Вимкнено';
                } else {
                    [detailTemperature, detailHumidity, detailLightLevel, detailTargetTemperature, detailTargetHumidity, detailAutoMode, detailHeater, detailHumidifier, detailFan, detailTurner].forEach(el => {
                        if (el) el.textContent = naText;
                    });
                }

                if (editDeviceNameInput) editDeviceNameInput.value = device.name;
                if (editDeviceLocationInput) editDeviceLocationInput.value = device.location || '';
                if (targetTempInput) targetTempInput.value = device.settings.targetTemperature;
                if (targetHumInput) targetHumInput.value = device.settings.targetHumidity;
                if (autoModeCheckbox) autoModeCheckbox.checked = device.settings.autoMode;
                if (turningEnabledCheckbox) turningEnabledCheckbox.checked = device.settings.turningEnabled;

            } else {
                if(deviceUpdateMessage) showMessage(deviceUpdateMessage, 'error', data.message || 'Не вдалося завантажити деталі пристрою.');
                if (deviceDetailsSection) deviceDetailsSection.style.display = 'none';
                if (deviceListSection) deviceListSection.style.display = 'block';
            }
        } catch (error) {
             if(deviceUpdateMessage) showMessage(deviceUpdateMessage, 'error', 'Помилка мережі при завантаженні деталей пристрою.');
            if (deviceDetailsSection) deviceDetailsSection.style.display = 'none';
            if (deviceListSection) deviceListSection.style.display = 'block';
        }
    }

    async function fetchDeviceStats(deviceId) {
       
        try {
            const response = await fetch(`/api/devices/${deviceId}/stats`, { headers: { 'Authorization': `Bearer ${token}` }});
            const data = await response.json();
            if (response.ok) {
                const stats = data.data;
                const naText = 'N/A';
                if (statDeviceAge) statDeviceAge.textContent = `${stats.deviceAge || 0} днів`;
                if (statUptimePercentage) statUptimePercentage.textContent = `${(stats.uptimePercentage || 0).toFixed(1)}%`;
                if (statAvgTemperature) statAvgTemperature.textContent = stats.averageConditions && typeof stats.averageConditions.avgTemperature === 'number' ? `${stats.averageConditions.avgTemperature.toFixed(1)}°C` : naText;
                if (statAvgHumidity) statAvgHumidity.textContent = stats.averageConditions && typeof stats.averageConditions.avgHumidity === 'number' ? `${stats.averageConditions.avgHumidity.toFixed(1)}%` : naText;
                if (statAlertsLastWeek) statAlertsLastWeek.textContent = stats.alertsLastWeek || 0;
                if (statUnresolvedAlerts) statUnresolvedAlerts.textContent = stats.unresolvedAlerts || 0;
            } else {
                console.error('Помилка завантаження статистики пристрою:', data.message);
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні статистики пристрою:', error);
        }
    }

    async function fetchAndRenderDeviceChart(deviceId, period = 'hourly') {
        if (!deviceDetailChartCanvas) return;
        
        const ctx = deviceDetailChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, deviceDetailChartCanvas.width, deviceDetailChartCanvas.height);
        ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
        ctx.fillText('Завантаження даних графіка...', deviceDetailChartCanvas.width / 2, deviceDetailChartCanvas.height / 2);

        try {
            let days = 1;
            if (period === 'daily') days = 7;
            else if (period === 'weekly') days = 30;

            const response = await fetch(`/api/data/${deviceId}/aggregated?period=${period}&days=${days}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                renderDeviceDetailChart(data.data.aggregatedData, period);
            } else {
                if (deviceDetailChartInstance) deviceDetailChartInstance.destroy();
                ctx.clearRect(0, 0, deviceDetailChartCanvas.width, deviceDetailChartCanvas.height);
                ctx.fillText(`Немає даних за обраний період для ${period} агрегації.`, deviceDetailChartCanvas.width / 2, deviceDetailChartCanvas.height / 2);
            }
        } catch (error) {
            if (deviceDetailChartInstance) deviceDetailChartInstance.destroy();
            ctx.clearRect(0, 0, deviceDetailChartCanvas.width, deviceDetailChartCanvas.height);
            ctx.fillText('Помилка мережі при завантаженні даних графіка.', deviceDetailChartCanvas.width / 2, deviceDetailChartCanvas.height / 2);
        }
    }

    function renderDeviceDetailChart(aggregatedData, period) {
        if (!deviceDetailChartCanvas) return;
        // ... (код функції залишається схожим, але з перекладом повідомлення "Нет данных...")
        if (deviceDetailChartInstance) {
            deviceDetailChartInstance.destroy();
        }
        if (!aggregatedData || aggregatedData.length === 0) {
            const ctx = deviceDetailChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, deviceDetailChartCanvas.width, deviceDetailChartCanvas.height);
            ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
            ctx.fillText('Немає даних за обраний період.', deviceDetailChartCanvas.width / 2, deviceDetailChartCanvas.height / 2);
            return;
        }
        // ... (решта коду для створення графіка)
        const labels = aggregatedData.map(d => {
            const date = new Date(d._id.year, d._id.month - 1, d._id.day, d._id.hour || 0);
            if (period === 'hourly') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return date.toLocaleDateString();
        });
        const temperatures = aggregatedData.map(d => d.avgTemperature !== undefined && d.avgTemperature !== null ? d.avgTemperature.toFixed(1) : null);
        const humidities = aggregatedData.map(d => d.avgHumidity !== undefined && d.avgHumidity !== null ? d.avgHumidity.toFixed(1) : null);
        const lightLevels = aggregatedData.map(d => d.avgLightLevel !== undefined && d.avgLightLevel !== null ? d.avgLightLevel.toFixed(0) : null);

        deviceDetailChartInstance = new Chart(deviceDetailChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Температура (°C)', data: temperatures, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.2)', fill: false, tension: 0.1 },
                    { label: 'Вологість (%)', data: humidities, borderColor: '#1a73e8', backgroundColor: 'rgba(26, 115, 232, 0.2)', fill: false, tension: 0.1 },
                    { label: 'Освітленість', data: lightLevels, borderColor: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.2)', fill: false, tension: 0.1, hidden: true }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } }, plugins: { legend: { display: true, position: 'top', }, tooltip: { mode: 'index', intersect: false, } } }
        });
    }


    if (chartPeriodSelect) {
        chartPeriodSelect.addEventListener('change', (e) => {
            if (currentDeviceForDetails) {
                fetchAndRenderDeviceChart(currentDeviceForDetails, e.target.value);
            }
        });
    }

    if (updateDeviceForm) {
        updateDeviceForm.addEventListener('submit', async (e) => {
            
            e.preventDefault();
            const deviceId = currentDeviceForDetails;
            const name = editDeviceNameInput.value;
            const location = editDeviceLocationInput.value;
            const targetTemperature = parseFloat(targetTempInput.value);
            const targetHumidity = parseFloat(targetHumInput.value);
            const autoMode = autoModeCheckbox.checked;
            const turningEnabled = turningEnabledCheckbox.checked;

            if (!deviceId) {
                if(deviceUpdateMessage) showMessage(deviceUpdateMessage, 'error', 'Немає обраного пристрою для оновлення.');
                return;
            }
            const updatePayload = { name, location, settings: { targetTemperature, targetHumidity, autoMode, turningEnabled } };
            try {
                const response = await fetch(`/api/devices/${deviceId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updatePayload),
                });
                const data = await response.json();
                if(deviceUpdateMessage) showMessage(deviceUpdateMessage, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Налаштування пристрою успішно оновлено!' : 'Помилка оновлення налаштувань пристрою.'));
                if (response.ok) fetchSingleDeviceData(deviceId);
            } catch (error) {
                if(deviceUpdateMessage) showMessage(deviceUpdateMessage, 'error', 'Сталася помилка мережі при оновленні пристрою.');
            }
        });
    }

    if (sendCommandForm) {
        sendCommandForm.addEventListener('submit', async (e) => {
           
            e.preventDefault();
            const deviceId = currentDeviceForDetails;
            const commandValue = commandSelect.value;
            if (!deviceId) { if(sendCommandMessage) showMessage(sendCommandMessage, 'error', 'Немає обраного пристрою для надсилання команди.'); return; }
            if (!commandValue) { if(sendCommandMessage) showMessage(sendCommandMessage, 'error', 'Будь ласка, оберіть команду.'); return; }
            let commandPayload = {};
            switch (commandValue) {
                case 'turn_eggs': commandPayload = { turn_eggs: true }; break;
                case 'auto_mode_on': commandPayload = { auto_mode: true }; break;
                case 'auto_mode_off': commandPayload = { auto_mode: false }; break;
                case 'heater_on': commandPayload = { heater: true }; break;
                case 'heater_off': commandPayload = { heater: false }; break;
                case 'humidifier_on': commandPayload = { humidifier: true }; break;
                case 'humidifier_off': commandPayload = { humidifier: false }; break;
                case 'emergency_stop': commandPayload = { emergency_stop: true }; break; // Або { heater: false, humidifier: false, auto_mode: false }
                default: if(sendCommandMessage) showMessage(sendCommandMessage, 'error', 'Невідома команда.'); return;
            }
            try {
                const response = await fetch(`/api/devices/${deviceId}/command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ command: commandPayload }), // Огортаємо в { command: ... }
                });
                const data = await response.json();
                if(sendCommandMessage) showMessage(sendCommandMessage, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Команду успішно надіслано!' : 'Помилка надсилання команди.'));
                if (response.ok) fetchSingleDeviceData(deviceId);
            } catch (error) {
                if(sendCommandMessage) showMessage(sendCommandMessage, 'error', 'Сталася помилка мережі при надсиланні команди.');
            }
        });
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', async () => {
            
            const deviceId = currentDeviceForDetails;
            const startDate = exportStartDateInput.value;
            const endDate = exportEndDateInput.value;
            if (!deviceId) { if(exportMessage) showMessage(exportMessage, 'error', 'Немає обраного пристрою для експорту.'); return; }
            let exportUrl = `/api/data/${deviceId}/export?format=csv`;
            if (startDate) exportUrl += `&startDate=${startDate}`;
            if (endDate) exportUrl += `&endDate=${endDate}`;
            try {
                const response = await fetch(exportUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${deviceId}_sensor_data.csv`;
                    document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
                    if(exportMessage) showMessage(exportMessage, 'success', 'Дані успішно експортовано!');
                } else {
                    const errorData = await response.json();
                    if(exportMessage) showMessage(exportMessage, 'error', errorData.message || 'Помилка експорту даних.');
                }
            } catch (error) {
                if(exportMessage) showMessage(exportMessage, 'error', 'Сталася помилка мережі при експорті даних.');
            }
        });
    }

    if (deleteDeviceBtn) {
        deleteDeviceBtn.addEventListener('click', async () => {
            
            const deviceId = currentDeviceForDetails;
            if (!deviceId) { if(deleteDeviceMessage) showMessage(deleteDeviceMessage, 'error', 'Немає обраного пристрою для видалення.'); return; }
            const deviceNameToDelete = detailDeviceName ? detailDeviceName.textContent : deviceId;
            if (confirm(`Ви впевнені, що хочете видалити пристрій "${deviceNameToDelete}" (${deviceId})? Цю дію не можна скасувати.`)) {
                await deleteDevice(deviceId);
            }
        });
    }

    async function deleteDevice(deviceId) {
        
        try {
            const response = await fetch(`/api/devices/${deviceId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const messageEl = deleteDeviceMessage || deviceUpdateMessage; 
            if(messageEl) showMessage(messageEl, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Пристрій успішно видалено!' : 'Помилка видалення пристрою.'));
            if (response.ok) {
                setTimeout(() => { window.location.href = '/html/devices.html'; }, 1000);
            }
        } catch (error) {
             const messageEl = deleteDeviceMessage || deviceUpdateMessage;
            if(messageEl) showMessage(messageEl, 'error', 'Сталася помилка мережі при видаленні пристрою.');
        }
    }

    // Початкове завантаження логіки на основі URL
    const urlParams = new URLSearchParams(window.location.search);
    const deviceIdFromUrl = urlParams.get('id');

    if (window.location.pathname.includes('/html/devices.html')) {
        if (deviceIdFromUrl) {
            if (deviceListSection) deviceListSection.style.display = 'none';
            if (deviceDetailsSection) deviceDetailsSection.style.display = 'block';
            showDeviceDetails(deviceIdFromUrl);
        } else {
            if (deviceListSection) deviceListSection.style.display = 'block';
            if (deviceDetailsSection) deviceDetailsSection.style.display = 'none';
            fetchDevices();
        }
    } else if (window.location.pathname.includes('/html/add-device.html')) {
     
    }
});
