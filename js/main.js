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

    //geometries
    const bgPlane = new THREE.PlaneGeometry(width, height, 10.0);
    
    //loader
    const loader = new THREE.TextureLoader();
    const material = new THREE.MeshBasicMaterial({
        map: loader.load('./assets/img/interaction_bg.jpg')
    });

    //mesh
    let mesh = new THREE.Mesh(bgPlane, material);
    scene.add(mesh);

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("../assets/models/");
    mtlLoader.load('bovie.mtl', function(materials) {
            //materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath("../assets/models/");
            objLoader.load('bovie.obj', function(object) {
                object.scale.set(30, 30, 30);
                mesh = object;
                scene.add(mesh);
            });
        });

/*
    const loader2 = new THREE.OBJLoader();
    // load a resource
    loader2.load(
        // resource URL
        './assets/models/bovie.obj',
        // called when resource is loaded
        function (object) {
            scene.add( object );
        },
        // called when loading is in progresses
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );
*/

    function loop() {
        //mesh.rotation.y += Math.PI / 100;
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    }

    loop();
        
    
    canvas.addEventListener("mousemove", mouse_move_handler);
    function mouse_move_handler(e) {
        
    }
}
