var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

var voiceList = speechSynthesis.getVoices(); // this is to prevent Chrome to scramble the voice list order
var speechRecognitionObj = new SpeechRecognition();

speechRecognitionObj.continuous = false; // making it stop at the end of an utterance
speechRecognitionObj.lang = 'en-US'; // setting the language to English
speechRecognitionObj.interimResults = false; // no interim results
speechRecognitionObj.maxAlternatives = 1; // only one alternative available as result

// function to listen using the speech recognition of the browser
function listen(callback) {
    // setting what to do once we get a result
    speechRecognitionObj.onresult = function(event){
        var result = event.results[0][0].transcript;
        console.log('Heard: ' + result);
        callback(result);
    }

    // opening the mic and start listening
    console.log('Started listening...');
    speechRecognitionObj.start();
}

// function to speak using the speech synthesis of the browser
function speak(botName, sentence) {
    let voiceList = speechSynthesis.getVoices();
    let picoVoice = voiceList[0]
    let bitVoice = voiceList[1]
    let utterance = new SpeechSynthesisUtterance(sentence);
    if (botName == 'pico'){
        utterance.voice = picoVoice;
    } else {
        utterance.voice = bitVoice;
    }

    // to control the speech flow for the balloons
    utterance.onstart = function(event) {
        manager.publish('speech_event', {eventType: 'start', bot: botName, speech: sentence});
    }
    utterance.onend = function(event) {
        manager.publish('speech_event', {eventType: 'end', bot: botName, speech: sentence});
    }
    speechSynthesis.speak(utterance);
}