window.onload = function () {
    //canvas params
    let width = 850;
    let height = 450;
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width',  width);
    canvas.setAttribute('height', height);

    //renderer
    let renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setClearColor(0x000000);
    //scene and camera
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000); //width / height
    camera.position.set(0, 0, 1000);
    //light
    let light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    //Load background texture
    let loader = new THREE.TextureLoader();
    loader.load('./assets/img/interaction_bg.jpg' , function(texture){
        scene.background = texture;  
    });

    //objects
    let penObj = new THREE.Object3D();
    let baseObj = new THREE.Object3D();
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("../assets/models/");
    //load pen
    mtlLoader.load('bovie.mtl', function(materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("../assets/models/");
        objLoader.load('bovie.obj', function (object) {
            object.scale.set(40, 40, 40);
            object.position.set(0, 0, 0);
            object.rotation.set(Math.PI / 2.0, 10, 0);
            penObj.add(object);
            scene.add(penObj);
        });
    });
    let penInitialParams = {
        angleX: - Math.PI / 6.0,
        angleY: 0.0,
        angleZ: 0.0
    }
    function startPenObject() {
        penObj.rotation.x = penInitialParams.angleX;
        penObj.rotation.y = penInitialParams.angleY;
        penObj.rotation.z = penInitialParams.angleZ;
    }; 
    startPenObject();
    //load base
    mtlLoader.load('base.mtl', function(materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("../assets/models/");
        objLoader.load('base.obj', function (object) {
            object.scale.set(70, 70, 70);
            object.position.set(0, 0, 0);
            object.rotation.set(Math.PI / 2.0, 0, 0);
            baseObj.add(object);
            scene.add(baseObj);
        });
    });
    
    //main render loop
    function loop() {
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    };
    loop();
        
    //mouse
    let mouseObj = {
        isDown: false
    }
    canvas.addEventListener("mousemove", mouse_move_handler);
    canvas.addEventListener("mousedown", mouse_down_handler);
    canvas.addEventListener("mouseup", mouse_up_handler);
    
    function mouse_move_handler(e) {
        if (!mouseObj.isDown) return;
        let centerX = width / 2.0,
            centerY = height / 2.0,
            R = 200,
            maxAngle = Math.PI / 4.0;
        
        let yAngle = maxAngle * mod( (centerX - e.x) / R );
        let xAngle = maxAngle * mod( (e.y - centerY) / R );
        penObj.rotation.y = -yAngle;
        penObj.rotation.x = xAngle;
    }

    function mouse_down_handler() {
        mouseObj.isDown = true;
    }
    
    function mouse_up_handler() {
        mouseObj.isDown = false;
        startPenObject();
    }

    function mod(x) { //x set -1 or 1 if it is out of interval [-1; 1] 
        return Math.abs(x) > 1 ? 1.0 * x / Math.abs(x) : x;
    }
}
