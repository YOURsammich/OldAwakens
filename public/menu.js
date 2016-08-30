$$$.query('.toggle-menu').addEventListener('click', function () {
    
    var menuContainer = document.getElementsByClassName('menu-container')[0];
    
    if (menuContainer.style.width === '300px') {
        menuContainer.style.width = '0px';
    } else {
        menuContainer.style.width = '300px';
    }
        
});