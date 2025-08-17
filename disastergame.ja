// Variáveis específicas do jogo de desastre
let player;
let isPlayerAlive = true;
let lava;

// Elementos da UI (obtidos do escopo global)
const hudMessage = document.getElementById("hudMessage");
const hudTimer = document.getElementById("hudTimer");

// Função principal que é chamada pelo main.js
async function startDisasterGame(engine, canvas) {
    const scene = new BABYLON.Scene(engine);
    
    // Configuração da física e gravidade
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.AmmoJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    // Luz e câmera
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;
    const camera = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 15, -25), scene);

    // Cria o mapa e o jogador
    createDisasterMap(scene);
    createPlayer(scene);

    // Configura a câmera para seguir o jogador
    camera.lockedTarget = player;
    camera.radius = 20;
    camera.heightOffset = 10;

    // Inicia o ciclo do jogo (intermissão -> desastre -> repete)
    startIntermission(scene);

    // Lógica que roda a cada frame
    scene.onBeforeRenderObservable.add(() => {
        if (isPlayerAlive && lava && player.position.y < lava.position.y) {
            playerDied();
        }
    });

    return scene;
}

function createPlayer(scene) {
    player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 15, 0); // Nasce em um lugar seguro
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
}

function createDisasterMap(scene) {
    // Chão principal
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    // Cria várias torres/plataformas de alturas diferentes para os jogadores subirem
    for (let i = 0; i < 10; i++) {
        const height = Math.random() * 20 + 5; // Altura entre 5 e 25
        const tower = BABYLON.MeshBuilder.CreateBox(`tower${i}`, { width: 10, depth: 10, height: height }, scene);
        tower.position.y = height / 2;
        tower.position.x = Math.random() * 80 - 40;
        tower.position.z = Math.random() * 80 - 40;
        tower.physicsImpostor = new BABYLON.PhysicsImpostor(tower, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    }
}

// Gerencia o ciclo do jogo
function startIntermission(scene) {
    let timeLeft = 15; // 15 segundos de preparação
    hudMessage.innerText = "Intermissão - Prepare-se!";
    
    const countdown = setInterval(() => {
        timeLeft--;
        hudTimer.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            startLavaDisaster(scene);
        }
    }, 1000);
}

function startLavaDisaster(scene) {
    hudMessage.innerText = "A LAVA ESTÁ SUBINDO! SUBA!";
    hudTimer.innerText = "SOBREVIVA!";
    
    // Cria o plano de lava bem abaixo do mapa
    lava = BABYLON.MeshBuilder.CreateGround("lava", {width: 500, height: 500}, scene);
    lava.position.y = -20;
    const lavaMaterial = new BABYLON.StandardMaterial("lavaMat", scene);
    lavaMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0); // Cor de lava
    lavaMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0); // Faz a lava brilhar
    lava.material = lavaMaterial;

    // Função para fazer a lava subir a cada frame
    const lavaRise = () => {
        lava.position.y += 0.03; // Velocidade de subida da lava
    };
    scene.onBeforeRenderObservable.add(lavaRise);

    // Define um tempo para o fim do desastre
    setTimeout(() => {
        scene.onBeforeRenderObservable.removeCallback(lavaRise);
        endRound(scene);
    }, 45000); // 45 segundos de desastre
}

function endRound(scene) {
    if (isPlayerAlive) {
        hudMessage.innerText = "Você sobreviveu!";
    } else {
        hudMessage.innerText = "Você não sobreviveu...";
    }
    hudTimer.innerText = "Aguarde a próxima rodada.";

    // Remove a lava
    if (lava) {
        lava.dispose();
        lava = null;
    }

    // Começa um novo ciclo depois de 5 segundos
    setTimeout(() => {
        resetPlayer();
        startIntermission(scene);
    }, 5000);
}

function playerDied() {
    isPlayerAlive = false;
    // Remove o controle físico do jogador para que ele não interfira mais
    player.physicsImpostor.dispose();
    hudMessage.innerText = "VOCÊ FOI ELIMINADO!";
    hudTimer.innerText = "Espere a próxima rodada";
}

function resetPlayer() {
    isPlayerAlive = true;
    player.position = new BABYLON.Vector3(0, 15, 0);
    // Recria o corpo físico
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 });
}
