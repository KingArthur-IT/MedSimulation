window.onload = function () {
    //params
    let cfg = {
        width: 850,
        height: 450,
        centerX: 425,
        centerY: 225,
        pathSrc: './assets/img/path.png',
        trainingPath1Src: './assets/img/path1.png',
        trainingPath2Src: './assets/img/path2.png',
        trainingPath3Src: './assets/img/pathExam.png',
        bgSrc: './assets/img/interaction_bg.jpg',
        modelsPath: './assets/models/',
        penSize: 49,        
        R: 200, //max pixel radius of pen moving
        maxAngle: (26.0) * Math.PI / 180.0,
        touchStep: 5
    }
    let simulation = {
        penCoords : {
            x: 0,
            y: 0
        },
        mouse: {
            isDown: false,
            startX: 0,
            startY: 0,
            endX:   0,
            endY:   0
        },
        stages: {
            training: true,
            practice: false,
            exam: false
        },
        dataIndex: 0,
        changeIndex: false,
        penInitialParams : {
            angleX: - (25.0) * Math.PI / 180.0,
            angleY: 0.0,
            angleZ: 0.0,
            positionX: 6,
            positionY: -40,
            positionZ: 0
        },
        exam : {
            count: 0,
            maxCount: 5,
            inline: true,
            pointsEps: 15,
            path: '',
            rightPath: true,
            lastMovementTime: 0,
            nonStop: true,
            notQuick: true
        },
        checkpoint: {
            coordsX: [430, 610, 430, 245, 500, 360, 360, 500],
            coordsY: [80, 90, 240, 90, 320, 320, 140, 140],
            passPoints: [false, false, false, false, false, false, false, false],
            passExam: ['1237456', '7456123', '3216547', '6547321']
        }
    }

    //unseen canvases to draw the pattern and get data from it
    let patternData = []; //data 850x450 of 0 and 1. where 0 - no path in coord, 1 - has path 
    patternData.push(); patternData.push();
    patternData[0] = []; patternData[1] = []; patternData[2] = [];

    
    //get data from supportingCanvas
    let patternCanvas = document.getElementById('supportingCanvas');
    patternCanvas.setAttribute('width', cfg.width);
    patternCanvas.setAttribute('height', cfg.height);
    let patternCanvasContex = patternCanvas.getContext('2d');
    let imageOfPath1 = new Image(); imageOfPath1.src = cfg.trainingPath1Src;
    imageOfPath1.onload = function () {
        patternCanvasContex.drawImage(imageOfPath1, 0, 0)
        //extended data array have color of each pixel in RGBA
        let patternDataExtended = patternCanvasContex.getImageData(0, 0, cfg.width, cfg.height).data;
        let i = 0;
        do {
            if (patternDataExtended[i] == 0 && 
                patternDataExtended[i + 1] == 0 &&
                patternDataExtended[i + 2] == 0 &&
                patternDataExtended[i + 3] == 0)
                patternData[0].push(0);
            else patternData[0].push(1);
            i += 4;
        } while (i < patternDataExtended.length);
    };
    //get data from supportingCanvas2
    let supportingCanvas2 = document.getElementById('supportingCanvas2');
    supportingCanvas2.setAttribute('width', cfg.width);
    supportingCanvas2.setAttribute('height', cfg.height);
    let patternCanvasContex2 = supportingCanvas2.getContext('2d');
    let imageOfPath2 = new Image(); imageOfPath2.src = cfg.trainingPath2Src; 
    imageOfPath2.onload = function () {
        patternCanvasContex2.drawImage(imageOfPath2, 0, 0)
        //extended data array have color of each pixel in RGBA
        let patternDataExtended = patternCanvasContex2.getImageData(0, 0, cfg.width, cfg.height).data;
        let i = 0;
        do {
            if (patternDataExtended[i] == 0 && 
                patternDataExtended[i + 1] == 0 &&
                patternDataExtended[i + 2] == 0 &&
                patternDataExtended[i + 3] == 0)
                patternData[1].push(0);
            else patternData[1].push(1);
            i += 4;
        } while (i < patternDataExtended.length);
    };
    //full
    let supportingCanvas3 = document.getElementById('supportingCanvas3');
    supportingCanvas3.setAttribute('width', cfg.width);
    supportingCanvas3.setAttribute('height', cfg.height);
    let patternCanvas3Contex = supportingCanvas3.getContext('2d');
    let imageOfPath3 = new Image(); imageOfPath3.src = cfg.trainingPath3Src;
    imageOfPath3.onload = function () {
        patternCanvas3Contex.drawImage(imageOfPath3, 0, 0)
        //extended data array have color of each pixel in RGBA
        let patternDataExtended = patternCanvas3Contex.getImageData(0, 0, cfg.width, cfg.height).data;
        let i = 0;
        do {
            if (patternDataExtended[i] == 0 && 
                patternDataExtended[i + 1] == 0 &&
                patternDataExtended[i + 2] == 0 &&
                patternDataExtended[i + 3] == 0)
                patternData[2].push(0);
            else patternData[2].push(1);
            i += 4;
        } while (i < patternDataExtended.length);
    };

    //main canvas to draw the scene
    let canvas = document.getElementById('canvas');
    canvas.setAttribute('width',  cfg.width);
    canvas.setAttribute('height', cfg.height);

    //renderer
    let renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setClearColor(0x000000);
    //scene and camera
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(40.0, cfg.width / cfg.height, 0.1, 5000); 
    camera.position.set(0, 0, 1000);
    //light
    let light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    //Load background texture
    let loader = new THREE.TextureLoader();
    loader.load(cfg.bgSrc, function (texture) {
        texture.minFilter = THREE.LinearFilter;
        scene.background = texture;  
    });
    //pattern
    const patternPlane = new THREE.PlaneGeometry(cfg.width, cfg.height, 10.0);
    loader = new THREE.TextureLoader();
    let material = new THREE.MeshBasicMaterial({
        map: loader.load(cfg.pathSrc, function (texture) {
            texture.minFilter = THREE.LinearFilter; }),
        transparent: true
    });    
    let patternPlaneMesh = new THREE.Mesh(patternPlane, material); 
    //patternPlaneMesh.position.z += 400;
    patternPlaneMesh.scale.set(1.6, 1.6, 1.6);
    //patternPlaneMesh.position.y -= 20;
    //patternPlaneMesh.rotation.x -= 5.0 * Math.PI / 180.0;
    scene.add(patternPlaneMesh);

    //objects
    let penObj = new THREE.Object3D();
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(cfg.modelsPath);
    //load pen
    mtlLoader.load('bovie.mtl', function(materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(cfg.modelsPath);
        objLoader.load('bovie.obj', function (object) {
            object.scale.set(cfg.penSize, cfg.penSize, cfg.penSize);
            object.position.set(0, 0, 0);
            object.rotation.set(Math.PI / 2.0, 10, 0);
            penObj.add(object);
            scene.add(penObj);
        });
    });

    //set pen to initial state func
    function startPenObject() {
        penObj.rotation.x = simulation.penInitialParams.angleX;
        penObj.rotation.y = simulation.penInitialParams.angleY;
        penObj.rotation.z = simulation.penInitialParams.angleZ;
        penObj.position.x = simulation.penInitialParams.positionX;
        penObj.position.y = simulation.penInitialParams.positionY;
        penObj.position.z = simulation.penInitialParams.positionZ;        
    }; 
    startPenObject();

    //trajectory line    
    let trajectoryMaterial = new THREE.LineBasicMaterial({color: 0xff00ff});
    let trajectoryPoints = []; let trajectoryPointsTime = [];
    let trajectoryPoints2 = []; let trajectoryPoints3 = []; let trajectoryPoints4 = [];
    //let curve;   let curvePoints;
    let trajectoryGeometry;
    let trajectoryGeometry2;
    let trajectoryGeometry3;
    let trajectoryGeometry4;
    let splineObject;
    let splineObject2;
    let splineObject3;
    let splineObject4;

    //-----------------main render loop-------------------------
    function loop() {
        if (simulation.stages.practice) {                   
            let time = new Date;
            if (time - trajectoryPointsTime[0] > 5000 && trajectoryPoints.length > 0) {
                trajectoryPoints.shift(); trajectoryPointsTime.shift();
                trajectoryPoints2.shift();  trajectoryPoints3.shift();  trajectoryPoints4.shift();
            }
            scene.remove(splineObject); scene.remove(splineObject2)
            scene.remove(splineObject3); scene.remove(splineObject4)
            trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
            trajectoryGeometry2 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints2);
            trajectoryGeometry3 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints3);
            trajectoryGeometry4 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints4);
            splineObject = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
            splineObject2 = new THREE.Line(trajectoryGeometry2, trajectoryMaterial);
            splineObject3 = new THREE.Line(trajectoryGeometry3, trajectoryMaterial);
            splineObject4 = new THREE.Line(trajectoryGeometry4, trajectoryMaterial);
            scene.add(splineObject);
            scene.add(splineObject2);
            scene.add(splineObject3);
            scene.add(splineObject4);
        }
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    };
    loop();
        
    //---------------mouse, touch, lock change events------------------
    canvas.addEventListener("mousedown",    mouse_down_handler);
    canvas.addEventListener("mousemove",    mouse_move_handler);
    //canvas.addEventListener("mouseup",      mouse_up_handler);
    
    canvas.addEventListener("touchstart",   touch_start_handler);
    canvas.addEventListener("touchmove",    touch_move_handler);    
    canvas.addEventListener("touchend",     touch_up_handler);
    
    if ("onpointerlockchange" in document) {
        document.addEventListener('pointerlockchange', lockChange, false);
    } else if ("onmozpointerlockchange" in document) {
        document.addEventListener('mozpointerlockchange', lockChange, false);
        } else if ("onwebkitpointerlockchange" in document) {
            document.addEventListener('webkitpointerlockchange', lockChange, false);
    };
    
    function mouse_down_handler() {
        if (!simulation.mouse.isDown) {//lock and start
            canvas.requestPointerLock = canvas.requestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
            //coords of pen`s end
            simulation.penCoords.x = cfg.width / 2.0 + simulation.penInitialParams.positionX;
            simulation.penCoords.y = 75;
            simulation.mouse.isDown = true;
        }
        else { //unlock
            document.exitPointerLock = document.exitPointerLock    ||
                           document.mozExitPointerLock ||
                           document.webkitExitPointerLock;
            document.exitPointerLock();
            simulation.mouse.isDown = false;
            startPenObject();
            simulation.dataIndex = 0;
            trajectoryPoints.length = 0; trajectoryPoints2.length = 0;
            trajectoryPoints3.length = 0; trajectoryPoints4.length = 0;
            trajectoryPointsTime.length = 0;
        }
    }
    function mouse_move_handler(e) {        
        //console.log(e.x, e.y)
        if (!simulation.mouse.isDown) return; 
        //get movement of the mouse in lock API
        let movementX = e.movementX ||
            e.mozMovementX          ||
            e.webkitMovementX       ||
            0;
        let movementY = e.movementY ||
            e.mozMovementY      ||
            e.webkitMovementY   ||
            0;

        //training mode
        if (simulation.stages.training) {
            trainingStage(movementX, movementY);
        };//if (stages.training)
        if (simulation.stages.practice) {
            practiceStage(movementX, movementY);
        }//if (stages.practice) 
        if (simulation.stages.exam) {
            examStage(movementX, movementY);
        }
    }
    function lockChange() {
        if(document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas) {
            console.log('The pointer lock status is now locked');
            if (simulation.stages.exam) {
                simulation.exam.count = 0;
                simulation.exam.inline = true;
                simulation.exam.path = '';
                for (let i = 0; i < 8; i++)
                    simulation.checkpoint.passPoints[i] = false;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.notQuick = true;
                simulation.exam.lastMovementTime = new Date();
            }
        } else {
            console.log('The pointer lock status is now unlocked');
            simulation.mouse.isDown = false;
            startPenObject();
            simulation.dataIndex = 0;
            trajectoryPoints.length = 0;
            trajectoryPoints2.length = 0;
            trajectoryPoints3.length = 0;
            trajectoryPoints4.length = 0;
            trajectoryPointsTime.length = 0;
            simulation.changeIndex = false;
            if (simulation.stages.exam) {
                if (document.getElementById('examText').value != "Экзамен сдан")
                    document.getElementById('examText').value = "Начните экзамен";
            }
        }
    }

    function touch_start_handler(e) {
        let eps = 15, //pixel gap to get the pen by its end
            getPenX = cfg.width / 2.0 + simulation.penInitialParams.positionX, //coords of pen`s end
            getPenY = 75;
        simulation.penCoords.x = getPenX;
        simulation.penCoords.y = getPenY;
        let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
        let touch = evt.touches[0] || evt.changedTouches[0];

        if (Math.abs(touch.pageX - getPenX) < eps && Math.abs(touch.pageY - getPenY) < eps) {
            simulation.mouse.isDown = true;            
            simulation.mouse.startX = touch.pageX;
            simulation.mouse.startY = touch.pageY;
        }
        if (simulation.stages.exam) {
                simulation.exam.count = 0;
                simulation.exam.inline = true;
                simulation.exam.path = '';
                for (let i = 0; i < 8; i++)
                    simulation.checkpoint.passPoints[i] = false;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.notQuick = true;
                simulation.exam.lastMovementTime = new Date();
            }
    }
    function touch_move_handler(e) {
        //e.preventDefault();
        if (!simulation.mouse.isDown) return;        
        //training regime
        
        simulation.mouse.endX = simulation.mouse.startX;
        simulation.mouse.endY = simulation.mouse.startY;
        
        let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
        let touch = evt.touches[0] || evt.changedTouches[0];

        simulation.mouse.startX = touch.pageX;
        simulation.mouse.startY = touch.pageY;

        //calculate new potential coords of pen
        //let newPenCoordX = penCoords.x - cfg.touchStep*(mouseObj.endX - mouseObj.startX) / Math.abs(mouseObj.endX - mouseObj.startX);
        //let newPenCoordY = penCoords.y - cfg.touchStep*(mouseObj.endY - mouseObj.startY) / Math.abs(mouseObj.endY - mouseObj.startY);
        
        let movementX = touch.pageX;
        let movementY = touch.pageY;
        
        //training mode
        if (simulation.stages.training) {
            trainingStageTouch(movementX, movementY);
        };//if (stages.training)
        if (simulation.stages.practice) {
            practiceStageTouch(movementX, movementY);
        }//if (stages.practice) 
        if (simulation.stages.exam) {
            examStageTouch(movementX, movementY);
        }
        
    }
    function touch_up_handler() {
        simulation.mouse.isDown = false;
        startPenObject();
        simulation.dataIndex = 0;

        trajectoryPoints.length = 0;
        trajectoryPoints2.length = 0;
        trajectoryPoints3.length = 0;
        trajectoryPoints4.length = 0;
        trajectoryPointsTime.length = 0;
        simulation.changeIndex = false;
        if (simulation.stages.exam) {
            if (document.getElementById('examText').value != "Экзамен сдан")
                document.getElementById('examText').value = "Начните экзамен";
           }
    }       

    let stageBtn = document.getElementById('stageBtn');
    stageBtn.addEventListener('click', () => {
        if (simulation.stages.training) {
            simulation.stages.training = false;
            simulation.stages.practice = true;
            simulation.stages.exam = false;
            stageBtn.value = "Перейти к экзамену";
            simulation.mouse.isDown = false;
        }
        else if (simulation.stages.practice) {
                simulation.stages.training = false;
                simulation.stages.practice = false;
                simulation.stages.exam = true;
                stageBtn.style.display = 'none';
                simulation.mouse.isDown = false;
                let inputText = document.getElementById('examText');
                inputText.style.display = 'block';
                inputText.value = "Начните экзамен";
                simulation.exam.rightPath = true;
            };
    })

    //set of functions
    function mod(x) { //x set -1 or 1 if it is out of interval [-1; 1] 
        return Math.abs(x) > 1 ? 1.0 * x / Math.abs(x) : x;
    }
    //get the rotation angles by the moving coords and rotate the pen
    function movePen(newPenCoordX, newPenCoordY, radius) {
        simulation.penCoords.x = newPenCoordX; simulation.penCoords.y = newPenCoordY;
        //caclulate rotation angle around y and x axises
        let yAngle = cfg.maxAngle * mod((cfg.centerX - simulation.penCoords.x) / radius);
        let xAngle = cfg.maxAngle * mod((simulation.penCoords.y - cfg.centerY) / radius);
        //angle correction based on non centered obj position
        yAngle *= (simulation.penCoords.x - cfg.centerX - simulation.penInitialParams.positionX)
            / (simulation.penCoords.x - cfg.centerX);
        xAngle *= (simulation.penCoords.y - cfg.centerY + simulation.penInitialParams.positionY)
            / (simulation.penCoords.y - cfg.centerY);
            
        if (!Number.isNaN(yAngle))
            penObj.rotation.y = -yAngle;
        if (!Number.isNaN(xAngle))
            penObj.rotation.x = xAngle;
    }
    function trainingStage(movementX, movementY) {
        if ((Math.abs(movementX) > 100 || Math.abs(movementY) > 100)) return;
        //запрет перескакивать
        if ((Math.abs(movementX) > 10 || Math.abs(movementY) > 10) &&
            (simulation.penCoords.x < 460 && simulation.penCoords.x > 300 &&
                simulation.penCoords.y > 30 && simulation.penCoords.y < 150)) return;
        //change index of the pattern data
        if (simulation.penCoords.x < 250 || simulation.penCoords.y > 350) {
            simulation.changeIndex = true;
        }
        if (simulation.penCoords.x > 370 && simulation.penCoords.x < 400 &&
            simulation.penCoords.y < 120 && simulation.penCoords.y > 55 && simulation.changeIndex) {
            simulation.changeIndex = false;
            simulation.dataIndex = simulation.dataIndex == 0 ? 1 : 0;
        }

        let newPenCoordX = simulation.penCoords.x + movementX;
        let newPenCoordY = simulation.penCoords.y + movementY;
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[simulation.dataIndex][k] == 1) 
            movePen(newPenCoordX, newPenCoordY, cfg.R);      
        else {
            k = (newPenCoordX + cfg.width * (newPenCoordY + 3));
            if (patternData[simulation.dataIndex][k] == 1) 
                movePen(newPenCoordX, newPenCoordY + 3, cfg.R);
            else {
                k = (newPenCoordX + cfg.width * (newPenCoordY - 3));
                if (patternData[simulation.dataIndex][k] == 1) 
                    movePen(newPenCoordX, newPenCoordY - 3, cfg.R);
                else {
                    k = (newPenCoordX + cfg.width * (newPenCoordY + 8));
                    if (patternData[simulation.dataIndex][k] == 1) 
                        movePen(newPenCoordX, newPenCoordY + 8, cfg.R);
                }
                }
            }
    }
    function practiceStage(movementX, movementY) {
        let newPenCoordX = simulation.penCoords.x + movementX;
        let newPenCoordY = simulation.penCoords.y + movementY;
        movePen(newPenCoordX, newPenCoordY, cfg.R);
        //draw line 
        let lineX = 280.0 * (simulation.penCoords.x - 0.5 * cfg.width) / (0.5 * cfg.width);
        let lineY = -150.0 * (simulation.penCoords.y - 0.5 * cfg.height) / (0.5 * cfg.height);
        trajectoryPoints.push(new THREE.Vector3(lineX, lineY, 600));
        trajectoryPoints2.push(new THREE.Vector3(lineX, lineY + 0.5, 600));
        trajectoryPoints3.push(new THREE.Vector3(lineX, lineY - 0.5, 600));
        trajectoryPoints4.push(new THREE.Vector3(lineX - 0.5, lineY, 600));
        trajectoryPointsTime.push(new Date);
    }
    function examStage(movementX, movementY) {
        let inputText = document.getElementById('examText');

        if (movementX > 5 || movementY > 5) {
            simulation.exam.notQuick = false;
            inputText.value = "Слишком быстро";
        };
        
        let time = new Date;

        if (time - simulation.exam.lastMovementTime > 1000) {
            simulation.exam.nonStop = false;
            inputText.value = "Запрещены остановки";
        } else simulation.exam.lastMovementTime = new Date();

        let newPenCoordX = simulation.penCoords.x + movementX;
        let newPenCoordY = simulation.penCoords.y + movementY;
        movePen(newPenCoordX, newPenCoordY, cfg.R);
        
        if (simulation.exam.inline && simulation.exam.rightPath &&
            simulation.exam.nonStop && simulation.exam.notQuick)
            inputText.value = "Верных движений: " + simulation.exam.count;
        else return;
            
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[2][k] == 0) {
            simulation.exam.inline = false;
            inputText.value = "Выход за пределы";
        }
        //path
        let allPoint = true;
        for (let i = 1; i < simulation.checkpoint.coordsX.length; i++){
            if (Math.abs(newPenCoordX - simulation.checkpoint.coordsX[i]) < simulation.exam.pointsEps &&
                Math.abs(newPenCoordY - simulation.checkpoint.coordsY[i]) < simulation.exam.pointsEps &&
                !simulation.checkpoint.passPoints[i]) {
                simulation.checkpoint.passPoints[i] = true;
                simulation.exam.path += i;
            }//if
            if (!simulation.checkpoint.passPoints[i])
                allPoint = false;
        }
        //count
        if (Math.abs(newPenCoordX - simulation.checkpoint.coordsX[0]) < simulation.exam.pointsEps &&
            Math.abs(newPenCoordY - simulation.checkpoint.coordsY[0]) < simulation.exam.pointsEps &&
            allPoint) {
            if (
                simulation.exam.path == simulation.checkpoint.passExam[0] ||
                simulation.exam.path == simulation.checkpoint.passExam[1] ||
                simulation.exam.path == simulation.checkpoint.passExam[2] ||
                simulation.exam.path == simulation.checkpoint.passExam[3]
            ) {
                simulation.exam.count += 1;
                simulation.exam.path = '';
                for (let i = 0; i < 8; i++)
                    simulation.checkpoint.passPoints[i] = false;
                document.getElementById('examText').value = "Верных движений: " + simulation.exam.count;
            } else {
                simulation.exam.rightPath = false;
                document.getElementById('examText').value = "Траектория не верная";
            }            
        }//if 
        //pass
        if (simulation.exam.count == simulation.exam.maxCount &&
            simulation.exam.inline && simulation.exam.rightPath &&
            simulation.exam.nonStop && simulation.exam.notQuick) {
            document.getElementById('examText').value = "Экзамен сдан";
            }
    }//exam function
    function trainingStageTouch(x, y) {
        //запрет перескакивать

        //change index of the pattern data
        if (simulation.penCoords.x < 250 || simulation.penCoords.y > 350) {
            simulation.changeIndex = true;
        }
        if (simulation.penCoords.x > 370 && simulation.penCoords.x < 400 &&
            simulation.penCoords.y < 120 && simulation.penCoords.y > 55 && simulation.changeIndex) {
            simulation.changeIndex = false;
            simulation.dataIndex = simulation.dataIndex == 0 ? 1 : 0;
        }

        let newPenCoordX = x;
        let newPenCoordY = y;
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[simulation.dataIndex][k] == 1) 
            movePen(newPenCoordX, newPenCoordY, cfg.R);      
        else {
            k = (newPenCoordX + cfg.width * (newPenCoordY + 3));
            if (patternData[simulation.dataIndex][k] == 1) 
                movePen(newPenCoordX, newPenCoordY + 3, cfg.R);
            else {
                k = (newPenCoordX + cfg.width * (newPenCoordY - 3));
                if (patternData[simulation.dataIndex][k] == 1) 
                    movePen(newPenCoordX, newPenCoordY - 3, cfg.R);
                else {
                    k = (newPenCoordX + cfg.width * (newPenCoordY + 8));
                    if (patternData[simulation.dataIndex][k] == 1) 
                        movePen(newPenCoordX, newPenCoordY + 8, cfg.R);
                }
                }
            }
    }
    function practiceStageTouch(x, y) {
        let newPenCoordX = x;
        let newPenCoordY = y;
        movePen(newPenCoordX, newPenCoordY, cfg.R);
        //draw line 
        let lineX = 280.0 * (simulation.penCoords.x - 0.5 * cfg.width) / (0.5 * cfg.width);
        let lineY = -150.0 * (simulation.penCoords.y - 0.5 * cfg.height) / (0.5 * cfg.height);
        trajectoryPoints.push(new THREE.Vector3(lineX, lineY, 600));
        trajectoryPoints2.push(new THREE.Vector3(lineX, lineY + 0.5, 600));
        trajectoryPoints3.push(new THREE.Vector3(lineX, lineY - 0.5, 600));
        trajectoryPoints4.push(new THREE.Vector3(lineX - 0.5, lineY, 600));
        trajectoryPointsTime.push(new Date);
    }
    function examStageTouch(x, y) {
        let inputText = document.getElementById('examText');
        /*
        if (movementX > 5 || movementY > 5) {
            simulation.exam.notQuick = false;
            inputText.value = "Слишком быстро";
        };*/
        
        let time = new Date;

        if (time - simulation.exam.lastMovementTime > 1000) {
            simulation.exam.nonStop = false;
            inputText.value = "Запрещены остановки";
        } else simulation.exam.lastMovementTime = new Date();

        let newPenCoordX = x;
        let newPenCoordY = y;
        movePen(newPenCoordX, newPenCoordY, cfg.R);
        
        if (simulation.exam.inline && simulation.exam.rightPath &&
            simulation.exam.nonStop && simulation.exam.notQuick)
            inputText.value = "Верных движений: " + simulation.exam.count;
        else return;
            
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[2][k] == 0) {
            simulation.exam.inline = false;
            inputText.value = "Выход за пределы";
        }
        //path
        let allPoint = true;
        for (let i = 1; i < simulation.checkpoint.coordsX.length; i++){
            if (Math.abs(newPenCoordX - simulation.checkpoint.coordsX[i]) < simulation.exam.pointsEps &&
                Math.abs(newPenCoordY - simulation.checkpoint.coordsY[i]) < simulation.exam.pointsEps &&
                !simulation.checkpoint.passPoints[i]) {
                simulation.checkpoint.passPoints[i] = true;
                simulation.exam.path += i;
            }//if
            if (!simulation.checkpoint.passPoints[i])
                allPoint = false;
        }
        //count
        if (Math.abs(newPenCoordX - simulation.checkpoint.coordsX[0]) < simulation.exam.pointsEps &&
            Math.abs(newPenCoordY - simulation.checkpoint.coordsY[0]) < simulation.exam.pointsEps &&
            allPoint) {
            if (
                simulation.exam.path == simulation.checkpoint.passExam[0] ||
                simulation.exam.path == simulation.checkpoint.passExam[1] ||
                simulation.exam.path == simulation.checkpoint.passExam[2] ||
                simulation.exam.path == simulation.checkpoint.passExam[3]
            ) {
                simulation.exam.count += 1;
                simulation.exam.path = '';
                for (let i = 0; i < 8; i++)
                    simulation.checkpoint.passPoints[i] = false;
                document.getElementById('examText').value = "Верных движений: " + simulation.exam.count;
            } else {
                simulation.exam.rightPath = false;
                document.getElementById('examText').value = "Траектория не верная";
            }            
        }//if 
        //pass
        if (simulation.exam.count == simulation.exam.maxCount &&
            simulation.exam.inline && simulation.exam.rightPath &&
            simulation.exam.nonStop && simulation.exam.notQuick) {
            document.getElementById('examText').value = "Экзамен сдан";
            }
    }//exam function
}//onload