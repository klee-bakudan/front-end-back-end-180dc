// Kembalikan ke domain API asli
const API_BASE_URL =
  'https://corsproxy.io/?https://test-180dc.vercel.app';

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

    // Hilangkan error saat mengetik
    emailInput.addEventListener('input', () => {
        emailErrorDiv.classList.remove('show');
        emailErrorDiv.textContent = '';
    });

    loginForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        const submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';

        try {

            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            console.log('STATUS:', response.status);
            console.log('DATA:', data);

            // ===== LOGIN SUCCESS =====
            if (response.ok) {

                const token =
                    data.token ||
                    data.access_token ||
                    data.data?.access_token;

                if (token) {
                    localStorage.setItem('access_token', token);
                }

                showToast('Login berhasil!', 'success');

                setTimeout(() => {
                    window.location.href = 'products.html';
                }, 1000);

            }

            // ===== LOGIN FAILED =====
            else {

                const errorMessage =
                    data.message ||
                    'Email atau password salah';

                emailErrorDiv.textContent = errorMessage;
                emailErrorDiv.classList.add('show');

                setTimeout(() => {
                    emailErrorDiv.classList.remove('show');
                    emailErrorDiv.textContent = '';
                }, 5000);
            }

        } catch (error) {

            console.error('LOGIN ERROR:', error);

            showToast(
                'Terjadi kesalahan jaringan. Cek koneksi atau CORS.',
                'error'
            );

        } finally {

            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';

        }

    });

}



// ========== STEP 3: PRODUCTS PAGE ==========
// ========== STEP 4: CREATE PRODUCT ==========
if (document.getElementById('newProductForm')) {

    const form = document.getElementById('newProductForm')

    form.addEventListener('submit', async (e) => {

        e.preventDefault()

        const token = localStorage.getItem('access_token')

        // redirect kalau belum login
        if (!token) {
            window.location.href = 'login.html'
            return
        }

        const name = document.getElementById('name').value
        const price = document.getElementById('price').value

        const submitBtn = form.querySelector('button[type="submit"]')

        submitBtn.disabled = true
        submitBtn.textContent = 'Menyimpan...'

        try {

            const response = await fetch(
                `${API_BASE_URL}/api/v1/products`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        name,
                        price: Number(price)
                    })
                }
            )

            const data = await response.json()

            console.log(data)

            // ===== SUCCESS =====
            if (response.status === 201 || response.ok) {

                showToast(
                    'Product berhasil dibuat!',
                    'success'
                )

                setTimeout(() => {
                    window.location.href = 'products.html'
                }, 1000)

                return
            }

            // ===== TOKEN EXPIRED =====
            if (response.status === 401) {

                localStorage.removeItem('access_token')

                showToast(
                    'Session expired, silakan login lagi',
                    'error'
                )

                setTimeout(() => {
                    window.location.href = 'login.html'
                }, 1500)

                return
            }

            // ===== VALIDATION =====
            if (response.status === 422) {

                const errorMessage =
                    data.message ||
                    'Validasi gagal'

                showToast(errorMessage, 'error')

                return
            }

            // ===== ERROR LAIN =====
            showToast(
                data.message || 'Gagal membuat product',
                'error'
            )

        } catch (error) {

            console.error(error)

            showToast(
                'Terjadi kesalahan jaringan',
                'error'
            )

        } finally {

            submitBtn.disabled = false
            submitBtn.textContent = 'Simpan Product'

        }

    })

}


// ========== PRODUCTS PAGE ==========

const API_BASE_URL =
  'https://corsproxy.io/?https://test-180dc.vercel.app'


// ======================
// PRODUCTS PAGE
// ======================

if (document.getElementById('productsContainer')) {

    const token =
        localStorage.getItem('access_token')

    if (!token) {

        window.location.href = 'login.html'

    } else {

        fetchProducts()

    }

}


// GLOBAL STATE
let currentPage = 1
let totalPages = 1
let currentLimit = 10


// SEARCH
document
    .getElementById('searchBtn')
    ?.addEventListener('click', () => {

        currentPage = 1

        fetchProducts()

    })


// PAGINATION
document
    .getElementById('prevPage')
    ?.addEventListener('click', () => {

        if (currentPage > 1) {

            currentPage--

            fetchProducts()

        }

    })


document
    .getElementById('nextPage')
    ?.addEventListener('click', () => {

        if (currentPage < totalPages) {

            currentPage++

            fetchProducts()

        }

    })


// ADD PRODUCT
document
    .getElementById('addProductBtn')
    ?.addEventListener('click', () => {

        window.location.href = 'new-product.html'

    })


