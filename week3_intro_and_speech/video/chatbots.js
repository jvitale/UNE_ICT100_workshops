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
            showTextBalloon(message.bot, botSpeech);
            speak(message.bot, botSpeech);
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

// creating subscribers for the 'speech_event' topic
const picoSpeechEventListener = manager.subscribe(
    'speech_event',
    function(message){
        if (message.bot == 'pico'){
            if (message.eventType == 'start'){
                showTextBalloon(message.bot, message.speech);
            } else {
                hideTextBalloon(message.bot);
            }
        }
    }
)

const bitSpeechEventListener = manager.subscribe(
    'speech_event',
    function(message){
        if (message.bot == 'bit'){
            if (message.eventType == 'start'){
                showTextBalloon(message.bot, message.speech);
            } else {
                hideTextBalloon(message.bot);
            }
        }
    }
)
