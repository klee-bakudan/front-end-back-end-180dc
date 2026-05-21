const API_BASE_URL = 'https://test-180dc.vercel.app';

// ========== STEP 1: REGISTER ==========
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const emailErrorDiv = document.getElementById('emailError');
    
    // Hilangkan error saat user mulai mengetik
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            if (emailErrorDiv) {
                emailErrorDiv.classList.remove('show');
                emailErrorDiv.textContent = '';
            }
        });
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = emailInput.value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validasi confirm password
        if (password !== confirmPassword) {
            showToast('Password dan konfirmasi password tidak cocok!', 'error');
            return;
        }
        
        // Disable button
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name: name,
                    email: email, 
                    password: password,
                    confirmPassword: confirmPassword
                })
            });
            
            const data = await response.json();
            
            console.log('Status:', response.status);
            console.log('Response:', data);
            
            // ========== HANDLE 201 SUCCESS ==========
            if (response.status === 201 && data.success === true) {
                // Simpan token ke localStorage
                if (data.data && data.data.access_token) {
                    localStorage.setItem('access_token', data.data.access_token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                }
                
                showToast(data.message || 'Registrasi berhasil! Redirect ke login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }
            
            // ========== HANDLE 409 CONFLICT (Email sudah digunakan) ==========
            if (response.status === 409) {
                const errorMessage = data.message || 'Email sudah terdaftar';
                // Tampilkan error INLINE di bawah email
                if (emailErrorDiv) {
                    showInlineError(errorMessage);
                } else {
                    showToast(errorMessage, 'error');
                }
                return;
            }
            
            // ========== HANDLE 422 VALIDATION ERROR ==========
            if (response.status === 422) {
                let errorMessage = data.message || 'Validasi gagal';
                
                // Cek apakah ada details error untuk email
                if (data.error && data.error.details && Array.isArray(data.error.details)) {
                    // Cari error yang berhubungan dengan email
                    const emailErrorDetail = data.error.details.find(detail => 
                        detail.field && detail.field.includes('email')
                    );
                    
                    if (emailErrorDetail) {
                        errorMessage = emailErrorDetail.message;
                        // Tampilkan inline di bawah email
                        if (emailErrorDiv) {
                            showInlineError(errorMessage);
                            return;
                        }
                    } else {
                        // Error lain (name, password, dll)
                        const firstError = data.error.details[0];
                        if (firstError) {
                            errorMessage = `${firstError.field}: ${firstError.message}`;
                        }
                    }
                }
                
                showToast(errorMessage, 'error');
                return;
            }
            
            // ========== HANDLE 500 INTERNAL SERVER ERROR ==========
            if (response.status === 500) {
                showToast('Terjadi kesalahan pada server. Silakan coba lagi nanti.', 'error');
                return;
            }
            
            // ========== HANDLE ERROR LAINNYA ==========
            showToast(data.message || 'Registrasi gagal', 'error');
            
        } catch (error) {
            console.error('Error detail:', error);
            
            // Cek apakah error karena CORS
            if (error.message === 'Failed to fetch') {
                showToast('Error CORS: Gunakan proxy atau extension CORS untuk testing', 'error');
            } else {
                showToast('Terjadi kesalahan jaringan. Silakan coba lagi.', 'error');
            }
        } finally {
            // Enable button lagi
            submitBtn.disabled = false;
            submitBtn.textContent = 'Daftar';
        }
    });
}

// Fungsi show inline error di bawah email
function showInlineError(message) {
    const emailErrorDiv = document.getElementById('emailError');
    if (emailErrorDiv) {
        emailErrorDiv.textContent = message;
        emailErrorDiv.classList.add('show');
        // Auto hilang setelah 5 detik
        setTimeout(() => {
            emailErrorDiv.classList.remove('show');
            emailErrorDiv.textContent = '';
        }, 5000);
    }
}

// Fungsi toast notification
function showToast(message, type = 'success') {
    // Hapus toast yang sudah ada
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto hilang setelah 3 detik
    setTimeout(() => {
        toast.remove();
    }, 3000);
}









// ========== STEP 2: LOGIN ==========
// ========== STEP 2: LOGIN ==========
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailErrorDiv = document.getElementById('emailError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        console.log('🔍 Mencoba login dengan:', { email, password });
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            console.log('📡 Status:', response.status);
            console.log('📦 Response data:', data);
            console.log('📝 emailErrorDiv:', emailErrorDiv);

            if (response.status === 200 && data.success === true) {
                console.log('✅ Login sukses!');
                localStorage.setItem('access_token', data.data.access_token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                window.location.href = 'products.html';
                
            } else if (response.status === 401) {
                console.log('❌ Masuk ke handler 401');
                const errorMessage = data.message || 'Email atau password salah';
                console.log('Pesan error:', errorMessage);
                
                if (emailErrorDiv) {
                    console.log('✅ emailErrorDiv ditemukan, menampilkan error...');
                    emailErrorDiv.textContent = errorMessage;
                    emailErrorDiv.classList.add('show');
                    console.log('classList emailErrorDiv:', emailErrorDiv.classList);
                    setTimeout(() => {
                        emailErrorDiv.classList.remove('show');
                        emailErrorDiv.textContent = '';
                    }, 5000);
                } else {
                    console.log('❌ emailErrorDiv TIDAK ditemukan!');
                    alert(errorMessage);
                }
                
            } else {
                console.log('⚠️ Response lain:', response.status);
                showToast(data.message || 'Login gagal', 'error');
            }
            
        } catch (error) {
            console.error('💥 Login error:', error);
            showToast('Terjadi kesalahan jaringan. Cek koneksi atau CORS.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
}