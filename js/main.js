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
        modelsPath: './assets/models/'
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
        penInitialParams : {
            penSize: 49,
            angleX: - (25.0) * Math.PI / 180.0,
            angleY: 0.0,
            angleZ: 0.0,
            positionX: 6,
            positionY: -40,
            positionZ: 0
        },
        penTopCoord: {
            x: 431,
            y: 75,
            accuracy: 15
        },
        maxPenAngle: (26.0) * Math.PI / 180.0,
        maxPixelPenRadius: 200,
        exam : {
            count: 0,
            maxCount: 5,
            inline: true,
            pointsEps: 30,
            path: '',
            rightPath: true,
            lastMovementTime: 0,
            nonStop: true,
            failTime: 0,
            waitReloadTime: 1000,
            failColor: 0xff3300,
            passColor: 0x00ff00,
            passed: false
        },
        checkpoint: {
            coordsX: [430, 610, 430, 245, 500, 360, 360, 500],
            coordsY: [80, 90, 240, 90, 320, 320, 140, 140],
            passPoints: [false, false, false, false, false, false, false, false],
            passExam: ['1237456', '7456123', '3216547', '6547321']
        },
        trainingCheckPoints: {
            changePoint: { x: 430, y: 80 },
            firstChange: { x: 430, y: 240},
            secondChange: { x: 430, y: 375 },
            accuracy: 10
        },
        trajectoryVisibilityTime: 5000,
        examMaxStopTime: 1000
    }

    //data 850x450 of 0 and 1. where 0 - no path in coord, 1 - has path 
    // [0] and [1] for training mode, [2] - full path for exam mode
    let patternData = []; 
    patternData.push(); patternData.push(); patternData.push();
    patternData[0] = []; patternData[1] = []; patternData[2] = [];
    getDataFromImages();

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
    patternPlaneMesh.scale.set(1.55, 1.6, 1.6);
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
            object.scale.set(simulation.penInitialParams.penSize,
                simulation.penInitialParams.penSize, simulation.penInitialParams.penSize);
            object.position.set(0, 0, 0);
            object.rotation.set(Math.PI / 2.0, 10, 0);
            penObj.add(object);
            scene.add(penObj);
        });
    });
    startPenObject();

    //trajectory line for practice stage
    let trajectoryMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff });
    //4 arays for line width
    let trajectoryPoints = [],
        trajectoryPointsTime = [], //time when the point was draw
        trajectoryPoints2 = [],
        trajectoryPoints3 = [],
        trajectoryPoints4 = [];
    let trajectoryGeometry, trajectoryGeometry2, trajectoryGeometry3, trajectoryGeometry4;
    let lineObject, lineObject2, lineObject3, lineObject4;

    //-----------------main render loop-------------------------
    function loop() {
        if (simulation.stages.practice) {                   
            let time = new Date;
            if (time - trajectoryPointsTime[0] > simulation.trajectoryVisibilityTime
                && trajectoryPoints.length > 0) {
                trajectoryPoints.shift(); trajectoryPointsTime.shift();
                trajectoryPoints2.shift();  trajectoryPoints3.shift();  trajectoryPoints4.shift();
            }
            scene.remove(lineObject); scene.remove(lineObject2)
            scene.remove(lineObject3); scene.remove(lineObject4)
            trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
            trajectoryGeometry2 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints2);
            trajectoryGeometry3 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints3);
            trajectoryGeometry4 = new THREE.BufferGeometry().setFromPoints(trajectoryPoints4);
            lineObject = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
            lineObject2 = new THREE.Line(trajectoryGeometry2, trajectoryMaterial);
            lineObject3 = new THREE.Line(trajectoryGeometry3, trajectoryMaterial);
            lineObject4 = new THREE.Line(trajectoryGeometry4, trajectoryMaterial);
            scene.add(lineObject); scene.add(lineObject2);
            scene.add(lineObject3); scene.add(lineObject4);
        }
        if (simulation.stages.exam) {
            //check exam in process or fail
            if (!(simulation.exam.inline && simulation.exam.rightPath &&
                simulation.exam.nonStop)) {
                let time = new Date;
                if (time - simulation.exam.failTime > simulation.exam.waitReloadTime) {
                    mouse_down_handler();
                };
            };
        }
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    };
    loop();
        
    //---------------mouse, touch, lock change events------------------
    canvas.addEventListener("mousedown",    mouse_down_handler);
    canvas.addEventListener("mousemove",    mouse_move_handler);
    
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
            scene.remove(light);
            light = new THREE.AmbientLight(0xffffff);
            scene.add(light);
            simulation.exam.passed = false;
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
            if (simulation.stages.exam) {
                simulation.exam.count = 0;
                simulation.exam.inline = true;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.path = '';
                for (let i = 0; i < simulation.checkpoint.passPoints.length; i++)
                    simulation.checkpoint.passPoints[i] = false;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.failTime = 0;
                //light
                if (!simulation.exam.passed) {
                    scene.remove(light);
                    light = new THREE.AmbientLight(0xffffff);
                    scene.add(light);    
                }    
            }        
        }
    }
    function mouse_move_handler(e) {        
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

        let newPenCoordX = simulation.penCoords.x + movementX;
        let newPenCoordY = simulation.penCoords.y + movementY;
        //training mode
        if (simulation.stages.training) {
            if ((Math.abs(movementX) > 50 || Math.abs(movementY) > 50)) return;            
            trainingStage(newPenCoordX, newPenCoordY);
        };//if (stages.training)
        if (simulation.stages.practice) {
            practiceStage(newPenCoordX, newPenCoordY);
        }//if (stages.practice) 
        if (simulation.stages.exam) {
            examStage(newPenCoordX, newPenCoordY);
        }
    }
    function lockChange() {
        if(document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas) {
            //console.log('The pointer lock status is now locked');
            if (simulation.stages.exam) {
                simulation.exam.count = 0;
                simulation.exam.inline = true;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.path = '';
                for (let i = 0; i < simulation.checkpoint.passPoints.length; i++)
                    simulation.checkpoint.passPoints[i] = false;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.lastMovementTime = new Date();
                simulation.exam.failTime = 0;
            }
        } else {
            //console.log('The pointer lock status is now unlocked');
            simulation.mouse.isDown = false;
            startPenObject();
            simulation.dataIndex = 0;
            trajectoryPoints.length = 0;
            trajectoryPoints2.length = 0;
            trajectoryPoints3.length = 0;
            trajectoryPoints4.length = 0;
            trajectoryPointsTime.length = 0;
            if (simulation.stages.exam) {
                if (document.getElementById('examText').value != "Exam passed!")
                    document.getElementById('examText').value = "Start Exam";
            }
        }
    }

    function touch_start_handler(e) {
        let eps = simulation.penTopCoord.accuracy,  //pixel gap to get the pen by its end
            getPenX = simulation.penTopCoord.x,     //coords of pen`s end
            getPenY = simulation.penTopCoord.y;
        simulation.penCoords.x = getPenX;
        simulation.penCoords.y = getPenY;
        let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
        let touch = evt.touches[0] || evt.changedTouches[0];

        if (Math.abs(touch.pageX - getPenX) < eps && Math.abs(touch.pageY - getPenY) < eps) {
            simulation.mouse.isDown = true;            
            //simulation.mouse.startX = touch.pageX;
            //simulation.mouse.startY = touch.pageY;
        }
        if (simulation.stages.exam) {
                simulation.exam.count = 0;
                simulation.exam.inline = true;
                simulation.exam.path = '';
                for (let i = 0; i < simulation.checkpoint.passPoints.length; i++)
                    simulation.checkpoint.passPoints[i] = false;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.lastMovementTime = new Date();
        }
        if (simulation.stages.exam) {
            scene.remove(light);
            light = new THREE.AmbientLight(0xffffff);
            scene.add(light);
            simulation.exam.passed = false;
            simulation.exam.count = 0;
            simulation.exam.inline = true;
            simulation.exam.rightPath = true;
            simulation.exam.nonStop = true;
            simulation.exam.path = '';
            for (let i = 0; i < simulation.checkpoint.passPoints.length; i++)
                simulation.checkpoint.passPoints[i] = false;
            simulation.exam.rightPath = true;
            simulation.exam.nonStop = true;
            simulation.exam.lastMovementTime = new Date();
            simulation.exam.failTime = 0;
        }
    }
    function touch_move_handler(e) {
        e.preventDefault();
        if (!simulation.mouse.isDown) return;        
        
        //simulation.mouse.endX = simulation.mouse.startX;
        //simulation.mouse.endY = simulation.mouse.startY;
        
        let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
        let touch = evt.touches[0] || evt.changedTouches[0];

        //simulation.mouse.startX = touch.pageX;
        //simulation.mouse.startY = touch.pageY;

        let newPosX = touch.pageX;
        let newPosY = touch.pageY;
        
        //training mode
        if (simulation.stages.training) {
            trainingStage(newPosX, newPosY);
        };//if (stages.training)
        if (simulation.stages.practice) {
            practiceStage(newPosX, newPosY);
        }//if (stages.practice) 
        if (simulation.stages.exam) {
            examStage(newPosX, newPosY);
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
        if (simulation.stages.exam) {
            if (document.getElementById('examText').value != "Exam passed!")
                document.getElementById('examText').value = "Start exam";
                simulation.exam.count = 0;
                simulation.exam.inline = true;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.path = '';
                for (let i = 0; i < simulation.checkpoint.passPoints.length; i++)
                    simulation.checkpoint.passPoints[i] = false;
                simulation.exam.rightPath = true;
                simulation.exam.nonStop = true;
                simulation.exam.failTime = 0;
                //light
                if (!simulation.exam.passed) {
                    scene.remove(light);
                    light = new THREE.AmbientLight(0xffffff);
                    scene.add(light);    
                }    
        }
    }       

    let stageBtn = document.getElementById('stageBtn');
    stageBtn.addEventListener('click', () => {
        if (simulation.stages.training) {
            simulation.stages.training = false;
            simulation.stages.practice = true;
            simulation.stages.exam = false;
            stageBtn.value = "Start Exam";
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
                //inputText.value = "Start Exam";
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
        let yAngle = simulation.maxPenAngle * mod((cfg.centerX - simulation.penCoords.x) / radius);
        let xAngle = simulation.maxPenAngle * mod((simulation.penCoords.y - cfg.centerY) / radius);
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
    function trainingStage(newPenCoordX, newPenCoordY) {
        //change index of the pattern data
        let eps = simulation.trainingCheckPoints.accuracy; 
        if ((Math.abs(newPenCoordX - simulation.trainingCheckPoints.firstChange.x) < eps &&
            Math.abs(newPenCoordY - simulation.trainingCheckPoints.firstChange.y) < 3.0 * eps) ||
            (Math.abs(newPenCoordX - simulation.trainingCheckPoints.secondChange.x) < eps &&
                Math.abs(newPenCoordY - simulation.trainingCheckPoints.secondChange.y) < 3.0 * eps)) {
            
                let sign = Math.sign(simulation.trainingCheckPoints.firstChange.x - simulation.penCoords.x);
                newPenCoordX += sign * 2.0 * eps;
                simulation.dataIndex = simulation.dataIndex == 0 ? 1 : 0;
                movePen(newPenCoordX, newPenCoordY, simulation.maxPixelPenRadius);
                return;
            }
        
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[simulation.dataIndex][k] == 1) 
            movePen(newPenCoordX, newPenCoordY, simulation.maxPixelPenRadius);      
        else {
            k = (newPenCoordX + cfg.width * (newPenCoordY + 3));
            if (patternData[simulation.dataIndex][k] == 1) 
                movePen(newPenCoordX, newPenCoordY + 3, simulation.maxPixelPenRadius);
            else {
                k = (newPenCoordX + cfg.width * (newPenCoordY - 3));
                if (patternData[simulation.dataIndex][k] == 1) 
                    movePen(newPenCoordX, newPenCoordY - 3, simulation.maxPixelPenRadius);
                else {
                    k = (newPenCoordX + cfg.width * (newPenCoordY + 8));
                    if (patternData[simulation.dataIndex][k] == 1) 
                        movePen(newPenCoordX, newPenCoordY + 7, simulation.maxPixelPenRadius);
                    else {
                        k = (newPenCoordX + cfg.width * (newPenCoordY - 8));
                        if (patternData[simulation.dataIndex][k] == 1) 
                            movePen(newPenCoordX, newPenCoordY - 7, simulation.maxPixelPenRadius);
                        else {
                            k = ((newPenCoordX + 10) + cfg.width * newPenCoordY);
                            if (patternData[simulation.dataIndex][k] == 1) 
                                movePen((newPenCoordX + 10), newPenCoordY, simulation.maxPixelPenRadius);
                            }
                        } 
                    }
                }
            }
    }
    function practiceStage(newPenCoordX, newPenCoordY) {
        movePen(newPenCoordX, newPenCoordY, simulation.maxPixelPenRadius);
        //draw line 
        let lineX = 280.0 * (simulation.penCoords.x - 0.5 * cfg.width) / (0.5 * cfg.width);
        let lineY = -150.0 * (simulation.penCoords.y - 0.5 * cfg.height) / (0.5 * cfg.height);
        trajectoryPoints.push(new THREE.Vector3(lineX, lineY, 600));
        trajectoryPoints2.push(new THREE.Vector3(lineX, lineY + 0.5, 600));
        trajectoryPoints3.push(new THREE.Vector3(lineX, lineY - 0.5, 600));
        trajectoryPoints4.push(new THREE.Vector3(lineX - 0.5, lineY, 600));
        trajectoryPointsTime.push(new Date);
    }
    function examStage(newPenCoordX, newPenCoordY) {
        let inputText = document.getElementById('examText');
        //current time
        let time = new Date;        
        //move
        movePen(newPenCoordX, newPenCoordY, simulation.maxPixelPenRadius);

        if (simulation.exam.passed)
            return;

        //check exam in process or fail
        if (simulation.exam.inline && simulation.exam.rightPath &&
            simulation.exam.nonStop)
            inputText.value = "Round comleted " + simulation.exam.count + '/' + simulation.exam.maxCount;
        else {
            if (time - simulation.exam.failTime > simulation.exam.waitReloadTime) {                
                mouse_down_handler();
            }
            return;
        };
      
        //non stop
        if (time - simulation.exam.lastMovementTime > simulation.examMaxStopTime) {
            simulation.exam.nonStop = false;
            simulation.exam.failTime = new Date;
            inputText.value = "No stops allowed";
            //red light
            scene.remove(light);
            light = new THREE.AmbientLight(simulation.exam.failColor);
            scene.add(light);
        } else simulation.exam.lastMovementTime = new Date();
            
        //if exam in process
        let k = (newPenCoordX + cfg.width * newPenCoordY); //index in data
        if (patternData[2][k] == 0) {
            simulation.exam.inline = false;
            simulation.exam.failTime = new Date;
            inputText.value = "Wrong Trajectory";
            //red light
            scene.remove(light);
            light = new THREE.AmbientLight(simulation.exam.failColor);
            scene.add(light);
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
                document.getElementById('examText').value = "Round comleted " + simulation.exam.count + '/' + simulation.exam.maxCount;
            } else {
                simulation.exam.rightPath = false;
                simulation.exam.failTime = new Date;
                document.getElementById('examText').value = "Wrong Trajectory";
                //red light
                scene.remove(light);
                light = new THREE.AmbientLight(simulation.exam.failColor);
                scene.add(light);
            }            
        }//if 
        //pass
        if (simulation.exam.count == simulation.exam.maxCount &&
            simulation.exam.inline && simulation.exam.rightPath &&
            simulation.exam.nonStop) {
            document.getElementById('examText').value = "Exam passed!";
            //green light
            scene.remove(light);
            light = new THREE.AmbientLight(simulation.exam.passColor);
            scene.add(light);
            simulation.exam.passed = true;
            //mouse_down_handler();
            }
    }//exam function
    function getDataFromImages() {
        //to get patternData[0] for training mode
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

        //to get patternData[1] for training mode
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
        //to get patternData[2] for exam mode
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
    }
    //set pen to initial state func
    function startPenObject() {
        penObj.rotation.x = simulation.penInitialParams.angleX;
        penObj.rotation.y = simulation.penInitialParams.angleY;
        penObj.rotation.z = simulation.penInitialParams.angleZ;
        penObj.position.x = simulation.penInitialParams.positionX;
        penObj.position.y = simulation.penInitialParams.positionY;
        penObj.position.z = simulation.penInitialParams.positionZ;        
    }; 
}//onload