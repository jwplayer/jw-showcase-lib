/**
 * Copyright 2015 Longtail Ad Solutions Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 **/

(function () {

    angular
        .module('jwShowcase.core')
        .service('player', player);

    /**
     * @ngdoc service
     * @name jwShowcase.core.player
     *
     * @description
     * This service is used to enable interaction to a Jwplayer instance. The playerDelegate can be set, but is
     * automatically set by the {@link jwShowcase.core.directive:jwPlayer `jwPlayerDirective`}.
     */

    player.$inject = ['$rootScope', '$q', 'userSettings', 'watchProgress', 'config', 'platform'];
    function player ($rootScope, $q, userSettings, watchProgress, config, platform) {

        var playerServices = {};

        this.getService    = getService;

        activate();

        ////////////////

        function activate() {

            $rootScope.$watch(function () {
                return userSettings.settings.conserveBandwidth;
            }, conserveBandwidthChangeHandler);
        }

        /**
         * Get player instance
         * @returns {*}
         */
        function getService (pid) {

            pid = pid || 'default';

            if (!playerServices[pid]) {
                // create new scope for player service
                playerServices[pid] = playerService(pid);
            }

            return playerServices[pid];
        }

        /**
         * Handle conserveBandwidth setting change
         *
         * @param {boolean} value
         */
        function conserveBandwidthChangeHandler(value) {

            // loop through all services
            angular.forEach(playerServices, function(service) {
                service.lowerBandwidth(value);
            });
        }

        /**
         * Player service creates a scope specifically
         * for a player instance and handles all global
         * events such as watch progress and quality
         * changes.
         *
         * @param    {String}  pid             Unique simple identifier for player service
         * @param    {Object}  options         Extra options for player
         * @returns  {Object}                  Service API
         */
        function playerService(pid) {

            var continueWatching = userSettings.settings.continueWatching && config.options.enableContinueWatching,
                requestQualityChange,
                lastPos,
                started,
                pinned,
                performedConditionalSeek,
                eventHandlers,
                playerId,
                startTime,
                item,
                watchProgressItem,
                playerInstance,
                levels,
                playerInstantiated,
                playerInstantiatedResolve;

            construct();

            // default player events to handle
            var PLAYER_EVENTS = {
                firstFrame: onFirstFrame,
                levels: onLevels,
                complete: onComplete,
                time: onTime
            };

            function construct() {
                requestQualityChange = false;
                lastPos = 0;
                started = false;
                pinned = false;
                performedConditionalSeek = false;
                eventHandlers = {};

                startTime = null;
                item = null;
                watchProgressItem = null;
                playerInstance = null;
                levels = null;

                playerInstantiated = null;
                playerInstantiatedResolve = null;

                playerInstantiated = $q(function (resolve) {

                    // break resolve method out of scope
                    playerInstantiatedResolve = resolve;
                });
            }

            function getInstance() {

                return playerInstance;
            }

            function getItem() {

                return item;
            }

            function setup(id) {
                playerId = id;

                playerInstance = jwplayer(id);

                // resolve playerInstantiated promise
                playerInstantiatedResolve();
            }

            function init(settings, playlistItem, options, events) {

                // wait for playerInstance
                playerInstantiated.then(function() {

                    update(playlistItem, options);

                    settings = angular.extend({
                        controls: true
                    }, settings);

                    // override autostart for mobile devices
                    if (window.cordova || platform.isMobile) {
                        settings.autostart = false;
                    }

                    // call setup on jwplayer
                    playerInstance = playerInstance.setup(settings);

                    if (window.cordova && settings.autostart) {

                        playerInstance.once('playlistItem', function () {
                            setTimeout(function () {
                                this.play(true);
                            }.bind(this), 1);
                        });
                    }

                    // add default event listeners to playerInstance
                    setPlayerEventHandlers(PLAYER_EVENTS);
                    setPlayerEventHandlers(events);
                });
            }

            function update(playlistItem, options) {

                item = playlistItem;

                // set watchProgressItem only if we have item
                watchProgressItem = item && watchProgress.getItem(item);

                // set relevant options

                if (options.startTime) {
                    startTime = options.startTime;
                }
            }

            function setPlayerEventHandlers(events) {
                angular.forEach(events, function (fn, type) {
                    playerInstance.on(type, fn);
                });
            }

            /**
             * Handle firstFrame event
             */
            function onFirstFrame() {

                if (!levels) {
                    return;
                }

                started = true;

                var levelsLength = levels.length;

                // hd turned off
                // set quality to last lowest level
                if (true === userSettings.settings.conserveBandwidth) {
                    playerInstance.setCurrentQuality(levelsLength > 2 ? levelsLength - 2 : levelsLength);
                }
            }

            /**
             * Handle levels event
             *
             * @param event
             */
            function onLevels(event) {

                levels = event.levels;
            }

            /**
             * Handle complete event
             */
            function onComplete() {

                if (item) {
                    watchProgress.removeItem(item);
                }
            }

            /**
             * Handle time event
             *
             * @param event
             */
            function onTime(event) {

                var position = Math.round(event.position);

                if (false !== requestQualityChange) {
                    playerInstance.setCurrentQuality(requestQualityChange);
                    requestQualityChange = false;
                }

                // occasionally the onTime event fires before the onPlay or onFirstFrame event.
                // so we have to prevent updating the watchProgress before the video has started
                if (!started) {
                    return;
                }

                if (!performedConditionalSeek) {
                    return performConditionalSeek();
                }

                if (item) {
                    // handle updating watchprogress
                    if (Math.abs(lastPos - position) > 5) {
                        lastPos = position;
                        watchProgress.handler(item, event.position / event.duration);
                    }
                }
            }

            /**
             * Seek to time given in stateParams when set or resume the watch progress
             */
            function performConditionalSeek() {

                performedConditionalSeek = true;

                if (startTime) {
                    playerInstance.seek(startTime);

                    startTime = null;

                    return;
                }

                if (continueWatching && angular.isDefined(watchProgressItem)) {
                    // resume video playback at last saved position from watchProgress

                    var toWatchProgress = watchProgressItem ? watchProgressItem.progress : 0;

                    if (toWatchProgress > 0) {
                        playerInstance.seek(toWatchProgress * item.duration);
                    }
                }
            }

            function lowerBandwidth(value) {

                // nothing to do
                if (!levels) {
                    return;
                }

                var toQuality = 0;
                var levelsLength = levels.length;

                if (true === value) {
                    toQuality = levelsLength > 2 ? levelsLength - 2 : levelsLength;
                }

                requestQualityChange = toQuality;
            }

            /**
             * Creates a function which calls the given method on the player delegate
             *
             * @param {string} method
             * @returns {Function}
             */
            function playerMethod(method) {

                return function () {
                    if (playerInstance && angular.isFunction(playerInstance[method])) {
                        return playerInstance[method].apply(playerInstance, Array.prototype.slice.call(arguments));
                    }
                };
            }

            function canPin() {
                if (platform.isMobile && pid === 'sticky') {
                    var state = playerInstance.getState();
                    return state === 'playing' || state === 'paused';
                }
            }

            function pin() {
                if (!canPin()) {
                    return;
                }

                pinned = true;

                fireEventHandlers('pin');
            }

            function unpin() {
                if (!pinned) {
                    return;
                }

                fireEventHandlers('unpin');

                pinned = false;
            }

            function isPinned() {
                return pinned;
            }

            function clear() {
                var container = playerInstance.getContainer();

                playerInstance.remove();

                setTimeout(function() {

                    construct();
                    setup(playerId);
                }, 1000);
            }

            function destroy() {
                // call jwplayer remove
                playerInstance.remove();

                // undefine service
                delete playerServices[pid];
            }

            function setEventHandler(eventName, handler) {
                if (!eventHandlers[eventName]) {
                    // initialize
                    eventHandlers[eventName] = [];
                }

                eventHandlers[eventName].push(handler);
            }

            function removeEventHandler(eventName, handler) {
                if (!eventHandlers[eventName]) {
                    // nothing to do
                    return;
                }

                var index = eventHandlers[eventName].indexOf(handler);
                if (index !== -1) {
                    // remove from array
                    eventHandlers[eventName].splice(index, 1);
                }
            }

            function fireEventHandlers(eventName) {
                if (!eventHandlers[eventName]) {
                    return;
                }

                angular.forEach(eventHandlers[eventName], function(handler) {
                    // call handler with playerInstance
                    handler(playerInstance);
                });
            }

            return {
                play:              playerMethod('play'),
                pause:             playerMethod('pause'),
                stop:              playerMethod('stop'),
                seek:              playerMethod('seek'),
                getState:          playerMethod('getState'),
                playlistItem:      playerMethod('playlistItem'),
                setCurrentQuality: playerMethod('setCurrentQuality'),
                load:              playerMethod('load'),

                setPlayerEventHandlers: setPlayerEventHandlers,

                on:      setEventHandler,
                off:     removeEventHandler,
                trigger: fireEventHandlers,

                pin:      pin,
                unpin:    unpin,
                isPinned: isPinned,

                setup:          setup,
                init:           init,
                update:         update,
                getInstance:    getInstance,
                getItem:        getItem,
                lowerBandwidth: lowerBandwidth,
                destroy:        destroy,
                clear:          clear,

                playerMethod: playerMethod
            };

        }
    }

}());
