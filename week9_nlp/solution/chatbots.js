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
        );
    }
)

btnTalkBit.addEventListener(
    'click',
    function() {
        listen(
            function(result){
                publishChatMessage('bit', result);
            }
        );
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

// function to extract the name from an answer
function retrieveName(sentence){
    let docx = nlp(sentence);
    let people = docx.match('#Person').json();

    if (people.length > 0){
        // we assume that the name of the person
        // is the first match
        return people[0].text;
    } else {
        return '';
    }
}

// function to check if the answer is yes or not
function isAnswerYes(answer){
    let docx = nlp(answer);
    return docx.has('(yes|sure|affermative|correct|definitely|obviously|true)');
}

// function to manage the dialogue to ask
// the name of the user
async function askName(bot, maxAttempts){
    let userName = '';
    let nAttempts = 0;
    while (userName === '' && nAttempts < maxAttempts){
        let promiseListen = new Promise(
            (resolve) => {
                listen((result) => resolve(result));
            }
        ).then((answer) => userName = retrieveName(answer));
        await promiseListen;
        nAttempts += 1;
        if (userName === ''){
            if (nAttempts < maxAttempts){
                await speak(bot, 'Sorry, I cannot get your name. What is your name?');
            } else {
                return '';
            }
        } else {
            await speak(bot, 'Did you say that your name is ' + userName + '?');
            let isCorrect = false;
            let promiseCheck = new Promise(
                (resolve) => {
                    listen((result) => resolve(result));
                }
            ).then((answer) => isCorrect = isAnswerYes(answer));
            await promiseCheck;
            if (isCorrect){
                return userName;
            } else {
                if (nAttempts < maxAttempts){
                    userName = '';
                    await speak(bot, 'Oh ok, let\'s try again. What is your name?');
                } else {
                    return '';
                }
            }
        }
    }
}

// function to execute the behaviour for
// remembering the user's face
async function rememberUserIdentity(msg){
    console.log('call to rememberUserIdentity');

    await speak(msg.bot, 'Ok, I will remember your identity');
    await speak(msg.bot, 'What is your name?');
    let userName = await askName(msg.bot, 3);

    if (userName === ''){
        await speak(msg.bot, 'Sorry but I was not able to get your name');
        return false;
    }
    await speak(msg.bot, 'Nice to meet you ' + userName);
    await speak(msg.bot, 'Please, face the camera and wait');

    // passing also the bot name to store the identity
    // in separate variables
    let outcome = await storeUserIdentity(userName, msg.bot);
    if (outcome === true){
        await speak(msg.bot, 'Done, I stored your identity');
    } else {
        await speak(msg.bot, 'Sorry, I was not able to detect your face');
        return false;
    }
    return true;
}

// function to execute the behaviour of
// recognising the user's identity
async function recogniseUserIdentity(msg){
    console.log('call to recogniseUserIdentity');
    await speak(msg.bot, 'Ok, I will recognise you');
    await speak(msg.bot, 'Please, face the camera and wait');

    // Passing the bot name as parameter to
    // recognise from 2 different variables
    let identity = await recogniseFace(msg.bot);
    if (identity === false){
        await speak(msg.bot, 'Sorry, I am not able to recognise you');
    } else {
        await speak(msg.bot, 'I think you are ' + identity);
    }
}

// function to execute the behaviour of
// recognising the user's gender and age
async function recogniseUserAgeAndGender(msg){
    console.log('call to recogniseUserAgeAndGender');
    await speak(msg.bot, 'Ok, I will recognise your age and gender');
    await speak(msg.bot, 'Please, face the camera and wait');

    let outcome = await recogniseAgeGender();
    if (outcome === false){
        await speak(msg.bot, 'Sorry, I am not able to recognise your age and gender');
    } else {
        await speak(msg.bot, 'I think you are a ' + outcome[1] + ' and about ' + outcome[0] + ' years old');
    }
}

// function to manage the behaviour
// for every command that starts with "Guess my"
async function guessingGame(msg){
    let docx = nlp(msg.content);
    let whatToGuess = docx.match('Guess my [<what>*]').groups('what').text();
    if (whatToGuess !== ''){
        switch(whatToGuess){
            case 'name':
                recogniseUserIdentity(msg);
                break;
            case 'age':
                recogniseUserAgeAndGender(msg);
                break;
            case 'gender':
                recogniseUserAgeAndGender(msg);
                break;
            case 'age and gender':
                recogniseUserAgeAndGender(msg);
                break;
            default:
                await speak(msg.bot, 'Sorry but I cannot guess your ' + whatToGuess);
        }
    }
}

//Exercise (1): function to rhyme the user name
async function rhymeUserName(msg){
    await speak(msg.bot, 'Ok, I will rhyme your name');

    await speak(msg.bot, 'What is your name?');
    let userName = await askName(msg.bot, 3);

    if (userName === ''){
        await speak(msg.bot, 'Sorry but I cannot rhyme your name since I was not able to get your name');
        return false;
    }

    // creating the rhyme
    let x = userName;
    let y;
    if(userName.toLowerCase().match(/^[a|e|i|o|u]/) === null){
        y = userName.substring(1, userName.length); // removing first consonant
    } else {
        y = x;
    }

    let rhyme = `
        ${x} ${x} Bo B${y},
        Bo Nana fhana Foh F${y},
        Fee Fi Moh M${y},
        ${x}!
    `;

    await speak(msg.bot, `Ok ${userName}, here you go`);
    await speak(msg.bot, rhyme);
    return true;
}

// Exercise (2): greet the user
async function greetUser(msg){
    // a list of all possible ways
    // for asking how are you
    let howAreYouList = [
        "how are you",
        "how is it going",
        "how are you going"
    ];

    // trying to look for a how are you pattern in the greeting
    let pattern = new RegExp(`(${howAreYouList.join("|")})`);
    let hasHowAreYou = msg.content.match(pattern) !== null;

    await speak(msg.bot, "Hello!");
    if (hasHowAreYou){
        // answering the how are you part
        await speak(msg.bot, "I'm good");

        
    }

    await speak(msg.bot, "How are you?");

    // listening for user response
    let answer;
    let promiseListen = new Promise(
        (resolve) => {
            listen((result) => resolve(result));
        }
    ).then((out) => answer = out);
    await promiseListen;

    if (answer.match(/(good|great|well|amazing)/) !== null) {
        // if it is a positive answer (i.e. user feeling good)
        await speak(msg.bot, "That's great!");
    } else {
        await speak(msg.bot, "Oh, that's not cool");
    }
    return true;
}

// Added two new commands to recognise the user identity
var botLogic = [
    ["I (love|like) you", manageEmotionalState],
    ["Remember me", rememberUserIdentity],
    ["Recognise me", recogniseUserIdentity],
    ["Who am I", recogniseUserIdentity],
    ["Guess my [<what>*]", guessingGame],
    // Exercise (1): new command for the name game
    ["Rhyme my name", rhymeUserName],
    // Exercise (2): manage greetings
    ["(Hi|Hey|Hello) *", greetUser]
];

// function to select the most
// appropriate behaviour to execute
function behaviourManager(msg){
    for (let behaviour of botLogic){
        let docx = nlp(msg.content);
        if (docx.match(behaviour[0]).length > 0){
            return behaviour[1];
        }
    }

    // if we are here, it means we did not find
    // any match for the command, so it is a general speech
    // return false
    return false;
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
            let jelousSpeech = 'Hey! Talk to me!';
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
                userGreeted = true;
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