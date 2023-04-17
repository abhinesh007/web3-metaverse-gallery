const logInButton = document.getElementById('logInButton');
const container = document.getElementById('login-container');
let userName = '';
let password = '';


let onLogin = () => {
    userName = document.getElementById('username').value || '';
    password = document.getElementById('password').value || '';
    // console.log('username, password', userName, password);

    const userDetails = {
        userName,
        password
    };
    localStorage.setItem('userDetails', JSON.stringify(userDetails))
    redirectToGallery(userName);
}

let init = () => {
    let { userName, password } = JSON.parse(localStorage.getItem('userDetails') || '');
    console.log('username, password', userName, password);
    // redirectToGallery(userName);
}

let redirectToGallery = (userName) => {
    if (userName) {
        window.location.href = "/client/index.html";
    }
}
