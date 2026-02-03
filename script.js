document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURATION & INIT ---
    const BOOT_TEXT = [
        "Initializing kernel...",
        "Loading user modules...",
        "Mounting /home/user...",
        "Checking integrity... OK",
        "Starting secure shell (SSH)..."
    ];

    // Standard User (Falls LocalStorage leer ist)
    const DEFAULT_USERS = { 'Junus': 'DevAkademie' };
    
    // Globale Variablen
    let users = loadUsers();
    let state = {
        mode: 'boot', // boot, login_user, login_pass, reg_user, reg_pass, command
        tempUser: '',
        currentUser: null
    };

    // DOM Elemente
    const el = {
        terminal: document.querySelector('.terminal-window'),
        output: document.getElementById('output'),
        inputLine: document.getElementById('input-line'),
        input: document.getElementById('command-input'),
        prompt: document.getElementById('prompt-text'),
        home: document.getElementById('home-container'),
        welcome: document.getElementById('welcome-msg'),
        logout: document.getElementById('logout-btn'),
        body: document.getElementById('terminal-body'),
        canvas: document.getElementById('matrix-canvas')
    };

    // --- F12 CONSOLE EASTER EGGS ---
    console.log("%c STOP! ", "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0px black;");
    console.log("%c Hier ist nichts für dich. Das ist ein gesicherter Bereich.", "color: white; font-size: 16px; background: black; padding: 5px;");
    console.log("%c Tipp: Probier mal window.systemHack() aus.", "color: #33ff00; font-family: monospace;");

    window.systemHack = function() {
        console.log("%c ACCESS GRANTED: GOD MODE ACTIVATED", "color: gold; font-size: 20px");
        alert("Hacker Mode aktiviert! Du wirst eingeloggt...");
        state.currentUser = "Neo";
        loginSuccess();
    };

    // --- MATRIX EFFECT ---
    const ctx = el.canvas.getContext('2d');
    let matrixInterval;

    function startMatrix() {
        el.canvas.style.display = 'block';
        el.canvas.width = window.innerWidth;
        el.canvas.height = window.innerHeight;
        
        const chars = "010101XYZABC<>[]{}@#$%&*";
        const fontSize = 14;
        const columns = el.canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        matrixInterval = setInterval(() => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, el.canvas.width, el.canvas.height);
            ctx.fillStyle = "#0F0";
            ctx.font = fontSize + "px monospace";

            for(let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if(drops[i] * fontSize > el.canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }, 33);
    }

    // --- CORE FUNCTIONS ---

    function loadUsers() {
        const stored = localStorage.getItem('console_users');
        return stored ? JSON.parse(stored) : DEFAULT_USERS;
    }

    function saveUser(u, p) {
        users[u] = p;
        localStorage.setItem('console_users', JSON.stringify(users));
    }

    function print(text, type = 'normal') {
        const p = document.createElement('div');
        p.innerHTML = text; // innerHTML erlaubt <br> und spans
        p.style.marginBottom = '4px';
        if (type === 'error') p.style.color = '#ff5f56';
        if (type === 'success') p.style.color = '#fff';
        if (type === 'info') p.style.color = '#38bdf8';
        if (type === 'system') p.style.color = '#666';
        
        el.output.appendChild(p);
        el.body.scrollTop = el.body.scrollHeight;
    }

    async function bootSequence() {
        for(let line of BOOT_TEXT) {
            print(line, 'system');
            await new Promise(r => setTimeout(r, 200));
        }
        print("<br>System v3.0.4 ready.", 'success');
        print("Tippe 'help' für Befehle oder logge dich ein.<br>");
        
        el.inputLine.classList.remove('hidden');
        el.input.focus();
        resetInputState();
    }

    function resetInputState() {
        state.mode = 'command';
        state.tempUser = '';
        el.prompt.innerHTML = "guest@system:~$";
        el.input.value = '';
        el.input.type = 'text';
    }

    // --- COMMAND PARSER ---

    el.input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const val = el.input.value.trim();
            
            // Maskierte Ausgabe bei Passwort
            if (state.mode.includes('pass')) {
                print(`${el.prompt.innerText} ****`);
            } else {
                print(`${el.prompt.innerText} ${val}`);
            }

            // Command Handling
            if (state.mode === 'command') {
                handleCommand(val);
            } 
            // Login Flow
            else if (state.mode === 'login_user') {
                if(val) {
                    state.tempUser = val;
                    state.mode = 'login_pass';
                    el.prompt.innerText = `password for ${val}:`;
                    el.input.type = 'password';
                }
            } 
            else if (state.mode === 'login_pass') {
                el.input.disabled = true;
                print("Verifying hash...", 'system');
                await new Promise(r => setTimeout(r, 600));

                if (users[state.tempUser] === val) {
                    state.currentUser = state.tempUser;
                    print("ACCESS GRANTED.", 'success');
                    loginSuccess();
                } else {
                    print("ACCESS DENIED.", 'error');
                    el.terminal.classList.add('shake');
                    setTimeout(() => el.terminal.classList.remove('shake'), 500);
                    resetInputState();
                }
                el.input.disabled = false;
                el.input.focus();
            }
            // Registration Flow
            else if (state.mode === 'reg_user') {
                if(users[val]) {
                    print(`User '${val}' existiert bereits.`, 'error');
                    resetInputState();
                } else if (!val) {
                    resetInputState();
                } else {
                    state.tempUser = val;
                    state.mode = 'reg_pass';
                    el.prompt.innerText = `set password for ${val}:`;
                    el.input.type = 'password';
                }
            }
            else if (state.mode === 'reg_pass') {
                if(!val) {
                    print("Passwort darf nicht leer sein.", 'error');
                } else {
                    print("Creating secure storage...", 'system');
                    await new Promise(r => setTimeout(r, 800));
                    saveUser(state.tempUser, val);
                    print(`User '${state.tempUser}' created successfully.`, 'success');
                    print("Please login now.");
                }
                resetInputState();
                el.input.focus();
            }

            el.input.value = '';
        }
    });

    function handleCommand(cmd) {
        const command = cmd.toLowerCase();

        switch(command) {
            case 'help':
                print("AVAILABLE COMMANDS:", 'info');
                print("&nbsp; login    - Start login process");
                print("&nbsp; register - Create new account");
                print("&nbsp; clear    - Clear terminal");
                print("&nbsp; date     - Show system time");
                print("&nbsp; matrix   - Toggle visual mode");
                break;
            case 'login':
                state.mode = 'login_user';
                el.prompt.innerText = "username:";
                break;
            case 'register':
                state.mode = 'reg_user';
                el.prompt.innerText = "new username:";
                break;
            case 'clear':
                el.output.innerHTML = '';
                break;
            case 'date':
                print(new Date().toString(), 'success');
                break;
            case 'matrix':
                print("Loading The Matrix...", 'success');
                startMatrix();
                break;
            case 'whoami':
                print("guest (unauthenticated)", 'system');
                break;
            case '':
                break;
            default:
                print(`Command not found: ${cmd}. Type 'help'.`, 'error');
        }
    }

    // --- VIEW SWITCHING ---

    function loginSuccess() {
        setTimeout(() => {
            el.terminal.style.transition = "transform 0.5s, opacity 0.5s";
            el.terminal.style.transform = "scale(0.01)";
            el.terminal.style.opacity = "0";
            
            setTimeout(() => {
                el.terminal.classList.add('hidden');
                document.querySelector('.crt-overlay').style.display = 'none';
                if(matrixInterval) clearInterval(matrixInterval);
                el.canvas.style.display = 'none';

                el.home.classList.remove('hidden');
                el.welcome.innerText = `Eingeloggt als: ${state.currentUser}`;
                
                setTimeout(() => el.home.classList.add('visible'), 50);
            }, 500);
        }, 1000);
    }

    el.logout.addEventListener('click', () => {
        el.home.classList.remove('visible');
        setTimeout(() => {
            el.home.classList.add('hidden');
            
            // Reset Terminal Style
            el.terminal.classList.remove('hidden');
            el.terminal.style.transform = "scale(1)";
            el.terminal.style.opacity = "1";
            document.querySelector('.crt-overlay').style.display = 'block';

            // Reset Terminal Content
            el.output.innerHTML = '';
            print("Session terminated.", 'system');
            resetInputState();
            el.input.focus();
        }, 1000);
    });

    // Klick ins Terminal fokussiert Input
    el.terminal.addEventListener('click', () => {
         if(!el.inputLine.classList.contains('hidden')) el.input.focus();
    });

    // START
    bootSequence();
});