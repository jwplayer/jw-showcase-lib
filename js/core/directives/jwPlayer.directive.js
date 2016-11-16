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

    var PLAYER_EVENTS = ['ready', 'play', 'pause', 'complete', 'seek', 'error', 'playlistItem', 'time', 'firstFrame',
        'levels'];

    angular
        .module('jwShowcase.core')
        .directive('jwPlayer', JwPlayerDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.video.directive:jwPlayer
     *
     * @description
     * This directive is used to create an Jwplayer instance.
     *
     * @param {Object=} settings Jwplayer settings that will be used in the `.setup()` method.
     *
     * @requires $parse
     * @requires $timeout
     * @requires jwShowcase.core.utils
     * @requires config
     *
     * @example
     *
     * ```
     * <jw-player settings="vm.playerSettings" on-play="vm.onPlayEvent"></jw-player>
     * ```
     *
     */
    JwPlayerDirective.$inject = ['$parse', '$timeout', 'utils', 'config'];
    function JwPlayerDirective ($parse, $timeout, utils, config) {

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
                backElement, playerInstance;

            activate();

            ////////////////////////

            /**
             * Initialize directive
             */
            function activate () {

                angular
                    .element(element[0])
                    .attr('id', playerId);

                if (window.jwplayerSdk) {
                    initializeSdk();
                    return;
                }

                initialize();
            }

            /**
             * Initialize JS player
             */
            function initialize () {

                playerInstance = jwplayer(playerId)
                    .setup(angular.extend({}, scope.settings));

                bindPlayerEventListeners();

                scope.$on('$destroy', function () {
                    $timeout(function () {
                        playerInstance.remove();
                    }, 1000);
                });
            }

            /**
             * Initialize SDK
             */
            function initializeSdk () {

                var rect             = element[0].getBoundingClientRect(),
                    topOffset        = Math.ceil(rect.top),
                    scrollElement    = ionic.DomUtil.getParentWithClass(element[0], 'scroll-content'),
                    aspectPercentage = scope.settings.aspectratio === '16:9' ? '56.25%' : '75%';

                backElement = angular
                    .element('<div></div>')
                    .css({
                        backgroundColor: '#000',
                        position:        'absolute',
                        top:             topOffset + 'px',
                        left:            0,
                        width:           scope.settings.width,
                        paddingTop:      aspectPercentage
                    });

                angular.element(scrollElement)
                    .parent()
                    .append(backElement);

                // push scrollElement down
                scrollElement.style.marginTop = aspectPercentage;

                // so event callbacks can use plugin methods
                playerInstance = window.jwplayerSdk;

                setTimeout(function () {
                    window.jwplayerSdk.init(angular.extend({}, scope.settings));
                    window.jwplayerSdk.move(0, topOffset);
                    window.jwplayerSdk.sendToBack();

                    bindPlayerEventListeners();

                    // ready event
                    setTimeout(function () {
                        backElement.css('display', 'none');
                        window.jwplayerSdk.bringToFront();
                    }, 50);
                }, 500);

                scope.$on('jwMenu.visible', function () {
                    window.jwplayerSdk.sendToBack();
                });

                scope.$on('jwMenu.hidden', function () {
                    window.jwplayerSdk.bringToFront();
                });

                scope.$on('$stateChangeStart', function () {

                    backElement.css('display', 'block');

                    setTimeout(function () {
                        window.jwplayerSdk.sendToBack();
                        window.jwplayerSdk.remove();
                    }, 10);
                });

                scope.$on('$destroy', function () {
                    backElement.remove();
                });
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
