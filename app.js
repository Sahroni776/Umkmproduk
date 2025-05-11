// 1. Inisialisasi Supabase Client
const SUPABASE_URL = 'https://zezwvrsbehecksmsscjd.supabase.co'; // PASTIKAN INI URL ANDA
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplend2cnNiZWhlY2tzbXNzY2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MTg2MzgsImV4cCI6MjA2MjQ5NDYzOH0.313RNDf1LM5qQcC-HjTnX9rZcz2EKw3bT5MHOf2ou2Q'; // PASTIKAN INI KUNCI ANON ANDA

let supabaseClient;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        throw new Error('Supabase library (supabase-js) tidak termuat dengan benar atau window.supabase.createClient bukan fungsi.');
    }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
    alert("Gagal menginisialisasi Supabase. Periksa URL dan Anon Key Anda di app.js, dan pastikan library Supabase termuat dengan benar dari CDN.");
}

// 2. Tangani Pengiriman Formulir
const productForm = document.getElementById('productForm');
const messageElement = document.getElementById('message');
const imageFileInput = document.getElementById('gambar_file');

if (productForm) {
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!supabaseClient) {
            messageElement.textContent = 'Supabase client tidak terinisialisasi. Periksa konsol.';
            messageElement.className = 'error';
            return;
        }

        const file = imageFileInput.files[0];
        if (!file) {
            messageElement.textContent = 'Silakan pilih file gambar produk.';
            messageElement.className = 'error';
            return;
        }

        messageElement.textContent = 'Mengunggah gambar dan menyimpan data...';
        messageElement.className = '';

        try {
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = `public/${fileName}`;

            // 1. Upload gambar ke Supabase Storage
            // NAMA BUCKET ANDA DI SINI - User mengonfirmasi 'gambar-produk' berhasil
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('gambar-produk') // Menggunakan 'gambar-produk' sesuai konfirmasi user
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Error Supabase Storage (Upload):', uploadError);
                messageElement.textContent = `Gagal mengunggah gambar: ${uploadError.message}`;
                messageElement.className = 'error';
                return;
            }

            // 2. Dapatkan URL publik dari gambar yang diunggah
            const { data: publicUrlData } = supabaseClient.storage
                .from('gambar-produk') // Menggunakan 'gambar-produk' sesuai konfirmasi user
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                console.error('Error Supabase Storage (Get Public URL): Tidak bisa mendapatkan URL publik.');
                messageElement.textContent = 'Gagal mendapatkan URL gambar setelah upload.';
                messageElement.className = 'error';
                // Pertimbangkan untuk menghapus file yang sudah terupload jika URL tidak didapat
                // await supabaseClient.storage.from('gambar-produk').remove([filePath]);
                return;
            }

            const imageUrl = publicUrlData.publicUrl;

            // 3. Simpan data produk (termasuk URL gambar) ke database
            const formData = new FormData(productForm);
            const productData = {
                nama_produk: formData.get('nama_produk'),
                harga: parseFloat(formData.get('harga')),
                deskripsi: formData.get('deskripsi'),
                gambar_url: imageUrl, // Menggunakan URL dari Supabase Storage
                nama_umkm: formData.get('nama_umkm'),
                lokasi: formData.get('lokasi'),
            };

            const { data: insertData, error: insertError } = await supabaseClient
                .from('produk_umkm')
                .insert([productData])
                .select();

            if (insertError) {
                console.error('Error Supabase Database (Insert):', insertError);
                messageElement.textContent = `Gagal menyimpan data produk: ${insertError.message}`;
                messageElement.className = 'error';
            } else {
                messageElement.textContent = 'Produk berhasil disimpan (gambar dan data)!';
                messageElement.className = 'success';
                productForm.reset();
                console.log('Data tersimpan:', insertData);
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
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

