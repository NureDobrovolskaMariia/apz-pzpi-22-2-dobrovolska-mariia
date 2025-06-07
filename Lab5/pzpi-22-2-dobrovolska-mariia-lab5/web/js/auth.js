document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const messageDiv = document.getElementById('message');

    
    function showMessage(type, text) {
        messageDiv.textContent = text;
        messageDiv.className = `message-area ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000); 
    }

   
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('jwtToken', data.token); 
                    showMessage('success', data.message);
                    window.location.href = '/html/dashboard.html'; 
                } else {
                    showMessage('error', data.message || 'Ошибка входа');
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                showMessage('error', 'Произошла ошибка сети. Пожалуйста, попробуйте ещё раз.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value; 

         
            if (password.length < 8) { 
                showMessage('error', 'Пароль должен быть не менее 8 символов.');
                return;
            }
            if (password !== confirmPassword) {
                showMessage('error', 'Пароли не совпадают.');
                return;
            }
           
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showMessage('error', 'Пожалуйста, введите действительный email.');
                return;
            }


            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('success', data.message + '. Теперь вы можете войти.');
                    setTimeout(() => {
                        window.location.href = '/html/login.html'; 
                    }, 2000);
                } else {
                    showMessage('error', data.message || 'Ошибка регистрации');
                }І
            } catch (error) {
                console.error('Ошибка сети:', error);
                showMessage('error', 'Произошла ошибка сети. Пожалуйста, попробуйте ещё раз.');
            }
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/html/register.html';
        });
    }
});