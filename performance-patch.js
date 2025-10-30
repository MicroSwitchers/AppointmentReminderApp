// Performance Optimization Patch for Visual Appointment Timer
// This file contains optimized functions to improve performance

(function() {
    'use strict';

    // DOM Element Cache
    const domCache = new Map();

    // Get or cache DOM elements
    window.getCachedElement = function(id) {
        if (!domCache.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                domCache.set(id, element);
            }
        }
        return domCache.get(id);
    };

    // Clear cache when needed
    window.clearDOMCache = function() {
        domCache.clear();
    };

    // Throttle function for performance
    window.throttle = function(func, delay) {
        let timeoutId = null;
        let lastExec = 0;

        return function(...args) {
            const elapsed = Date.now() - lastExec;

            const execute = () => {
                lastExec = Date.now();
                func.apply(this, args);
            };

            if (elapsed > delay) {
                execute();
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(execute, delay - elapsed);
            }
        };
    };

    // Debounce function
    window.debounce = function(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // RequestAnimationFrame-based timer update
    let rafId = null;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 1000; // Update every 1 second

    window.startOptimizedTimer = function(updateCallback) {
        const update = (timestamp) => {
            if (timestamp - lastUpdate >= UPDATE_INTERVAL) {
                lastUpdate = timestamp;
                updateCallback();
            }
            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
        return rafId;
    };

    window.stopOptimizedTimer = function() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    // Batch DOM updates
    window.batchDOMUpdates = function(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    };

    // Optimized element update
    window.updateElement = function(elementOrId, property, value) {
        const element = typeof elementOrId === 'string'
            ? getCachedElement(elementOrId)
            : elementOrId;

        if (!element) return;

        // Only update if value changed
        if (element[property] !== value) {
            element[property] = value;
        }
    };

    // Efficient class toggle
    window.toggleClass = function(elementOrId, className, force) {
        const element = typeof elementOrId === 'string'
            ? getCachedElement(elementOrId)
            : elementOrId;

        if (!element) return;

        if (typeof force === 'boolean') {
            element.classList.toggle(className, force);
        } else {
            element.classList.toggle(className);
        }
    };

    // Intersection Observer for visible elements only
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    const visibleElements = new Set();

    window.observeVisibility = function(element, onVisible, onHidden) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibleElements.add(element);
                    if (onVisible) onVisible(element);
                } else {
                    visibleElements.delete(element);
                    if (onHidden) onHidden(element);
                }
            });
        }, observerOptions);

        observer.observe(element);
        return observer;
    };

    window.isElementVisible = function(element) {
        return visibleElements.has(element);
    };

    // Efficient time formatting
    const timeFormatCache = new Map();

    window.formatTimeOptimized = function(hours, minutes, seconds) {
        const key = `${hours}:${minutes}:${seconds}`;

        if (timeFormatCache.has(key)) {
            return timeFormatCache.get(key);
        }

        const formatted = {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0')
        };

        // Limit cache size
        if (timeFormatCache.size > 1000) {
            timeFormatCache.clear();
        }

        timeFormatCache.set(key, formatted);
        return formatted;
    };

    // Memory-efficient event delegation
    window.delegateEvent = function(parent, selector, event, handler) {
        parent.addEventListener(event, function(e) {
            const target = e.target.closest(selector);
            if (target) {
                handler.call(target, e);
            }
        });
    };

    // Optimize CSS animations
    window.optimizeAnimations = function() {
        // Disable animations for elements not in viewport
        const style = document.createElement('style');
        style.textContent = `
            .offscreen {
                animation-play-state: paused !important;
                transition: none !important;
            }
        `;
        document.head.appendChild(style);
    };

    // Log performance metrics
    window.logPerformance = function(label) {
        if (window.performance && window.performance.memory) {
            console.log(`[Performance] ${label}:`, {
                memory: `${(window.performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
                domNodes: document.getElementsByTagName('*').length,
                cachedElements: domCache.size
            });
        }
    };

    // Initialize optimizations
    window.initPerformanceOptimizations = function() {
        // Add passive event listeners for better scroll performance
        const addPassiveListener = (event) => {
            let supportsPassive = false;
            try {
                const opts = Object.defineProperty({}, 'passive', {
                    get: function() {
                        supportsPassive = true;
                        return true;
                    }
                });
                window.addEventListener('testPassive', null, opts);
                window.removeEventListener('testPassive', null, opts);
            } catch (e) {}

            if (supportsPassive) {
                const events = ['scroll', 'touchstart', 'touchmove', 'wheel'];
                events.forEach(eventName => {
                    document.addEventListener(eventName, () => {}, { passive: true });
                });
            }
        };

        addPassiveListener();

        // Optimize animations
        optimizeAnimations();

        console.log('[Performance] Optimizations initialized');
    };

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
    } else {
        initPerformanceOptimizations();
    }

})();
