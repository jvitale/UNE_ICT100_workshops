// creating the pub/sub manager object
var manager = new PubSubManager();

// getting all the command buttons
const btn_talk_pico = document.getElementById('talk-to-pico');
const btn_talk_dot = document.getElementById('talk-to-dot');
const btn_text_pico = document.getElementById('text-pico');
const btn_text_dot = document.getElementById('text-dot');

function publish_chat_message(bot_name, msg_content){
    message = {
        to: bot_name,
        content: msg_content
    }
    manager.publish('user_message', message);
}

btn_text_pico.addEventListener(
    'click',
    function () {
        var input_text = document.getElementById('input-text-pico');
        var text = input_text.value;
        if (text.length > 0) {
            input_text.value = '';
            publish_chat_message('pico', text);
        }
    }
);

btn_text_dot.addEventListener(
    'click',
    function () {
        var input_text = document.getElementById('input-text-dot');
        var text = input_text.value;
        if (text.length > 0) {
            input_text.value = '';
            publish_chat_message('dot', text);
        }
    }
);

btn_talk_pico.addEventListener('click', function(){
    listen(function(result){
        publish_chat_message('pico', result);
    })
});

btn_talk_dot.addEventListener('click', function(){
    listen(function(result){
        publish_chat_message('dot', result);
    })
});

function show_text_balloon(bot_name, message){
    var balloon = document.getElementById('text-balloon-' + bot_name);
    balloon.getElementsByClassName('bot-message')[0].textContent = message;
    balloon.style.display = 'block';
}

function hide_text_balloon(bot_name) {
    var balloon = document.getElementById('text-balloon-' + bot_name);
    balloon.getElementsByClassName('bot-message')[0].textContent = '';
    balloon.style.display = 'none';
}

/*
// creating subscribers to topics for pico
var pico_chat_listener = manager.subscribe(
    'user_message',
    function (message) {
        if (message.to == 'pico'){
            var bot_speech = 'I heard: ' + message.content;
            speak(message.to, bot_speech);
        }
    }
);

var pico_speech_event_listener = manager.subscribe(
    'speech_event',
    function(message){
        if (message.bot == 'pico'){
            if (message.eventType == 'start'){
                show_text_balloon(message.bot, message.speech);
            } else {
                hide_text_balloon(message.bot);
            }
        }
    }
)

// creating subscribers to topics for dpt
var dot_chat_listener = manager.subscribe(
    'user_message',
    function (message) {
        if (message.to == 'dot'){
            var bot_speech = 'You said: ' + message.content;
            speak(message.to, bot_speech);
        } else {
            speak('dot', 'Hey, talk to me!');
        }
    }
);

var dot_speech_event_listener = manager.subscribe(
    'speech_event',
    function(message){
        if (message.bot == 'dot'){
            if (message.eventType == 'start'){
                show_text_balloon(message.bot, message.speech);
            } else {
                hide_text_balloon(message.bot);
            }
        }
    }
)
*/

// creating subscribers to topics for bots
var chat_listener = manager.subscribe(
    'user_message',
    function (message) {
        if (message.to == 'pico'){
            var bot_speech = 'I heard: ' + message.content;
        } else {
            var bot_speech = 'You said: ' + message.content;
        }
        speak(message.to, bot_speech);
        if (message.to == 'pico') {
            speak('dot', 'Hey, talk to me!')
        }
    }
);

var speech_event_listener = manager.subscribe(
    'speech_event',
    function(message){
        if (message.eventType == 'start'){
            show_text_balloon(message.bot, message.speech);
        } else {
            hide_text_balloon(message.bot);
        }
    }
)

