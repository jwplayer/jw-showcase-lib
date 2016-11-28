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
 * express or implied. See the License on the specific language
 * governing permissions and limitations under the License.
 **/

(function () {

    var LARGE_SCREEN = window.matchMedia('(min-device-width: 960px)').matches;

    angular
        .module('jwShowcase.core')
        .controller('CardController', CardController);

    /**
     * @ngdoc event
     * @name CardController#jwCardMenu:open
     * @eventType broadcast on root scope
     * @description
     * Broadcasted when the card menu opens.
     *
     * @param {$event} event Synthetic event object.
     * @param {$scope} targetScope Scope where event was broadcasted from.
     */

    /**
     * @ngdoc controller
     * @name jwShowcase.core.CardController
     *
     * @requires $rootScope
     * @requires $scope
     * @requires $state
     * @requires jwShowcase.core.utils
     * @requires jwShowcase.core.watchlist
     * @requires jwShowcase.core.player
     */
    CardController.$inject = ['$rootScope', '$scope', '$state', 'utils', 'watchlist', 'player'];
    function CardController ($rootScope, $scope, $state, utils, watchlist, player) {

        var vm = this;

        vm.getClassNames          = getClassNames;
        vm.clickHandler           = clickHandler;
        vm.menuButtonClickHandler = menuButtonClickHandler;
        vm.watchlistClickHandler  = watchlistClickHandler;

        vm.duration      = 0;
        vm.menuVisible   = false;
        vm.inWatchList   = false;
        vm.watchProgress = vm.item.feedid === 'continue-watching';
        vm.toast         = null;
        vm.posterUrl     = getPosterUrl();
        vm.nowPlaying    = false;
        vm.player        = player;

        activate();

        ////////////////

        /**
         * Initialize controller
         */
        function activate () {

            vm.duration    = utils.getVideoDurationByItem(vm.item);
            vm.inWatchList = watchlist.hasItem(vm.item);

            $scope.$on('jwCardMenu:open', cardMenuOpenEventHandler);
            $scope.$on('$stateUpdate', update);

            $scope.$watch(function () {
                return watchlist.hasItem(vm.item);
            }, function (val, oldVal) {
                if (val !== oldVal) {
                    vm.inWatchList = val;
                }
            });

            update();
        }

        /**
         * Update controller
         */
        function update () {

            var current = $state.current,
                params  = $state.params;

            vm.nowPlaying = current.name === 'root.video' && params.mediaId === vm.item.mediaid && params.feedId === vm.item.feedid;
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.CardController#watchlistClickHandler
         * @methodOf jwShowcase.core.CardController
         *
         * @description
         * Handle click event on the watchlist button.
         *
         * @param {$event} event Synthetic event object.
         */
        function watchlistClickHandler (event) {

            if (watchlist.hasItem(vm.item) === true) {

                vm.inWatchList = false;

                vm.showToast({
                    templateUrl: 'views/core/toasts/unsavedVideo.html',
                    duration:    1200
                }).then(function () {
                    watchlist.removeItem(vm.item);
                });
            }

            event.preventDefault();
            event.stopImmediatePropagation();
        }

        /**
         * @name cardMenuOpenEventHandler
         *
         * @description
         * Handle jwCardMenu:open event.
         *
         * @param {$event} event Synthetic event object.
         * @param {$scope} targetScope Scope where event was broadcasted from.
         */
        function cardMenuOpenEventHandler (event, targetScope) {

            if (targetScope === $scope) {
                return;
            }

            vm.menuVisible = false;
            vm.toast       = null;
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.CardController#getClassNames
         * @methodOf jwShowcase.core.CardController
         *
         * @description
         * Returns Object with classNames and whether they should be added or not.
         */
        function getClassNames () {

            return {
                'jw-card-flag-featured':    vm.featured,
                'jw-card-flag-default':     !vm.featured,
                'jw-card-flag-touch':       'ontouchstart' in window ||
                                            (window.DocumentTouch && document instanceof window.DocumentTouch),
                'jw-card-flag-now-playing': vm.nowPlaying,
                'jw-card-flag-menu-open':   vm.menuVisible
            };
        }

        /**
         * @ngdoc method
         * @name getPosterUrl
         *
         * @description
         * Returns poster URL with preferred resolution.
         */
        function getPosterUrl () {

            var width = vm.featured ? 1280 : 640;

            // half width when user has a small screen
            if (false === LARGE_SCREEN) {
                width = width / 2;
            }

            return utils.replaceImageSize(vm.item.image, width);
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.CardController#clickHandler
         * @methodOf jwShowcase.core.CardController
         *
         * @description
         * Handle click event on the card or play button.
         *
         * @param {$event} event Synthetic event object.
         * @param {boolean} clickedOnPlayIcon True if the r clicked on the play icon.
         */
        function clickHandler (event, clickedOnPlayIcon) {

            event.preventDefault();
            event.stopImmediatePropagation();

            if (true === vm.nowPlaying && clickedOnPlayIcon) {
                player.play();
            }

            if (angular.isFunction(vm.onClick)) {
                vm.onClick(vm.item, clickedOnPlayIcon);
            }
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.CardController#menuButtonClickHandler
         * @methodOf jwShowcase.core.CardController
         *
         * @param {$event} event Event object
         * @description
         * Handle click event on the menu button.
         *
         * @fires CardController#jwCardMenu:open
         */
        function menuButtonClickHandler (event) {

            event.stopImmediatePropagation();
            vm.menuVisible = true;

            $rootScope.$broadcast('jwCardMenu:open', $scope);
        }
    }

}());
