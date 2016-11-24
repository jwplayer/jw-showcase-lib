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

    var LARGE_SCREEN = window.matchMedia('(min-device-width: 960px)').matches;

    angular
        .module('jwShowcase.core')
        .controller('CardController', CardController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.controller:CardController
     * @requires $rootScope
     * @requires $scope
     * @requires jwShowcase.core.utils
     * @requires jwShowcase.core.player
     */
    CardController.$inject = ['$rootScope', '$scope', '$state', 'utils', 'watchlist', 'player'];
    function CardController ($rootScope, $scope, $state, utils, watchlist, player) {

        var vm = this;

        vm.getClassNames          = getClassNames;
        vm.clickHandler           = clickHandler;
        vm.menuButtonClickHandler = menuButtonClickHandler;
        vm.closeMenuHandler       = closeMenuHandler;
        vm.watchlistClickHandler  = watchlistClickHandler;

        vm.duration    = 0;
        vm.menuVisible = false;
        vm.inWatchList = false;
        vm.toast       = null;
        vm.posterUrl   = getPosterUrl();
        vm.nowPlaying  = false;
        vm.player      = player;

        vm.play = function () {
            player.play();
        };

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
         * Handle watchlistclick event
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
         * Handle jwCardMenu:open event
         * @param {$event} event
         * @param {$scope} targetScope
         */
        function cardMenuOpenEventHandler (event, targetScope) {

            if (targetScope === $scope) {
                return;
            }

            vm.menuVisible = false;
            vm.toast       = null;
        }

        /**
         * @returns {Object.<string, boolean>}
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
         * Return poster url with optimal quality for screen size
         * @returns {string}
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
         * @param {Object}      event               Event object
         * @param {boolean}     clickedOnPlayIcon   True if the user clicked on the play icon
         */
        function clickHandler (event, clickedOnPlayIcon) {

            if (angular.isFunction(vm.onClick)) {
                vm.onClick(vm.item, clickedOnPlayIcon);
            }

            event.preventDefault();
            event.stopImmediatePropagation();
        }

        /**
         * Handle click on more button
         * @param event
         */
        function menuButtonClickHandler (event) {

            event.stopImmediatePropagation();
            vm.menuVisible = true;

            $rootScope.$broadcast('jwCardMenu:open', $scope);
        }

        /**
         * Close menu
         */
        function closeMenuHandler () {

            vm.menuVisible = false;
        }
    }

}());
