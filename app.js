const soundEffect = new Audio('twinklesparkle.mp3');

function sillyButton() {
    soundEffect.play();
    alert("Hello world!")
}

document.addEventListener('DOMContentLoaded', () => {
    // Create the custom cursor element
    const cursorEl = document.createElement('div');
    cursorEl.classList.add('custom-cursor');
    document.body.appendChild(cursorEl);

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        cursorEl.style.left = `${e.clientX}px`;
        cursorEl.style.top = `${e.clientY}px`;
    });

    // Handle hover effects on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorEl.classList.add('hover');
        });

        el.addEventListener('mouseleave', () => {
            cursorEl.classList.remove('hover');
        });
    });
});