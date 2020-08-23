// creating global variables to store
// the video element and canvas for overlay
var videoInput = null;
var faceDetectorCanvas = null;
var canvasDisplaySize = null;

// setting the parameters for the webcam
const webcamConstraints = {
    audio: false,
    video: {width: 320, height:240}
}

// creating a subscriber to intercept
// the message sent when the webcam is
// open and ready to stream
let subwebcam = manager.subscribe(
    'webcam_opened',
    function (message){
        // we save the video element in
        // the global variable videoInput
        videoInput = message.videoInput;

        // we create a canvas as overlay of the video element
        faceDetectorCanvas = faceapi.createCanvasFromMedia(videoInput);
        let videoFrame = document.getElementById('video-frame');
        videoFrame.append(faceDetectorCanvas);

        // we set some properties to make sure that
        // the canvas and the video elements
        // are perfectly overlapping
        faceDetectorCanvas.style.position = 'absolute';
        faceDetectorCanvas.style.top = 0;
        faceDetectorCanvas.style.left = 0;

        canvasDisplaySize = {width: videoInput.width, height: videoInput.height};
        faceapi.matchDimensions(faceDetectorCanvas, canvasDisplaySize);

        // this subscriber will run a detection
        // everytime a new message is sent
        // for the topic 'detect_face'
        manager.subscribe(
            'detect_face', 
            (msg) => detectFace(new faceapi.TinyFaceDetectorOptions())
        );
        
        // this subscriber will draw the bounding
        // boxes each time that a new message
        // is sent for the topic 'face_detection_complete'
        manager.subscribe(
            'face_detection_complete',
            manageFaceDetection
        );
        
        // let's start the face detection with
        // a first message on the topic
        // 'detect_face'
        //manager.publish('detect_face', {});
    }
)

// preload the model for the machine learning
// model and open the webcam once loaded
Promise.all([
    console.log('Going to load the model'),
    faceapi.nets.tinyFaceDetector.loadFromUri('models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models'),
    faceapi.nets.ageGenderNet.loadFromUri('models'), 
    console.log('Model loaded')
]).then(
    openWebcam(webcamConstraints)
);

// function to draw the bounding boxes
// for the detected faces
function manageFaceDetection(detectionMsg){
    // getting the detections from the message
    let detections = detectionMsg.detections;

    // resize the bounding boxes of the detected faces
    // accordingly to the size of the canvas
    let resizedDetections = faceapi.resizeResults(detections, canvasDisplaySize);
    
    // cleaning the canvas from previous bounding boxes
    faceDetectorCanvas.getContext('2d').clearRect(0, 0, faceDetectorCanvas.width, faceDetectorCanvas.height);
    
    // draw the new bounding boxes
    faceapi.draw.drawDetections(faceDetectorCanvas, resizedDetections);

    // publish a new empty message for the
    // 'detect_face' topic, so that a new detection
    // can be done
    manager.publish('detect_face', {});
}


// function to detect the faces
function detectFace(options){
    // storing the current timestamp
    // at the beginning of the detection
    let startTimestamp = Date.now();

    // detect the faces with faceapi
    // !! this call is a Promise !!
    // this means that it does not return
    // the detections, but a Promise object that
    // can be then used to check when the
    // detection algorithm has completed
    // and get the detected faces
    faceapi.detectAllFaces(
        videoInput,
        options
    ).then(
        // this is invoke once the Promise
        // created by detectAllFaces
        // terminate with success
        function (detections){
            // we save the timestamp now
            // after the end of the detection
            let endTimestamp = Date.now();

            // we compute the time difference in seconds
            let timeElapsed = (endTimestamp - startTimestamp)/1000;

            // we log the elapsed time
            console.log('Detection took ' + timeElapsed + ' seconds');
            
            
            // finally we publish a message
            // for the topic 'face_detection_complete'
            // and pass the detections as the message
            manager.publish(
                'face_detection_complete',
                {detections: detections}
            );
        }
    ).catch(
        // this is executed only if the
        // Promise created by detectAllFaces
        // has some error
        function (err){
            console.error('Error during face detection: ' + err);
        }
    )
}




