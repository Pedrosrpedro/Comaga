// =======================================================
// SEÇÃO 1: FUNÇÕES GLOBAIS DO CONSOLE
// =======================================================
function toggleConsole() {
    document.getElementById('mobile-console').classList.toggle('hidden');
}
function closeConsole() {
    document.getElementById('mobile-console').classList.add('hidden');
}
function clearConsole() {
    document.getElementById('console-log-container').innerHTML = '';
}


// =======================================================
// SEÇÃO 2: LÓGICA DE CAPTURA DO CONSOLE
// =======================================================
(function setupMobileConsole() {
    const logContainer = document.getElementById('console-log-container');

    function logToScreen(message, type = 'log') {
        const msgElement = document.createElement('div');
        msgElement.className = `log-message ${type}`;
        msgElement.textContent = `[${type.toUpperCase()}] ${message}`;
        logContainer.appendChild(msgElement);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = function(...args) {
        logToScreen(args.join(' '), 'log');
        originalLog.apply(console, args);
    };

    console.error = function(...args) {
        logToScreen(args.join(' '), 'error');
        originalError.apply(console, args);
    };

    console.warn = function(...args) {
        logToScreen(args.join(' '), 'warn');
        originalWarn.apply(console, args);
    };

    window.onerror = function(message, source, lineno) {
        console.error(`ERRO NÃO TRATADO: "${message}" em ${source} na linha ${lineno}`);
        return true;
    };

    console.log("Console de depuração iniciado.");
})();


// =======================================================
// SEÇÃO 3: GERENCIADOR DE ÁUDIO (usando Howler.js)
// =======================================================
const sounds = {
    click: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/menu-click.wav'] }),
    music: new Howl({
        src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/pleasant-music.mp3'],
        loop: true,
        volume: 0.3
    }),
    playerFall: new Howl({ src: ['https://cdn.jsdelivr.net/gh/scifilef/hosted-assets/player-fall.wav'] })
};


// =======================================================
// SEÇÃO 4: ESTADO CENTRAL E FUNÇÕES DE UI
// =======================================================
const gameState = {
    currentScreen: 'menu',
    hud: { message: '', timer: '' },
    editor: {
        scene: null,
        avatar: null,
        texture: null,
        tool: 'move',
        color: '#ff0000',
        isPainting: false
    }
};

const availableGames = [
    { id: 'disaster_survival', displayName: 'SOBREVIVA AO DESASTRE', name: 'Natural Disaster Survival', rating: 91, players: 12.2 }
];

function createHeaderHTML() {
    return `
        <header class="main-header">
            <nav class="main-nav">
                <a href="#" class="nav-item active"><i class="fa-solid fa-house"></i> Home</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-user-astronaut"></i> Avatar</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-users"></i> Connect</a>
            </nav>
        </header>
    `;
}

function createFriendsListHTML() {
    return `
        <section class="content-row">
            <h2>Friends (0)</h2>
            <div class="friends-list">
               <p style="color: #b8b8b8;">Sistema de amigos em desenvolvimento.</p>
            </div>
        </section>
    `;
}

function createGamesGridHTML(games) {
    const gameCardsHTML = games.map(game => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-image-placeholder ${game.id}">${game.displayName}</div>
            <div class="game-info">
                <h3>${game.name}</h3>
                <div class="game-stats">
                    <span><i class="fa-solid fa-thumbs-up"></i> ${game.rating}%</span>
                    <span><i class="fa-solid fa-users"></i> ${game.players}K</span>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <section class="content-row">
            <h2>Continue</h2>
            <div class="games-grid">${gameCardsHTML}</div>
        </section>
    `;
}

function createHudHTML() {
    return `
        <div class="hud-container">
            <p>${gameState.hud.message}</p>
            <p id="hudTimer">${gameState.hud.timer}</p>
        </div>
    `;
}

function createAvatarEditorUIHTML() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#ff8800', '#8800ff'];
    const colorButtons = colors.map(c => `<button class="color-btn" style="background-color: ${c};" data-color="${c}"></button>`).join('');

    return `
        <div class="editor-ui-container">
            <div class="editor-top-bar">
                <button id="back-to-menu-btn"><i class="fa-solid fa-arrow-left"></i> Voltar</button>
                <h2>Editor de Avatar</h2>
                <button id="save-avatar-btn"><i class="fa-solid fa-save"></i> Salvar</button>
            </div>
            <div class="editor-bottom-bar">
                <div class="editor-tools">
                    <button class="tool-btn active" data-tool="move"><i class="fa-solid fa-arrows-up-down-left-right"></i> Câmera</button>
                    <button class="tool-btn" data-tool="pen"><i class="fa-solid fa-pencil"></i> Caneta</button>
                    <button class="tool-btn" data-tool="bucket"><i class="fa-solid fa-fill-drip"></i> Balde</button>
                    <button class="tool-btn" data-tool="eraser"><i class="fa-solid fa-eraser"></i> Borracha</button>
                </div>
                <div class="editor-palette">${colorButtons}</div>
                <div class="editor-controls">
                    <button class="control-btn" data-control="rot-left"><i class="fa-solid fa-rotate-left"></i></button>
                    <button class="control-btn" data-control="rot-right"><i class="fa-solid fa-rotate-right"></i></button>
                    <button class="control-btn" data-control="view-top"><i class="fa-solid fa-arrow-up"></i></button>
                    <button class="control-btn" data-control="view-bottom"><i class="fa-solid fa-arrow-down"></i></button>
                </div>
            </div>
        </div>
    `;
}

// =======================================================
// SEÇÃO 5: LÓGICA PRINCIPAL DA APLICAÇÃO
// =======================================================
const appContainer = document.getElementById('app');
const canvas = document.getElementById('renderCanvas');
const joystickZone = document.getElementById('joystickZone');
let engine;
let player;
let moveX = 0;
let moveZ = 0;

const keys = { w: false, a: false, s: false, d: false, ' ': false };
window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});
window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

function render() {
    canvas.classList.add('hidden');
    joystickZone.classList.add('hidden');
    appContainer.innerHTML = '';

    if (gameState.currentScreen === 'menu') {
        appContainer.innerHTML = `<div class="roblox-container">${createHeaderHTML()}<main class="main-content">${createFriendsListHTML()}${createGamesGridHTML(availableGames)}</main></div>`;
        gsap.from(".roblox-container", { duration: 0.5, opacity: 0 });
    } else if (gameState.currentScreen === 'playing') {
        canvas.classList.remove('hidden');
        if (engine) engine.resize();
        joystickZone.classList.remove('hidden');
        appContainer.innerHTML = createHudHTML();
    } else if (gameState.currentScreen === 'loading') {
        appContainer.innerHTML = `<div class="roblox-container"><h1>Carregando...</h1></div>`;
    } else if (gameState.currentScreen === 'avatar_editor') {
        canvas.classList.remove('hidden');
        if (engine) engine.resize();
        appContainer.innerHTML = createAvatarEditorUIHTML();
    }
}

function updateHud(message, timer) {
    gameState.hud.message = message;
    gameState.hud.timer = timer;
    if (gameState.currentScreen === 'playing') {
        render();
    }
}

function setupJoystick() {
    console.log("Configurando o joystick virtual...");
    const options = {
        zone: joystickZone,
        mode: 'static',
        color: 'white',
        size: 150
    };
    const manager = nipplejs.create(options);
    manager.on('move', (event, data) => {
        const angle = data.angle.radian;
        const force = Math.min(data.force, 2);
        moveX = Math.cos(angle) * force;
        moveZ = Math.sin(angle) * force;
    });
    manager.on('end', () => {
        moveX = 0;
        moveZ = 0;
    });
}

async function launchGame(gameId) {
    gameState.currentScreen = 'loading';
    render();
    stopAvatarEditor(engine);

    gsap.to(".roblox-container", {
        duration: 0.5,
        opacity: 0,
        onComplete: async () => {
            try {
                if (!engine) {
                    engine = new BABYLON.Engine(canvas, true, null, true);
                }
                const gameData = await startDisasterGame(engine, canvas, updateHud, sounds);
                
                if (!gameData || !gameData.scene || !gameData.player) {
                    throw new Error("A função startDisasterGame não retornou a cena ou o jogador.");
                }
                
                const scene = gameData.scene;
                player = gameData.player;
                setupJoystick();
                
                engine.runRenderLoop(() => {
                    if (gameState.currentScreen === 'playing' && player && player.physicsImpostor) {
                        const camera = scene.activeCamera;
                        const playerSpeed = 7.5;
                        const jumpForce = 6;
                        
                        // Usa um Raycast para detectar o chão de forma confiável
                        const ray = new BABYLON.Ray(player.position, new BABYLON.Vector3(0, -1, 0), 1.1);
                        const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "ground" || mesh.name.startsWith("tower"));
                        const isOnGround = hit.hit;

                        // --- Lógica do Pulo ---
                        if (keys[' '] && isOnGround) {
                            player.physicsImpostor.applyImpulse(
                                new BABYLON.Vector3(0, jumpForce, 0),
                                player.getAbsolutePosition()
                            );
                        }
                        // Consome a tecla de pulo para evitar pulos repetidos
                        keys[' '] = false;


                        // --- Lógica de Movimento ---
                        let totalMoveX = moveX;
                        let totalMoveZ = moveZ;
                        if (keys.w) totalMoveZ += 1; // Para frente
                        if (keys.s) totalMoveZ -= 1; // Para trás
                        if (keys.a) totalMoveX -= 1; // Para esquerda
                        if (keys.d) totalMoveX += 1; // Para direita

                        const cameraForward = camera.getDirection(BABYLON.Vector3.Forward());
                        const cameraRight = camera.getDirection(BABYLON.Vector3.Right());
                        cameraForward.y = 0;
                        cameraRight.y = 0;
                        cameraForward.normalize();
                        cameraRight.normalize();

                        // Combina o input com a direção da câmera
                        const moveDirection = cameraRight.scale(totalMoveX).add(cameraForward.scale(totalMoveZ));
                        const currentVelocity = player.physicsImpostor.getLinearVelocity();

                        if (moveDirection.lengthSquared() > 0) {
                            moveDirection.normalize();

                            // Rotaciona o jogador (a malha) para a direção do movimento
                            const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
                            player.rotation.y = BABYLON.Scalar.Lerp(player.rotation.y, targetAngle, 0.1);
                            
                            // Aplica a velocidade ao corpo físico
                            const newVelocity = moveDirection.scale(playerSpeed);
                            player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(newVelocity.x, currentVelocity.y, newVelocity.z));
                        } else {
                            // Para o movimento horizontal se não houver input
                            player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, currentVelocity.y, 0));
                        }
                    }
                    if(scene && scene.isReady()) scene.render();
                });

                window.addEventListener("resize", () => { if(engine) engine.resize(); });
                gameState.currentScreen = 'playing';
                sounds.music.play();
                render();
            } catch (error) {
                console.error("FALHA CRÍTICA AO INICIAR O JOGO:", error.message, error.stack);
                gameState.currentScreen = 'menu';
                render();
            }
        }
    });
}

async function launchAvatarEditor() {
    gameState.currentScreen = 'loading';
    render();

    if (engine) {
        engine.stopRenderLoop();
        const oldScene = engine.getScene();
        if(oldScene) {
            oldScene.dispose();
        }
    }

    try {
        if (!engine) {
            engine = new BABYLON.Engine(canvas, true, null, true);
        }
        
        const editorData = await startAvatarEditor(engine, canvas);
        gameState.editor.scene = editorData.scene;
        gameState.editor.avatar = editorData.avatar;
        gameState.editor.texture = editorData.texture;
        
        gameState.editor.tool = 'move'; 
        
        gameState.currentScreen = 'avatar_editor';
        render();

    } catch(e) {
        console.error("Falha ao iniciar o editor de avatar", e);
        gameState.currentScreen = 'menu';
        render();
    }
}

// =======================================================
// SEÇÃO 6: INICIALIZAÇÃO E EVENT LISTENERS
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    appContainer.addEventListener('click', (event) => {
        const target = event.target;
        const gameCard = target.closest('.game-card');
        const navItem = target.closest('.nav-item');

        if (gameCard) {
            sounds.click.play();
            gsap.to(gameCard, { scale: 0.95, yoyo: true, repeat: 1, duration: 0.1,
                onComplete: () => launchGame(gameCard.dataset.gameId)
            });
            return;
        }
        
        if (navItem) {
            sounds.click.play();
            if (navItem.textContent.includes("Avatar")) {
                launchAvatarEditor();
            } else if (navItem.textContent.includes("Home")) {
                 stopAvatarEditor(engine);
                 gameState.currentScreen = 'menu';
                 render();
            }
            return;
        }

        if (gameState.currentScreen === 'avatar_editor') {
            const toolBtn = target.closest('.tool-btn');
            const colorBtn = target.closest('.color-btn');
            const controlBtn = target.closest('.control-btn');
            const backBtn = target.closest('#back-to-menu-btn');
            const saveBtn = target.closest('#save-avatar-btn');

            if (toolBtn) {
                document.querySelector('.tool-btn.active').classList.remove('active');
                toolBtn.classList.add('active');
                const newTool = toolBtn.dataset.tool;
                gameState.editor.tool = newTool;

                const camera = gameState.editor.scene.activeCamera;
                if (newTool === 'move') {
                    camera.attachControl(canvas, true);
                } else {
                    camera.detachControl();
                }
            }
            if (colorBtn) {
                gameState.editor.color = colorBtn.dataset.color;
            }
            if (backBtn) {
                stopAvatarEditor(engine);
                gameState.currentScreen = 'menu';
                render();
            }
            if (saveBtn) {
                const base64Canvas = gameState.editor.texture.getContext().canvas.toDataURL();
                localStorage.setItem("playerAvatarTexture", base64Canvas);
                alert("Avatar salvo!");
            }
            if (controlBtn && gameState.editor.scene) {
                const camera = gameState.editor.scene.activeCamera;
                const control = controlBtn.dataset.control;
                if(control === 'rot-left') camera.alpha -= 0.3;
                if(control === 'rot-right') camera.alpha += 0.3;
                if(control === 'view-top') camera.beta = 0.1;
                if(control === 'view-bottom') camera.beta = Math.PI - 0.1;
            }
        }
    });

    canvas.addEventListener('pointerdown', (evt) => {
        if (gameState.currentScreen !== 'avatar_editor' || gameState.editor.tool === 'move') return;
        gameState.editor.isPainting = true;
        paint(evt);
    });
    canvas.addEventListener('pointermove', (evt) => {
        if (gameState.currentScreen !== 'avatar_editor' || !gameState.editor.isPainting || gameState.editor.tool === 'move') return;
        paint(evt);
    });
    canvas.addEventListener('pointerup', () => {
        gameState.editor.isPainting = false;
    });
    canvas.addEventListener('pointerout', () => {
        gameState.editor.isPainting = false;
    });

    function paint(evt) {
        const { scene, tool, color, texture } = gameState.editor;
        if (!scene) return;

        const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
        if (pickInfo.hit) {
            const textureContext = texture.getContext();
            
            if (tool === 'bucket') {
                textureContext.fillStyle = color;
                textureContext.fillRect(0, 0, 512, 512);
            } 
            else if (tool === 'pen' || tool === 'eraser') {
                const uv = pickInfo.getTextureCoordinates();
                if(!uv) return;

                const posX = uv.x * 512;
                const posY = (1 - uv.y) * 512;
                
                textureContext.beginPath();
                textureContext.fillStyle = (tool === 'eraser') ? '#cccccc' : color;
                const brushSize = (tool === 'eraser') ? 20 : 10;
                textureContext.arc(posX, posY, brushSize, 0, 2 * Math.PI);
                textureContext.fill();
            }
            texture.update();
        }
    }

    // Renderização inicial
    render();
});
