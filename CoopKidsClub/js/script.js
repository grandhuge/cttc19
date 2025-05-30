document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Background Music Toggle
    const musicToggleBtn = document.getElementById('music-toggle');
    const backgroundMusic = document.getElementById('background-music');

    if (musicToggleBtn && backgroundMusic) {
        let isMusicPlaying = false;
        // Autoplay is often blocked by browsers, so start paused.
        // Or try to play and catch error if you want to attempt autoplay.
        // For this example, let's start paused.
        backgroundMusic.pause();
        musicToggleBtn.textContent = '🎵 เปิดเพลง';

        musicToggleBtn.addEventListener('click', () => {
            if (isMusicPlaying) {
                backgroundMusic.pause();
                musicToggleBtn.textContent = '🎵 เปิดเพลง';
            } else {
                backgroundMusic.play().catch(error => {
                    console.warn("Autoplay was prevented:", error);
                    // Handle browsers that block autoplay until user interaction
                    // Maybe show a message "Click again to play music"
                });
                musicToggleBtn.textContent = '🔇 ปิดเพลง';
            }
            isMusicPlaying = !isMusicPlaying;
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Lesson button hover sound (optional, example)
    const lessonButtons = document.querySelectorAll('.lesson-btn');
    // const hoverSound = new Audio('path/to/hover-sound.mp3'); // Add your sound file

    lessonButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            // hoverSound.currentTime = 0; // Rewind to start
            // hoverSound.play().catch(e => console.log("Hover sound play error:", e));
            // For simplicity, we'll skip implementing actual hover sound here
            // but this is where you could add it.
        });
    });

    console.log("Co-op Kids Club script loaded!");
});