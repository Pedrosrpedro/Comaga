// soccerGame.js

async function startSoccerGame(engine, canvas, onGoalScored) {
    
    const scene = new BABYLON.Scene(engine);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.AmmoJSPlugin());

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 40, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 100;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.2;

    // --- Criação do Campo e Paredes ---
    const field = BABYLON.MeshBuilder.CreateGround("field", {width: 40, height: 60}, scene);
    const fieldMaterial = new BABYLON.StandardMaterial("fieldMat", scene);
    fieldMaterial.diffuseColor = new BABYLON.Color3.FromHexString("#4CAF50"); // Verde
    field.material = fieldMaterial;
    field.physicsImpostor = new BABYLON.PhysicsImpostor(field, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.5 }, scene);

    const wall1 = BABYLON.MeshBuilder.CreateBox("wall", {width: 40, height: 3, depth: 1}, scene);
    wall1.position.z = 30;
    wall1.physicsImpostor = new BABYLON.PhysicsImpostor(wall1, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    wall1.isVisible = false;
    
    // ... Crie as outras 3 paredes da mesma forma, ajustando a posição e rotação ...

    // --- Criação da Bola ---
    const ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: 1.5}, scene);
    ball.position.y = 5;
    const ballMaterial = new BABYLON.StandardMaterial("ballMat", scene);
    ballMaterial.diffuseColor = BABYLON.Color3.White();
    ball.material = ballMaterial;
    ball.physicsImpostor = new BABYLON.PhysicsImpostor(ball, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.8, friction: 0.2 }, scene);

    // --- Criação dos Gols e Zonas de Gatilho ---
    // Gol 1 (Azul)
    const goal1 = BABYLON.MeshBuilder.CreateBox("goal1", {width: 10, height: 5, depth: 1}, scene);
    goal1.position.z = -30;
    goal1.material = new BABYLON.StandardMaterial("goal1Mat", scene);
    goal1.material.diffuseColor = BABYLON.Color3.Blue();

    const goal1Trigger = BABYLON.MeshBuilder.CreateBox("goal1Trigger", {width: 10, height: 5, depth: 2}, scene);
    goal1Trigger.position.z = -29;
    goal1Trigger.isVisible = false;

    // Gol 2 (Vermelho)
    const goal2 = BABYLON.MeshBuilder.CreateBox("goal2", {width: 10, height: 5, depth: 1}, scene);
    goal2.position.z = 30;
    goal2.material = new BABYLON.StandardMaterial("goal2Mat", scene);
    goal2.material.diffuseColor = BABYLON.Color3.Red();

    const goal2Trigger = BABYLON.MeshBuilder.CreateBox("goal2Trigger", {width: 10, height: 5, depth: 2}, scene);
    goal2Trigger.position.z = 29;
    goal2Trigger.isVisible = false;

    // --- Lógica de Detecção de Gol ---
    scene.onBeforeRenderObservable.add(() => {
        if (ball.intersectsMesh(goal1Trigger, false)) {
            onGoalScored('red'); // Time Vermelho marcou
        }
        if (ball.intersectsMesh(goal2Trigger, false)) {
            onGoalScored('blue'); // Time Azul marcou
        }
    });
    
    // Cria o jogador (como no outro jogo, mas sem a lógica de rotação daqui)
    const player = createPlayer(scene);

    return { scene, player, ball };
}

// Função para criar o jogador (pode ser a mesma do disasterGame)
function createPlayer(scene) {
    const player = BABYLON.MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 5, -20);
    player.rotationQuaternion = new BABYLON.Quaternion();
    
    const playerMaterial = new BABYLON.StandardMaterial("playerMat", scene);
    const savedTexture = localStorage.getItem("playerAvatarTexture");
    if (savedTexture) {
        playerMaterial.diffuseTexture = new BABYLON.Texture(savedTexture, scene);
    } else {
        playerMaterial.diffuseColor = new BABYLON.Color3.FromHexString("#cccccc");
    }
    player.material = playerMaterial;
    
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 80, restitution: 0.1, friction: 0.5 }, scene);
    return player;
}
