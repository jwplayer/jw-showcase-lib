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

    var PLAYER_EVENTS = ['ready', 'play', 'pause', 'complete', 'seek', 'error', 'setupError', 'playlistItem', 'time',
        'firstFrame', 'levels', 'adImpression'];

    angular
        .module('jwShowcase.core')
        .directive('jwPlayer', JwPlayerDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwPlayer
     * @module jwShowcase.core
     *
     * @description
     * This directive is used to create a Jwplayer instance.
     *
     * @param {Object=} settings Jwplayer settings that will be used in the `.setup()` method.
     *
     * @requires $parse
     * @requires $timeout
     * @requires jwShowcase.core.utils
     * @requires jwShowcase.core.player
     *
     * @example
     *
     * ```
     * <jw-player settings="vm.playerSettings" on-play="vm.onPlayEvent"></jw-player>
     * ```
     */
    JwPlayerDirective.$inject = ['$parse', '$timeout', 'utils', 'player', 'platform', 'onScroll'];
    function JwPlayerDirective ($parse, $timeout, utils, player, platform, onScroll) {

        return {
            scope:       {
                settings: '='
            },
            replace:     false,
            templateUrl: 'views/core/jwPlayer.html',
            link:        link
        };

        function link (scope, element, attr) {

            var playerId = generateRandomId(),
                onScrollDesktop,
                onScrollMobile,
                initTimeoutId,
                playerInstance;

            // get applicable DOM elements
            var $videoPlayerContainerEl = angular.element(document.querySelector('.jw-video-container-player'));
            var $headerEl = angular.element(document.querySelector('.jw-header'));

            /**
             * Player offset from top
             * @type  {Number}
             */
            var playerOffsetTop = 0;

            var playerStuck = false;

            activate();

            ////////////////////////

            /**
             * Initialize directive
             */
            function activate () {

                element
                    .find('div')
                    .attr('id', playerId);

                initTimeoutId = setTimeout(initialize, 500);

                scope.$on('$destroy', function () {

                    // prevent initialisation
                    clearTimeout(initTimeoutId);

                    // reset sticky player
                    stickPlayer(false);

                    // remove sticky player scroll handlers
                    removeScrollHandlers();

                    if (playerInstance && platform.screenSize() === 'mobile') {
                        var state = playerInstance.getState();
                        if (state === 'playing' || state === 'paused') {
                            // pin player
                            player.pin(state === 'playing');

                            return;
                        }
                    }

                    // remove player instance after timeout
                    $timeout(function () {

                        // only remove player when the service instance is this player instance. Otherwise we could
                        // potentially unset an already set player because this is wrapped in a timeout.
                        if (player.getPlayer() === playerInstance) {
                            player.setPlayer(null);
                        }

                        if (playerInstance) {
                            playerInstance.remove();
                        }
                    }, 1000);
                });
            }

            /**
             * Initialize JS player
             */
            function initialize () {

                var settings = angular.extend({
                    controls: true
                }, scope.settings);

                // determine autostart
                if (settings.resume && settings.resume !== null) {
                    // resume takes precedence
                    settings.autostart = settings.resume;
                } else {
                    // override autostart for mobile devices
                    if (window.cordova || platform.isMobile) {
                        settings.autostart = false;
                    }
                }

                playerInstance = jwplayer(playerId)
                    .setup(settings);

                setupScrollHandlers();
                bindPlayerEventListeners();

                if (window.cordova && scope.settings.autostart) {

                    playerInstance.once('playlistItem', function () {
                        setTimeout(function() {
                            this.play(true);
                        }.bind(this), 1);
                    });
                }

                player.setPlayer(playerInstance);
            }

            /**
             * Add event listeners to playerInstance
             */
            function bindPlayerEventListeners () {

                // custom events from directive
                PLAYER_EVENTS.forEach(function (type) {
                    playerInstance.on(type, function (event) {
                        proxyEvent(type, event);
                    });
                });
            }

            /**
             * Proxy JW Player event to directive attribute
             *
             * @param {string} type
             * @param {Object} event
             */
            function proxyEvent (type, event) {

                var attrName = 'on' + utils.ucfirst(type),
                    parsed;

                parsed = $parse(attr[attrName])(scope.$parent);

                if (!angular.isFunction(parsed)) {
                    return;
                }

                // prevent $digest every time event
                if (type === 'time') {
                    return parsed.call(playerInstance, event);
                }

                $timeout(function () {
                    parsed.call(playerInstance, event);
                });
            }

            /**
             * Generate random player id
             * @returns {*}
             */
            function generateRandomId () {

                var randomNumber = Math.round(Math.random() * 10000),
                    candidateId  = 'player-' + randomNumber;

                if (!document.querySelector('#' + candidateId)) {
                    return candidateId;
                }

                return generateRandomId();
            }

            function setupScrollHandlers() {
                var previousScreenSize = platform.screenSize();

                function setupHandlersForScreensize(evt) {
                    var screenSize = platform.screenSize();
                    // if screen size did not change
                    if (previousScreenSize === screenSize && evt !== null) {
                        return;
                    }

                    // set screen size specific scroll handler for sticky player
                    if (platform.screenSize() === 'mobile') {
                        // unstick desktop
                        stickPlayer(false);

                        onScrollDesktop && onScrollDesktop.clear();
                        onScrollMobile = onScroll.bind(mobileScrollHandler);
                    } else {
                        // unstick mobile
                        stickPlayer(false, true);

                        onScrollMobile && onScrollMobile.clear();
                        onScrollDesktop = onScroll.bind(desktopScrollHandler);
                    }

                    previousScreenSize = platform.screenSize();
                }

                // calculate proper player top offset
                playerOffsetTop = utils.getElementOffsetTop($videoPlayerContainerEl[0]);

                // pass `null` to force initialisation
                setupHandlersForScreensize(null);

                // reset handlers on resize
                window.addEventListener('resize', utils.debounce(setupHandlersForScreensize, 200));
            }

            function removeScrollHandlers() {
                onScrollDesktop && onScrollDesktop.clear();
                onScrollMobile && onScrollMobile.clear();
            }

            function stickPlayer(state, forMobile) {
                if (playerStuck === state) {
                    return;
                }

                playerStuck = state;

                if (forMobile) {
                    // stick player to top of screen

                    playerInstance.utils.toggleClass($headerEl[0], 'is-hidden', state);
                    playerInstance.utils.toggleClass($videoPlayerContainerEl[0], 'is-pinned', state);
                } else {
                    // stick smaller player to bottom right of screen

                    if (playerInstance) {
                        // wait for animation to finish
                        $videoPlayerContainerEl.one(
                            utils.getPrefixedEventNames('animationEnd'),
                            function() {
                                window.requestAnimationFrame(function() {
                                    // update the player's size so the controls are adjusted
                                    playerInstance.resize();
                                });
                            }
                        );
                    }

                    // toggle class (and animation)
                    playerInstance.utils.toggleClass($videoPlayerContainerEl[0], 'minimized', state);
                }
            }

            function mobileScrollHandler() {
                // stick when we've scrolled passed header height
                stickPlayer(utils.getScrollTop() > 60, true);
            }

            function desktopScrollHandler() {
                // stick when we've scrolled passed the player's top
                stickPlayer(utils.getScrollTop() > playerOffsetTop);
            }

        }

    }

}());
