// =======================================================
// VARIÁVEIS GLOBAIS DO JOGO DE DESASTRE
// =======================================================
let isPlayerAlive = true;
let lava;

// =======================================================
// FUNÇÃO PRINCIPAL DO JOGO
// =======================================================
async function startDisasterGame(engine, canvas, onHudUpdate, sounds) {
    await window.Ammo();
    
    const scene = new BABYLON.Scene(engine);
    
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.AmmoJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;

    const camera = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 15, -25), scene);

    createDisasterMap(scene);
    // A variável 'player' agora é local para esta função e retornada no final
    const player = createPlayer(scene);

    camera.lockedTarget = player;
    camera.radius = 20;
    camera.heightOffset = 10;

    scene.onBeforeRenderObservable.add(() => {
        // Lógica de morte por lava
        if (isPlayerAlive && lava && player.position.y < lava.position.y) {
            playerDied(player, sounds, onHudUpdate); // Passa os parâmetros necessários
        }

        // =========================================================================
        // MUDANÇA 1: MANTER O JOGADOR EM PÉ (ENQUANTO VIVO)
        // Esta é a nova lógica que força o jogador a ficar reto a cada frame.
        // =========================================================================
        if (isPlayerAlive && player.physicsImpostor) {
            // Pega a velocidade de rotação atual
            const currentAngularVelocity = player.physicsImpostor.getAngularVelocity();
            // Cria uma nova velocidade de rotação que zera os eixos X e Z, mantendo o eixo Y (para virar no futuro)
            const correctedAngularVelocity = new BABYLON.Vector3(0, currentAngularVelocity.y, 0);
            // Aplica a velocidade corrigida, impedindo que ele tombe
            player.physicsImpostor.setAngularVelocity(correctedAngularVelocity);
        }
    });

    // Função que gerencia a intermissão (tempo de preparação)
    function startIntermission() {
        let timeLeft = 15;
        onHudUpdate("Intermissão - Prepare-se!", timeLeft);
        
        const countdown = setInterval(() => {
            timeLeft--;
            onHudUpdate("Intermissão - Prepare-se!", timeLeft);
            if (timeLeft <= 0) {
                clearInterval(countdown);
                startLavaDisaster();
            }
        }, 1000);
    }

    // Função que inicia o desastre da lava
    function startLavaDisaster() {
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
            endRound();
        }, 45000);
    }

    // Função chamada quando a rodada acaba
    function endRound() {
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
            resetPlayer(player, scene);
            startIntermission();
        }, 5000);
    }
    
    // Inicia o primeiro ciclo do jogo
    startIntermission();

    return { scene, player };
}

// =======================================================
// FUNÇÕES AUXILIARES
// =======================================================

// Função chamada quando o jogador morre
function playerDied(player, sounds, onHudUpdate) {
    if (!isPlayerAlive) return;
    isPlayerAlive = false;
    sounds.playerFall.play();
    onHudUpdate("VOCÊ FOI ELIMINADO!", "Espere a próxima rodada");
    
    // =========================================================================
    // MUDANÇA 2: PERMITIR A QUEDA
    // Removemos a linha 'player.physicsImpostor.dispose()'.
    // Ao não remover o corpo físico, ele continuará no mundo e poderá tombar
    // naturalmente, já que a lógica para mantê-lo em pé (MUDANÇA 1) para de rodar.
    // =========================================================================
}

// Função para resetar o estado do jogador para uma nova rodada
function resetPlayer(player, scene) {
    isPlayerAlive = true;
    
    // Se o corpo físico antigo ainda existir, removemos antes de criar um novo
    if (player.physicsImpostor) {
        player.physicsImpostor.dispose();
    }
    
    player.position = new BABYLON.Vector3(0, 15, 0);
    player.rotation = new BABYLON.Vector3(0, 0, 0); // Garante que ele comece em pé
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
    // Não precisamos mais da trava de rotação aqui
}

// Cria o objeto do jogador
function createPlayer(scene) {
    const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 15, 0);
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1, restitution: 0.1, friction: 0.5 }, scene);
    // Não precisamos mais da trava de rotação aqui
    return player;
}

// Cria o mapa com o chão e as torres
function createDisasterMap(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    for (let i = 0; i < 15; i++) {
        const height = _.random(5.0, 25.0, true);
        const width = _.random(8, 12);
        const depth = _.random(8, 12);
        
        const tower = BABYLON.MeshBuilder.CreateBox(`tower${i}`, { width, depth, height }, scene);
        tower.position.y = height / 2;
        tower.position.x = _.random(-45, 45);
        tower.position.z = _.random(-45, 45);
        tower.physicsImpostor = new BABYLON.PhysicsImpostor(tower, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    }
}
