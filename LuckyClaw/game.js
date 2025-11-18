// (v24) Game Logic Module
import { STATES, CLAW_SPEED_PPS, MAX_ITEMS, PERFORMATIVE_FAIL_CHANCE, MIN_CLAW_POS, MAX_CLAW_POS, BALL_COLORS, CLAW_TOLERANCE_PX } from './constants.js';

export class Game {
    constructor(renderer, audio, i18n) {
        console.log("Initializing ClawGame (v24)...");
        
        this.renderer = renderer;
        this.audio = audio;
        this.i18n = i18n;

        // (v22) Encapsulate State
        this.settings = {
            reduceMotion: false,
            bgm: false, // (v14) Default BGM to OFF
            sfx: true // (v14) Default SFX to ON
        };
        
        this.currentState = STATES.LOADING;
        this.prizePool = [];
        this.claimedPrizes = [];
        this.pendingWinner = { item: null, index: -1 };
        this.keysDown = {};
        this.clawPositionPercent = 50;
        this.moveDirection = 0;
        this.rAFId = null;
        this.hasPlayedOnce = false;
        this.lastFocusedElement = null;
        this.lastFrameTime = null; // (v21) For delta time
        
        // (v23) Pass settings reference to audio engine
        this.audio.settings = this.settings;
        this.renderer.settings = this.settings;
    }

