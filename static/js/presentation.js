// Script to display clamp animation overlay before showing the page
// The overlay fades out after a short delay

document.addEventListener('DOMContentLoaded', () => {
    const presentation = document.getElementById('presentation');
    if (!presentation) return;

    document.body.classList.add('no-scroll');

    const hidePresentation = () => {
        presentation.classList.add('fade-out');
        setTimeout(() => {
            presentation.style.display = 'none';
            document.body.classList.remove('no-scroll');
        }, 1000); // match fade-out transition
    };

    // Adjust timeout to match clamp animation duration
    setTimeout(hidePresentation, 6000);
});

