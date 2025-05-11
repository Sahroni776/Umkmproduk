// 1. Inisialisasi Supabase Client
const SUPABASE_URL = 'https://zezwvrsbehecksmsscjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplend2cnNiZWhlY2tzbXNzY2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MTg2MzgsImV4cCI6MjA2MjQ5NDYzOH0.313RNDf1LM5qQcC-HjTnX9rZcz2EKw3bT5MHOf2ou2Q';

let supabaseClient; // Mengganti nama variabel agar tidak bentrok dengan global supabase dari CDN
try {
    // Pastikan global `supabase` dari CDN tersedia (sesuai index.html Anda)
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        throw new Error('Supabase library (supabase-js) tidak termuat dengan benar atau createClient bukan fungsi.');
    }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
    alert("Gagal menginisialisasi Supabase. Periksa URL dan Anon Key Anda di app.js, dan pastikan library Supabase termuat dengan benar.");
}

// 2. Tangani Pengiriman Formulir
const productForm = document.getElementById('productForm');
const messageElement = document.getElementById('message');

if (productForm) {
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Mencegah reload halaman

        if (!supabaseClient) {
            messageElement.textContent = 'Supabase client tidak terinisialisasi. Periksa konsol.';
            messageElement.className = 'error';
            return;
        }

        const formData = new FormData(productForm);
        const productData = {
            nama_produk: formData.get('nama_produk'),
            harga: parseFloat(formData.get('harga')),
            deskripsi: formData.get('deskripsi'),
            gambar_url: formData.get('gambar_url'),
            nama_umkm: formData.get('nama_umkm'),
            lokasi: formData.get('lokasi'),
        };

        messageElement.textContent = 'Menyimpan data...';
        messageElement.className = '';

        try {
            const { data, error } = await supabaseClient
                .from('produk_umkm') // Pastikan nama tabel sudah benar
                .insert([productData])
                .select();

            if (error) {
                console.error('Error Supabase:', error);
                messageElement.textContent = `Gagal menyimpan data: ${error.message}`;
                messageElement.className = 'error';
            } else {
                messageElement.textContent = 'Produk berhasil disimpan!';
                messageElement.className = 'success';
                productForm.reset(); // Kosongkan formulir setelah berhasil
                console.log('Data tersimpan:', data);
            }
        } catch (error) {
            console.error('Error JavaScript:', error);
            messageElement.textContent = `Terjadi kesalahan: ${error.message}`;
            messageElement.className = 'error';
        }
    });
} else {
    console.error('Form dengan ID productForm tidak ditemukan.');
}

// 3. Registrasi Service Worker (untuk PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js') // Pastikan path ke sw.js benar
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