    init() {
        this.renderer.localizeUI();
        
        this.setState(STATES.LOADING);
        
        if (this.audio.init()) {
            this.renderer.hideLoading();
            this.setState(STATES.SETUP);
        } else {
            this.renderer.dom.loadingText.textContent = "Error: Web Audio API not supported.";
        }
        
        // (v24) Link AudioEngine DOM elements
        this.audio.linkDOMElements(this.renderer.dom);

        this.renderer.dom.toggleSoundBgm.checked = this.settings.bgm;
        this.renderer.dom.toggleSoundSfx.checked = this.settings.sfx;

        // (v22) Wire up event listeners, binding 'this'
        this.renderer.dom.nameInput.addEventListener('input', this.onNameInput.bind(this));
        this.renderer.dom.startGameBtn.addEventListener('click', this.onStartGameClick.bind(this));

        // (v4/v7) Hold-to-Move listeners
        this.renderer.dom.controlLeftBtn.addEventListener('mousedown', () => this.onMovePress('left'));
        this.renderer.dom.controlRightBtn.addEventListener('mousedown', () => this.onMovePress('right'));
        this.renderer.dom.controlLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.onMovePress('left'); });
        this.renderer.dom.controlRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.onMovePress('right'); });
        
        window.addEventListener('mouseup', this.onMoveRelease.bind(this));
        window.addEventListener('touchend', this.onMoveRelease.bind(this));
        this.renderer.dom.controlLeftBtn.addEventListener('mouseleave', this.onMoveRelease.bind(this)); 
        this.renderer.dom.controlRightBtn.addEventListener('mouseleave', this.onMoveRelease.bind(this));
        this.renderer.dom.controlLeftBtn.addEventListener('touchcancel', this.onMoveRelease.bind(this));
        this.renderer.dom.controlRightBtn.addEventListener('touchcancel', this.onMoveRelease.bind(this));

        this.renderer.dom.controlGrabBtn.addEventListener('click', this.onGrabPress.bind(this));
        this.renderer.dom.controlShuffleBtn.addEventListener('click', this.onShufflePress.bind(this)); // (v11)
        
        // (v16) Keyboard Controls
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // (v10) New button listeners
        this.renderer.dom.acceptPrizeBtn.addEventListener('click', this.onAcceptPrize.bind(this));
        this.renderer.dom.cancelPrizeBtn.addEventListener('click', this.onCancelPrize.bind(this));
        this.renderer.dom.startOverBtn.addEventListener('click', this.onStartOver.bind(this));
        
        // (v7/v8) Modals
        this.renderer.dom.settingsBtn.addEventListener('click', () => this.openModal(this.renderer.dom.settingsModal));
        // (v13) Mute Button
        this.renderer.dom.muteBtn.addEventListener('click', () => this.audio.toggleMute());
        // (v19) New Modal Listeners
        this.renderer.dom.historyBtn.addEventListener('click', () => this.openModal(this.renderer.dom.historyModal, this.onHistoryPress.bind(this)));
        this.renderer.dom.remainingBtn.addEventListener('click', () => this.openModal(this.renderer.dom.remainingModal, this.onRemainingPress.bind(this)));
        this.renderer.dom.closeHistoryBtn.addEventListener('click', () => this.closeModal(this.renderer.dom.historyModal));
        this.renderer.dom.closeRemainingBtn.addEventListener('click', () => this.closeModal(this.renderer.dom.remainingModal));
        
        this.renderer.dom.closeSettingsBtn.addEventListener('click', () => this.closeModal(this.renderer.dom.settingsModal));
        this.renderer.dom.closeHowToPlayBtn.addEventListener('click', () => {
            this.closeModal(this.renderer.dom.howToPlayModal);
            // (v22.1) Set state to IDLE *after* closing How-to-Play
            if (!this.hasPlayedOnce) {
                this.setState(STATES.IDLE);
                this.hasPlayedOnce = true;
            }
        });
        
        // (v20) Add keydown listeners for modals
        [this.renderer.dom.settingsModal, this.renderer.dom.howToPlayModal, this.renderer.dom.resultModal, this.renderer.dom.historyModal, this.renderer.dom.remainingModal].forEach(modal => {
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if(modal.classList.contains('active')) {
                        this.closeModal(modal);
                    }
                }
            });
        });

        // (v7) Settings Toggles
        this.renderer.dom.toggleReduceMotion.addEventListener('change', (e) => this.settings.reduceMotion = e.target.checked);
        this.renderer.dom.toggleSoundBgm.addEventListener('change', (e) => {
            this.settings.bgm = e.target.checked;
            if (this.audio.isMuted && this.settings.bgm) {
                this.audio.toggleMute(false); 
            } else if (this.settings.bgm) { 
                this.audio.startBGM();
            } else { 
                this.audio.stopBGM();
            }
        });
        this.renderer.dom.toggleSoundSfx.addEventListener('change', (e) => {
            this.settings.sfx = e.target.checked;
            if (this.audio.isMuted && this.settings.sfx) {
                this.audio.toggleMute(false); 
            } else {
                 this.audio.setSFXVolume(this.settings.sfx ? 1 : 0);
            }
        });
    }
    
    openModal(modalEl, onOpenCallback) {
        this.lastFocusedElement = document.activeElement; 
        this.audio.play('button_press');
        
        if (onOpenCallback) onOpenCallback(); 
        
        this.renderer.openModal(modalEl);
    }

    closeModal(modalEl) {
        if (!modalEl || !modalEl.classList.contains('active')) return;
        
        this.audio.play('button_press');
        this.renderer.closeModal(modalEl);
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus(); 
        }
        
        // (v22.1) Special case for first play
        if (modalEl === this.renderer.dom.howToPlayModal && !this.hasPlayedOnce) {
            this.setState(STATES.IDLE);
            this.hasPlayedOnce = true;
        }
    }
    
    
    onNameInput() {
        // (v21) Allow comma/tab separation
        const rawText = this.renderer.dom.nameInput.value
            .replace(/,/g, '\n')
            .replace(/\t/g, '\n'); 
        
        const names = rawText
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);
            
        this.renderer.updateNameCounter(names.length);
    }

    onStartGameClick() {
        this.audio.unlock();
        this.audio.play('coin_insert');
        
        // (v21) Allow comma/tab separation
        const rawText = this.renderer.dom.nameInput.value
            .replace(/,/g, '\n')
            .replace(/\t/g, '\n'); 
        
        const names = rawText
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        if (names.length === 0) {
            this.renderer.showError(this.i18n.getText('error.empty'));
            return;
        }
        if (names.length > MAX_ITEMS) {
            this.renderer.showError(this.i18n.getText('error.limit', MAX_ITEMS));
            return;
        }
        
        this.renderer.showError('');
        
        this.prizePool = names.map((name, i) => ({
            id: `ball-${Date.now()}-${i}`,
            item: name,
            color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
            size: (25 + Math.random() * 10) 
        }));
        
        this.claimedPrizes = [];
        this.renderBallsFromPool();
        
        // (v22.1) Change flow
        if (!this.hasPlayedOnce) {
            this.openModal(this.renderer.dom.howToPlayModal);
            // State set to IDLE in modal close handler
        } else {
            this.setState(STATES.IDLE);
        }
    }
    
    onMovePress(direction) {
        if (this.currentState !== STATES.IDLE && this.currentState !== STATES.MOVING) return;
        
        this.audio.play('button_press');
        
        this.moveDirection = (direction === 'left') ? -1 : 1;
        this.renderer.updateControlPressState('controlLeftBtn', direction === 'left');
        this.renderer.updateControlPressState('controlRightBtn', direction === 'right');
        
        this.setState(STATES.MOVING);
        
        if (!this.rAFId) {
            this.lastFrameTime = performance.now(); // (v21) Start delta time
            this.rAFId = requestAnimationFrame(this.gameLoop.bind(this)); // (v22) Bind 'this'
        }
    }
    
    onMoveRelease() {
        if (this.currentState !== STATES.MOVING) return;
        
        this.moveDirection = 0;
        if (this.rAFId) {
            cancelAnimationFrame(this.rAFId);
            this.rAFId = null;
        }
        this.audio.stopLoop('claw_move');
        this.renderer.updateControlPressState('controlLeftBtn', false);
        this.renderer.updateControlPressState('controlRightBtn', false);
        this.renderer.hidePreviewTooltip();
        this.setState(STATES.IDLE);
    }
    
    onGrabPress() {
        if (this.currentState !== STATES.IDLE && this.currentState !== STATES.MOVING) return;
        if (this.prizePool.length === 0) {
            alert(this.i18n.getText('error.noItems')); 
            return;
        }
        
        this.onMoveRelease();
        
        this.setState(STATES.GRABBING);
        
        this.audio.play('grab_engage');
        this.renderer.updateControlPressState('controlGrabBtn', true);
        setTimeout(() => this.renderer.updateControlPressState('controlGrabBtn', false), 100);

        const targetBallEl = this.findClosestBallToClaw();
        
        if (targetBallEl === null) {
            console.log("Grab missed: No ball within tolerance.");
            this.runEmptyGrabSequence(); 
        
        } else {
            const ballId = targetBallEl.dataset.itemId;
            const prizeIndex = this.prizePool.findIndex(p => p.id === ballId);
            const prize = this.prizePool[prizeIndex];

            if (!prize) {
                 console.error(`Grab logic failed: No prize data found for ball ID ${ballId}`);
                 this.setState(STATES.IDLE);
                 return;
            }
            
            this.pendingWinner = { item: prize.item, index: prizeIndex };
            const isFailure = (this.prizePool.length > 1) && (Math.random() < PERFORMATIVE_FAIL_CHANCE);
            this.runGrabAnimationSequence(prize.item, isFailure, targetBallEl);
        }
    }
    
    onShufflePress() {
        if (this.currentState !== STATES.IDLE && this.currentState !== STATES.MOVING) return;
        
        this.onMoveRelease();

        this.setState(STATES.SHUFFLING); 
        this.audio.play('shuffle');
        
        this.renderer.playAnimation('shakePit');
        
        // (v23) Logic: Shuffle array
        this.prizePool.sort(() => Math.random() - 0.5);
        // (v23) Command: Re-render
        this.renderBallsFromPool();

        setTimeout(() => {
            this.setState(STATES.IDLE); 
        }, 300); 
    }
    
    onAcceptPrize() {
        this.audio.play('button_press');
        if (this.pendingWinner.index > -1) {
            this.claimedPrizes.push(this.pendingWinner.item);
            this.prizePool.splice(this.pendingWinner.index, 1);
        }
        this.pendingWinner = { item: null, index: -1 }; 
        
        this.closeModal(this.renderer.dom.resultModal); 
        this.onPlayAgain(); 
    }

    onCancelPrize() {
        this.audio.play('button_press');
        this.pendingWinner = { item: null, index: -1 };
        
        this.closeModal(this.renderer.dom.resultModal); 
        this.onPlayAgain();
    }

    onPlayAgain() {
        this.setState(STATES.IDLE);
        this.renderBallsFromPool();
        
        this.renderer.playAnimation('clawReset');
        this.clawPositionPercent = 50;
    }

    onStartOver() {
        this.pendingWinner = { item: null, index: -1 }; 
        this.prizePool = []; 
        this.claimedPrizes = []; 
        this.closeModal(this.renderer.dom.resultModal); 
        this.onPlayAgain(); 
        this.renderer.resetSetupForm();
        this.setState(STATES.SETUP);
    }
    
    onHistoryPress() {
        this.renderer.updateListModal(this.renderer.dom.historyListContent, this.claimedPrizes, 'history.empty');
    }
    
    onRemainingPress() {
        // (v23) Get items from data pool
        const remainingItems = this.prizePool.map(p => p.item);
        this.renderer.updateListModal(this.renderer.dom.remainingListContent, remainingItems, 'remaining.empty');
    }

    handleKeyDown(e) {
        if (this.renderer.dom.howToPlayModal.classList.contains('active') || 
            this.renderer.dom.settingsModal.classList.contains('active') || 
            this.renderer.dom.resultModal.classList.contains('active') ||
            this.renderer.dom.historyModal.classList.contains('active') ||
            this.renderer.dom.remainingModal.classList.contains('active')) {
            
            // (v20) Allow Escape key even when modal is open
            if (e.key === 'Escape') {
                // Find and close the active modal
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) this.closeModal(activeModal);
            }
            return;
        }

        if (this.keysDown[e.key]) return; 
        this.keysDown[e.key] = true;

        if (this.currentState !== STATES.IDLE && this.currentState !== STATES.MOVING) {
            if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                 this.keysDown[e.key] = false;
            }
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.onMovePress('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.onMovePress('right');
                break;
            case ' ': // Spacebar
                e.preventDefault();
                this.onGrabPress();
                break;
            case 's':
            case 'S':
            case 'ช': 
                e.preventDefault();
                this.onShufflePress();
                break;
        }
    }
    
    handleKeyUp(e) {
        this.keysDown[e.key] = false;
        
        if (this.currentState === STATES.MOVING) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (this.keysDown['ArrowLeft']) {
                    this.onMovePress('left');
                } else if (this.keysDown['ArrowRight']) {
                    this.onMovePress('right');
                } else {
                    this.onMoveRelease();
                }
            }
        }
    }

    findClosestBallToClaw() {
        if (this.prizePool.length === 0) return null; 
        
        const clawRect = this.renderer.dom.claw.getBoundingClientRect();
        const clawCenterX = clawRect.left + (clawRect.width / 2);

        let closestBallEl = null;
        let minDistance = Infinity;

        const balls = this.renderer.dom.pit.querySelectorAll('.ball');
        balls.forEach(ballEl => {
            const ballRect = ballEl.getBoundingClientRect();
            const ballCenterX = ballRect.left + (ballRect.width / 2);
            const distance = Math.abs(clawCenterX - ballCenterX);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestBallEl = ballEl;
            }
        });
        
        if (minDistance > CLAW_TOLERANCE_PX) {
            console.log(`Miss. Closest distance: ${minDistance}px > ${CLAW_TOLERANCE_PX}px`);
            return null; 
        }
        
        if (!closestBallEl) {
             console.warn("No ball elements found, registering as miss.");
             return null;
        }

        return closestBallEl;
    }
    
    runEmptyGrabSequence() {
        this.renderer.showOverlay('feedback.miss');
        
        setTimeout(() => {
            this.renderer.playAnimation('clawDrop');
            this.audio.play('claw_impact'); 
            this.renderer.playAnimation('screenShake');
        }, 100); 

        setTimeout(() => {
            this.renderer.playAnimation('clawSqueeze');
            this.audio.play('claw_squeeze'); 
        }, 600); 

        setTimeout(() => {
            this.renderer.playAnimation('clawLift');
            this.audio.playLoop('claw_move'); 
            this.renderer.hideOverlay(); 
        }, 1000); 

        setTimeout(() => {
            this.audio.stopLoop('claw_move');
            this.renderer.playAnimation('clawReset');
            this.setState(STATES.IDLE);
        }, 2000); 
    }
    
    runGrabAnimationSequence(winner, isFailure, targetBallEl) {
        this.renderer.showOverlay('status.working');
        
        setTimeout(() => {
            this.renderer.playAnimation('clawDrop');
            this.audio.play('claw_impact'); 
            this.renderer.playAnimation('screenShake');
        }, 100); 

        setTimeout(() => {
            this.renderer.playAnimation('clawSqueeze', targetBallEl);
            this.audio.play('claw_squeeze'); 
        }, 600); 

        setTimeout(() => {
            this.renderer.playAnimation('clawLift');
            this.audio.playLoop('claw_move'); 
        }, 1000); 

        setTimeout(() => {
            this.audio.stopLoop('claw_move');
            
            if (isFailure) {
                this.renderer.playAnimation('clawFail', targetBallEl);
                this.audio.play('claw_fail');
            } else {
                this.setState(STATES.DROPPING);
                this.renderer.playAnimation('clawMoveToChute');
            }
        }, 2000); 

        setTimeout(() => {
            this.renderer.hideOverlay();
            if (!isFailure) {
                this.renderer.playAnimation('clawDropInChute', targetBallEl);
            }
            
            this.showWinnerModal(winner);
            this.setState(STATES.SHOW_RESULT);
        }, isFailure ? 2500 : 3500); 
    }
    
    showWinnerModal(winner) {
        this.renderer.showWinnerModal(
            winner, 
            this.prizePool.length, 
            this.prizePool.length === 0 // isLast
        );
        this.audio.play('fanfare');
    }
    
    renderBallsFromPool() {
        this.renderer.renderBallsFromPool(
            this.prizePool,
            (item) => { // (v23) Pass callbacks directly
                if (this.currentState === STATES.IDLE || this.currentState === STATES.MOVING) {
                    this.renderer.showPreviewTooltip(item);
                }
            },
            () => {
                this.renderer.hidePreviewTooltip();
            }
        );
    }
    
    updatePreviewTooltip() {
        if (this.currentState !== STATES.MOVING) {
            this.renderer.hidePreviewTooltip();
            return;
        }

        const targetBallEl = this.findClosestBallToClaw();
        if (targetBallEl) {
            const prize = this.prizePool.find(p => p.id === targetBallEl.dataset.itemId);
            if (prize) {
                this.renderer.showPreviewTooltip(prize.item);
            } else {
                this.renderer.hidePreviewTooltip();
            }
        } else {
            this.renderer.hidePreviewTooltip();
        }
    }

    gameLoop(currentTime) {
        if (this.currentState !== STATES.MOVING) {
            this.rAFId = null;
            return; 
        }

        // (v21) Delta time calculation for frame-independent speed
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
        }
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // time in seconds
        this.lastFrameTime = currentTime;

        this.clawPositionPercent += this.moveDirection * CLAW_SPEED_PPS * deltaTime;
        this.clawPositionPercent = Math.max(MIN_CLAW_POS, Math.min(MAX_CLAW_POS, this.clawPositionPercent));
        this.renderer.updateClawPosition(this.clawPositionPercent);
        
        this.updatePreviewTooltip();

        this.rAFId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    setState(newState) {
        if (this.currentState === newState) return;
        
        console.log(`State change: ${this.currentState} -> ${newState}`);
        this.currentState = newState;
        
        // (v23) Default control map
        const controls = {
            move: false,
            grab: false,
            shuffle: false,
            ui: false // (v19)
        };
        
        this.audio.setBGMVolume(0.1);

        switch(newState) {
            case STATES.SETUP:
                this.renderer.showScreen('setup-screen');
                break;
                
            case STATES.LOADING:
                this.renderer.showScreen('setup-screen');
                this.renderer.showLoading();
                break;

            case STATES.IDLE:
                this.renderer.showScreen('game-screen');
                controls.ui = true;
                if (this.prizePool.length > 0) { 
                    controls.move = true;
                    controls.grab = true;
                    controls.shuffle = true; 
                }
                this.audio.setBGMVolume(0.2);
                break;
                
            case STATES.MOVING:
                this.renderer.showScreen('game-screen');
                controls.ui = true;
                controls.grab = true; 
                controls.shuffle = true; 
                this.audio.playLoop('claw_move');
                break;

            case STATES.GRABBING:
            case STATES.DROPPING:
            case STATES.SHUFFLING: 
                this.renderer.showScreen('game-screen');
                controls.ui = true;
                break;
                
            case STATES.SHOW_RESULT:
                this.renderer.showScreen('game-screen'); 
                controls.ui = true;
                this.openModal(this.renderer.dom.resultModal); 
                break;
        }
        
        this.renderer.setControlsEnabled(controls);
    }

} // ----- End of Game Class -----


// ----- 10. Start Game (v24) -----
// Initialize and inject dependencies
const i18n = new I18nService();
const renderer = new Renderer(i18n);
const audio = new AudioEngine(renderer.settings); // Pass settings reference

new Game(renderer, audio, i18n).init(); // (v23) Call init!

}); // ----- End of DOMContentLoaded -----