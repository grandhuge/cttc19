// (v24) Renderer Module
// This class ONLY handles DOM manipulation. It knows nothing about game logic.

export class Renderer {
    constructor(i18n) {
        this.i18n = i18n;
        this.settings = null; // Will be injected by Game class

        // (v23) All DOM elements are encapsulated here
        this.dom = {
            bodyEl: document.body,
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultModal: document.getElementById('result-modal'),
            resultCard: document.getElementById('result-card'),
            howToPlayModal: document.getElementById('how-to-play-modal'),
            settingsModal: document.getElementById('settings-modal'),
            historyModal: document.getElementById('history-modal'),
            remainingModal: document.getElementById('remaining-modal'),
            historyListContent: document.getElementById('history-list-content'),
            remainingListContent: document.getElementById('remaining-list-content'),
            loadingText: document.getElementById('loading-text'),
            nameInput: document.getElementById('name-input'),
            nameCounter: document.getElementById('name-counter'),
            setupError: document.getElementById('setup-error'),
            startGameBtn: document.getElementById('start-game-btn'),
            pit: document.getElementById('pit'),
            clawRig: document.getElementById('claw-rig'),
            clawArm: document.getElementById('claw-arm'),
            claw: document.getElementById('claw'),
            chuteHole: document.getElementById('chute-hole'),
            gameOverlay: document.getElementById('game-overlay'),
            previewTooltip: document.getElementById('preview-tooltip'),
            controlLeftBtn: document.getElementById('control-left-btn'),
            controlRightBtn: document.getElementById('control-right-btn'),
            controlShuffleBtn: document.getElementById('control-shuffle-btn'),
            controlGrabBtn: document.getElementById('control-grab-btn'),
            winnerNameEl: document.getElementById('winner-name'),
            remainingCountEl: document.getElementById('remaining-count'),
            acceptPrizeBtn: document.getElementById('accept-prize-btn'),
            cancelPrizeBtn: document.getElementById('cancel-prize-btn'),
            startOverBtn: document.getElementById('start-over-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            muteBtn: document.getElementById('mute-btn'),
            iconUnmuted: document.getElementById('icon-unmuted'),
            iconMuted: document.getElementById('icon-muted'),
            historyBtn: document.getElementById('history-btn'),
            remainingBtn: document.getElementById('remaining-btn'),
            closeHistoryBtn: document.getElementById('close-history-btn'),
            closeRemainingBtn: document.getElementById('close-remaining-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            closeHowToPlayBtn: document.getElementById('close-how-to-play-btn'),
            toggleReduceMotion: document.getElementById('toggle-reduce-motion'),
            toggleSoundBgm: document.getElementById('toggle-sound-bgm'),
            toggleSoundSfx: document.getElementById('toggle-sound-sfx')
        };
    }

    localizeUI() {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            const count = el.dataset.count;
            const value = (count) ? this.i18n.getText(key, count) : this.i18n.getText(key);
            
            if (el.tagName === 'TEXTAREA' && el.hasAttribute('placeholder')) {
                el.placeholder = value;
            } else if (el.hasAttribute('aria-label')) {
                el.setAttribute('aria-label', value);
            } else if (el.hasAttribute('title')) {
                el.setAttribute('title', value);
            } else {
                el.innerHTML = value; // Use innerHTML for help text
            }
        });
    }
    
    showScreen(screenId) {
        ['setup-screen', 'game-screen'].forEach(id => {
            // (v24) Check if element exists before accessing classList
            if (this.dom[id]) {
                this.dom[id].classList.remove('active');
            }
        });
        
        if (this.dom[screenId]) {
            this.dom[screenId].classList.add('active');
        }
    }
    
