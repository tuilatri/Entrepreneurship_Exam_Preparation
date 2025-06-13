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

function generateOptionOrder(questionIndex, quizData) {
    const question = quizData[questionIndex];
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
                parseInt(q.question.split('.')[1]) >= 6);
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
        quizData.forEach((_, index) => {
            currentOptionOrders[index] = generateOptionOrder(index, quizData);
        });
    }

    function renderQuiz() {
        quizForm.innerHTML = '';
        
        currentQuestionOrder.forEach((questionIndex, displayIndex) => {
            const questionData = quizData[questionIndex];
            const questionElement = document.createElement('div');
            questionElement.className = 'question';
            questionElement.id = `question-${questionIndex}`;
            
            const questionText = document.createElement('div');
            questionText.className = 'question__text';
            questionText.textContent = `${displayIndex + 1}. ${questionData.question}`;
            // Add hint for multiple choice questions
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
            
            quizForm.appendChild(questionElement);
        });
        totalQuestions.textContent = quizData.length;
    }

    function highlightAnswers(questionIndex, selectedOptions, correctAnswers) {
        const questionElement = document.getElementById(`question-${questionIndex}`);
        const optionContainers = questionElement.querySelectorAll('.option');
        const optionLabels = questionElement.querySelectorAll('.option__label');
        
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
            const inputs = document.querySelectorAll(`input[name="question-${questionIndex}"]:checked`);
            const selectedOptions = Array.from(inputs);
            
            questionElement.classList.remove('question--correct', 'question--incorrect');
            
            const isMultipleChoice = Array.isArray(questionData.correctAnswer);
            let correctAnswers = isMultipleChoice 
                ? questionData.correctAnswer 
                : [questionData.correctAnswer];
            
            if (selectedOptions.length > 0) {
                const selectedValues = selectedOptions.map(opt => opt.value);
                let isCorrect;
                
                if (isMultipleChoice) {
                    // For multiple choice, check if selected answers exactly match correct answers
                    const allCorrectSelected = correctAnswers.every(ans => 
                        selectedValues.includes(ans));
                    const noIncorrectSelected = selectedValues.every(val => 
                        correctAnswers.includes(val));
                    isCorrect = allCorrectSelected && noIncorrectSelected && 
                        selectedValues.length === correctAnswers.length;
                } else {
                    // For single choice, check if the single selected answer is correct
                    isCorrect = selectedValues.length === 1 && 
                        selectedValues[0] === questionData.correctAnswer;
                }
                
                if (isCorrect) {
                    score++;
                    questionElement.classList.add('question--correct');
                } else {
                    questionElement.classList.add('question--incorrect');
                }
                
                highlightAnswers(questionIndex, selectedOptions, correctAnswers);
            } else {
                questionElement.classList.add('question--incorrect');
                highlightAnswers(questionIndex, [], correctAnswers);
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