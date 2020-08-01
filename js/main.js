const UI = (() => {
    const init = () => {
        _cacheUI();
        _bindEvents();
    };
    
    const _cacheUI = () => {
        this.startBtn = document.getElementById('start-btn');
        this.twoPlayerBtn = document.getElementById('two-player-btn');
        this.botBtn = document.getElementById('bot-btn');
        this.player1Input = document.getElementById('player1-input');
        this.player2Input = document.getElementById('player2-input');
        this.player1Name = document.getElementById('player1-name');
        this.player2Name = document.getElementById('player2-name');
        this.player2Icon = document.querySelector('#player2 > div');
        this.boardOverlay = document.querySelector('.overlay');
        
        this.overlay = document.querySelector('aside');
        this.popup = overlay.querySelector('div');
        this.popupParagraph = overlay.querySelector('p');
        this.rematchButton = document.querySelector('aside button');
    };

    const _bindEvents = () => {
        this.startBtn.addEventListener('click', Game.init);
        this.rematchButton.addEventListener('click', Game.resetGame);
        this.twoPlayerBtn.addEventListener('click', handlePlayModeView);
        this.botBtn.addEventListener('click', handlePlayModeView);
    };

    const playMode = () => {
        return this.twoPlayerBtn.classList.contains('active-mode') ? 'two-player' : 'bot';
    }

    const _setName = (player) => {
        this[`${player}Name`].textContent = getNames()[player];
        if (playMode() === 'bot') this.player2Name.textContent = 'Computer';
    };

    const toggleComputerIcon = () => {
        playMode() === 'bot' ? this.player2Icon.textContent = '🖥️' : this.player2Icon.textContent = '🦧';
    };

    const _switchInput = (player) => {
        this[`${player}Input`].classList.toggle('hide');
        this[`${player}Name`].classList.toggle('hide');
    };

    const handlePlayModeView = (e) => {
        if (!e.target.classList.contains('active-mode')) {
            this.twoPlayerBtn.classList.toggle('active-mode');
            this.botBtn.classList.toggle('active-mode');
            
            _setName('player2');
            toggleComputerIcon();
            _switchInput('player2');
        }
    };

    const setUI = () => {
        _setName('player1');
        _setName('player2');
        _switchInput('player1');
        if (playMode() === 'two-player') _switchInput('player2');
        this.startBtn.classList.add('hide');
        this.twoPlayerBtn.classList.add('hide');
        this.botBtn.classList.add('hide');
        toggleBoardOverlay();
    };

    const toggleBoardOverlay = () => {
        this.boardOverlay.classList.toggle('overlay');
    };

    const getNames = () => {
        const player1 = this.player1Input.value;
        const player2 = this.player2Input.value;

        return {player1, player2};
    };

    const showEndGamePopup = (btnText, name) => {
        toggleBoardOverlay();
        setEndgameContent(btnText, name);
        displayPopup();
    };

    const setEndgameContent = (pText, btnText) => {
        this.popupParagraph.textContent = pText;
        this.rematchButton.textContent = btnText;
    };

    const displayPopup = () => {
        this.popup.classList.add('transition');
        this.overlay.classList.add('visible');
    };

    const closePopup = () => {
        this.popup.classList.remove('transition');
        this.overlay.classList.remove('visible');
    };

    return {init, setEndgameContent, displayPopup, closePopup, getNames, setUI, toggleBoardOverlay, handlePlayModeView, playMode, showEndGamePopup};
})();

