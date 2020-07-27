// getting video media element
const webcam = document.getElementById('webcam-feed');

async function openWebcam(constraints){
    var stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = stream;
    } catch(err) {
        console.error('Error during opening webcam: ' + err);
    }
}

// create a publisher to communicate when the webcam is ready
webcam.addEventListener(
    'play',
    function (){
        console.log('Webcam feed is now open');
    }
)