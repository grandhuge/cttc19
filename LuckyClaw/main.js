// (v24) Main JavaScript Entry Point (ESM)
// This file connects all the modules together.

import { I18nService } from './i18n.js';
import { AudioEngine } from './audio.js';
import { Renderer } from './renderer.js';
import { Game } from './game.js';

// Wait for the DOM to be fully loaded before starting the game
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize core services
    const i18n = new I18nService();
    const renderer = new Renderer(i18n);
    const audio = new AudioEngine(renderer.settings); // Pass settings reference
    
    // 2. Initialize the main game controller and inject dependencies
    const game = new Game(renderer, audio, i18n);
    
    // 3. Start the game
    game.init();

    // (v24) Make classes available globally for debugging if needed
    // window.ClawGame = game;
    // window.ClawAudio = audio;
    // window.ClawRenderer = renderer;
});