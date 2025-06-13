document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const floatingButtons = document.querySelector('.floating-buttons');

    if (!themeToggle || !floatingButtons) {
        console.error('Required elements not found');
        return;
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.classList.toggle('dark-mode', savedTheme === 'dark');
    themeToggle.textContent = savedTheme === 'dark' ? 'Toggle Light Mode' : 'Toggle Dark Mode';

    // Toggle theme
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        themeToggle.textContent = isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
    });

    // Scroll buttons functionality
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollBottomBtn = document.getElementById('scrollBottomBtn');
    let lastScrollTop = 0;
    let scrollTimeout;

    window.addEventListener('scroll', () => {
        console.log('Scroll detected');
        clearTimeout(scrollTimeout);
        floatingButtons.classList.add('show');
        scrollTimeout = setTimeout(() => {
            floatingButtons.classList.remove('show');
        }, 2000);
    });

    scrollTopBtn.addEventListener('click', () => {
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo(0, 0);
        }
    });

    scrollBottomBtn.addEventListener('click', () => {
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo(0, document.body.scrollHeight);
        }
    });
});