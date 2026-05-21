//config
const API_BASE_URL = 'https://corsproxy.io/?https://test-180dc.vercel.app';

//function
function showInlineError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => {
            errorDiv.classList.remove('show');
            errorDiv.textContent = '';
        }, 5000);
    }
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}


function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


//regis
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const emailErrorDiv = document.getElementById('emailError');

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

        //cek
        if (!name) {
            showToast('Nama lengkap wajib diisi', 'error');
            return;
        }

        if (!email) {
            showToast('Email wajib diisi', 'error');
            return;
        }

        if (!password) {
            showToast('Password wajib diisi', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password minimal 6 karakter!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Password dan konfirmasi password tidak cocok!', 'error');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, confirmPassword })
            });

            const data = await response.json();

            console.log('Status:', response.status);
            console.log('Response:', data);

            // 201 SUCCESS
            if (response.status === 201 && data.success === true) {
                showToast(data.message || 'Registrasi berhasil!', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }

            // 409 CONFLICT (Email sudah digunakan)
            if (response.status === 409) {
                const errorMessage = data.message || 'Email sudah terdaftar';
                if (emailErrorDiv) {
                    showInlineError('emailError', errorMessage);
                }
                return;
            }

            // 422 VALIDATION ERROR
            if (response.status === 422) {
                console.log('DETAIL 422:', data);

                let errorMessage = data.message || 'Validasi gagal';
                let shown = false;

                // Cek error
                if (data.error && data.error.details && Array.isArray(data.error.details)) {
                    for (const detail of data.error.details) {
                        const field = detail.field || '';
                        const msg = detail.message || '';

                        if (field.includes('email')) {
                            if (emailErrorDiv) {
                                showInlineError('emailError', msg);
                                shown = true;
                                break;
                            }
                        } else if (field.includes('password')) {
                            showToast(`Password: ${msg}`, 'error');
                            shown = true;
                            break;
                        }
                    }
                }

                if (!shown) {
                    showToast(errorMessage, 'error');
                }
                return;
            }

            // 500 ERROR
            if (response.status === 500) {
                showToast('Terjadi kesalahan pada server. Silakan coba lagi.', 'error');
                return;
            }

            showToast(data.message || 'Registrasi gagal', 'error');

        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan jaringan', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Daftar';
        }
    });
}



//login
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const emailErrorDiv = document.getElementById('emailError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const password = document.getElementById('password').value;

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

            if (response.ok) {
                const token = data.token || data.access_token || data.data?.access_token;
                if (token) localStorage.setItem('access_token', token);

                showToast('Login berhasil!', 'success');
                setTimeout(() => {
                    window.location.href = 'products.html';
                }, 1000);
            } else {
                const errorMessage = data.message || 'Email atau password salah';
                if (emailErrorDiv) {
                    emailErrorDiv.textContent = errorMessage;
                    emailErrorDiv.classList.add('show');
                    setTimeout(() => {
                        emailErrorDiv.classList.remove('show');
                        emailErrorDiv.textContent = '';
                    }, 5000);
                }
            }

        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan jaringan', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
}

//var
let currentPage = 1;
let totalPages = 1;
let currentLimit = 10;

//product page
if (document.getElementById('productsContainer')) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
    } else {
        fetchProducts();

        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            window.location.href = 'new-product.html';
        });

        document.getElementById('emptyAddBtn')?.addEventListener('click', () => {
            window.location.href = 'new-product.html';
        });

        document.getElementById('searchBtn')?.addEventListener('click', () => {
            currentPage = 1;
            fetchProducts();
        });
        //token
        if (document.getElementById('productsContainer')) {
            const token = localStorage.getItem('access_token');
            if (!token) {
                window.location.href = 'login.html';
            } else {
                fetchProducts();

                document.getElementById('addProductBtn')?.addEventListener('click', () => {
                    window.location.href = 'new-product.html';
                });

                document.getElementById('emptyAddBtn')?.addEventListener('click', () => {
                    window.location.href = 'new-product.html';
                });

                document.getElementById('searchBtn')?.addEventListener('click', () => {
                    currentPage = 1;
                    fetchProducts();
                });

                //sort
                document.getElementById('sortBy')?.addEventListener('change', () => {
                    currentPage = 1;
                    fetchProducts();
                });

                //sort order
                document.getElementById('sortOrder')?.addEventListener('change', () => {
                    currentPage = 1;
                    fetchProducts();
                });

                document.getElementById('prevPage')?.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        fetchProducts();
                    }
                });

                document.getElementById('nextPage')?.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        fetchProducts();
                    }
                });
            }
        }

        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchProducts();
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchProducts();
            }
        });
    }
}

