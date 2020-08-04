// function to read from the input text boxes
function readInputText(botName, clearInput){
    let inputTextObj = document.getElementById('input-text-' + botName);
    let text = inputTextObj.value;
    if (clearInput == true){
        inputTextObj.value = '';
    }
    return text;
}

// function to publish a chat message
function publishChatMessage(botName, msgContent){
    let message = {
        bot: botName,
        content: msgContent
    };
    manager.publish('user_message', message);
}

// function to show the text balloon
function showTextBalloon(botName, message){
    let balloon = document.getElementById('text-balloon-' + botName);
    balloon.getElementsByClassName('bot-message')[0].textContent = message;
    balloon.style.display = 'block';
}

// function to hide the text balloon
function hideTextBalloon(botName){
    let balloon = document.getElementById('text-balloon-' + botName);
    balloon.getElementsByClassName('bot-message')[0].textContent = '';
    balloon.style.display = 'none';
}

// declaring constants to get access to the buttons controlling
// the chat
const btnTextPico = document.getElementById('text-pico');
const btnTextBit = document.getElementById('text-bit');
const btnTalkPico = document.getElementById('talk-to-pico');
const btnTalkBit = document.getElementById('talk-to-bit');

// adding 'onclick' events to the buttons
btnTextPico.addEventListener(
    'click',
    function() {
        let text = readInputText('pico', true);
        if (text.length > 0){
            publishChatMessage('pico', text);
        }
    }
)

btnTextBit.addEventListener(
    'click',
    function() {
        let text = readInputText('bit', true);
        if (text.length > 0){
            publishChatMessage('bit', text);
        }
    }
)

btnTalkPico.addEventListener(
    'click',
    function() {
        listen(
            function(result){
                publishChatMessage('pico', result);
            }
        )
    }
)

btnTalkBit.addEventListener(
    'click',
    function() {
        listen(
            function(result){
                publishChatMessage('bit', result);
            }
        )
    }
)

// function to change the emotion of the bot
// when getting "I love you"
async function manageEmotionalState(msg){
    console.log('call to manageEmotionalState');
    // pico gets happy
    let emotionMessage = {
        bot: msg.bot,
        emotionalState: 'happy'
    };
    
    let botSpeech = 'I love you too';
    await speak(msg.bot, botSpeech);
    manager.publish('emotional_state_changed', emotionMessage);
}

// function to execute the behaviour for
// remembering the user's face
async function rememberUserIdentity(msg){
    console.log('call to rememberUserIdentity');

    await speak(msg.bot, 'Ok, I will remember your identity');
    await speak(msg.bot, 'What is your name?');
    let userName = '';
    let promiseListen = new Promise(
        (resolve, reject) => {
            listen((result) => resolve(result));
        }
    ).then((name) => userName = name);
    await promiseListen
    await speak(msg.bot, 'Nice to meet you ' + userName);
    await speak(msg.bot, 'Please, face the camera and wait');
    let outcome = await storeUserIdentity(userName);
    if (outcome === true){
        await speak(msg.bot, 'Done, I stored your identity');
    } else {
        await speak(msg.bot, 'Sorry, I was not able to detect your face');
    }
}

// function to execute the behaviour of
// recognising the user's identity
async function recogniseUserIdentity(msg){
    console.log('call to recogniseUserIdentity');
    await speak(msg.bot, 'Ok, I will recognise you');
    await speak(msg.bot, 'Please, face the camera and wait');
    let identity = await recogniseFace();
    if (identity === false){
        await speak(msg.bot, 'Sorry, I am not able to recognise you');
    } else {
        await speak(msg.bot, 'I think you are ' + identity);
    }
}

var botLogic = [
    ["I love you", manageEmotionalState],
    ["Remember me", rememberUserIdentity],
    ["Recognise me", recogniseUserIdentity]
]

// function to select the most
// appropriate behaviour to execute
function behaviourManager(msg){
    for (let behaviour of botLogic){
        if (msg.content.toLowerCase() == behaviour[0].toLowerCase()){
            return behaviour[1];
        }
    }

    // if we are here, it means we did not find
    // any match for the command, so it is a general speech
    // return false
    return false
}

// creating subscribers to the 'user_message' topic
const picoChatListener = manager.subscribe(
    'user_message',
    function(message){
        if (message.bot == 'pico'){
            let behaviour = behaviourManager(message);
            if (behaviour === false){
                // general chat
                let botSpeech = "I heard: " + message.content;
                // execute the speech
                speak(message.bot, botSpeech);
            } else {
                behaviour(message);
            }
        }
    }
)

// creating a subscriber to the topic 'emotional_state_changed'
const bitEmotionalStateListener = manager.subscribe(
    'emotional_state_changed',
    function(message){
        if (message.bot == 'pico' && message.emotionalState == 'happy'){
            // Bit gets jelous
            let jelousSpeech = 'Hey! Talk to me!'
            speak('bit', jelousSpeech);
        }
    }
)

const bitChatListener = manager.subscribe(
    'user_message',
    function(message){
        if (message.bot == 'bit'){
            let behaviour = behaviourManager(message);
            if (behaviour === false){
                // general chat
                let botSpeech = "You said: " + message.content;
                // execute the speech
                speak(message.bot, botSpeech);
            } else {
                behaviour(message);
            }
        }
    }
)

// creating a subscriber for the 'speech_event' topic
const speechEventListener = manager.subscribe(
    'speech_event',
    function(message){
        if (message.eventType == 'start'){
            showTextBalloon(message.bot, message.speech);
        } else {
            hideTextBalloon(message.bot);
        }
    }
)

// Let's set a global variable to know if the
// user was greeted or not
var userGreeted = false;

// we also need another variable to keep
// track of the last detection timestamp
// so we can compute the time between each
// detection
var lastDetectionTimestamp = 0;

// let's create a subscriber to intercept
// the messages on the topic
// 'face_detection_complete'
var engagementListener = manager.subscribe(
    'face_detection_complete',
    function(message){

        // check if there are faces detected
        var detections = message.detections;
        if (detections.length > 0){
            // There is a new detection
            // Let's reset the last detection timestamp
            // to the current time
            lastDetectionTimestamp = Date.now();

            // if it is the first time that we
            // see the user, we greet them
            if (!userGreeted){
                speak('pico', 'Hello there!');
                speak('bit', 'Nice to see you!');
                // and then remember to set
                // the global variable userGreeted to true
                userGreeted = true
            }
        } else {
            // we do not only check if the face is not detected anymore
            // but also the time elapsed from the last detection
            // if it is more than 7 seconds we can be sure that the user
            var timeElapsed = (Date.now() - lastDetectionTimestamp)/1000;
            if (detections.length == 0 && userGreeted && timeElapsed > 7){
                // we already greeted the user but
                // there are no more detections so we
                // say goodbye and disengage
                // by setting userGreeted back to false
                speak('pico', 'Goodbye');
                speak('bit', 'See you later');
                userGreeted = false;
            }
        }
    }
)