let vocab = [];
let filtered = [];
let wrongWords = [];
let currentWord = null;
let currentMethod = null;
let isMuted = false; // default: sound on
let audioFiles = {};


    // CSV import
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        Papa.parse(file, { header: true, complete: function(results) {
            vocab = results.data.filter(row => row.Word && row.Translation);
            document.getElementById('fileSection').style.display = 'none';
            setupSelectors();
        }});
    });

    // Audio folder import
    document.getElementById('audioFolder').addEventListener('change', (e) => {
    const files = e.target.files;
    for (let file of files) {
        // remove file extension, use lowercase for consistency
        const word = file.name.split('.')[0].toLowerCase();
        audioFiles[word] = file;
    }
    console.log("Loaded audio files:", Object.keys(audioFiles));
    // hide folder section and show the rest of your selectors
    document.getElementById('audioFolderSection').style.display = 'none';
    setupSelectors(); // continue your existing setup
    });


    // Dropdown setup
    function setupSelectors() {
        const topicSelect = document.getElementById('topicSelect');
        const topics = [...new Set(vocab.map(w => w.Topic).filter(Boolean))];
        topics.forEach(t => { let opt = document.createElement('option'); opt.value = t; opt.textContent = t; topicSelect.appendChild(opt); });
        topicSelect.onchange = fillSubtopics;
        fillSubtopics();
        document.getElementById('selector').style.display = 'block';
    }

    function fillSubtopics() {
        const topic = document.getElementById('topicSelect').value;
        const subtopicSelect = document.getElementById('subtopicSelect');
        subtopicSelect.innerHTML = '';
        const subs = [...new Set(vocab.filter(w => w.Topic===topic).map(w => w.Subtopic).filter(Boolean))];
        subs.forEach(s => { let opt = document.createElement('option'); opt.value=s; opt.textContent=s; subtopicSelect.appendChild(opt); });
    }

    // Method selection
    function chooseMethod(method) {
        currentMethod = method;
    }

    // Toggle mute function
    function toggleMute() {
        isMuted = !isMuted;
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }

    // Play audio function
    function playAudioForWord(word) {
        if (isMuted || !word) return;
        const file = audioFiles[word.toLowerCase()];
        if (!file) return;
        const audio = new Audio(URL.createObjectURL(file));
        audio.play();
    }

    
    // Start learning
    function startLearning() {
        if(!currentMethod){ alert("Select a method."); return; }
        const topic = document.getElementById('topicSelect').value;
        const subtopic = document.getElementById('subtopicSelect').value;
        filtered = vocab.filter(w => w.Topic===topic && w.Subtopic===subtopic);
        if(filtered.length < 1){ alert("No words available for this selection."); return; }
        document.getElementById('selector').style.display='none';
        document.getElementById('app').style.display='block';
        if(currentMethod==='translation') nextQuestion();
        if(currentMethod==='reverse') nextReverse();
        if(currentMethod==='spelling') nextSpellingQuestion();
        if(currentMethod==='matching') nextMatchingQuestion();
    }

    // Shuffle helper
    function shuffle(a){ return a.sort(()=>Math.random()-0.5); }

    // Translation Quiz
    function nextQuestion(){
        document.getElementById("result").textContent='';
        currentWord = (wrongWords.length>0 && Math.random()<0.5)? wrongWords[Math.floor(Math.random()*wrongWords.length)] : filtered[Math.floor(Math.random()*filtered.length)];
        document.getElementById("question").textContent = `Translate: "${currentWord.Word}"`;
        // 🔊 play audio when the word shows
        playAudioForWord(currentWord.Word);
        let options = [currentWord.Translation];
        while(options.length<3){ let o=filtered[Math.floor(Math.random()*filtered.length)].Translation; if(!options.includes(o)) options.push(o);}
        options = shuffle(options);
        const div = document.getElementById("options"); div.innerHTML='';
        options.forEach(opt => { let btn=document.createElement("button"); btn.textContent=opt; btn.className="button"; btn.onclick=()=>checkAnswer(opt); div.appendChild(btn); });
    }

    function checkAnswer(ans){
        const res = document.getElementById("result");
        if(ans===currentWord.Translation){ res.textContent="Correct!"; wrongWords=wrongWords.filter(w=>w.Word!==currentWord.Word); }
        else{ res.textContent=`Wrong! Correct: ${currentWord.Translation}`; if(!wrongWords.includes(currentWord)) wrongWords.push(currentWord);}
        setTimeout(nextQuestion,3000);
    }

    // Reverse Translation
    function nextReverse(){
        document.getElementById("result").textContent='';
        currentWord = (wrongWords.length>0 && Math.random()<0.5)? wrongWords[Math.floor(Math.random()*wrongWords.length)] : filtered[Math.floor(Math.random()*filtered.length)];
        document.getElementById("question").textContent = `What word means: "${currentWord.Translation}"`;
        let options = [currentWord.Word];
        while(options.length<3){ let o=filtered[Math.floor(Math.random()*filtered.length)].Word; if(!options.includes(o)) options.push(o);}
        options = shuffle(options);
        const div = document.getElementById("options"); div.innerHTML='';
        options.forEach(opt => { let btn=document.createElement("button"); btn.textContent=opt; btn.className="button"; btn.onclick=()=>checkReverse(opt); div.appendChild(btn); });
    }
    function checkReverse(ans){
        const res=document.getElementById("result");
        if(ans===currentWord.Word){ res.textContent="Correct!"; wrongWords=wrongWords.filter(w=>w.Word!==currentWord.Word); }
        else{ res.textContent=`Wrong! Correct: ${currentWord.Word}`; if(!wrongWords.includes(currentWord)) wrongWords.push(currentWord);}
        setTimeout(nextReverse,3000);
    }

    // Spelling
    function nextSpellingQuestion(){
        document.getElementById("result").textContent='';
        currentWord = (wrongWords.length>0 && Math.random()<0.5)? wrongWords[Math.floor(Math.random()*wrongWords.length)] : filtered[Math.floor(Math.random()*filtered.length)];
        document.getElementById("question").textContent = `Spell this word: "${currentWord.Translation}"`;

        const div = document.getElementById("options");
        div.innerHTML='';

        // Display for typed letters
        const typedDiv = document.createElement("p");
        typedDiv.id = "typedWord";
        typedDiv.style.fontWeight = "bold";
        typedDiv.style.fontSize = "18px";
        typedDiv.style.minHeight = "24px";
        div.appendChild(typedDiv);

        let userAnswer = '';

        const letters = shuffle([...currentWord.Word]);
        const letterButtons = [];

        // Letter buttons
        letters.forEach(l => {
            let btn = document.createElement("button");
            btn.textContent = l; 
            btn.className = "button smallButton"; 
            btn.onclick = () => { 
                userAnswer += l; 
                typedDiv.textContent = userAnswer;
                btn.disabled = true; 
                btn.style.opacity = 0.5; 
            };
            div.appendChild(btn);
            letterButtons.push(btn);
        });

        div.appendChild(document.createElement("br"));

        // Submit button
        const submitBtn = document.createElement("button");
        submitBtn.textContent="Submit"; 
        submitBtn.className="button";
        submitBtn.onclick = () => checkSpellingAnswer(userAnswer);
        div.appendChild(submitBtn);

        // Keyboard input listener
        const keyHandler = (e) => {
            const key = e.key;
            // Only allow letters that are in the shuffled array and still have a button enabled
            for (let i = 0; i < letters.length; i++) {
                if (letters[i].toLowerCase() === key.toLowerCase() && !letterButtons[i].disabled) {
                    userAnswer += letters[i];
                    typedDiv.textContent = userAnswer;
                    letterButtons[i].disabled = true;
                    letterButtons[i].style.opacity = 0.5;
                    break;
                }
            }
            // Enter key submits
            if (key === "Enter") {
                checkSpellingAnswer(userAnswer);
            }
            // Backspace removes last letter
            if (key === "Backspace" && userAnswer.length > 0) {
                const lastLetter = userAnswer.slice(-1);
                userAnswer = userAnswer.slice(0, -1);
                typedDiv.textContent = userAnswer;
                // Re-enable the last button with that letter
                for (let i = letterButtons.length - 1; i >= 0; i--) {
                    if (letterButtons[i].textContent === lastLetter && letterButtons[i].disabled) {
                        letterButtons[i].disabled = false;
                        letterButtons[i].style.opacity = 1;
                        break;
                    }
                }
            }
        };

        document.addEventListener("keydown", keyHandler);

        // Remove listener when moving to next question to prevent duplicates
        const cleanupListener = () => {
            document.removeEventListener("keydown", keyHandler);
        };

        submitBtn.onclick = () => {
            cleanupListener();
            checkSpellingAnswer(userAnswer);
        };
    }



    function checkSpellingAnswer(ans){
        const res=document.getElementById("result");
        if(ans===currentWord.Word){ res.textContent="Correct!"; wrongWords=wrongWords.filter(w=>w.Word!==currentWord.Word);}
        else{ res.textContent=`Wrong! Correct: ${currentWord.Word}`; if(!wrongWords.includes(currentWord)) wrongWords.push(currentWord);}
        setTimeout(nextSpellingQuestion,3000);
    }

    // Matching question
    // Matching question with unique colors and proper deselection
    function nextMatchingQuestion() {
        document.getElementById("result").textContent = '';
        const numPairs = Math.min(5, filtered.length);
        const pairs = shuffle([...filtered]).slice(0, numPairs); 
        currentWord = pairs;

        document.getElementById("question").textContent = "Match words with translations (click to pair/deselect)";
        const div = document.getElementById("options");
        div.innerHTML = '';

        const wordsDiv = document.createElement("div");
        const translationsDiv = document.createElement("div");
        wordsDiv.style.display = "inline-block"; 
        wordsDiv.style.marginRight = "50px";
        translationsDiv.style.display = "inline-block";

        const words = shuffle(pairs.map(p => p.Word));
        const translations = shuffle(pairs.map(p => p.Translation));

        const pairColors = ['#ffff99','#add8e6','#90ee90','#ffb347','#ff7f7f'];
        const assignedColors = {}; // word -> color assigned
        const selections = {}; // word -> translation
        const wordButtons = {};
        const translationButtons = {};

        let firstSelection = null; // {type: 'word'|'translation', value: string}

        function getNextAvailableColor() {
            // pick the first color not currently assigned
            return pairColors.find(c => !Object.values(assignedColors).includes(c));
        }

        function pairItems(word, translation) {
            let color;
            if(assignedColors[word]) {
                color = assignedColors[word];
            } else {
                color = getNextAvailableColor();
                assignedColors[word] = color;
            }
            wordButtons[word].style.backgroundColor = color;
            translationButtons[translation].style.backgroundColor = color;
            selections[word] = translation;
            firstSelection = null;
        }

        function deselectPair(word, translation) {
            wordButtons[word].style.backgroundColor = '';
            translationButtons[translation].style.backgroundColor = '';
            delete selections[word];
            delete assignedColors[word];
            firstSelection = null;
        }

        // Word buttons
        words.forEach(w => {
            const btn = document.createElement("button");
            btn.textContent = w;
            btn.className = "button smallButton";
            btn.onclick = () => {
                if(selections[w]) { 
                    deselectPair(w, selections[w]);
                    return;
                }
                if(!firstSelection) {
                    firstSelection = { type: 'word', value: w };
                    const tempColor = getNextAvailableColor();
                    btn.style.backgroundColor = tempColor;
                } else if(firstSelection.type === 'translation') {
                    pairItems(w, firstSelection.value);
                } else {
                    // switch selected word
                    wordButtons[firstSelection.value].style.backgroundColor = '';
                    firstSelection = { type: 'word', value: w };
                    const tempColor = getNextAvailableColor();
                    btn.style.backgroundColor = tempColor;
                }
            };
            wordsDiv.appendChild(btn);
            wordsDiv.appendChild(document.createElement("br"));
            wordButtons[w] = btn;
        });

        // Translation buttons
        translations.forEach(t => {
            const btn = document.createElement("button");
            btn.textContent = t;
            btn.className = "button smallButton";
            btn.onclick = () => {
                const pairedWord = Object.keys(selections).find(k => selections[k] === t);
                if(pairedWord) {
                    deselectPair(pairedWord, t);
                    return;
                }
                if(!firstSelection) {
                    firstSelection = { type: 'translation', value: t };
                    // show tentative color using the next available
                    const tempWord = pairs.find(p => p.Translation === t).Word;
                    const tempColor = getNextAvailableColor();
                    btn.style.backgroundColor = tempColor;
                } else if(firstSelection.type === 'word') {
                    pairItems(firstSelection.value, t);
                } else {
                    // switch selected translation
                    translationButtons[firstSelection.value].style.backgroundColor = '';
                    firstSelection = { type: 'translation', value: t };
                    const tempWord = pairs.find(p => p.Translation === t).Word;
                    const tempColor = getNextAvailableColor();
                    btn.style.backgroundColor = tempColor;
                }
            };
            translationsDiv.appendChild(btn);
            translationsDiv.appendChild(document.createElement("br"));
            translationButtons[t] = btn;
        });

        div.appendChild(wordsDiv);
        div.appendChild(translationsDiv);

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit";
        submitBtn.className = "button";
        submitBtn.onclick = () => checkMatchingAnswer(selections, wordButtons, translationButtons, assignedColors);

        div.appendChild(document.createElement("br"));
        div.appendChild(submitBtn);
    }


    // Check matching and show correct/incorrect outlines
    function checkMatchingAnswer(selections, wordButtons, translationButtons, assignedColors) {
        const res = document.getElementById("result");
        let correct = true;

        currentWord.forEach(w => {
            const selectedTranslation = selections[w.Word];
            if (selectedTranslation !== w.Translation) correct = false;
        });

        // Outline each pair based on correctness, keep assigned color
        Object.keys(selections).forEach(word => {
            const translation = selections[word];
            const color = assignedColors[word]; // the assigned pair color

            // keep the color
            wordButtons[word].style.backgroundColor = color;
            translationButtons[translation].style.backgroundColor = color;

            // show correctness
            if (translation === currentWord.find(cw => cw.Word === word).Translation) {
                wordButtons[word].style.border = '3px solid #00ff00'; // green outline
                translationButtons[translation].style.border = '3px solid #00ff00';
            } else {
                wordButtons[word].style.border = '3px solid #ff0000'; // red outline
                translationButtons[translation].style.border = '3px solid #ff0000';
            }
        });

        if (correct) {
            res.textContent = "All correct!";
            wrongWords = wrongWords.filter(w => !currentWord.some(cw => cw.Word === w.Word));
        } else {
            res.textContent = "Some wrong!";
            currentWord.forEach(w => {
                if (selections[w.Word] !== w.Translation && !wrongWords.some(ww => ww.Word === w.Word)) {
                    wrongWords.push(w);
                }
            });
        }

        // Move to next question after short delay
        setTimeout(nextMatchingQuestion, 6000);
    }
    // Dark mode toggle
    // Function to apply mode
    function setMode(isDark) {
        document.body.classList.toggle('dark-mode', isDark);
        const btn = document.getElementById('darkModeBtn');
        // Show the mode it will switch to on click
        btn.textContent = isDark ? '🌞' : '🌙';   //day/night
    }

    // Auto-detect on load
    window.addEventListener('DOMContentLoaded', () => {
        const hour = new Date().getHours();
        const isNight = hour >= 19 || hour < 7; // night between 7pm-7am
        setMode(isNight);
    });

    // Toggle button
    document.getElementById('darkModeBtn').addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('dark-mode');
        setMode(!isCurrentlyDark);
    });

    function resetApp() {
        filtered = [];
        wrongWords = [];
        currentWord = null;
        currentMethod = null;

        document.getElementById('app').style.display = 'none';
        document.getElementById('selector').style.display = 'block';

        // Remove highlight from method buttons
        const buttons = document.querySelectorAll("#methodSelection button");
        buttons.forEach(btn => btn.style.backgroundColor = '');
    }


    function restartTopic() {
        wrongWords = [];
        // Show the selector or quiz again depending on method
        if(currentMethod === 'translation' || currentMethod === 'reverse') {
            nextQuestion();
        } else if(currentMethod === 'spelling') {
            nextSpellingQuestion();
        } else if(currentMethod === 'matching') {
            nextMatchingQuestion();
        }
    }

    
