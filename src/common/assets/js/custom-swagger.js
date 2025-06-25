document.addEventListener('DOMContentLoaded', function() {
  // Tạo nút toggle theme
  const toggleButton = document.createElement('button');
  toggleButton.className = 'theme-toggle';
  toggleButton.setAttribute('aria-label', 'Toggle dark mode');
  toggleButton.setAttribute('title', 'Toggle dark/light theme');
  toggleButton.style.position = 'fixed';
  toggleButton.style.top = '20px';
  toggleButton.style.right = '20px';
  toggleButton.style.padding = '8px 12px';
  toggleButton.style.borderRadius = '4px';
  toggleButton.style.backgroundColor = '#123456';
  toggleButton.style.color = '#fff';
  toggleButton.style.border = 'none';
  toggleButton.style.cursor = 'pointer';

  const sun = document.createElement('span');
  sun.innerHTML = '☀️';
  const moon = document.createElement('span');
  moon.innerHTML = '🌙';
  toggleButton.appendChild(sun);
  toggleButton.appendChild(moon);

  const savedTheme = localStorage.getItem('swagger-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateToggleButton(savedTheme);

  function updateToggleButton(theme) {
    sun.style.display = theme === 'dark' ? 'inline' : 'none';
    moon.style.display = theme === 'dark' ? 'none' : 'inline';
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('swagger-theme', newTheme);
    updateToggleButton(newTheme);
  }

  toggleButton.addEventListener('click', toggleTheme);
  toggleButton.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  });

  document.body.appendChild(toggleButton);

  // Tùy chỉnh filter tag
  const filterInput = document.querySelector('.swagger-ui input[type="search"]');
  if (filterInput) {
    filterInput.placeholder = 'Search APIs...';
    filterInput.style.padding = '8px';
    filterInput.style.borderRadius = '4px';
    filterInput.style.border = '1px solid #0288d1';

    filterInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      const tags = document.querySelectorAll('.swagger-ui .opblock-tag');

      tags.forEach(tag => {
        const tagNameElement = tag.querySelector('.opblock-tag-section h4');
        if (tagNameElement) {
          const tagName = tagNameElement.textContent.toLowerCase();
          tag.style.display = searchTerm === '' || tagName.includes(searchTerm) ? 'block' : 'none';
        }
      });
    });
  } else {
    console.warn('Filter input not found. Check Swagger UI structure.');
  }
});