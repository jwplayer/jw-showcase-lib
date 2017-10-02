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
                pid:       '='
            },
            replace:     true,
            templateUrl: 'views/core/jwPlayer.html',
            link:        link
        };

        function link (scope, element) {

            var playerId = generateRandomId(),
                playerService = player.getService(scope.pid);

            activate();

            ////////////////////////

            /**
             * Initialize directive
             */
            function activate () {

                element
                    .find('div')
                    .find('div')
                    .attr('id', playerId);

                // create player instance through service
                playerService.setup(playerId);

                scope.$on('$destroy', function () {
                    // only remove player when the service instance is this player instance. Otherwise we could
                    // potentially unset an already set player because this is wrapped in a timeout.
                    if (player.getService(scope.pid) === playerService) {
                        playerService.destroy();
                    }
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

        }

    }

}());
