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

    player.$inject = ['$rootScope', '$q', 'userSettings', 'watchProgress', 'config', 'platform', 'dataStore'];
    function player ($rootScope, $q, userSettings, watchProgress, config, platform, dataStore) {

        /**
         * Holds instantiated player services.
         */
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

            // default pid is... 'default'!
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
         * for a player instance and handles all 'global'
         * events such as watch progress and quality
         * changes.
         *
         * @param   {string} pid     Unique simple identifier for player service
         * @param   {object} options Extra options for player
         * @returns {object}         Service API
         */
        function playerService(pid) {

            var continueWatching = userSettings.settings.continueWatching && config.options.enableContinueWatching,
                pinHandlers = {},
                playerId,
                requestQualityChange,
                lastPos,
                started,
                pinned,
                performedConditionalSeek,
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
                time: onTime,
                playlistItem: onPlaylistItem
            };

            /**
             * Set all scope variables to their original values.
             */
            function construct() {

                // set all vars in scope to their default values
                requestQualityChange = false;
                lastPos = 0;
                started = false;
                pinned = false;
                performedConditionalSeek = false;

                startTime = null;
                item = null;
                watchProgressItem = null;
                playerInstance = null;
                levels = null;

                // create promise for player instantiation
                playerInstantiated = $q(function (resolve) {

                    // break resolve method out of scope
                    playerInstantiatedResolve = resolve;
                });
            }

            /**
             * Clear the player and this service.
             *
             * Called when mini player is dismissed by user.
             */
            function clear() {

                // remove player instance
                playerInstance.remove();

                // wait for next event loop
                window.setTimeout(function() {
                    // re-construct
                    construct();

                    // setup player again with same player id
                    setup(playerId);
                }, 1);
            }

            /**
             * Completely destroy the player and
             * this service.
             */
            function destroy() {

                // call jwplayer remove
                playerInstance.remove();

                // undefine service
                delete playerServices[pid];
            }

            /**
             * Create a jwplayer instance for an element ID.
             *
             * Called by directive.
             *
             * @param {string} id
             */
            function setup(id) {

                // move id into scope so we can re-use it later
                playerId = id;

                // create player instance
                playerInstance = jwplayer(id);

                // resolve playerInstantiated promise
                playerInstantiatedResolve();
            }

            /**
             * Initialize/setup the player instance.
             *
             * Will wait for the directive to
             * have instantiated the player.
             *
             * @param {object} settings      Settings for jwplayer
             * @param {object} playlistItem  Current playlist item
             * @param {object} options       Additional options
             * @param {object} events        Player events and handlers to bind
             */
            function init(settings, playlistItem, options, events) {

                // wait for playerInstance to have been created
                playerInstantiated.then(function() {

                    // move playlistItem into scope for re-use
                    item = playlistItem;

                    // set watchProgressItem only if we have item
                    watchProgressItem = item && watchProgress.getItem(item);

                    // parse options
                    if (options.startTime) {
                        // set local startTime so video can start there
                        startTime = options.startTime;
                    }

                    settings = angular.extend({
                        controls: true
                    }, settings);

                    // override autostart for mobile devices
                    if (window.cordova || platform.isMobile) {
                        settings.autostart = false;
                    }

                    // call setup on jwplayer instance
                    playerInstance.setup(settings);

                    // TODO: this won't do anything
                    // if (window.cordova && settings.autostart) {

                    //     playerInstance.once('playlistItem', function () {
                    //         setTimeout(function () {
                    //             this.play(true);
                    //         }.bind(this), 1);
                    //     });
                    // }

                    // add default and custom event listeners to playerInstance
                    setPlayerEventHandlers(PLAYER_EVENTS);
                    setPlayerEventHandlers(events);
                });
            }

            function setPlayerEventHandlers(events) {
                // loop through event names and handlers
                angular.forEach(events, function (fn, type) {
                    // set on playerInstance
                    playerInstance.on(type, fn);
                });
            }

            function onFirstFrame() {

                if (!levels) {
                    return;
                }

                started = true;

                // hd turned off
                // set quality to last lowest level
                if (true === userSettings.settings.conserveBandwidth) {
                    var levelsLength = levels.length;
                    playerInstance.setCurrentQuality(levelsLength > 2 ? levelsLength - 2 : levelsLength);
                }
            }

            function onLevels(event) {

                levels = event.levels;
            }

            function onComplete() {

                if (item) {
                    watchProgress.removeItem(item);
                }
            }

            function onTime(event) {

                var position = Math.round(event.position);

                // is quality change was requested, handle it here
                if (false !== requestQualityChange) {
                    playerInstance.setCurrentQuality(requestQualityChange);
                    requestQualityChange = false;
                }

                // occasionally the onTime event fires before the onPlay or onFirstFrame event.
                // so we have to prevent updating the watchProgress before the video has started
                if (!started) {
                    return;
                }

                // always check and perform at least one conditional seek
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

            function onPlaylistItem(event) {

                // search item in dataStore
                var newItem = dataStore.getItem(event.item.mediaid);

                // if item is not loaded in showcase
                if (!newItem) {

                    // return when publisher has showcaseContentOnly set to true
                    if (config.options.showcaseContentOnly) {
                        return;
                    }

                    // fallback to item given in event object
                    newItem = event.item;
                }

                // return if item doesn't exist or its the same item
                if (newItem.mediaid === item.mediaid) {
                    return;
                }

                // reset lastPos
                lastPos = 0;
                item = newItem;
            }

            /**
             * Seek to time given in stateParams when set or resume the watch progress
             */
            function performConditionalSeek() {

                performedConditionalSeek = true;

                // if a custom startTime was passed in options
                if (startTime) {
                    playerInstance.seek(startTime);

                    startTime = null;

                    return;
                }

                // if continue watching enabled and a watchProgressItem is available
                if (continueWatching && angular.isDefined(watchProgressItem)) {
                    // resume video playback at last saved position from watchProgress

                    var toWatchProgress = watchProgressItem ? watchProgressItem.progress : 0;

                    if (toWatchProgress > 0) {
                        playerInstance.seek(toWatchProgress * item.duration);
                    }
                }
            }

            /**
             * When called with boolean value, this
             * method will set the requestQualityChange
             * variable, which is handled in the `onTime`
             * handler, and will lower or raise
             * the video's quality.
             *
             * @param   {boolean} value If video quality should be lowered
             * @returns {void}
             */
            function lowerBandwidth(value) {

                // nothing to do when no video quality levels
                if (!levels) {
                    return;
                }

                var toQuality = 0;
                var levelsLength = levels.length;

                if (true === value) {
                    toQuality = levelsLength > 2 ? levelsLength - 2 : levelsLength;
                }

                // set to integer value so `onTime` will handle it
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

            /**
             * Checks if player can be pinned.
             *
             * @returns {boolean} If player is pinable
             */
            function canPin() {

                // only 'mobile' player is pinnable
                if (platform.isMobile && pid === 'mobile') {
                    // players that have not yet started will not be pinned
                    var state = playerInstance.getState();
                    return state === 'playing' || state === 'paused';
                }
            }

            /**
             * Pin player by checking if it's possible, and firing
             * the registered pin handler.
             *
             * @returns {void}
             */
            function pin() {

                if (!canPin()) {
                    return;
                }

                pinned = true;

                firePinHandler('pin');
            }

            /**
             * Unpin player by checking if it's pinned, and firing the
             * registered unpin event handler.
             *
             * @returns {void}
             */
            function unpin() {

                if (!pinned) {
                    return;
                }

                firePinHandler('unpin');

                pinned = false;
            }

            /**
             * Return local pinned boolean.
             *
             * Can be used to check if player is pinned.
             *
             * @returns {boolean} If player is pinned
             */
            function isPinned() {

                return pinned;
            }

            /**
             * Set handler to fire when player gets (un)pinned.
             *
             * @param {string}   eventName 'pin' or 'unpin'
             * @param {function} handler   Method to call on event
             */
            function setPinHandler(eventName, handler) {

                pinHandlers[eventName] = handler;
            }

            /**
             * Fire registered (un)pin event handler.
             *
             * @param   {string} eventName 'pin' or 'unpin'
             * @returns {void}
             */
            function firePinHandler(eventName) {

                if (!pinHandlers[eventName]) {
                    return;
                }

                // call with playerInstance
                pinHandlers[eventName](playerInstance);
            }

            /**
             * Based on whether the player can be pinned,
             * will either pin or clear the player.
             */
            function onLeaveVideoPage() {
                if (canPin()) {
                    // do it!
                    pin();
                } else {
                    // traditional clear
                    clear();
                }
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

                onLeaveVideoPage: onLeaveVideoPage,

                on: setPinHandler,

                pin:      pin,
                unpin:    unpin,
                isPinned: isPinned,

                setup:          setup,
                init:           init,
                lowerBandwidth: lowerBandwidth,
                destroy:        destroy,
                clear:          clear,

                playerMethod: playerMethod,

                getInstance: function() {
                    return playerInstance;
                },
                getItem: function() {
                    return item;
                }
            };

        }
    }

}());
