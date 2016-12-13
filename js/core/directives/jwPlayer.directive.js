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
    JwPlayerDirective.$inject = ['$parse', '$timeout', 'utils', 'player'];
    function JwPlayerDirective ($parse, $timeout, utils, player) {

        return {
            scope:       {
                settings: '='
            },
            replace:     true,
            templateUrl: 'views/core/jwPlayer.html',
            link:        link
        };

        function link (scope, element, attr) {

            var playerId = generateRandomId(),
                initTimeoutId,
                playerInstance;

            activate();

            ////////////////////////

            /**
             * Initialize directive
             */
            function activate () {

                angular
                    .element(element[0])
                    .attr('id', playerId);

                initTimeoutId = setTimeout(initialize, 500);

                scope.$on('$destroy', function () {

                    // prevent initialisation
                    clearTimeout(initTimeoutId);

                    // remove player instance after timeout
                    $timeout(function () {
                        player.setPlayer(null);
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

                // override autostart
                if (window.cordova) {
                    settings.autostart = false;
                }

                playerInstance = jwplayer(playerId)
                    .setup(settings);

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

                if (angular.isFunction(parsed)) {
                    $timeout(function () {
                        parsed.call(playerInstance, event);
                    }, 1);
                }
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
        }
    }

}());
