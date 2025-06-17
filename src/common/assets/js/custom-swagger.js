document.addEventListener('DOMContentLoaded', function() {
    // Logic toggle theme (giữ nguyên)
    const toggleButton = document.createElement('button');
    toggleButton.className = 'theme-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle dark mode');
    toggleButton.setAttribute('title', 'Toggle dark/light theme');
    const sun = document.createElement('span');
    sun.innerHTML = '☀️';
    const moon = document.createElement('span');
    moon.innerHTML = '🌙';
    toggleButton.appendChild(sun);
    toggleButton.appendChild(moon);
  
    const savedTheme = localStorage.getItem('swagger-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('swagger-theme', newTheme);
    }
    
    toggleButton.addEventListener('click', toggleTheme);
    toggleButton.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTheme();
      }
    });
    
    document.body.appendChild(toggleButton);
  
    // Tùy chỉnh filter tag để không phân biệt chữ hoa/thường
    const filterInput = document.querySelector('.swagger-ui input[type="search"]'); // Sử dụng selector chính xác hơn
    if (filterInput) {
      filterInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim(); // Chuyển search term thành chữ thường và loại bỏ khoảng trắng thừa
        const tags = document.querySelectorAll('.swagger-ui .opblock-tag');
  
        tags.forEach(tag => {
          const tagNameElement = tag.querySelector('.opblock-tag-section__header h4');
          if (tagNameElement) {
            const tagName = tagNameElement.textContent.toLowerCase(); // Chuyển tag name thành chữ thường
            if (searchTerm === '' || tagName.includes(searchTerm)) {
              tag.style.display = 'block'; // Hiển thị tag nếu khớp hoặc không có từ khóa
            } else {
              tag.style.display = 'none'; // Ẩn tag nếu không khớp
            }
          }
        });
      });
    } else {
      console.warn('Filter input not found. Check Swagger UI structure.');
    }
  });