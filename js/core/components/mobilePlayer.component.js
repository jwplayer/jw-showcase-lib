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
        .component('jwMobilePlayer', {
            controllerAs:     'vm',
            controller:       MobilePlayerController,
            templateUrl:      'views/core/mobilePlayer.html'
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.MobilePlayerController
     *
     * @requires $element
     * @requires $timeout
     * @requires $state
     * @requires jwShowcase.core.betterSwipe
     * @requires jwShowcase.core.player
     */
    MobilePlayerController.$inject = ['$element', '$timeout', '$state', 'betterSwipe', 'utils', 'player'];
    function MobilePlayerController ($element, $timeout, $state, betterSwipe, utils, player) {

        var vm = this,
            isDragging = false,
            $containerEl = angular.element($element.find('div')[0]),
            playerService = player.getService('mobile'),
            swiper;

        vm.returnToVideo = returnToVideo;

        // register event handlers on player service
        playerService.on('pin', onPin);
        playerService.on('unpin', onUnpin);

        // setup swipe handling asap
        addSwipeHandling($containerEl);

        function returnToVideo() {

            // ignore click handler when dragging mini player or when player is not pinned
            if (isDragging || !playerService.isPinned()) {
                return;
            }

            // get current playlist item from video to determine the page to navigate to
            var item = playerService.getItem();
            if (!item) {
                return;
            }

            return $state.go('root.video', {
                feedId:  item.feedid,
                mediaId: item.mediaid,
                slug:    item.$slug
            });
        }

        /**
         * Handle pin and unpin event and transition.
         *
         * @param {object}  playerInstance Instance of jwplayer
         * @param {boolean} pinned         If player is pinned
         */
        function afterPinTransition(playerInstance, pinned) {

            // wait for transition end event
            $containerEl.one(utils.getPrefixedEventNames('transitionEnd'), function () {
                // (de)activate swiper when (not) pinned
                swiper.active(pinned);

                // improve render speed
                window.requestAnimationFrame(function () {
                    // resize and hide controls if pinned
                    playerInstance.resize();
                    playerInstance.setControls(!pinned);
                });
            });
        }

        /**
         * Handle pinning player.
         *
         * Fired when player gets pinned.
         *
         * @param {object} playerInstance Instance of jwplayer
         */
        function onPin(playerInstance) {

            // make sure the container is reset
            resetContainerDrag();

            afterPinTransition(playerInstance, true);

            $containerEl.addClass('is-pinned');
        }

        /**
         * Handle unpinning player.
         *
         * Fired when player gets unpinned.
         *
         * @param {object} playerInstance Instance of jwplayer
         */
        function onUnpin(playerInstance) {

            afterPinTransition(playerInstance, false);

            $containerEl.removeClass('is-pinned');
        }

        /**
         * Handle manual mini player dismissal.
         */
        function dismiss() {

            // reset/reinstantiate player (service) and its properties
            playerService.clear();

            resetContainerDrag();
            $containerEl.removeClass('is-pinned');

            // deactive swiper
            swiper.active(false);
        }

        /**
         * Add swipe handling for mobile player element.
         *
         * @param {object} el Mobile player container element
         */
        function addSwipeHandling(el) {

            // threshold in pixels to swipe
            var threshold = 150;

            // start position
            var start = 0;
            var moved = 0;

            // bind betterSwipe to element and handle events
            swiper = betterSwipe.bind(
                el,
                {
                    start: function(coords, event) {
                        // no need to do anything if player is not pinned
                        if (!playerService.isPinned()) {
                            return;
                        }

                        // remember start position
                        start = coords.x;

                        // add css class to prevent transitions when dragging
                        $containerEl.addClass('is-dragging');
                    },
                    move: function(coords, event) {
                        var diff = coords.x - start;

                        // if absolute threshold reached in either direction (0 to 1)
                        moved = Math.abs(diff) / threshold;

                        if (moved > 0) {
                            isDragging = true;
                        }

                        // update css based on how much the container was dragged
                        $containerEl.css({
                            marginLeft: diff + 'px',
                            opacity: 1 - moved
                        });
                    },
                    end: function() {
                        // if we moved past the threshold
                        if (moved >= 1) {
                            dismiss();
                        } else {
                            resetContainerDrag();
                        }

                        start = 0;
                        moved = 0;
                    },
                    cancel: function() {
                        resetContainerDrag();

                        start = 0;
                        moved = 0;
                    },
                    leave: function() {
                        // if we moved past the threshold
                        if (moved >= 1) {
                            dismiss();
                        } else {
                            resetContainerDrag();
                        }

                        start = 0;
                        moved = 0;
                    }
                }
            );

            // not active by default
            swiper.active(false);
        }

        /**
         * Reset container's original positionm.
         */
        function resetContainerDrag() {

            if ($containerEl.hasClass('is-dragging')) {
                // wait for drag reset transition to finish
                $containerEl.one(utils.getPrefixedEventNames('transitionEnd'), function (event) {
                    isDragging = false;
                });
            } else {
                isDragging = false;
            }

            $containerEl.removeClass('is-dragging');
            $containerEl.removeAttr('style');
        }

    }

}());