//fetch
async function fetchProducts() {
    const token = localStorage.getItem('access_token');

    const loadingEl = document.getElementById('loadingSkeleton');
    const containerEl = document.getElementById('productsContainer');
    const emptyEl = document.getElementById('emptyState');
    const noResultEl = document.getElementById('noResultState');
    const paginationEl = document.getElementById('pagination');

    if (loadingEl) loadingEl.style.display = 'block';
    if (containerEl) containerEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
    if (noResultEl) noResultEl.style.display = 'none';
    if (paginationEl) paginationEl.style.display = 'none';

    try {
        const search = document.getElementById('searchInput')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'created_at';
        const order = document.getElementById('sortOrder')?.value || 'desc';

       
        const url = `${API_BASE_URL}/api/v1/products/?page=${currentPage}&limit=${currentLimit}&search=${search}&sort_by=${sortBy}&sort_order=${order}`;
        console.log('URL:', url);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();

        let products = [];
        if (Array.isArray(data.data)) products = data.data;
        else if (data.data?.items) products = data.data.items;

        totalPages = data.data?.total_pages || data.total_pages || 1;

        if (products.length === 0 && search) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (noResultEl) {
                document.getElementById('searchKeyword').textContent = search;
                noResultEl.style.display = 'block';
            }
            document.getElementById('clearSearchBtnResult')?.addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                currentPage = 1;
                fetchProducts();
            });
        } else if (products.length === 0) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
        } else {
            renderProducts(products);
            renderPagination();
            if (containerEl) containerEl.style.display = 'block';
            if (paginationEl) paginationEl.style.display = 'flex';
        }

    } catch (error) {
        console.error(error);
        showToast('Gagal mengambil data produk', 'error');
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

//render
function renderProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    products.forEach(product => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${escapeHtml(product.name)}</strong></td>
                <td>Rp ${Number(product.price).toLocaleString('id-ID')}</td>
                <td>${product.created_at ? new Date(product.created_at).toLocaleDateString('id-ID') : '-'}</td>
                <td>
                    <button class="btn-edit" data-id="${product.id}" data-name="${escapeHtml(product.name)}" data-price="${product.price}">✏️ Edit</button>
                    <button class="btn-delete" data-id="${product.id}">🗑️ Hapus</button>
                </td>
            </tr>
        `;
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            openEditModal(btn.dataset.id, btn.dataset.name, btn.dataset.price);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteProduct(btn.dataset.id);
        });
    });
}

function renderPagination() {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const totalDataSpan = document.getElementById('totalData');

    if (pageInfo) pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    if (totalDataSpan) totalDataSpan.textContent = '';
}

//create
if (document.getElementById('newProductForm')) {
    const form = document.getElementById('newProductForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const name = document.getElementById('name').value;
        const price = document.getElementById('price').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/products/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, price: Number(price) })
            });

            const data = await response.json();

            if (response.status === 201 || response.ok) {
                showToast('Produk berhasil ditambahkan!', 'success');
                setTimeout(() => {
                    window.location.href = 'products.html';
                }, 1000);
                return;
            }

            if (response.status === 401) {
                localStorage.removeItem('access_token');
                showToast('Session expired, silakan login lagi', 'error');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }

            showToast(data.message || 'Gagal menambah produk', 'error');

        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan jaringan', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan';
        }
    });
}

//edit
function openEditModal(id, name, price) {
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editProductId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editPrice').value = price;
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editError').textContent = '';
}

document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
document.querySelector('.close-modal')?.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    const id = document.getElementById('editProductId').value;
    const body = {
        name: document.getElementById('editName').value,
        price: Number(document.getElementById('editPrice').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            closeModal();
            fetchProducts();
            showToast('Produk berhasil diupdate!', 'success');
            return;
        }

        if (response.status === 403) {
            document.getElementById('editError').textContent = 'Anda tidak memiliki izin untuk mengedit produk ini';
        } else {
            document.getElementById('editError').textContent = data.message || 'Gagal mengedit produk';
        }

    } catch (error) {
        console.error(error);
        document.getElementById('editError').textContent = 'Terjadi kesalahan jaringan';
    }
});

//delete
async function deleteProduct(id) {
    const confirmed = confirm('⚠️ Yakin ingin menghapus produk ini?\n\nTindakan ini tidak dapat dibatalkan!');
    if (!confirmed) return;

    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Produk berhasil dihapus!', 'success');
            fetchProducts();
            return;
        }

        if (response.status === 403) {
            showToast('Anda tidak memiliki izin untuk menghapus produk ini', 'error');
        } else if (response.status === 404) {
            showToast('Produk tidak ditemukan', 'error');
        } else {
            const data = await response.json();
            showToast(data.message || 'Gagal menghapus produk', 'error');
        }

    } catch (error) {
        console.error(error);
        showToast('Terjadi kesalahan jaringan', 'error');
    }
}

//logout
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    showToast('Logout berhasil!', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}