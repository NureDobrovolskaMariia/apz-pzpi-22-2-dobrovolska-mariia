document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded for admin page.');

    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    // Елементи навігації
    const userNameNav = document.getElementById('userNameNav');
    const userRoleNav = document.getElementById('userRoleNav');
    const adminPanelLink = document.getElementById('adminPanelLink'); 
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    const userDropdownTrigger = document.getElementById('userDropdownTrigger');
    const userDropdown = document.getElementById('userDropdown');

    // Елементи вкладок
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Керування користувачами
    const usersTableBody = document.getElementById('usersTableBody');
    const userSearchInput = document.getElementById('userSearchInput');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userActiveFilter = document.getElementById('userActiveFilter');
    const applyUserFiltersBtn = document.getElementById('applyUserFiltersBtn');
    const prevUserPageBtn = document.getElementById('prevUserPageBtn');
    const currentUserPageSpan = document.getElementById('currentUserPageSpan');
    const nextUserPageBtn = document.getElementById('nextUserPageBtn');
    const userManagementMessage = document.getElementById('userManagementMessage');
    let currentUserPage = 1;
    const usersPerPage = 10;

    // Модальне вікно редагування користувача
    const editUserRoleModal = document.getElementById('editUserRoleModal');
    const modalUserId = document.getElementById('modalUserId');
    const modalUserName = document.getElementById('modalUserName');
    const modalUserEmail = document.getElementById('modalUserEmail');
    const modalUserRoleSelect = document.getElementById('modalUserRoleSelect');
    const modalUserIsActive = document.getElementById('modalUserIsActive');
    const saveUserRoleBtn = document.getElementById('saveUserRoleBtn');
    const editUserModalMessage = document.getElementById('editUserModalMessage');
    const closeButton = editUserRoleModal.querySelector('.close-button');


    // Статистика платформи
    const platformStatsDaysFilter = document.getElementById('platformStatsDaysFilter');
    const platformStatsCards = document.getElementById('platformStatsCards');
    const userRegistrationChartCanvas = document.getElementById('userRegistrationChart');
    const deviceStatusChartCanvas = document.getElementById('deviceStatusChart');
    let userRegChartInstance, deviceStatusChartInstance;

    // Моніторинг системи
    const serverInfoDisplay = document.getElementById('serverInfoDisplay');
    const healthCheckDisplay = document.getElementById('healthCheckDisplay');
    const refreshHealthCheckBtn = document.getElementById('refreshHealthCheckBtn');
    
    // --- Допоміжні функції ---
    function showUIMessage(element, type, text) {
        if (!element) return;
        element.textContent = text;
        element.className = `message-area ${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 5000);
    }

    if (userDropdownTrigger) {
        userDropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); userDropdown.classList.toggle('show');
        });
        window.addEventListener('click', (e) => {
            if (userDropdown.classList.contains('show') && !userDropdownTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', () => {
            localStorage.removeItem('jwtToken'); window.location.href = '/html/login.html';
        });
    }
    
    // --- Перевірка ролі та завантаження профілю для навігації ---
    async function initializeAdminPage() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const user = data.data.user;
                userNameNav.textContent = user.name;
                userRoleNav.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                if (user.role !== 'admin') {
                    alert('Доступ заборонено. Ця сторінка лише для адміністраторів.');
                    window.location.href = '/html/dashboard.html';
                    return;
                }
                adminPanelLink.style.display = 'block'; // Переконатися, що посилання видиме
                 loadTabData('user-management'); // Завантажити дані для першої вкладки
            } else {
                localStorage.removeItem('jwtToken'); window.location.href = '/html/login.html';
            }
        } catch (error) {
            console.error('Network error fetching profile:', error);
            localStorage.removeItem('jwtToken'); window.location.href = '/html/login.html';
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
            loadTabData(link.dataset.tab);
        });
    });

    function loadTabData(tabId) {
        console.log("Loading data for tab:", tabId);
        switch (tabId) {
            case 'user-management':
                fetchUsers();
                break;
            case 'platform-stats':
                fetchPlatformStats();
                break;
            case 'system-monitoring':
                fetchSystemHealth();
                break;
        }
    }

    // --- Керування користувачами ---
    async function fetchUsers() {
        const searchTerm = userSearchInput.value;
        const role = userRoleFilter.value;
        const isActive = userActiveFilter.value;

        let query = `page=${currentUserPage}&limit=${usersPerPage}`;
        if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
        if (role) query += `&role=${role}`;
        if (isActive !== "") query += `&isActive=${isActive}`;

        usersTableBody.innerHTML = '<tr><td colspan="6">Завантаження користувачів...</td></tr>';
        try {
            const response = await fetch(`/api/users?${query}`, { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                displayUsersTable(data.data.users, data.pagination);
            } else {
                usersTableBody.innerHTML = `<tr><td colspan="6">Помилка: ${data.message}</td></tr>`;
            }
        } catch (error) {
            usersTableBody.innerHTML = `<tr><td colspan="6">Мережева помилка: ${error.message}</td></tr>`;
        }
    }

    function displayUsersTable(users, pagination) {
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="6">Користувачів не знайдено.</td></tr>';
        } else {
            users.forEach(user => {
                const row = usersTableBody.insertRow();
                row.insertCell().textContent = user._id;
                row.insertCell().textContent = user.name;
                row.insertCell().textContent = user.email;
                row.insertCell().textContent = user.role;
                row.insertCell().innerHTML = user.isActive ? 
                    '<span class="status-indicator status-online">Так</span>' : 
                    '<span class="status-indicator status-offline">Ні</span>';

                const actionsCell = row.insertCell();
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-sm primary-btn';
                editBtn.textContent = 'Редагувати';
                editBtn.onclick = () => openEditUserModal(user);
                actionsCell.appendChild(editBtn);
                
                const promoteBtn = document.createElement('button');
                promoteBtn.className = 'btn btn-sm secondary-btn ml-5';
                promoteBtn.textContent = 'Підвищити до Admin';
                promoteBtn.disabled = user.role === 'admin';
                promoteBtn.onclick = () => promoteUserToAdmin(user._id, user.name);
                actionsCell.appendChild(promoteBtn);
            });
        }
        currentUserPageSpan.textContent = `Сторінка ${pagination.page} з ${pagination.pages || 1}`;
        prevUserPageBtn.disabled = pagination.page === 1;
        nextUserPageBtn.disabled = pagination.page === pagination.pages || pagination.pages === 0;
    }

    applyUserFiltersBtn.addEventListener('click', () => { currentUserPage = 1; fetchUsers(); });
    prevUserPageBtn.addEventListener('click', () => { if (currentUserPage > 1) { currentUserPage--; fetchUsers(); } });
    nextUserPageBtn.addEventListener('click', () => { currentUserPage++; fetchUsers(); });

    function openEditUserModal(user) {
        modalUserId.value = user._id;
        modalUserName.textContent = user.name;
        modalUserEmail.textContent = user.email;
        modalUserRoleSelect.value = user.role;
        modalUserIsActive.checked = user.isActive;
        editUserModalMessage.style.display = 'none';
        editUserRoleModal.style.display = 'flex';
    }
    
    if(closeButton) {
       closeButton.onclick = () => editUserRoleModal.style.display = 'none';
    }
    window.onclick = (event) => {
      if (event.target == editUserRoleModal) {
        editUserRoleModal.style.display = "none";
      }
    }

    saveUserRoleBtn.addEventListener('click', async () => {
        const userId = modalUserId.value;
        const newRole = modalUserRoleSelect.value;
        const isActive = modalUserIsActive.checked;

        try {
            const response = await fetch(`/api/users/${userId}`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: newRole, isActive: isActive })
            });
            const data = await response.json();
            if (response.ok) {
                showUIMessage(editUserModalMessage, 'success', 'Дані користувача оновлено!');
                fetchUsers();
                setTimeout(() => { editUserRoleModal.style.display = 'none'; }, 1500);
            } else {
                showUIMessage(editUserModalMessage, 'error', `Помилка: ${data.message}`);
            }
        } catch (error) {
            showUIMessage(editUserModalMessage, 'error', `Мережева помилка: ${error.message}`);
        }
    });

    async function promoteUserToAdmin(userId, userName) {
        if (!confirm(`Ви впевнені, що хочете підвищити користувача ${userName} (${userId}) до адміністратора?`)) {
            return;
        }
        try {
            const response = await fetch(`/api/users/${userId}/promote`, { 
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                showUIMessage(userManagementMessage, 'success', data.message || 'Користувача підвищено до адміністратора.');
                fetchUsers();
            } else {
                showUIMessage(userManagementMessage, 'error', data.message || 'Не вдалося підвищити користувача.');
            }
        } catch (error) {
            showUIMessage(userManagementMessage, 'error', `Мережева помилка: ${error.message}`);
        }
    }


    // --- Статистика платформи ---
    platformStatsDaysFilter.addEventListener('change', fetchPlatformStats);

    async function fetchPlatformStats() {
        const days = platformStatsDaysFilter.value;
        platformStatsCards.innerHTML = '<p>Завантаження статистики...</p>';
        try {
            const response = await fetch(`/api/users/platform/stats?days=${days}`, { //
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                displayPlatformStats(data.data);
            } else {
                platformStatsCards.innerHTML = `<p class="error">Помилка: ${data.message}</p>`;
            }
        } catch (error) {
            platformStatsCards.innerHTML = `<p class="error">Мережева помилка: ${error.message}</p>`;
        }
    }

    function displayPlatformStats(stats) {
        platformStatsCards.innerHTML = ''; 
        
        function createStatCard(title, value) {
            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `<h3>${title}</h3><p>${value}</p>`;
            platformStatsCards.appendChild(card);
        }

        createStatCard('Загальна кількість користувачів', stats.users.total);
        createStatCard('Нові користувачі', `${stats.users.new} (за ${platformStatsDaysFilter.value} дн.)`);
        createStatCard('Адміністратори', stats.users.admins);
        createStatCard('Загальна кількість пристроїв', stats.devices.total);
        createStatCard('Пристроїв онлайн', stats.devices.online);
        createStatCard('Нові пристрої', `${stats.devices.new} (за ${platformStatsDaysFilter.value} дн.)`);
        createStatCard('Загальна кількість сповіщень', `${stats.alerts.total} (за ${platformStatsDaysFilter.value} дн.)`);
        createStatCard('Невирішених сповіщень', stats.alerts.unresolved);
        createStatCard('Критичних сповіщень', stats.alerts.critical);
        createStatCard('Обсяг даних (записів)', `${stats.data.volume} (за ${platformStatsDaysFilter.value} дн.)`);

        renderUserRegistrationChart(stats.trends.userRegistrations);
        renderDeviceStatusChart(stats.devices);
    }

    function renderUserRegistrationChart(trendData) {
        if (userRegChartInstance) userRegChartInstance.destroy();
        if (!trendData || trendData.length === 0) {
            userRegistrationChartCanvas.getContext('2d').fillText('Немає даних для тренду реєстрацій.', 10, 50);
            return;
        }
        const labels = trendData.map(d => `${d._id.day}/${d._id.month}/${d._id.year}`);
        const dataPoints = trendData.map(d => d.count);

        userRegChartInstance = new Chart(userRegistrationChartCanvas, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Реєстрації користувачів', data: dataPoints, borderColor: '#1a73e8', tension: 0.1 }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    function renderDeviceStatusChart(deviceStats) {
        if (deviceStatusChartInstance) deviceStatusChartInstance.destroy();
         const data = {
            labels: ['Онлайн', 'Офлайн', 'Всього активних'],
            datasets: [{
                label: 'Статус пристроїв',
                data: [deviceStats.online, deviceStats.total - deviceStats.online, deviceStats.total],
                backgroundColor: ['#28a745', '#dc3545', '#007bff']
            }]
        };
        deviceStatusChartInstance = new Chart(deviceStatusChartCanvas, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    }


    // --- Моніторинг системи ---
    refreshHealthCheckBtn.addEventListener('click', fetchSystemHealth);

    async function fetchSystemHealth() {
        serverInfoDisplay.innerHTML = '<p>Завантаження інформації про сервер...</p>';
        healthCheckDisplay.innerHTML = '<p>Завантаження стану системи...</p>';
        try {
            const response = await fetch('/health', { headers: { 'Authorization': `Bearer ${token}` } }); //
            const data = await response.json();
            if (response.ok) {
                displayServerInfo(data);
                displayHealthCheck(data);
            } else {
                serverInfoDisplay.innerHTML = `<p class="error">Помилка: ${data.message || 'Не вдалося завантажити інформацію'}</p>`;
                healthCheckDisplay.innerHTML = `<p class="error">Помилка: ${data.message || 'Не вдалося завантажити стан'}</p>`;
            }
        } catch (error) {
            serverInfoDisplay.innerHTML = `<p class="error">Мережева помилка: ${error.message}</p>`;
            healthCheckDisplay.innerHTML = `<p class="error">Мережева помилка: ${error.message}</p>`;
        }
    }

    function displayServerInfo(healthData) {
        serverInfoDisplay.innerHTML = `
            <div class="summary-card"><h3>Версія API/Сервера</h3><p>${healthData.environment} (умовно)</p></div>
            <div class="summary-card"><h3>Час роботи сервера</h3><p>${(healthData.uptime / 3600).toFixed(2)} годин</p></div>
            <div class="summary-card"><h3>Використання пам'яті (Heap Total)</h3><p>${(healthData.memory.heapTotal / 1024 / 1024).toFixed(2)} MB</p></div>
            <div class="summary-card"><h3>Використання пам'яті (Heap Used)</h3><p>${(healthData.memory.heapUsed / 1024 / 1024).toFixed(2)} MB</p></div>
        `;
    }

    function displayHealthCheck(healthData) {
        healthCheckDisplay.innerHTML = `
            <div class="summary-card">
                <h3>Статус сервера</h3>
                <p class="${healthData.status === 'OK' ? 'status-online' : 'status-offline'}">${healthData.status}</p>
            </div>
            <div class="summary-card"><h3>Час перевірки</h3><p>${new Date(healthData.timestamp).toLocaleString()}</p></div>
            <div class="summary-card"><h3>База даних</h3><p class="${healthData.database === 'connected' ? 'status-online' : 'status-offline'}">${healthData.database}</p></div>
            <div class="summary-card"><h3>MQTT Брокер</h3><p class="${healthData.mqtt === 'connected' ? 'status-online' : 'status-offline'}">${healthData.mqtt}</p></div>
        `;
    }

    // --- Початкове завантаження ---
    initializeAdminPage();
});