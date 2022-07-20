let theme = localStorage.getItem('theme');
apply(theme);

function toggle() {
    let body = document.querySelector('body');

    localStorage.removeItem('theme');
    let currentBackground = window.getComputedStyle(body).backgroundColor;

    if (currentBackground == "rgb(40, 42, 45)") {
        apply(0);
        localStorage.setItem("theme", 0);
    } else {
        apply(1);
        localStorage.setItem("theme", 1);
    }
}

function apply(theme) {
    let html = document.querySelector('html');
    html.className = theme == 1 ? "dark" : "light";
}
