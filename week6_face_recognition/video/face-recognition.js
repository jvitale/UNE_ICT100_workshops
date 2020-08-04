var faceDescriptors = [];

// function to extract the identity features
// and store them with the user name
async function storeUserIdentity(name){
    let detections = [];
    let attempts = 0;
    while (detections.length == 0 && attempts < 3){
        detections = await faceapi.detectAllFaces(
            videoInput, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();
        attempts += 1;
    }
    
    if (detections.length > 0){
        let userFaceDescriptors = new faceapi.LabeledFaceDescriptors(name, [detections[0].descriptor]);
        faceDescriptors.push(userFaceDescriptors);
        return true;
    } else {
        return false;
    }
}

// function to match the face and recognise
// the identity
async function recogniseFace(){
    if (faceDescriptors.length == 0){
        // no faces stored
        // end and return false
        return false;
    }

    let detections = [];
    let attempts = 0;
    while (detections.length == 0 && attempts < 3){
        detections = await faceapi.detectAllFaces(
            videoInput, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();
    }

    if (detections.length > 0){
        let faceMatcher = new faceapi.FaceMatcher(faceDescriptors, 0.6);
        let match = faceMatcher.findBestMatch(detections[0].descriptor);

        if (match.label != 'unknown'){
            return match.label;
        } else {
            return false;
        }
    } else {
        return false;
    }
}