    openModal(modalEl) {
        modalEl.classList.add('active');
        const firstFocusable = modalEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    closeModal(modalEl) {
        if (!modalEl || !modalEl.classList.contains('active')) return;
        modalEl.classList.remove('active');
    }
    
    showLoading() {
        this.dom.loadingText.style.display = 'block';
        this.dom.startGameBtn.disabled = true;
    }
    
    hideLoading() {
        this.dom.loadingText.style.display = 'none';
        this.dom.startGameBtn.disabled = false;
    }
    
    showError(message) {
        this.dom.setupError.textContent = message;
    }
    
    updateNameCounter(count) {
        this.dom.nameCounter.textContent = this.i18n.getText('counter.items', count);
    }
    
    setControlsEnabled(stateMap) {
        this.dom.controlLeftBtn.disabled = !stateMap.move;
        this.dom.controlRightBtn.disabled = !stateMap.move;
        this.dom.controlGrabBtn.disabled = !stateMap.grab;
        this.dom.controlShuffleBtn.disabled = !stateMap.shuffle;
        this.dom.historyBtn.disabled = !stateMap.ui;
        this.dom.remainingBtn.disabled = !stateMap.ui;
    }
    
    updateClawPosition(percent) {
        this.dom.clawRig.style.left = `${percent}%`;
    }

    updateControlPressState(control, isPressing) {
        const el = this.dom[control];
        if (el) {
            el.classList.toggle('is-pressing', isPressing);
        }
    }
    
    showOverlay(textKey) {
        this.dom.gameOverlay.textContent = this.i18n.getText(textKey);
        this.dom.gameOverlay.classList.add('show');
    }
    
    hideOverlay() {
        this.dom.gameOverlay.classList.remove('show');
    }
    
    showPreviewTooltip(text) {
        this.dom.previewTooltip.textContent = text;
        this.dom.previewTooltip.classList.add('show');
    }
    
    hidePreviewTooltip() {
         this.dom.previewTooltip.classList.remove('show');
    }
    
    playAnimation(name, targetBallEl = null) {
        switch(name) {
            case 'shakePit':
                this.dom.pit.classList.add('is-shaking');
                setTimeout(() => this.dom.pit.classList.remove('is-shaking'), 300);
                break;
                
            case 'screenShake':
                if (!this.settings.reduceMotion) {
                    this.dom.bodyEl.classList.add('screen-shake');
                    setTimeout(() => this.dom.bodyEl.classList.remove('screen-shake'), 300);
                }
                break;
            
            case 'clawDrop':
                this.dom.clawRig.classList.add('is-dropping');
                break;
                
            case 'clawSqueeze':
                this.dom.clawRig.classList.add('is-squeezing');
                if (targetBallEl) {
                    this.dom.claw.appendChild(targetBallEl);
                    targetBallEl.style.position = 'absolute';
                    targetBallEl.style.top = '5px';
                    targetBallEl.style.left = '50%';
                    targetBallEl.style.transform = 'translateX(-50%)';
                    targetBallEl.style.margin = '0';
                    targetBallEl.style.zIndex = '-1';
                }
                break;
                
            case 'clawLift':
                this.dom.clawRig.classList.remove('is-dropping');
                this.dom.clawRig.classList.add('is-lifting');
                break;
                
            case 'clawFail':
                this.dom.clawRig.classList.add('is-failing');
                this.dom.clawRig.classList.remove('is-squeezing', 'is-lifting');
                if (targetBallEl) {
                    this.dom.pit.appendChild(targetBallEl); // Return to pit
                    targetBallEl.style.position = 'relative'; 
                    targetBallEl.style.top = 'auto';
                    targetBallEl.style.left = 'auto';
                    targetBallEl.style.transform = 'none';
                    targetBallEl.style.zIndex = 'auto';
                    targetBallEl.style.setProperty('--delay', `${Math.random() * 3}s`);
                }
                break;
                
            case 'clawMoveToChute':
                this.dom.clawRig.classList.add('is-moving-chute');
                break;
                
            case 'clawDropInChute':
                this.dom.clawRig.classList.remove('is-squeezing', 'is-lifting', 'is-failing');
                if (targetBallEl) {
                    this.dom.chuteHole.appendChild(targetBallEl);
                    targetBallEl.style.position = 'absolute';
                    targetBallEl.style.top = '0';
                    targetBallEl.style.left = '50%';
                    setTimeout(() => targetBallEl.remove(), 500); 
                }
                break;
            
            case 'clawReset':
                this.dom.clawRig.classList.remove('is-squeezing', 'is-lifting', 'is-failing');
                this.dom.clawRig.classList.remove('is-moving-chute');
                this.dom.clawRig.style.left = '50%';
                break;
        }
    }
    
    renderBallsFromPool(prizePool, onBallHover, onBallOut) {
        this.dom.pit.innerHTML = ''; 
        
        prizePool.forEach(prize => {
            const ball = document.createElement('div');
            ball.classList.add('ball');
            ball.id = prize.id; 
            ball.dataset.itemId = prize.id; 
            ball.style.width = `${prize.size}px`;
            ball.style.height = `${prize.size}px`;
            ball.style.backgroundColor = prize.color;
            ball.style.setProperty('--delay', `${Math.random() * 3}s`); 
            
            ball.addEventListener('mouseover', () => onBallHover(prize.item));
            ball.addEventListener('mouseout', onBallOut);

            this.dom.pit.appendChild(ball);
        });
    }
    
    showWinnerModal(winner, remainingCount, isLast) {
        this.dom.winnerNameEl.textContent = winner; 
        
        if (isLast) {
            this.dom.remainingCountEl.textContent = this.i18n.getText('remaining.last'); 
        } else {
            this.dom.remainingCountEl.textContent = this.i18n.getText('remaining.count', remainingCount); 
        }

        this.dom.acceptPrizeBtn.disabled = false;
        this.dom.cancelPrizeBtn.disabled = false;
        
        if (!this.settings.reduceMotion) { 
            // (v23) Moved confetti to Renderer
            if (typeof confetti === 'function') { 
                confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, zIndex: 9999 });
            }
        }
    }
    
    updateListModal(modalContentEl, items, emptyKey) {
        modalContentEl.innerHTML = '';
        if (items.length === 0) {
            modalContentEl.innerHTML = this.i18n.getText(emptyKey);
            return;
        }
        const list = document.createElement('ol');
        list.className = 'list-decimal list-inside';
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item; 
            list.appendChild(li);
        });
        modalContentEl.appendChild(list);
    }
    
    resetSetupForm() {
        this.dom.nameInput.value = '';
        this.dom.nameCounter.textContent = this.i18n.getText('counter.items', 0);
    }
    
}