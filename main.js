// =======================================================
// === CÓDIGO COMPLETO DO JOGO COM MULTIPLAYER FIREBASE ===
// =======================================================

// =======================================================
// SEÇÃO 1: FUNÇÕES GLOBAIS DE UI (CONSOLE)
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
    score: { blue: 0, red: 0 },
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
    { id: 'disaster_survival', displayName: 'SOBREVIVA AO DESASTRE', name: 'Natural Disaster Survival', rating: 91, players: 12.2 },
    { id: 'soccer_game', displayName: 'FUTEBOL 1V1', name: 'Soccer Stars', rating: 88, players: 1.5 }
];

function createHeaderHTML() {
    return `
        <header class="main-header">
            <nav class="main-nav">
                <a href="#" class="nav-item active" data-nav="home"><i class="fa-solid fa-house"></i> Home</a>
                <a href="#" class="nav-item" data-nav="avatar"><i class="fa-solid fa-user-astronaut"></i> Avatar</a>
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
    if (gameState.currentScreen === 'playing_soccer') {
        return `
            <div class="soccer-hud">
                <div class="team-blue">${gameState.score.blue}</div>
                <div class="team-red">${gameState.score.red}</div>
            </div>
        `;
    }
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
let currentScene = null;
let player;
let ball = null;

// VARIÁVEIS DE MULTIPLAYER FIREBASE
let isHost = false; 
let opponents = {}; 
let firebaseApp;
let database;
let myAuthId = null; 
let gameSessionRef;
let playersRef;

let moveX = 0;
let moveZ = 0;


// =======================================================
// NOVA LÓGICA DE MULTIPLAYER COM FIREBASE
// =======================================================
function initializeFirebase() {
    // <-- COLE A SUA CONFIGURAÇÃO DO FIREBASE AQUI DENTRO!
    const firebaseConfig = {
      apiKey: "AIzaSyAchW-Gr80W-I8ROKKMuZzTEG0gOku4G9k",
      authDomain: "teste-multiplayer-e0ccd.firebaseapp.com",
      databaseURL: "https://teste-multiplayer-e0ccd-default-rtdb.firebaseio.com",
      projectId: "teste-multiplayer-e0ccd",
      storageBucket: "teste-multiplayer-e0ccd.firebasestorage.app",
      messagingSenderId: "163391453336",
      appId: "1:163391453336:web:e93e1a41932c848232f8ed",
      measurementId: "G-PQEBPWSBQE"
    };

    // Inicializa o Firebase
    firebaseApp = firebase.initializeApp(firebaseConfig);
    database = firebase.database();

    // Autentica o jogador anonimamente
    firebase.auth().signInAnonymously()
      .then(() => {
        const user = firebase.auth().currentUser;
        if (user) {
          myAuthId = user.uid;
          console.log("Autenticado com sucesso! Meu ID é:", myAuthId);
          
          playersRef = database.ref('players');
          const myPlayerRef = playersRef.child(myAuthId);
          
          // Sistema de presença: Remove o jogador do banco de dados quando ele se desconectar
          myPlayerRef.onDisconnect().remove();

          // Começa a escutar por mudanças na sessão de jogo
          listenForGameSessionChanges();
        }
      })
      .catch((error) => {
        console.error("Falha na autenticação anônima:", error);
      });
}

function listenForGameSessionChanges() {
    gameSessionRef = database.ref('game_session');
    
    // Escuta por qualquer mudança na sessão de jogo (ex: um host iniciou um jogo)
    gameSessionRef.on('value', (snapshot) => {
        const gameData = snapshot.val();
        // Se existe uma sessão de jogo e eu não sou o host, eu entro no jogo
        if (gameData && gameData.gameId && !isHost) {
            console.log("Recebemos ordem do host para iniciar o jogo:", gameData.gameId);
            launchGame(gameData.gameId);
        }
    });
}

function setupMultiplayerListeners() {
    if (!playersRef) return;
    
    // NOVO JOGADOR ENTROU
    playersRef.on('child_added', (snapshot) => {
        const data = snapshot.val();
        const id = snapshot.key;

        if (!currentScene || id === myAuthId || opponents[id]) return; 

        console.log("Um novo oponente apareceu:", id);
        const opponent = BABYLON.MeshBuilder.CreateCapsule("opponent_" + id, { height: 2, radius: 0.5 }, currentScene);
        opponent.rotationQuaternion = new BABYLON.Quaternion();
        const opponentMaterial = new BABYLON.StandardMaterial("opponentMat_" + id, currentScene);
        
        if (data.texture && data.texture.includes('base64')) {
            const rawBase64 = data.texture.split(',')[1];
            opponentMaterial.diffuseTexture = BABYLON.Texture.CreateFromBase64String(rawBase64, "opponentTexture_" + id, currentScene);
        } else {
            opponentMaterial.diffuseColor = new BABYLON.Color3.Red();
        }
        opponent.material = opponentMaterial;
        opponents[id] = opponent;
    });

    // JOGADOR EXISTENTE SE MOVIMENTOU
    playersRef.on('child_changed', (snapshot) => {
        const data = snapshot.val();
        const id = snapshot.key;

        if (!currentScene || id === myAuthId) return;

        const opponentMesh = opponents[id];
        if (opponentMesh) {
            const targetPos = new BABYLON.Vector3(data.pos.x, data.pos.y, data.pos.z);
            const targetRot = new BABYLON.Quaternion(data.rot.x, data.rot.y, data.rot.z, data.rot.w);
            opponentMesh.position = BABYLON.Vector3.Lerp(opponentMesh.position, targetPos, 0.2);
            opponentMesh.rotationQuaternion = BABYLON.Quaternion.Slerp(opponentMesh.rotationQuaternion, targetRot, 0.2);
        }
    });

    // JOGADOR DESCONECTOU
    playersRef.on('child_removed', (snapshot) => {
        const id = snapshot.key;
        console.log("Oponente desconectou:", id);
        if (opponents[id]) {
            opponents[id].dispose();
            delete opponents[id];
        }
    });
    
    // ESCUTA PELA BOLA (SE NÃO FOR O HOST)
    if (!isHost) {
        const ballRef = database.ref('game_session/ball');
        ballRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (ball && ball.physicsImpostor && data && data.pos && data.vel) {
                const targetPos = new BABYLON.Vector3(data.pos.x, data.pos.y, data.pos.z);
                const targetVel = new BABYLON.Vector3(data.vel.x, data.vel.y, data.vel.z);
                ball.position = BABYLON.Vector3.Lerp(ball.position, targetPos, 0.5);
                ball.physicsImpostor.setLinearVelocity(targetVel);
            }
        });
    }
}


const keys = { w: false, a: false, s: false, d: false, ' ': false };
window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});
window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

function render() {
    canvas.classList.add('hidden');
    joystickZone.classList.add('hidden');
    appContainer.innerHTML = '';

    if (gameState.currentScreen === 'menu') {
        appContainer.innerHTML = `<div class="roblox-container">${createHeaderHTML()}<main class="main-content">${createFriendsListHTML()}${createGamesGridHTML(availableGames)}</main></div>`;
    } else if (gameState.currentScreen === 'playing_soccer' || gameState.currentScreen === 'playing_disaster') {
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
    if (gameState.currentScreen === 'playing_disaster') {
        render();
    }
}

function setupJoystick() {
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
    for (const id in opponents) {
        if(opponents[id]) opponents[id].dispose();
    }
    opponents = {};
    
    if (playersRef) playersRef.off();
    if (gameSessionRef) gameSessionRef.off();
    
    gameState.score = { blue: 0, red: 0 };
    ball = null;
    gameState.currentScreen = 'loading';
    render();

    if (engine) {
        engine.stopRenderLoop();
        if (currentScene) currentScene.dispose();
        currentScene = null;
    }

    try {
        if (!engine) {
            engine = new BABYLON.Engine(canvas, true, null, true);
        }

        let gameData;
        if (gameId === 'soccer_game') {
            gameState.currentScreen = 'playing_soccer';
            gameData = await startSoccerGame(engine, canvas, (scoringTeam) => {
                if (scoringTeam === 'red') gameState.score.red++;
                if (scoringTeam === 'blue') gameState.score.blue++;
                render();
                
                ball.position = new BABYLON.Vector3(0, 5, 0);
                ball.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
                ball.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
            });
            ball = gameData.ball;
        } else {
            gameState.currentScreen = 'playing_disaster';
            gameData = await startDisasterGame(engine, canvas, updateHud, sounds);
        }
        
        currentScene = gameData.scene;
        player = gameData.player;
        player.moveDirection = new BABYLON.Vector3(0, 0, 0);
        
        render();
        setupJoystick();
        setupMultiplayerListeners();
        
        let lastSentTime = 0;
        engine.runRenderLoop(() => {
            if (!player || !player.physicsImpostor || !currentScene || !currentScene.activeCamera) return;

            const camera = currentScene.activeCamera;
            const playerSpeed = 7.5;
            const jumpForce = 6;
            const ray = new BABYLON.Ray(player.position, new BABYLON.Vector3(0, -1, 0), 1.1);
            const hit = currentScene.pickWithRay(ray, (mesh) => mesh.name !== "player" && !mesh.name.startsWith("opponent"));
            const isOnGround = hit.hit;

            if (keys[' '] && isOnGround) {
                player.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, jumpForce, 0), player.getAbsolutePosition());
                keys[' '] = false;
            }

            let totalMoveX = moveX;
            let totalMoveZ = moveZ;
            if (keys.w) totalMoveZ += 1;
            if (keys.s) totalMoveZ -= 1;
            if (keys.a) totalMoveX -= 1;
            if (keys.d) totalMoveX += 1;

            const cameraForward = camera.getDirection(BABYLON.Vector3.Forward());
            const cameraRight = camera.getDirection(BABYLON.Vector3.Right());
            cameraForward.y = 0;
            cameraRight.y = 0;
            cameraForward.normalize();
            cameraRight.normalize();
            const moveDirection = cameraRight.scale(totalMoveX).add(cameraForward.scale(totalMoveZ));
            const currentVelocity = player.physicsImpostor.getLinearVelocity();

            if (moveDirection.lengthSquared() > 0) {
                moveDirection.normalize();
                player.moveDirection.copyFrom(moveDirection);
                const newVelocity = moveDirection.scale(playerSpeed);
                player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(newVelocity.x, currentVelocity.y, newVelocity.z));
            } else {
                player.moveDirection.set(0, 0, 0); 
                player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, currentVelocity.y, 0));
            }
            
            // LÓGICA DE ENVIO DE DADOS PARA O FIREBASE
            if (myAuthId && (Date.now() - lastSentTime > 100)) {
                const myPlayerRef = playersRef.child(myAuthId);
                const myTexture = localStorage.getItem("playerAvatarTexture");
                
                const playerData = {
                    pos: { x: player.position.x, y: player.position.y, z: player.position.z },
                    rot: { x: player.rotationQuaternion.x, y: player.rotationQuaternion.y, z: player.rotationQuaternion.z, w: player.rotationQuaternion.w },
                    texture: myTexture
                };
                
                myPlayerRef.set(playerData);

                if (isHost && ball && ball.physicsImpostor) {
                    const ballVel = ball.physicsImpostor.getLinearVelocity();
                    const ballData = {
                        pos: { x: ball.position.x, y: ball.position.y, z: ball.position.z },
                        vel: { x: ballVel.x, y: ballVel.y, z: ballVel.z }
                    };
                    database.ref('game_session/ball').set(ballData);
                }
                lastSentTime = Date.now();
            }
            
            if (currentScene && currentScene.isReady()) currentScene.render();
        });

        window.addEventListener("resize", () => { if(engine) engine.resize(); });

    } catch (error) {
        console.error("FALHA CRÍTICA AO INICIAR O JOGO:", error);
        gameState.currentScreen = 'menu';
        render();
    }
}

async function launchAvatarEditor() {
    gameState.currentScreen = 'loading';
    render();

    if (engine) {
        engine.stopRenderLoop();
        if (currentScene) currentScene.dispose();
        currentScene = null;
    }

    try {
        if (!engine) {
            engine = new BABYLON.Engine(canvas, true, null, true);
        }
        
        const editorData = await startAvatarEditor(engine, canvas);
        currentScene = editorData.scene;
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
    // INICIALIZA A CONEXÃO COM O FIREBASE
    initializeFirebase();

    // --- NOVO: Referências para os elementos do Modal ---
    const joinGameModal = document.getElementById('join-game-modal');
    const modalGameTitle = document.getElementById('modal-game-title');
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    let selectedGameId = null; // Variável para guardar o ID do jogo que foi clicado

    // --- NOVO: Funções para mostrar e esconder o modal ---
    function openJoinModal(gameId, gameName) {
        selectedGameId = gameId; // Guarda o ID do jogo
        modalGameTitle.textContent = gameName; // Atualiza o título do modal
        joinGameModal.classList.remove('hidden'); // Mostra o modal
    }

    function closeJoinModal() {
        joinGameModal.classList.add('hidden'); // Esconde o modal
        selectedGameId = null; // Limpa o ID do jogo selecionado
    }

    // Listener principal da aplicação
    appContainer.addEventListener('click', (event) => {
        const target = event.target;
        const gameCard = target.closest('.game-card');
        const navItem = target.closest('.nav-item');

        // --- LÓGICA MODIFICADA ---
        // Se um card de jogo for clicado, abra o modal em vez de iniciar o jogo
        if (gameCard) {
            sounds.click.play();
            const gameId = gameCard.dataset.gameId;
            const gameName = gameCard.querySelector('h3').textContent;
            openJoinModal(gameId, gameName); // Chama a função para abrir o modal
            return; // Para a execução para não continuar com o código antigo
        }
        
        if (navItem) {
            sounds.click.play();
            const navAction = navItem.dataset.nav;
            if (navAction === "avatar") {
                launchAvatarEditor();
            } else if (navAction === "home") {
                 if (engine) {
                    engine.stopRenderLoop();
                    if (currentScene) currentScene.dispose();
                    currentScene = null;
                }
                // LIMPA A SESSÃO DE JOGO AO VOLTAR PARA O MENU
                 if(isHost && gameSessionRef) {
                     gameSessionRef.remove();
                 }
                 if(playersRef && myAuthId) {
                     playersRef.child(myAuthId).remove();
                 }
                 isHost = false;

                 gameState.currentScreen = 'menu';
                 render();
            }
            return;
        }

        if (gameState.currentScreen === 'avatar_editor') {
            // Lógica do editor de avatar...
        }
    });

    // --- NOVO: Listeners para os botões do Modal ---
    createRoomBtn.addEventListener('click', () => {
        sounds.click.play();
        if (!selectedGameId) return;

        console.log(`Criando sala para o jogo: ${selectedGameId}. Eu serei o Host!`);
        isHost = true; // Define este jogador como o anfitrião (host)

        // Avisa aos outros jogadores, escrevendo na sessão de jogo do Firebase
        if (gameSessionRef) {
            gameSessionRef.set({
                gameId: selectedGameId,
                hostId: myAuthId
            });
        }
        
        // Inicia o jogo para o host. A função `set` acima irá notificar
        // os outros jogadores para que eles iniciem o jogo também.
        launchGame(selectedGameId);
        closeJoinModal();
    });

    joinRoomBtn.addEventListener('click', () => {
        sounds.click.play();
        if (!selectedGameId) return;

        console.log(`Tentando entrar em uma sala para: ${selectedGameId}. Eu serei um cliente.`);
        isHost = false; // Define este jogador como um cliente

        // Apenas fecha o modal. O listener `listenForGameSessionChanges` que já existe
        // irá automaticamente detectar quando um host criar a sala e iniciará o jogo.
        alert("Procurando uma sala... Você entrará automaticamente quando o host iniciar o jogo.");
        closeJoinModal();
    });

    closeModalBtn.addEventListener('click', () => {
        sounds.click.play();
        closeJoinModal();
    });
    
    // O resto do seu código de listeners (avatar, paint, etc.) continua aqui...
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

    render();
});
