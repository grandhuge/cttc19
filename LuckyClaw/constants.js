// (v24) Shared Constants Module
// This file solves the ReferenceError by providing a single source of truth.

// (v6) Finite State Machine (FSM)
export const STATES = {
    SETUP: 'SETUP',
    LOADING: 'LOADING', 
    IDLE: 'IDLE',
    MOVING: 'MOVING',
    GRABBING: 'GRABBING',
    DROPPING: 'DROPPING',
    SHUFFLING: 'SHUFFLING',
    SHOW_RESULT: 'SHOW_RESULT'
};

// (v1) Game Logic Constants
export const CLAW_SPEED_PPS = 15; // (v21) Changed to Percent Per Second
export const MAX_ITEMS = 100; // (v7)
export const PERFORMATIVE_FAIL_CHANCE = 0.20; // (v4)
export const MIN_CLAW_POS = 15;
export const MAX_CLAW_POS = 85;
// (v12) Ball Colors
export const BALL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
// (v18) New Tolerance
export const CLAW_TOLERANCE_PX = 30; // (v21) Increased tolerance