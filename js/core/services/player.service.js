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

    player.$inject = ['$rootScope', 'userSettings', 'watchProgress', 'config'];
    function player ($rootScope, userSettings, watchProgress, config) {

        var playerServices = {};

        this.createService = createService;
        this.getService    = getService;

        activate();

        ////////////////

        function activate() {

            $rootScope.$watch(function () {
                return userSettings.settings.conserveBandwidth;
            }, conserveBandwidthChangeHandler);
        }

        /**
         * (Un)set player instance
         *
         * @param player
         */
        function createService (player, options) {

            options.pid = options.pid || 'default';

            playerServices[options.pid] = playerService(player, options);
        }

        /**
         * Get player instance
         * @returns {*}
         */
        function getService (pid) {

            pid = pid || 'default';

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

        function playerService(playerInstance, options) {

            var pid                      = options.pid,
                item                     = options.item || null,
                watchProgressItem        = item ? watchProgress.getItem(item) : null,
                startTime                = options.startTime || null,
                requestQualityChange     = false,
                lastPos                  = 0,
                started                  = false,
                performedConditionalSeek = false,
                PLAYER_EVENTS            = {
                    firstFrame: onFirstFrame,
                    levels: onLevels,
                    complete: onComplete,
                    time: onTime
                },
                levels,
                onPinHandler,
                onUnpinHandler;


            function getInstance() {
                return playerInstance;
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

                watchProgress.removeItem(item);
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

                if (Math.abs(lastPos - position) > 5) {
                    lastPos = position;
                    watchProgress.handler(item, event.position / event.duration);
                }
            }

            /**
             * Seek to time given in stateParams when set or resume the watch progress
             */
            function performConditionalSeek() {

                var continueWatching = userSettings.settings.continueWatching && config.options.enableContinueWatching;

                performedConditionalSeek = true;

                if (startTime) {
                    playerInstance.seek(startTime);

                    startTime = null;

                    return;
                }

                if (continueWatching && angular.isDefined(watchProgressItem)) {
                    resumeWatchProgress();
                }
            }

            /**
             * Resume video playback at last saved position from watchProgress
             */
            function resumeWatchProgress() {

                var toWatchProgress = watchProgressItem ? watchProgressItem.progress : 0;

                if (toWatchProgress > 0) {
                    playerInstance.seek(toWatchProgress * item.duration);
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

            /**
             * Add event listeners to playerInstance
             */
            angular.forEach(PLAYER_EVENTS, function (fn, type) {
                playerInstance.on(type, fn);
            });

            // set handler for pin event piping
            function onPin(handler) {

                onPinHandler = handler;
            }

            // set handler for unpin event piping
            function onUnpin(handler) {

                onUnpinHandler = handler;
            }

            // pipe method through to sticky player's handler
            function pin() {

                if (!onPinHandler) {
                    return;
                }

                onPinHandler(playerInstance);
            }

            // pipe method through to sticky player's handler
            function unpin() {

                if (!onUnpinHandler) {
                    return;
                }

                onUnpinHandler(playerInstance);
            }

            function destroy() {

                // call jwplayer remove
                playerInstance.remove();

                // undefine service
                delete playerServices[pid];
            }

            return {
                play: playerMethod('play'),
                pause: playerMethod('pause'),
                stop: playerMethod('stop'),
                seek: playerMethod('seek'),
                getState: playerMethod('getState'),
                playlistItem: playerMethod('playlistItem'),
                setCurrentQuality: playerMethod('setCurrentQuality'),
                load: playerMethod('load'),

                getInstance: getInstance,
                lowerBandwidth: lowerBandwidth,
                onPin: onPin,
                onUnpin: onUnpin,
                pin: pin,
                unpin: unpin,
                destroy: destroy
            };

        }
    }

}());
