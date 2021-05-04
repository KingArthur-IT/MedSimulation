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
    loader.load('./assets/img/interaction_bg.jpg', function (texture) {
        texture.minFilter = THREE.LinearFilter;
        scene.background = texture;  
    });
    //pattern
    const patternPlane = new THREE.PlaneGeometry(850.0, 450.0, 10.0);
    loader = new THREE.TextureLoader();
    let material = new THREE.MeshBasicMaterial({
        map: loader.load('./assets/img/path.png'),
        transparent: true
     });
    let mesh = new THREE.Mesh(patternPlane, material);
    mesh.position.z += 400;
    scene.add(mesh);

    //objects
    let penObj = new THREE.Object3D();
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("./assets/models/");
    //load pen
    mtlLoader.load('bovie.mtl', function(materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath("./assets/models/");
        objLoader.load('bovie.obj', function (object) {
            object.scale.set(50, 50, 50);
            object.position.set(0, 0, 0);
            object.rotation.set(Math.PI / 2.0, 10, 0);
            penObj.add(object);
            scene.add(penObj);
        });
    });
    let penInitialParams = {
        angleX: - (25.0) * Math.PI / 180.0,
        angleY: 0.0,
        angleZ: 0.0,
        positionX: 6,
        positionY: -40,
        positionZ: 0
    }
    function startPenObject() {
        penObj.rotation.x = penInitialParams.angleX;
        penObj.rotation.y = penInitialParams.angleY;
        penObj.rotation.z = penInitialParams.angleZ;
        penObj.position.x = penInitialParams.positionX;
        penObj.position.y = penInitialParams.positionY;
        penObj.position.z = penInitialParams.positionZ;
        
    }; 
    startPenObject();
    
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
    canvas.addEventListener("touchmove", touch_move_handler);
    canvas.addEventListener("mousedown", mouse_down_handler);
    canvas.addEventListener("touchstart", touch_start_handler);
    canvas.addEventListener("mouseup", mouse_up_handler);
    canvas.addEventListener("touchend", mouse_up_handler);
    
    function mouse_move_handler(e) {
        if (!mouseObj.isDown) return;
        let centerX = width / 2.0,
            centerY = height / 2.0,
            R = 200,
            maxAngle = (28.0) * Math.PI / 180.0;
        
        let yAngle = maxAngle * mod((centerX - e.x) / R);
        yAngle *= (e.x - centerX - penInitialParams.positionX) / (e.x - centerX);
        let xAngle = maxAngle * mod((e.y - centerY) / R);
        xAngle *= (e.y - centerY + penInitialParams.positionY) / (e.y - centerY);
        
        penObj.rotation.y = -yAngle;
        penObj.rotation.x = xAngle;
    }
    function touch_move_handler(e) {
        if (!mouseObj.isDown) return;
        let centerX = width / 2.0,
            centerY = height / 2.0,
            R = 200,
            maxAngle = Math.PI / 4.0;
        
        let yAngle = maxAngle * mod( (centerX - e.touches[0].pageX) / R );
        let xAngle = maxAngle * mod( (e.touches[0].pageY - centerY) / R );
        penObj.rotation.y = -yAngle;
        penObj.rotation.x = xAngle;
    }

    function mouse_down_handler(e) {
        let eps = 10,
            getPenX = width / 2.0 + penInitialParams.positionX,
            getPenY = 85;
        if (Math.abs(e.x - getPenX) < eps && Math.abs(e.y - getPenY) < eps)
            mouseObj.isDown = true;
    }

    function touch_start_handler(e) {
        let eps = 5,
            getPenX = width / 2.0,
            getPenY = 80;
        if (Math.abs(e.touches[0].pageX - getPenX) < eps && Math.abs(e.touches[0].pageY - getPenY) < eps)
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
