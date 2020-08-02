// creating an object from the class PubSubManager
const manager = new PubSubManager();

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

// creating subscribers to the 'user_message' topic
const picoChatListener = manager.subscribe(
    'user_message',
    function(message){
        if (message.bot == 'pico'){
            let botSpeech = "I heard: " + message.content;

            // pico checks for the content of the message
            if (message.content.toLowerCase() == 'I love you'.toLowerCase()){
                // pico gets happy
                let emotionMessage = {
                    bot: 'pico',
                    emotionalState: 'happy'
                };

                // before publishing this message, let's wait for
                // Pico's speech to end
                let tempSpeechEventListener = manager.subscribe(
                    'speech_event',
                    function(speechEventMessage){
                        if (speechEventMessage.eventType == 'end' && speechEventMessage.bot == 'pico' && speechEventMessage.speech == botSpeech){
                            manager.publish('emotional_state_changed', emotionMessage);

                            // unsubscribe the temporary speech event subscriber
                            // to avoid future events
                            // (try to comment out the line below and
                            // to say 'I love you' to Pico two times to see what happens)
                            manager.unsubscribe(tempSpeechEventListener);
                        }
                    } 
                );
                
            }

            // execute the speech
            showTextBalloon(message.bot, botSpeech);
            speak(message.bot, botSpeech);
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
            showTextBalloon('bit', jelousSpeech);
            speak('bit', jelousSpeech);
        }
    }
)

const bitChatListener = manager.subscribe(
    'user_message',
    function(message){
        if (message.bot == 'bit'){
            let botSpeech = "You said: " + message.content;
            showTextBalloon(message.bot, botSpeech);
            speak(message.bot, botSpeech);
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

// Exercise: create a new subscriber to face_detection_complete
// checking if there is a new face detection and
// making the robots say hello

// Solution

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
        // Exercise (1)
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
            // Exercise (3): checking the time before disengaging
            // we do not only check if the face is not detected anymore
            // but also the time elapsed from the last detection
            // if it is more than 7 seconds we can be sure that the user
            var timeElapsed = (Date.now() - lastDetectionTimestamp)/1000;
            if (detections.length == 0 && userGreeted && timeElapsed > 7){
                // Exercise (2)
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