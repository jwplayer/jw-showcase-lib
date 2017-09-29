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
         * for a player instance and handles all 'global'
         * events such as watch progress and quality
         * changes.
         *
         * @param    {String}  pid             Unique simple identifier for player service
         * @param    {Object}  options         Extra options for player
         * @returns  {Object}                  Service API
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
                time: onTime
            };

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

            function clear() {
                // remove player instance
                playerInstance.remove();

                window.setTimeout(function() {
                    // re-construct
                    construct();

                    // setup player again with same player id
                    setup(playerId);
                }, 1);
            }

            function destroy() {
                // call jwplayer remove
                playerInstance.remove();

                // undefine service
                delete playerServices[pid];
            }

            function setup(id) {
                // move id into scope so we can re-use it later
                playerId = id;

                // create player instance
                playerInstance = jwplayer(id);

                // resolve playerInstantiated promise
                playerInstantiatedResolve();
            }

            function init(settings, playlistItem, options, events) {

                // wait for playerInstance to have been created
                playerInstantiated.then(function() {

                    update(playlistItem, options);

                    settings = angular.extend({
                        controls: true
                    }, settings);

                    // override autostart for mobile devices
                    if (window.cordova || platform.isMobile) {
                        settings.autostart = false;
                    }

                    // call setup on jwplayer instance
                    playerInstance.setup(settings);

                    // TODO: this won't do
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

            function update(playlistItem, options) {

                // move playlistItem into scope for re-use
                item = playlistItem;

                // set watchProgressItem only if we have item
                watchProgressItem = item && watchProgress.getItem(item);

                // parse options
                if (options.startTime) {
                    startTime = options.startTime;
                }
            }

            function setPlayerEventHandlers(events) {
                angular.forEach(events, function (fn, type) {
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

                firePinHandler('pin');
            }

            function unpin() {
                if (!pinned) {
                    return;
                }

                firePinHandler('unpin');

                pinned = false;
            }

            function isPinned() {
                return pinned;
            }

            function setPinHandler(eventName, handler) {

                pinHandlers[eventName] = handler;
            }

            function firePinHandler(eventName) {
                if (!pinHandlers[eventName]) {
                    return;
                }

                pinHandlers[eventName](playerInstance);
            }

            function onLeaveVideoPage() {
                if (canPin()) {
                    pin();
                } else {
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
                update:         update,
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
