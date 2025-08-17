// Variáveis globais específicas deste jogo
let player;
let isPlayerAlive = true;
let lava;

// A função principal agora aceita um "callback" (onHudUpdate)
// para se comunicar com o main.js e atualizar a UI.
async function startDisasterGame(engine, canvas, onHudUpdate) {
    
    // Espera o motor de física Ammo.js estar 100% pronto antes de continuar.
    // Isso corrige o bug do "carregamento infinito".
    await window.Ammo();
    
    const scene = new BABYLON.Scene(engine);
    
    // Configuração da física e gravidade
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.AmmoJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    // Luz e câmera
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;
    const camera = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 15, -25), scene);

    // Cria os elementos do jogo
    createDisasterMap(scene);
    createPlayer(scene);

    // Configura a câmera para seguir o jogador
    camera.lockedTarget = player;
    camera.radius = 20;
    camera.heightOffset = 10;

    // Lógica que roda a cada frame para checar a morte do jogador
    scene.onBeforeRenderObservable.add(() => {
        if (isPlayerAlive && lava && player.position.y < lava.position.y) {
            playerDied();
        }
    });

    // Gerencia o ciclo do jogo (intermissão -> desastre -> repete)
    function startIntermission(scene) {
        let timeLeft = 15;
        onHudUpdate("Intermissão - Prepare-se!", timeLeft);
        
        const countdown = setInterval(() => {
            timeLeft--;
            onHudUpdate("Intermissão - Prepare-se!", timeLeft);
            if (timeLeft <= 0) {
                clearInterval(countdown);
                startLavaDisaster(scene);
            }
        }, 1000);
    }

    function startLavaDisaster(scene) {
        onHudUpdate("A LAVA ESTÁ SUBINDO! SUBA!", "SOBREVIVA!");
        
        lava = BABYLON.MeshBuilder.CreateGround("lava", {width: 500, height: 500}, scene);
        lava.position.y = -20;
        const lavaMaterial = new BABYLON.StandardMaterial("lavaMat", scene);
        lavaMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0);
        lavaMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0);
        lava.material = lavaMaterial;

        const lavaRise = () => { lava.position.y += 0.03; };
        scene.onBeforeRenderObservable.add(lavaRise);

        setTimeout(() => {
            scene.onBeforeRenderObservable.removeCallback(lavaRise);
            endRound(scene);
        }, 45000);
    }

    function endRound(scene) {
        if (isPlayerAlive) {
            onHudUpdate("Você sobreviveu!", "Aguarde a próxima rodada.");
        } else {
            onHudUpdate("Você não sobreviveu...", "Aguarde a próxima rodada.");
        }

        if (lava) {
            lava.dispose();
            lava = null;
        }

        setTimeout(() => {
            resetPlayer(scene);
            startIntermission(scene);
        }, 5000);
    }

    function playerDied() {
        if (!isPlayerAlive) return; // Garante que a função só rode uma vez
        isPlayerAlive = false;
        player.physicsImpostor.dispose();
        onHudUpdate("VOCÊ FOI ELIMINADO!", "Espere a próxima rodada");
    }

    function resetPlayer(scene) {
        isPlayerAlive = true;
        // Reseta a posição e recria o corpo físico
        player.position = new BABYLON.Vector3(0, 15, 0);
        player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
    }
    
    // Inicia o primeiro ciclo do jogo
    startIntermission(scene);

    return scene;
}

// Funções de criação de objetos 3D
function createPlayer(scene) {
    player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 15, 0);
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
}

function createDisasterMap(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    for (let i = 0; i < 10; i++) {
        const height = Math.random() * 20 + 5;
        const tower = BABYLON.MeshBuilder.CreateBox(`tower${i}`, { width: 10, depth: 10, height: height }, scene);
        tower.position.y = height / 2;
        tower.position.x = Math.random() * 80 - 40;
        tower.position.z = Math.random() * 80 - 40;
        tower.physicsImpostor = new BABYLON.PhysicsImpostor(tower, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    }
}
