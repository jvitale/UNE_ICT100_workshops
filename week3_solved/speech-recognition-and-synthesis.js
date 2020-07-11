var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

var voice_list = speechSynthesis.getVoices(); // this is to prevent Chrome to scramble the voice list order
var speech_recognition = new SpeechRecognition();
var speech_grammar_list = new SpeechGrammarList();
speech_grammar_list.addFromString('#JSGF V1.0;', 1);

speech_recognition.grammars = speech_grammar_list;
speech_recognition.continuous = false;
speech_recognition.lang = 'en-US';
speech_recognition.interimResults = false;
speech_recognition.maxAlternatives = 1;

function listen(callback) {
    speech_recognition.onresult = function(event){
        var result = event.results[0][0].transcript;
        console.log('Heard: ' + result);
        callback(result);
    }
    console.log('Started listening...');
    speech_recognition.start();
}

async function speak(bot_name, sentence) {
    var voice_list = speechSynthesis.getVoices();
    var pico_voice = voice_list[0]
    var dot_voice = voice_list[1]
    var utterance = new SpeechSynthesisUtterance(sentence);
    if (bot_name == 'pico'){
        utterance.voice = pico_voice;
    } else {
        utterance.voice = dot_voice;
    }
    utterance.onstart = function(event) {
        manager.publish('speech_event', {eventType: 'start', bot: bot_name, speech: sentence});
    }
    utterance.onend = function(event) {
        manager.publish('speech_event', {eventType: 'end', bot: bot_name, speech: sentence});
    }
    speechSynthesis.speak(utterance);
}