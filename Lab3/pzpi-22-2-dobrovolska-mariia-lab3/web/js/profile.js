
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM завантажено для сторінки профілю.'); 

    // Елементи навігації та загальні елементи
    const userNameNav = document.getElementById('userNameNav');
    const userRoleNav = document.getElementById('userRoleNav');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const logoutBtn = document.getElementById('logoutBtn'); 
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    const userDropdownTrigger = document.getElementById('userDropdownTrigger');
    const userDropdown = document.getElementById('userDropdown');

    // Елементи відображення профілю
    const profileNameSpan = document.getElementById('profileName');
    const profileEmailSpan = document.getElementById('profileEmail');
    const profileRoleSpan = document.getElementById('profileRole');
    const memberSinceSpan = document.getElementById('memberSince');

    // Елементи статистики профілю
    const statDeviceCount = document.getElementById('statDeviceCount');
    const statUnresolvedAlerts = document.getElementById('statUnresolvedAlerts');
    const statRecentAlerts = document.getElementById('statRecentAlerts');

    // Форма редагування профілю
    const updateProfileForm = document.getElementById('updateProfileForm');
    const editNameInput = document.getElementById('editName');
    const currentPasswordInput = document.getElementById('currentPassword'); 
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const profileMessageDiv = document.getElementById('profileMessage');

    // Форма налаштувань email
    const updateEmailSettingsForm = document.getElementById('updateEmailSettingsForm');
    const emailNotificationsEnabledCheckbox = document.getElementById('emailNotificationsEnabled');
    const emailSettingsMessageDiv = document.getElementById('emailSettingsMessage');

    // Форма налаштувань сповіщень про температуру
    const updateTempAlertSettingsForm = document.getElementById('updateTempAlertSettingsForm');
    const tempMinInput = document.getElementById('tempMin');
    const tempMaxInput = document.getElementById('tempMax');
    const tempAlertMessageDiv = document.getElementById('tempAlertMessage');

    // Форма налаштувань сповіщень про вологість
    const updateHumidityAlertSettingsForm = document.getElementById('updateHumidityAlertSettingsForm');
    const humidityMinInput = document.getElementById('humidityMin');
    const humidityMaxInput = document.getElementById('humidityMax');
    const humidityAlertMessageDiv = document.getElementById('humidityAlertMessage');

    // Елементи вкладок
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const token = localStorage.getItem('jwtToken');

    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    // Функція для відображення повідомлень
    function showMessage(element, type, text) {
        if (!element) {
            
            return;
        }
        element.textContent = text;
        element.className = `message-area ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    // Перемикання видимості випадаючого меню
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

    // Функціонал виходу
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

    // Логіка перемикання вкладок
    if (tabLinks.length > 0 && tabContents.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                tabLinks.forEach(item => item.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                link.classList.add('active');
                const targetTabId = link.dataset.tab + 'Tab';
                const targetTabElement = document.getElementById(targetTabId);
                if (targetTabElement) {
                    targetTabElement.classList.add('active');
                }
            });
        });
    }

    // Завантаження профілю користувача
    async function fetchUserProfile() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.data && data.data.user) {
                const user = data.data.user;
                if (userNameNav) userNameNav.textContent = user.name;
                if (userRoleNav) userRoleNav.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

                if (profileNameSpan) profileNameSpan.textContent = user.name;
                if (profileEmailSpan) profileEmailSpan.textContent = user.email;
                if (profileRoleSpan) profileRoleSpan.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                if (memberSinceSpan) memberSinceSpan.textContent = new Date(user.createdAt).toLocaleDateString();

                if (editNameInput) editNameInput.value = user.name;
                if (emailNotificationsEnabledCheckbox) emailNotificationsEnabledCheckbox.checked = user.emailNotifications;
                
                if (tempMinInput) tempMinInput.value = user.alertSettings?.temperature?.min ?? 36.0;
                if (tempMaxInput) tempMaxInput.value = user.alertSettings?.temperature?.max ?? 39.0;
                if (humidityMinInput) humidityMinInput.value = user.alertSettings?.humidity?.min ?? 50.0;
                if (humidityMaxInput) humidityMaxInput.value = user.alertSettings?.humidity?.max ?? 70.0;

                if (adminPanelLink) {
                    adminPanelLink.style.display = user.role === 'admin' ? 'block' : 'none';
                }
                return user;
            } else {
                console.error('Помилка завантаження профілю:', data.message); 
  
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні профілю:', error); 

        }
    }

    // Завантаження статистики користувача
    async function fetchUserStats() {
        try {
            const response = await fetch('/api/auth/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.data) {
                const stats = data.data;
                if (statDeviceCount) statDeviceCount.textContent = stats.deviceCount;
                if (statUnresolvedAlerts) statUnresolvedAlerts.textContent = stats.unresolvedAlertsCount;
                if (statRecentAlerts) statRecentAlerts.textContent = stats.recentAlertsCount;
            } else {
                console.error('Помилка завантаження статистики:', data.message); 
            }
        } catch (error) {
            console.error('Мережева помилка при завантаженні статистики:', error); 
        }
    }

    // Обробка форми оновлення профілю
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = editNameInput.value;
            const currentPassword = currentPasswordInput ? currentPasswordInput.value : null; // Отримуємо поточний пароль
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;
            let profileUpdateData = { name: newName };

            // Логіка зміни пароля
            if (newPassword) {
                if (!currentPassword) {
                    if (profileMessageDiv) showMessage(profileMessageDiv, 'error', 'Будь ласка, введіть поточний пароль для його зміни.');
                    return;
                }
                if (newPassword.length < 8) {
                    if (profileMessageDiv) showMessage(profileMessageDiv, 'error', 'Новий пароль має містити щонайменше 8 символів.'); 
                    return;
                }
                if (newPassword !== confirmNewPassword) {
                    if (profileMessageDiv) showMessage(profileMessageDiv, 'error', 'Нові паролі не співпадають.'); 
                    return;
                }
                
                try {
                    const passwordChangeResponse = await fetch('/api/auth/change-password', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword }),
                    });
                    const passwordChangeData = await passwordChangeResponse.json();
                    if (passwordChangeResponse.ok) {
                        if (profileMessageDiv) showMessage(profileMessageDiv, 'success', passwordChangeData.message || 'Пароль успішно оновлено!'); 
                        if (newPasswordInput) newPasswordInput.value = '';
                        if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                        if (currentPasswordInput) currentPasswordInput.value = ''; // Очистити поле поточного пароля
                    } else {
                        if (profileMessageDiv) showMessage(profileMessageDiv, 'error', passwordChangeData.message || 'Помилка зміни пароля.'); 
                        return; 
                    }
                } catch (error) {
                    console.error('Мережева помилка при зміні пароля:', error); 
                    if (profileMessageDiv) showMessage(profileMessageDiv, 'error', 'Сталася мережева помилка при зміні пароля.'); 
                    return;
                }
            }

            // Оновлення імені (якщо пароль не змінювався або змінився успішно)
            try {
                const profileUpdateResponse = await fetch('/api/auth/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(profileUpdateData), // Надсилаємо тільки ім'я, якщо пароль не змінювався
                });
                const updatedProfileData = await profileUpdateResponse.json();
                if (profileUpdateResponse.ok) {
                 
                    if (!newPassword && profileMessageDiv) {
                        showMessage(profileMessageDiv, 'success', updatedProfileData.message || 'Профіль успішно оновлено!'); 
                    } else if (newPassword && profileMessageDiv) {
                       
                    }
                    fetchUserProfile(); 
                } else {
                     if (profileMessageDiv) showMessage(profileMessageDiv, 'error', updatedProfileData.message || 'Помилка оновлення профілю.'); 
                }
            } catch (error) {
                console.error('Мережева помилка при оновленні профілю:', error); 
                if (profileMessageDiv) showMessage(profileMessageDiv, 'error', 'Сталася мережева помилка при оновленні профілю.'); 
            }
        });
    }

    // Обробка форми налаштувань email
    if (updateEmailSettingsForm) {
        updateEmailSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailNotifications = emailNotificationsEnabledCheckbox.checked;
            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ emailNotifications }),
                });
                const data = await response.json();
                if (emailSettingsMessageDiv) {
                    showMessage(emailSettingsMessageDiv, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Налаштування email сповіщень успішно оновлено!' : 'Помилка оновлення налаштувань email.')); 
                }
            } catch (error) {
                console.error('Мережева помилка при оновленні налаштувань email:', error); 
                if (emailSettingsMessageDiv) showMessage(emailSettingsMessageDiv, 'error', 'Сталася мережева помилка при оновленні налаштувань email.'); 
            }
        });
    }

    // Обробка форми налаштувань сповіщень про температуру
    if (updateTempAlertSettingsForm) {
        updateTempAlertSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const minTemp = parseFloat(tempMinInput.value);
            const maxTemp = parseFloat(tempMaxInput.value);

            if (isNaN(minTemp) || isNaN(maxTemp) || minTemp >= maxTemp) {
                if (tempAlertMessageDiv) showMessage(tempAlertMessageDiv, 'error', 'Введіть коректні значення для мінімальної та максимальної температури (мін < макс).'); 
                return;
            }
            // Припускаємо, що SENSOR_LIMITS.TEMPERATURE.MIN та MAX доступні або жорстко закодовані тут для валідації
            const SENSOR_TEMP_MIN = -50; // Приклад
            const SENSOR_TEMP_MAX = 100; // Приклад
            if (minTemp < SENSOR_TEMP_MIN || maxTemp > SENSOR_TEMP_MAX) {
                if (tempAlertMessageDiv) showMessage(tempAlertMessageDiv, 'error', `Діапазон температур має бути від ${SENSOR_TEMP_MIN}°C до ${SENSOR_TEMP_MAX}°C.`); 
                return;
            }
            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ alertSettings: { temperature: { min: minTemp, max: maxTemp } } }),
                });
                const data = await response.json();
                if (tempAlertMessageDiv) {
                    showMessage(tempAlertMessageDiv, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Налаштування сповіщень про температуру успішно оновлено!' : 'Помилка оновлення налаштувань температури.')); 
                }
            } catch (error) {
                console.error('Мережева помилка при оновленні налаштувань температури:', error); 
                if (tempAlertMessageDiv) showMessage(tempAlertMessageDiv, 'error', 'Сталася мережева помилка при оновленні налаштувань температури.'); 
            }
        });
    }

    // Обробка форми налаштувань сповіщень про вологість
    if (updateHumidityAlertSettingsForm) {
        updateHumidityAlertSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const minHum = parseFloat(humidityMinInput.value);
            const maxHum = parseFloat(humidityMaxInput.value);

            if (isNaN(minHum) || isNaN(maxHum) || minHum >= maxHum) {
                if (humidityAlertMessageDiv) showMessage(humidityAlertMessageDiv, 'error', 'Введіть коректні значення для мінімальної та максимальної вологості (мін < макс).'); 
                return;
            }
            const SENSOR_HUM_MIN = 0; // Приклад
            const SENSOR_HUM_MAX = 100; // Приклад
            if (minHum < SENSOR_HUM_MIN || maxHum > SENSOR_HUM_MAX) {
                if (humidityAlertMessageDiv) showMessage(humidityAlertMessageDiv, 'error', `Діапазон вологості має бути від ${SENSOR_HUM_MIN}% до ${SENSOR_HUM_MAX}%.`); 
                return;
            }
            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ alertSettings: { humidity: { min: minHum, max: maxHum } } }),
                });
                const data = await response.json();
                if (humidityAlertMessageDiv) {
                    showMessage(humidityAlertMessageDiv, response.ok ? 'success' : 'error', data.message || (response.ok ? 'Налаштування сповіщень про вологість успішно оновлено!' : 'Помилка оновлення налаштувань вологості.')); 
                }
            } catch (error) {
                console.error('Мережева помилка при оновленні налаштувань вологості:', error); 
                if (humidityAlertMessageDiv) showMessage(humidityAlertMessageDiv, 'error', 'Сталася мережева помилка при оновленні налаштувань вологості.'); 
            }
        });
    }

    
    await fetchUserProfile();
    await fetchUserStats();
});
