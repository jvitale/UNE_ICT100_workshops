// using two keys, one for pico and one for bit
// to store the identities descriptors
// in separate variables
var faceDescriptors = {
    'pico': [],
    'bit': []
}

// function to extract the identity features
// and store them with the user name

async function storeUserIdentity(name, botName){

    // attempting to detect a face three times
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
        let userFaceDescriptors = new faceapi.LabeledFaceDescriptors(
            name, 
            [detections[0].descriptor]
        );

        // storing the descriptors for the current bot
        faceDescriptors[botName].push(userFaceDescriptors);
        return true;
    } else {
        return false;
    }
}

// function to match the face and recognise
// the identity
async function recogniseFace(botName){
    // All over this function instead of
    // using the variable faceDescriptors directly
    // we use faceDescriptors[botName]
    if (faceDescriptors[botName].length == 0){
        // no faces stored
        // end and return false
        return false;
    }

    // attempting to detect a face three times
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
        let faceMatcher = new faceapi.FaceMatcher(faceDescriptors[botName], 0.6);
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

// Function to recognise age and gender
async function recogniseAgeGender(){
    // attempting to detect a face three times
    let detections = [];
    let attempts = 0;
    while (detections.length == 0 && attempts < 3){
        detections = await faceapi.detectAllFaces(
            videoInput, 
            new faceapi.TinyFaceDetectorOptions()
        ).withAgeAndGender();
        attempts += 1;
    }

    if (detections.length > 0){
        let age = parseInt(detections[0].age);
        let gender = detections[0].gender;
        return [age, gender];
    } else {
        return false;
    }
}