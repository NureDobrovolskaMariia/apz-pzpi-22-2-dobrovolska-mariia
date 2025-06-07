document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded for alerts page.');

    const userNameNav = document.getElementById('userNameNav');
    const userRoleNav = document.getElementById('userRoleNav');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const logoutBtn = document.getElementById('logoutBtn'); 
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    const userDropdownTrigger = document.getElementById('userDropdownTrigger');
    const userDropdown = document.getElementById('userDropdown');

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
            if (response.ok && data.data && data.data.user) {
                const user = data.data.user;
                if(userNameNav) userNameNav.textContent = user.name;
                if(userRoleNav) userRoleNav.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                if(adminPanelLink) adminPanelLink.style.display = user.role === 'admin' ? 'block' : 'none';
            } else {
                console.error('Помилка завантаження профілю для навігації:', data.message);
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні профілю для навігації:', error);
        }
    }
    await fetchUserProfileForNav();

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const alertsTableBody = document.getElementById('alertsTableBody');
    const alertStatusFilter = document.getElementById('alertStatusFilter');
    const alertSeverityFilter = document.getElementById('alertSeverityFilter');
    const alertTypeFilter = document.getElementById('alertTypeFilter');
    const alertDeviceIdFilter = document.getElementById('alertDeviceIdFilter');
    const selectAllAlertsCheckbox = document.getElementById('selectAllAlerts');
    const resolveSelectedAlertsBtn = document.getElementById('resolveSelectedAlertsBtn');
    const cleanupResolvedAlertsBtn = document.getElementById('cleanupResolvedAlertsBtn');
    const alertListMessageDiv = document.getElementById('alertListMessage');
    const prevAlertsPageBtn = document.getElementById('prevAlertsPage');
    const currentAlertsPageSpan = document.getElementById('currentAlertsPage');
    const nextAlertsPageBtn = document.getElementById('nextAlertsPage');
    let currentAlertsPage = 1;
    const alertsPerPage = 10;

    const criticalAlertsListDiv = document.getElementById('criticalAlertsList');

    const totalAlertsCount = document.getElementById('totalAlertsCount');
    const unresolvedAlertsStats = document.getElementById('unresolvedAlertsStats');
    const resolvedAlertsStats = document.getElementById('resolvedAlertsStats');
    const tempAlertsStats = document.getElementById('tempAlertsStats');
    const humidityAlertsStats = document.getElementById('humidityAlertsStats');
    const offlineAlertsStats = document.getElementById('offlineAlertsStats');
    const alertsByDeviceStatsDiv = document.getElementById('alertsByDeviceStats');
    const dailyAlertsChartCanvas = document.getElementById('dailyAlertsChart');
    let dailyAlertsChartInstance;

    const createManualAlertForm = document.getElementById('createManualAlertForm');
    const manualAlertDeviceIdSelect = document.getElementById('manualAlertDeviceId');
    const manualAlertTypeSelect = document.getElementById('manualAlertType');
    const manualAlertSeveritySelect = document.getElementById('manualAlertSeverity');
    const manualAlertValueInput = document.getElementById('manualAlertValue');
    const manualAlertMessageInput = document.getElementById('manualAlertMessage');
    const manualAlertMessageDiv = document.getElementById('manualAlertMessageDiv');

    let userDevices = [];

    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            tabLinks.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            link.classList.add('active');
            const targetTabId = link.dataset.tab + 'Tab';
            const targetTabElement = document.getElementById(targetTabId);
            if (targetTabElement) {
                targetTabElement.classList.add('active');
            }
            loadTabData(link.dataset.tab);
        });
    });

    function loadTabData(tabId) {
        console.log("Loading data for tab:", tabId);
        switch (tabId) {
            case 'all-alerts':
                fetchAlerts();
                break;
            case 'critical-alerts':
                fetchCriticalAlerts();
                break;
            case 'alert-stats':
                fetchAlertStatistics();
                break;
            case 'create-alert':
                populateManualAlertDeviceSelect();
                break;
        }
    }

    async function fetchAlerts() {
        if (!alertsTableBody) return;
        console.log('Fetching all alerts list...');
        const status = alertStatusFilter ? alertStatusFilter.value : '';
        const severity = alertSeverityFilter ? alertSeverityFilter.value : '';
        const type = alertTypeFilter ? alertTypeFilter.value : '';
        const deviceId = alertDeviceIdFilter ? alertDeviceIdFilter.value : '';

        const queryParams = new URLSearchParams();
        if (status !== '') queryParams.append('isResolved', status);
        if (severity) queryParams.append('severity', severity);
        if (type) queryParams.append('type', type);
        if (deviceId) queryParams.append('deviceId', deviceId);
        queryParams.append('page', currentAlertsPage);
        queryParams.append('limit', alertsPerPage);
        
        alertsTableBody.innerHTML = `<tr><td colspan="9">Завантаження сповіщень...</td></tr>`;
        try {
            const response = await fetch(`/api/alerts?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.data && data.pagination) {
                displayAlertsInTable(data.data.alerts, data.pagination.total, data.pagination.page, data.pagination.pages);
            } else {
                alertsTableBody.innerHTML = `<tr><td colspan="9" class="error">Помилка завантаження сповіщень: ${data.message || 'Невідома помилка'}</td></tr>`;
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні сповіщень:', error);
            alertsTableBody.innerHTML = `<tr><td colspan="9" class="error">Мережева помилка при завантаженні сповіщень.</td></tr>`;
        }
    }

    function displayAlertsInTable(alerts, totalAlerts, currentPage, totalPages) {
        if (!alertsTableBody) return;
        alertsTableBody.innerHTML = ''; 

        if (!alerts || alerts.length === 0) {
            alertsTableBody.innerHTML = '<tr><td colspan="9">Немає сповіщень, що відповідають фільтрам.</td></tr>'; 
            if (currentAlertsPageSpan) currentAlertsPageSpan.textContent = `Сторінка ${currentPage || 1} з ${totalPages || 1}`;
            if (prevAlertsPageBtn) prevAlertsPageBtn.disabled = true;
            if (nextAlertsPageBtn) nextAlertsPageBtn.disabled = true;
            return;
        }

        alerts.forEach(alert => {
            const row = document.createElement('tr');
            const deviceName = alert.deviceId && alert.deviceId.name ? alert.deviceId.name : (alert.deviceId || 'Невідомий пристрій');
            row.innerHTML = `
                <td><input type="checkbox" class="alert-checkbox" data-alert-id="${alert._id}"></td>
                <td>${deviceName}</td>
                <td>${alert.type}</td>
                <td><span class="status-indicator status-${alert.severity.toLowerCase()}">${alert.severity}</span></td>
                <td>${alert.message}</td>
                <td>${alert.currentValue !== undefined && alert.currentValue !== null ? alert.currentValue : 'N/A'}</td>
                <td>${new Date(alert.createdAt).toLocaleString()}</td>
                <td><span class="status-indicator status-${alert.isResolved ? 'online' : 'offline'}">${alert.isResolved ? 'Вирішено' : 'Не вирішено'}</span></td>
                <td>
                    <button class="btn btn-sm primary-btn resolve-alert-btn" data-alert-id="${alert._id}" ${alert.isResolved ? 'disabled' : ''}>Вирішити</button>
                </td>
            `;
            alertsTableBody.appendChild(row);
        });

        if (currentAlertsPageSpan) currentAlertsPageSpan.textContent = `Сторінка ${currentPage} з ${totalPages} (Всього: ${totalAlerts})`;
        if (prevAlertsPageBtn) prevAlertsPageBtn.disabled = currentPage === 1;
        if (nextAlertsPageBtn) nextAlertsPageBtn.disabled = currentPage === totalPages || totalPages === 0;

        document.querySelectorAll('.resolve-alert-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const alertId = e.target.dataset.alertId;
                await resolveAlert(alertId);
            });
        });

        if (selectAllAlertsCheckbox) {
            selectAllAlertsCheckbox.checked = false; 
            selectAllAlertsCheckbox.onchange = (e) => { 
                document.querySelectorAll('.alert-checkbox').forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            };
        }
    }

    if (prevAlertsPageBtn) prevAlertsPageBtn.addEventListener('click', () => { if (currentAlertsPage > 1) { currentAlertsPage--; fetchAlerts(); } });
    if (nextAlertsPageBtn) nextAlertsPageBtn.addEventListener('click', () => { currentAlertsPage++; fetchAlerts(); });

    if (alertStatusFilter) alertStatusFilter.addEventListener('change', () => { currentAlertsPage = 1; fetchAlerts(); });
    if (alertSeverityFilter) alertSeverityFilter.addEventListener('change', () => { currentAlertsPage = 1; fetchAlerts(); });
    if (alertTypeFilter) alertTypeFilter.addEventListener('change', () => { currentAlertsPage = 1; fetchAlerts(); });
    if (alertDeviceIdFilter) alertDeviceIdFilter.addEventListener('change', () => { currentAlertsPage = 1; fetchAlerts(); });

    async function populateDeviceFilter() {
        try {
            const response = await fetch('/api/devices', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok && data.data && data.data.devices) {
                userDevices = data.data.devices;
                if (alertDeviceIdFilter) {
                    alertDeviceIdFilter.innerHTML = '<option value="">Всі пристрої</option>'; 
                    userDevices.forEach(device => {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.textContent = `${device.name} (${device.deviceId})`;
                        alertDeviceIdFilter.appendChild(option);
                    });
                }
                populateManualAlertDeviceSelect();
            } else {
                console.error('Помилка завантаження пристроїв для фільтрації:', data.message);
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні пристроїв для фільтрації:', error);
        }
    }

    async function resolveAlert(alertId) {
        console.log('Resolving alert:', alertId);
        try {
            const response = await fetch(`/api/alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (alertListMessageDiv) {
                showMessage(alertListMessageDiv, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Сповіщення вирішено!' : 'Помилка вирішення сповіщення.'));
            }
            if (response.ok) fetchAlerts();
        } catch (error) {
            console.error('Мережева помилка при вирішенні сповіщення:', error);
            if (alertListMessageDiv) showMessage(alertListMessageDiv, 'error', 'Сталася помилка мережі при вирішенні сповіщення.');
        }
    }

    if (resolveSelectedAlertsBtn) {
        resolveSelectedAlertsBtn.addEventListener('click', async () => {
            const selectedAlertIds = Array.from(document.querySelectorAll('.alert-checkbox:checked')).map(checkbox => checkbox.dataset.alertId);
            if (selectedAlertIds.length === 0) {
                if (alertListMessageDiv) showMessage(alertListMessageDiv, 'error', 'Оберіть сповіщення для вирішення.'); 
                return;
            }
            if (confirm(`Ви впевнені, що хочете вирішити ${selectedAlertIds.length} обраних сповіщень?`)) { 
                try {
                    const response = await fetch('/api/alerts/resolve/multiple', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ alertIds: selectedAlertIds })
                    });
                    const data = await response.json();
                    if (alertListMessageDiv) {
                        showMessage(alertListMessageDiv, response.ok ? 'success' : 'error', data.message || (response.ok ? `${data.data.resolvedCount} сповіщень вирішено.` : 'Помилка вирішення обраних сповіщень.')); 
                    }
                    if (response.ok) fetchAlerts();
                } catch (error) {
                    console.error('Мережева помилка при вирішенні обраних сповіщень:', error);
                    if (alertListMessageDiv) showMessage(alertListMessageDiv, 'error', 'Сталася помилка мережі.');
                }
            }
        });
    }

    if (cleanupResolvedAlertsBtn) {
        cleanupResolvedAlertsBtn.addEventListener('click', async () => {
            if (confirm('Ви впевнені, що хочете видалити всі вирішені сповіщення старші 30 днів?')) { 
                try {
                    const response = await fetch('/api/alerts/cleanup?olderThanDays=30', {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (alertListMessageDiv) {
                         showMessage(alertListMessageDiv, response.ok ? 'success' : 'error', data.message || (response.ok ? `${data.data.deletedCount} сповіщень видалено.` : 'Помилка очищення вирішених сповіщень.')); 
                    }
                    if (response.ok) fetchAlerts();
                } catch (error) {
                    console.error('Мережева помилка при очищенні вирішених сповіщень:', error);
                    if (alertListMessageDiv) showMessage(alertListMessageDiv, 'error', 'Сталася помилка мережі.');
                }
            }
        });
    }

    async function fetchCriticalAlerts() {
        if (!criticalAlertsListDiv) return;
        criticalAlertsListDiv.innerHTML = '<p>Завантаження критичних сповіщень...</p>'; 
        try {
            const response = await fetch('/api/alerts/critical', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok && data.data) {
                displayCriticalAlerts(data.data.criticalAlerts);
            } else {
                criticalAlertsListDiv.innerHTML = `<p class="error">Помилка завантаження критичних сповіщень: ${data.message || 'Невідома помилка'}</p>`; 
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні критичних сповіщень:', error);
            criticalAlertsListDiv.innerHTML = `<p class="error">Мережева помилка при завантаженні критичних сповіщень.</p>`; 
        }
    }

    function displayCriticalAlerts(alerts) {
        if (!criticalAlertsListDiv) return;
        criticalAlertsListDiv.innerHTML = '';
        if (!alerts || alerts.length === 0) {
            criticalAlertsListDiv.innerHTML = '<p>Немає активних критичних сповіщень.</p>'; 
            return;
        }
        alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item critical ${alert.isResolved ? 'resolved' : ''}`;
            const deviceName = alert.deviceName || alert.deviceId;
            alertItem.innerHTML = `
                <h4>🚨 ${alert.type} - Пристрій: ${deviceName} - Рівень: ${alert.severity}</h4>
                <p>Повідомлення: ${alert.message}</p>
                <p>Час: ${new Date(alert.createdAt).toLocaleString()}</p>
                <p><a href="/html/devices.html?id=${alert.deviceId}">Детальніше про пристрій</a></p>
            `;
            criticalAlertsListDiv.appendChild(alertItem);
        });
    }

    async function fetchAlertStatistics() {
        console.log('Fetching alert statistics...');
        try {
            const response = await fetch('/api/alerts/statistics?days=30', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (response.ok && data.data) {
                const stats = data.data.summary;
                const byType = data.data.byType;
                const byDevice = data.data.byDevice;
                const dailyTrend = data.data.dailyTrend;

                if (totalAlertsCount) totalAlertsCount.textContent = stats.totalAlerts || 0;
                if (unresolvedAlertsStats) unresolvedAlertsStats.textContent = stats.unresolvedAlerts || 0;
                if (resolvedAlertsStats) resolvedAlertsStats.textContent = stats.resolvedAlerts || 0;

                if (tempAlertsStats) tempAlertsStats.textContent = (byType.find(s => s._id === 'TEMPERATURE') || { count: 0 }).count;
                if (humidityAlertsStats) humidityAlertsStats.textContent = (byType.find(s => s._id === 'HUMIDITY') || { count: 0 }).count;
                if (offlineAlertsStats) offlineAlertsStats.textContent = (byType.find(s => s._id === 'DEVICE_OFFLINE') || { count: 0 }).count;

                if (alertsByDeviceStatsDiv) {
                    alertsByDeviceStatsDiv.innerHTML = '';
                    if (byDevice && byDevice.length > 0) {
                        byDevice.forEach(item => {
                            const p = document.createElement('p');
                            p.innerHTML = `<strong>${item.deviceName || item._id}</strong>: Всього: ${item.count}, Не вирішено: ${item.unresolved}`; 
                            alertsByDeviceStatsDiv.appendChild(p);
                        });
                    } else {
                        alertsByDeviceStatsDiv.innerHTML = '<p>Немає статистики за пристроями.</p>'; 
                    }
                }
                if (dailyAlertsChartCanvas) renderDailyAlertsChart(dailyTrend);
            } else {
                console.error('Помилка завантаження статистики сповіщень:', data.message);
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні статистики сповіщень:', error);
        }
    }

    function renderDailyAlertsChart(dailyTrendData) {
        if (!dailyAlertsChartCanvas) return;
        if (dailyAlertsChartInstance) dailyAlertsChartInstance.destroy();
        
        const ctx = dailyAlertsChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, dailyAlertsChartCanvas.width, dailyAlertsChartCanvas.height);

        if (!dailyTrendData || dailyTrendData.length === 0) {
            ctx.font = '16px Arial'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
            ctx.fillText('Немає даних для щоденного тренду.', dailyAlertsChartCanvas.width / 2, dailyAlertsChartCanvas.height / 2); 
            return;
        }
        const labels = dailyTrendData.map(d => `${d._id.day}/${d._id.month}`);
        const counts = dailyTrendData.map(d => d.count);
        dailyAlertsChartInstance = new Chart(dailyAlertsChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Сповіщень на день', 
                    data: counts,
                    backgroundColor: '#1a73e8',
                    borderColor: '#145cb3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Кількість сповіщень' } }, x: { title: { display: true, text: 'Дата' } } }, 
                plugins: { legend: { display: false } }
            }
        });
    }

    async function populateManualAlertDeviceSelect() {
        if (!manualAlertDeviceIdSelect) return;
        manualAlertDeviceIdSelect.innerHTML = '<option value="">-- Оберіть пристрій --</option>'; 
        if (userDevices.length === 0) {
            await populateDeviceFilter(); 
        }
        userDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = `${device.name} (${device.deviceId})`;
            manualAlertDeviceIdSelect.appendChild(option);
        });
    }

    if (createManualAlertForm) {
        createManualAlertForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const deviceId = manualAlertDeviceIdSelect.value;
            const type = manualAlertTypeSelect.value;
            const severity = manualAlertSeveritySelect.value;
            const message = manualAlertMessageInput.value;
            const currentValue = manualAlertValueInput.value !== '' ? parseFloat(manualAlertValueInput.value) : undefined;

            if (!deviceId || !type || !message) {
                if (manualAlertMessageDiv) showMessage(manualAlertMessageDiv, 'error', 'Будь ласка, заповніть всі обов\'язкові поля (Пристрій, Тип, Повідомлення).'); 
                return;
            }
            try {
                const response = await fetch('/api/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ deviceId, type, severity, message, currentValue }),
                });
                const data = await response.json();
                if (manualAlertMessageDiv) {
                    showMessage(manualAlertMessageDiv, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Сповіщення успішно створено!' : 'Помилка створення сповіщення.')); 
                }
                if (response.ok) {
                    createManualAlertForm.reset();
                    const activeTab = document.querySelector('.tab-content.active');
                    if (activeTab && activeTab.id === 'all-alertsTab') {
                        fetchAlerts();
                    }
                }
            } catch (error) {
                console.error('Мережева помилка при створенні сповіщення:', error);
                if (manualAlertMessageDiv) showMessage(manualAlertMessageDiv, 'error', 'Сталася помилка мережі при створенні сповіщення.'); 
            }
        });
    }


    await populateDeviceFilter(); 
    

    const initiallyActiveTabLink = document.querySelector('.tab-link.active');
    if (initiallyActiveTabLink) {
        loadTabData(initiallyActiveTabLink.dataset.tab);
    } else {
        fetchAlerts(); 
    }
});