const Game = (() => {
    const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let gameOn = false;
    let playMode = '';

    const init = () => {
        playMode = UI.playMode();
        UI.setUI();
        Gameboard.init();

        this.player1 = Player(UI.getNames().player1, '🦍', 'gorilla.png');
        this.player2 = Player(UI.getNames().player2, '🦧', 'chimp.png');
        if (playMode === 'bot') this.player2 = Player('Computer', '🖥️');

        this.currentPlayer = this.player1;

        Gameboard.setCursor(currentPlayer.getCursorName());
        
        gameOn = true;
    };

    const playRound = (e) => {
        if (!gameOn) return;
        const index = e.target.dataset.id;
        if (!Gameboard.isFreeSquare(index)) return;
        Gameboard.setMarker(index, currentPlayer.getMarker());
        
        _checkEndGame();
        _switchPlayer();
        if (playMode === 'bot' && gameOn) botTurn();
    };

    const botTurn = () => {
        Bot.play(winConditions);
        _checkEndGame();
        _switchPlayer();
    };

    const _checkEndGame = () => {        
        if (_victory()) _endGame(`${currentPlayer.getName()} won the game!`, 'Rematch?');
        if (_fullBoard() && gameOn) _endGame("It's a tie!", 'Start over!');
    };

    const _endGame = (btnText, name) => {
        gameOn = false;
        UI.showEndGamePopup(btnText, name);
    };

    const _victory = () => {
        const gameboard = Gameboard.get();
        const marker = currentPlayer.getMarker();
        let victory;
        
        for (let i = 0; i < winConditions.length; i++) {
            victory = winConditions[i].every(el => gameboard[el] === marker );
            if (victory) break;
        }

        return victory;
    };

    const _fullBoard = () => {
        const gameboard = Gameboard.get();
        const full = gameboard.every(el => el != '');
        return full;
    };

    const _switchPlayer = () => {
        this.currentPlayer === this.player1 ? this.currentPlayer = this.player2 : this.currentPlayer = this.player1;
        Gameboard.setCursor(currentPlayer.getCursorName());
    }

    const resetGame = () => {
        Gameboard.clear();
        UI.toggleBoardOverlay();
        UI.closePopup();
        if (playMode === 'bot') this.currentPlayer = this.player1;
        Gameboard.setCursor(currentPlayer.getCursorName());
        gameOn = true;
    };

    return {init, playRound, resetGame};
})();

const Gameboard = (() => {
    let gameboard = Array(9).fill('');

    const init = () => {
        _cacheDOM();
        _render();
        _bindEvents();
    };

    const _cacheDOM = () => {
        this.boardArea = document.getElementById('game');
        this.squares = this.boardArea.querySelectorAll('.square');
    };

    const _bindEvents = () => {
        this.squares.forEach(square => { square.addEventListener("click", Game.playRound) });
    };

    const _render = () => {
        this.squares.forEach((square, i) => {
            square.textContent = gameboard[i];
        });
    };

    const get = () => gameboard;

    const setMarker = (index, marker) => {
        gameboard[index] = marker;
        _render();
    };

    const setCursor = (cursorName) => {
        this.boardArea.style.setProperty('--cursorPath', `url('../images/${cursorName}'), auto`);
    };

    const isFreeSquare = (index) => {
        return gameboard[index] === '' ? true : false;
    };

    const clear = () => {
        gameboard = Array(9).fill('');
        _render();
    };

    return {init, setMarker, setCursor, get, isFreeSquare, clear};
})();

const Player = (name, marker, cursorName='') => {
    const getName = () => name;
    const getMarker = ()  => marker;
    const getCursorName = () => cursorName;

    return {getName, getMarker, getCursorName};
};

const Bot = ((name, marker) => {
    const getName = () => name;
    const getMarker = ()  => marker;
    
    const play = (winConditions) => {
        let index = findIndex(winConditions, '🦍', '🖥️');
        if (!index) index = findIndex(winConditions, '🖥️', '🦍');
        index >= 0 ? Gameboard.setMarker(index, '🖥️') : playRandom();
    };

    const findIndex = (winConditions, marker1, marker2) => {
        const gameboard = Gameboard.get();
        for (let i = 0; i < winConditions.length; i++) {
            let counter = 0;
            let freeIndex;
            
            for (let j = 0; j < winConditions[i].length; j++) {
                if (gameboard[winConditions[i][j]] === marker1) break;
                if (gameboard[winConditions[i][j]] === marker2) counter++;
                if (gameboard[winConditions[i][j]] === '') freeIndex = winConditions[i][j];
            }

            if (counter === 2 && freeIndex >= 0) return freeIndex;
        }
    };

    const playRandom = () => {
        let index = _getRandom();
        while (!Gameboard.isFreeSquare(index)) {
            index = _getRandom();
        }
        
        Gameboard.setMarker(index, '🖥️');
    };

    const _getRandom = () => {
        return Math.floor(Math.random() * 8);
    };
    
    return {playRandom, play};
})();

UI.init();