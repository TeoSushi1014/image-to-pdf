const translations = {
    en: {
        title: 'Image to PDF Converter',
        dropText: 'Choose Images or Drop Here',
        portrait: 'Portrait',
        landscape: 'Landscape',
        convertSingle: 'Convert Each Image',
        convertAll: 'Merge All Images',
        downloaded: 'Downloaded:',
        error: 'Error converting image!',
        errorMerge: 'Error creating PDF!'
    },
    vi: {
        title: 'Chuyển Đổi Ảnh Sang PDF',
        dropText: 'Chọn Ảnh hoặc Kéo Thả Vào Đây',
        portrait: 'Dọc',
        landscape: 'Ngang',
        convertSingle: 'Chuyển Từng Ảnh',
        convertAll: 'Gộp Tất Cả Ảnh',
        downloaded: 'Đã tải xuống:',
        error: 'Lỗi chuyển đổi ảnh!',
        errorMerge: 'Lỗi tạo file PDF!'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements initialization
    const imageInput = document.getElementById('imageInput');
    const convertSingle = document.getElementById('convertSingle');
    const convertAll = document.getElementById('convertAll');
    const preview = document.getElementById('preview');
    const uploadForm = document.getElementById('uploadForm');
    const themeToggle = document.getElementById('themeToggle');
    const langToggle = document.getElementById('langToggle');
    const html = document.documentElement;
    const uploadArea = document.querySelector('.upload-area');

    // Initialize state
    let images = [];
    let currentLang = localStorage.getItem('lang') || 'en';

    // Theme initialization function
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem('theme', savedTheme);
    }

    // Language initialization function
    function updateLanguage(lang) {
        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.getAttribute('data-lang');
            if (translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });
        langToggle.querySelector('span').textContent = lang.toUpperCase();
        localStorage.setItem('lang', lang);
        currentLang = lang;
    }

    // Initialize app
    initializeTheme();
    updateLanguage(currentLang);

    // Event Listeners
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });

    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'vi' : 'en';
        updateLanguage(currentLang);
    });

    imageInput.addEventListener('change', (e) => {
        const newImages = Array.from(e.target.files);
        displayPreviews(newImages);
    });

    uploadForm.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadForm.classList.add('border-blue-500');
    });

    uploadForm.addEventListener('dragleave', () => {
        uploadForm.classList.remove('border-blue-500');
    });

    uploadForm.addEventListener('dragenter', (e) => {
        e.preventDefault();
        uploadForm.classList.add('drag-over');
    });

    uploadForm.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadForm.classList.remove('drag-over');
    });

    uploadForm.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadForm.classList.remove('border-blue-500');
        uploadForm.classList.remove('drag-over');
        const newImages = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        displayPreviews(newImages);
    });

    // Update drag & drop handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
        uploadArea.classList.add('border-sky-400');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        uploadArea.classList.remove('border-sky-400');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        uploadArea.classList.remove('border-sky-400');
        
        const newImages = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        displayPreviews(newImages);
    });

    // Add click handler for upload area
    uploadArea.addEventListener('click', (e) => {
        // Only trigger if clicking the area itself, not its children
        if (e.target === uploadArea || e.target.closest('.upload-area') === uploadArea) {
            imageInput.click();
        }
    });

    // Prevent opening file picker twice when clicking the label
    const uploadLabel = uploadArea.querySelector('label');
    uploadLabel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Helper functions
    function showNotification(message, isTranslationKey = false) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = isTranslationKey ? 
            translations[currentLang][message] : message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function downloadPDF(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showNotification(`${translations[currentLang].downloaded} ${filename}`);
    }

    async function convertToPDF(imageFile, orientation) {
        const pdfDoc = await PDFLib.PDFDocument.create();
        const imageBytes = await imageFile.arrayBuffer();
        let image;
        
        if (imageFile.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageFile.type === 'image/png') {
            image = await pdfDoc.embedPng(imageBytes);
        } else {
            throw new Error('Unsupported image format');
        }

        const imgWidth = image.width;
        const imgHeight = image.height;
        const pageWidth = orientation === 'portrait' ? 595 : 842;
        const scaledWidth = pageWidth;
        const scaledHeight = (pageWidth * imgHeight) / imgWidth;

        // Create page with calculated dimensions
        const page = pdfDoc.addPage([
            orientation === 'portrait' ? 595 : 842,
            scaledHeight
        ]);

        // Draw image to fill the page width
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: scaledWidth,
            height: scaledHeight
        });

        return await pdfDoc.save();
    }

    // Add iOS-like preview animation
    function displayPreviews(newImages) {
        if (newImages.length > 0) {
            images = [...images, ...newImages];
        }
        
        // Clear preview area
        preview.innerHTML = '';
        
        // Display all images
        images.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item glass p-4 rounded-xl transition-all duration-300';
                div.style.animationDelay = `${index * 0.1}s`;
                div.dataset.index = index; // Add index to element
                div.innerHTML = `
                    <button type="button" class="delete-btn" aria-label="Delete image">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <div class="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-50">
                        <img src="${e.target.result}" class="w-full h-full object-contain">
                    </div>
                    <p class="text-center text-sm font-medium text-gray-700 dark:text-gray-200 truncate">${file.name}</p>
                `;
                preview.appendChild(div);

                // Add delete button handler
                const deleteBtn = div.querySelector('.delete-btn');
                deleteBtn.onclick = removeImage;
            };
            reader.readAsDataURL(file);
        });
    }

    // Separate function to handle image removal
    function removeImage(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const item = this.closest('.preview-item');
        const index = parseInt(item.dataset.index);
        
        // Add fade out and scale down animation
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        
        // Wait for animation to complete
        setTimeout(() => {
            // Remove image from array
            images = images.filter((_, idx) => idx !== index);
            
            // Remove the item from DOM
            item.remove();
            
            // Update remaining items' indices and reflow animations
            const remainingItems = preview.querySelectorAll('.preview-item');
            remainingItems.forEach((item, newIndex) => {
                item.dataset.index = newIndex;
                item.style.transform = 'translateX(20px)';
                item.style.opacity = '0.5';
                
                // Trigger reflow
                requestAnimationFrame(() => {
                    item.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    item.style.transform = 'translateX(0)';
                    item.style.opacity = '1';
                });
            });
        }, 300);
        
        return false;
    }

    convertSingle.addEventListener('click', async () => {
        const orientation = document.querySelector('input[name="orientation"]:checked').value;
        
        for (const image of images) {
            try {
                const pdfBytes = await convertToPDF(image, orientation);
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const filename = `${image.name.split('.')[0]}.pdf`;
                downloadPDF(blob, filename);
            } catch (error) {
                console.error('Error converting image:', error);
                showNotification('error', true);
            }
        }
    });

    convertAll.addEventListener('click', async () => {
        const orientation = document.querySelector('input[name="orientation"]:checked').value;
        const pdfDoc = await PDFLib.PDFDocument.create();
        let currentY = 0;
        
        try {
            // Calculate total height needed
            for (const image of images) {
                const imageBytes = await image.arrayBuffer();
                let pdfImage;
                
                if (image.type === 'image/jpeg') {
                    pdfImage = await pdfDoc.embedJpg(imageBytes);
                } else if (image.type === 'image/png') {
                    pdfImage = await pdfDoc.embedPng(imageBytes);
                }

                const imgWidth = pdfImage.width;
                const imgHeight = pdfImage.height;
                const pageWidth = orientation === 'portrait' ? 595 : 842;
                const scaledWidth = pageWidth;
                const scaledHeight = (pageWidth * imgHeight) / imgWidth;

                // Add page and draw image
                const page = pdfDoc.addPage([
                    orientation === 'portrait' ? 595 : 842,
                    scaledHeight
                ]);

                page.drawImage(pdfImage, {
                    x: 0,
                    y: 0,
                    width: scaledWidth,
                    height: scaledHeight
                });
            }
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadPDF(blob, 'combined.pdf');
        } catch (error) {
            console.error('Error processing images:', error);
            showNotification('errorMerge', true);
        }
    });
});
