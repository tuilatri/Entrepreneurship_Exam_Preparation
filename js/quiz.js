function scrollToResults() {
    const resultsElement = document.getElementById('quizScoreDisplay');
    if (resultsElement) {
        resultsElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' 
        });
    }
}

function scrollToFirstQuestion() {
    const firstQuestion = document.querySelector('.question');
    if (firstQuestion) {
        firstQuestion.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' 
        });
    }
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function generateOptionOrder(questionIndex, quizData, subIndex = null) {
    const question = subIndex !== null 
        ? quizData[questionIndex].subQuestions[subIndex]
        : quizData[questionIndex];
    const optionIndices = Array.from({length: question.options.length}, (_, i) => i);
    return shuffleArray(optionIndices);
}

async function loadQuizData(quizType) {
    const quizForm = document.getElementById('quizForm');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const formActions = document.getElementById('formActions');
    const quizScoreDisplay = document.getElementById('quizScoreDisplay');
    const scoreValue = document.getElementById('scoreValue');
    const totalQuestions = document.getElementById('totalQuestions');

    let quizData = [];
    let currentQuestionOrder = [];
    let currentOptionOrders = {};

    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allQuestions = await response.json();

        // Filter questions based on quiz type
        if (quizType === 'midterm') {
            quizData = allQuestions.filter(q => q.question.startsWith('3.') && 
                parseInt(q.question.split('.')[1]) <= 5);
        } else if (quizType === 'final') {
            quizData = allQuestions.filter(q => q.question.startsWith('3.') && 
                parseInt(q.question.split('.')[1]) >= 6 || q.question.startsWith('4.'));
        } else {
            quizData = allQuestions;
        }

        resetQuestionAndOptionOrders();
        
        loadingIndicator.style.display = 'none';
        quizForm.style.display = 'block';
        formActions.style.display = 'flex';
        
        renderQuiz();
    } catch (error) {
        console.error('Error loading quiz data:', error);
        loadingIndicator.style.display = 'none';
        errorMessage.textContent = 'Failed to load questions. Please try again later.';
        errorMessage.style.display = 'block';
    }

    function resetQuestionAndOptionOrders() {
        currentQuestionOrder = shuffleArray(Array.from({length: quizData.length}, (_, i) => i));
        currentOptionOrders = {};
        quizData.forEach((question, index) => {
            if (question.subQuestions) {
                currentOptionOrders[index] = {};
                question.subQuestions.forEach((_, subIndex) => {
                    currentOptionOrders[index][subIndex] = generateOptionOrder(index, quizData, subIndex);
                });
            } else {
                currentOptionOrders[index] = generateOptionOrder(index, quizData);
            }
        });
    }

    function renderQuiz() {
        quizForm.innerHTML = '';
        
        // Set starting number based on quizType
        const startNumber = quizType === 'final' ? 4 : 1;
        
        currentQuestionOrder.forEach((questionIndex, displayIndex) => {
            const questionData = quizData[questionIndex];
            const questionElement = document.createElement('div');
            questionElement.className = 'question';
            questionElement.id = `question-${questionIndex}`;
            
            // Check if the question has a scenario (i.e., subQuestions)
            if (questionData.scenario && questionData.subQuestions) {
                // Render the scenario paragraph
                const scenarioText = document.createElement('div');
                scenarioText.className = 'scenario__text';
                scenarioText.textContent = questionData.scenario;
                questionElement.appendChild(scenarioText);
                
                // Render each sub-question
                questionData.subQuestions.forEach((subQuestion, subIndex) => {
                    const subQuestionElement = document.createElement('div');
                    subQuestionElement.className = 'subquestion';
                    
                    const subQuestionText = document.createElement('div');
                    subQuestionText.className = 'question__text';
                    subQuestionText.textContent = `${startNumber + displayIndex}.${subIndex + 1}. ${subQuestion.subQuestion}`;
                    subQuestionElement.appendChild(subQuestionText);
                    
                    // Generate option order for this sub-question
                    const optionOrder = currentOptionOrders[questionIndex]?.[subIndex] || 
                        generateOptionOrder(questionIndex, quizData, subIndex);
                    currentOptionOrders[questionIndex] = currentOptionOrders[questionIndex] || {};
                    currentOptionOrders[questionIndex][subIndex] = optionOrder;
                    
                    // Render options for the sub-question
                    optionOrder.forEach(optionIndex => {
                        const option = subQuestion.options[optionIndex];
                        const optionId = `q${questionIndex}-s${subIndex}-option${optionIndex}`;
                        
                        const optionContainer = document.createElement('div');
                        optionContainer.className = 'option';
                        
                        const input = document.createElement('input');
                        input.type = Array.isArray(subQuestion.correctAnswer) ? 'checkbox' : 'radio';
                        input.className = 'option__input';
                        input.name = `question-${questionIndex}-sub-${subIndex}`;
                        input.id = optionId;
                        input.value = option;
                        
                        const label = document.createElement('label');
                        label.className = 'option__label';
                        label.htmlFor = optionId;
                        label.textContent = option;
                        label.dataset.optionValue = option;
                        label.dataset.originalIndex = optionIndex;
                        
                        optionContainer.appendChild(input);
                        optionContainer.appendChild(label);
                        subQuestionElement.appendChild(optionContainer);
                    });
                    
                    questionElement.appendChild(subQuestionElement);
                });
            } else {
                // Render regular question
                const questionText = document.createElement('div');
                questionText.className = 'question__text';
                questionText.textContent = `${startNumber + displayIndex}. ${questionData.question}`;
                if (Array.isArray(questionData.correctAnswer)) {
                    questionText.textContent += ' (Select all that apply)';
                }
                questionElement.appendChild(questionText);
                
                const isMultipleChoice = Array.isArray(questionData.correctAnswer);
                const inputType = isMultipleChoice ? 'checkbox' : 'radio';
                
                const optionOrder = currentOptionOrders[questionIndex];
                
                optionOrder.forEach(optionIndex => {
                    const option = questionData.options[optionIndex];
                    const optionId = `q${questionIndex}-option${optionIndex}`;
                    
                    const optionContainer = document.createElement('div');
                    optionContainer.className = 'option';
                    
                    const input = document.createElement('input');
                    input.type = inputType;
                    input.className = 'option__input';
                    input.name = `question-${questionIndex}`;
                    input.id = optionId;
                    input.value = option;
                    
                    const label = document.createElement('label');
                    label.className = 'option__label';
                    label.htmlFor = optionId;
                    label.textContent = option;
                    label.dataset.optionValue = option;
                    label.dataset.originalIndex = optionIndex;
                    
                    optionContainer.appendChild(input);
                    optionContainer.appendChild(label);
                    questionElement.appendChild(optionContainer);
                });
            }
            
            quizForm.appendChild(questionElement);
        });
        totalQuestions.textContent = quizData.length;
    }

    function highlightAnswers(questionIndex, subIndex, selectedOptions, correctAnswers) {
        const questionElement = document.getElementById(`question-${questionIndex}`);
        let optionContainers, optionLabels;
        
        if (subIndex !== undefined) {
            const subQuestionElement = questionElement.querySelectorAll('.subquestion')[subIndex];
            optionContainers = subQuestionElement.querySelectorAll('.option');
            optionLabels = subQuestionElement.querySelectorAll('.option__label');
        } else {
            optionContainers = questionElement.querySelectorAll('.option');
            optionLabels = questionElement.querySelectorAll('.option__label');
        }
        
        optionContainers.forEach(container => {
            container.classList.remove('option--correct', 'option--incorrect');
        });
        
        optionLabels.forEach(label => {
            label.classList.remove('option__label--correct', 'option__label--incorrect');
            
            const optionValue = label.dataset.optionValue;
            const isCorrect = Array.isArray(correctAnswers) 
                ? correctAnswers.includes(optionValue)
                : optionValue === correctAnswers;
            
            if (isCorrect) {
                label.classList.add('option__label--correct');
                label.closest('.option').classList.add('option--correct');
            }
            
            const isSelected = selectedOptions.some(opt => opt.value === optionValue);
            if (isSelected && !isCorrect) {
                label.classList.add('option__label--incorrect');
                label.closest('.option').classList.add('option--incorrect');
            }
        });
    }

    function showResults() {
        let score = 0;
        
        currentQuestionOrder.forEach((questionIndex) => {
            const questionData = quizData[questionIndex];
            const questionElement = document.getElementById(`question-${questionIndex}`);
            questionElement.classList.remove('question--correct', 'question--incorrect');
            
            if (questionData.subQuestions) {
                let allSubQuestionsCorrect = true;
                
                questionData.subQuestions.forEach((subQuestion, subIndex) => {
                    const subQuestionElement = questionElement.querySelectorAll('.subquestion')[subIndex];
                    const inputs = document.querySelectorAll(`input[name="question-${questionIndex}-sub-${subIndex}"]:checked`);
                    const selectedOptions = Array.from(inputs);
                    
                    subQuestionElement.classList.remove('question--correct', 'question--incorrect');
                    
                    const isMultipleChoice = Array.isArray(subQuestion.correctAnswer);
                    let correctAnswers = isMultipleChoice 
                        ? subQuestion.correctAnswer 
                        : [subQuestion.correctAnswer];
                    
                    if (selectedOptions.length > 0) {
                        const selectedValues = selectedOptions.map(opt => opt.value);
                        let isCorrect;
                        
                        if (isMultipleChoice) {
                            const allCorrectSelected = correctAnswers.every(ans => 
                                selectedValues.includes(ans));
                            const noIncorrectSelected = selectedValues.every(val => 
                                correctAnswers.includes(val));
                            isCorrect = allCorrectSelected && noIncorrectSelected && 
                                selectedValues.length === correctAnswers.length;
                        } else {
                            isCorrect = selectedValues.length === 1 && 
                                selectedValues[0] === subQuestion.correctAnswer;
                        }
                        
                        if (isCorrect) {
                            subQuestionElement.classList.add('question--correct');
                        } else {
                            subQuestionElement.classList.add('question--incorrect');
                            allSubQuestionsCorrect = false;
                        }
                        
                        highlightAnswers(questionIndex, subIndex, selectedOptions, correctAnswers);
                    } else {
                        subQuestionElement.classList.add('question--incorrect');
                        allSubQuestionsCorrect = false;
                        highlightAnswers(questionIndex, subIndex, [], correctAnswers);
                    }
                });
                
                if (allSubQuestionsCorrect) {
                    score++;
                    questionElement.classList.add('question--correct');
                } else {
                    questionElement.classList.add('question--incorrect');
                }
            } else {
                const inputs = document.querySelectorAll(`input[name="question-${questionIndex}"]:checked`);
                const selectedOptions = Array.from(inputs);
                
                const isMultipleChoice = Array.isArray(questionData.correctAnswer);
                let correctAnswers = isMultipleChoice 
                    ? questionData.correctAnswer 
                    : [questionData.correctAnswer];
                
                if (selectedOptions.length > 0) {
                    const selectedValues = selectedOptions.map(opt => opt.value);
                    let isCorrect;
                    
                    if (isMultipleChoice) {
                        const allCorrectSelected = correctAnswers.every(ans => 
                            selectedValues.includes(ans));
                        const noIncorrectSelected = selectedValues.every(val => 
                            correctAnswers.includes(val));
                        isCorrect = allCorrectSelected && noIncorrectSelected && 
                            selectedValues.length === correctAnswers.length;
                    } else {
                        isCorrect = selectedValues.length === 1 && 
                            selectedValues[0] === questionData.correctAnswer;
                    }
                    
                    if (isCorrect) {
                        score++;
                        questionElement.classList.add('question--correct');
                    } else {
                        questionElement.classList.add('question--incorrect');
                    }
                    
                    highlightAnswers(questionIndex, undefined, selectedOptions, correctAnswers);
                } else {
                    questionElement.classList.add('question--incorrect');
                    highlightAnswers(questionIndex, undefined, [], correctAnswers);
                }
            }
        });
        
        scoreValue.textContent = score;
        quizScoreDisplay.style.display = 'block';
        scrollToResults();
    }

    function resetForm() {
        resetQuestionAndOptionOrders();
        renderQuiz();
        quizForm.reset();
        quizScoreDisplay.style.display = 'none';
        
        currentQuestionOrder.forEach(questionIndex => {
            const questionElement = document.getElementById(`question-${questionIndex}`);
            questionElement.classList.remove('question--correct', 'question--incorrect');
            const subQuestionElements = questionElement.querySelectorAll('.subquestion');
            subQuestionElements.forEach(subElement => {
                subElement.classList.remove('question--correct', 'question--incorrect');
            });
            const optionContainers = questionElement.querySelectorAll('.option');
            const optionLabels = questionElement.querySelectorAll('.option__label');
            
            optionContainers.forEach(container => {
                container.classList.remove('option--correct', 'option--incorrect');
            });
            
            optionLabels.forEach(label => {
                label.classList.remove('option__label--correct', 'option__label--incorrect');
            });
        });
        
        scrollToFirstQuestion();
    }

    submitBtn.addEventListener('click', showResults);
    resetBtn.addEventListener('click', resetForm);
}