// FETCH PRODUCTS
async function fetchProducts() {

    const token =
        localStorage.getItem('access_token')

    document.getElementById(
        'loadingSkeleton'
    ).style.display = 'block'

    document.getElementById(
        'productsContainer'
    ).style.display = 'none'

    try {

        const search =
            document.getElementById('searchInput').value

        const sortBy =
            document.getElementById('sortBy').value

        const order =
            document.getElementById('sortOrder').value

        const url =
            `${API_BASE_URL}/api/v1/products/?page=${currentPage}&limit=${currentLimit}&search=${search}&sort_by=${sortBy}&order=${order}`

        const response = await fetch(url, {

            headers: {
                'Authorization': `Bearer ${token}`
            }

        })

        if (response.status === 401) {

            localStorage.removeItem('access_token')

            window.location.href = 'login.html'

            return
        }

        const data = await response.json()

        console.log(data)

        let products = []

        if (Array.isArray(data.data)) {

            products = data.data

        } else if (data.data?.items) {

            products = data.data.items

        }

        totalPages =
            data.data?.total_pages ||
            data.total_pages ||
            1

        renderProducts(products)

        renderPagination()

    } catch (error) {

        console.error(error)

        alert('Gagal fetch products')

    } finally {

        document.getElementById(
            'loadingSkeleton'
        ).style.display = 'none'

    }

}


// RENDER PRODUCTS
function renderProducts(products) {

    const tbody =
        document.getElementById(
            'productsTableBody'
        )

    tbody.innerHTML = ''

    if (!products || products.length === 0) {

        document.getElementById(
            'emptyState'
        ).style.display = 'block'

        return
    }

    document.getElementById(
        'productsContainer'
    ).style.display = 'block'

    products.forEach(product => {

        tbody.innerHTML += `

            <tr>

                <td>${product.name}</td>

                <td>
                    Rp ${Number(product.price)
                        .toLocaleString('id-ID')}
                </td>

                <td>
                    ${
                        product.created_at
                        ? new Date(product.created_at)
                            .toLocaleDateString('id-ID')
                        : '-'
                    }
                </td>

                <td>

                    <button
                        class="edit-btn"
                        data-id="${product.id}"
                        data-name="${product.name}"
                        data-price="${product.price}"
                    >
                        ✏️ Edit
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${product.id}"
                    >
                        🗑 Delete
                    </button>

                </td>

            </tr>

        `
    })


    // EDIT
    document
        .querySelectorAll('.edit-btn')
        .forEach(btn => {

            btn.addEventListener('click', () => {

                openEditModal(
                    btn.dataset.id,
                    btn.dataset.name,
                    btn.dataset.price
                )

            })

        })


    // DELETE
    document
        .querySelectorAll('.delete-btn')
        .forEach(btn => {

            btn.addEventListener('click', () => {

                deleteProduct(btn.dataset.id)

            })

        })

}


// PAGINATION
function renderPagination() {

    document.getElementById(
        'pageInfo'
    ).textContent =
        `Halaman ${currentPage} dari ${totalPages}`

    document.getElementById(
        'prevPage'
    ).disabled =
        currentPage === 1

    document.getElementById(
        'nextPage'
    ).disabled =
        currentPage === totalPages

}


// ======================
// EDIT MODAL
// ======================

function openEditModal(id, name, price) {

    document.getElementById(
        'editModal'
    ).style.display = 'flex'

    document.getElementById(
        'editProductId'
    ).value = id

    document.getElementById(
        'editName'
    ).value = name

    document.getElementById(
        'editPrice'
    ).value = price

}


function closeModal() {

    document.getElementById(
        'editModal'
    ).style.display = 'none'

}


// CLOSE BUTTON
document
    .getElementById('closeModalBtn')
    ?.addEventListener('click', closeModal)


// ESC CLOSE
document.addEventListener('keydown', (e) => {

    if (e.key === 'Escape') {

        closeModal()

    }

})


// CLICK OUTSIDE
window.addEventListener('click', (e) => {

    const modal =
        document.getElementById('editModal')

    if (e.target === modal) {

        closeModal()

    }

})


// EDIT SUBMIT
document
    .getElementById('editProductForm')
    ?.addEventListener('submit', async (e) => {

        e.preventDefault()

        const token =
            localStorage.getItem('access_token')

        const id =
            document.getElementById(
                'editProductId'
            ).value

        const body = {
            name:
                document.getElementById(
                    'editName'
                ).value,

            price: Number(
                document.getElementById(
                    'editPrice'
                ).value
            )
        }

        try {

            const response = await fetch(
                `${API_BASE_URL}/api/v1/products/${id}`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

                    body: JSON.stringify(body)
                }
            )

            const data = await response.json()

            console.log(data)

            if (response.ok) {

                closeModal()

                fetchProducts()

                return
            }

            document.getElementById(
                'editError'
            ).textContent =
                data.message || 'Gagal edit'

        } catch (error) {

            console.error(error)

        }

    })


// ======================
// DELETE
// ======================

async function deleteProduct(id) {

    const yes =
        confirm('Yakin hapus produk?')

    if (!yes) return

    const token =
        localStorage.getItem('access_token')

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/v1/products/${id}`,
            {
                method: 'DELETE',

                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        const data = await response.json()

        console.log(data)

        if (response.ok) {

            fetchProducts()

            return
        }

        alert(data.message || 'Gagal hapus')

    } catch (error) {

        console.error(error)

    }

}


// LOGOUT
function logout() {

    localStorage.removeItem('access_token')

    window.location.href = 'login.html'

}