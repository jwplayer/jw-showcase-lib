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
        .component('jwStickyPlayer', {
            controllerAs:     'vm',
            controller:       StickyPlayerController,
            templateUrl:      'views/core/stickyPlayer.html'
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.StickyPlayerController
     *
     * @requires $element
     * @requires $timeout
     * @requires $state
     * @requires jwShowcase.core.betterSwipe
     * @requires jwShowcase.core.player
     */
    StickyPlayerController.$inject = ['$element', '$timeout', '$state', 'betterSwipe', 'utils', 'player'];
    function StickyPlayerController ($element, $timeout, $state, betterSwipe, utils, player) {

        var vm = this,
            isDragging = false,
            $stickyContainerEl = angular.element($element.find('div')[0]),
            playerService = player.getService('sticky'),
            swiper;

        vm.returnToVideo = returnToVideo;

        playerService.on('pin', onPin);
        playerService.on('unpin', onUnpin);

        addSwipeHandling($stickyContainerEl);

        function returnToVideo() {
            // prevent click handler from firing when dragging mini player
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

        function afterPinTransition(playerInstance, pinned) {
            $stickyContainerEl.one(utils.getPrefixedEventNames('transitionEnd'), function () {
                window.requestAnimationFrame(function () {
                    // activate swiper is pinned
                    swiper.active(pinned);

                    // resize and hide controls if pinned
                    playerInstance.resize();
                    playerInstance.setControls(!pinned);
                });
            });
        }

        function onPin(playerInstance) {
            // make sure the container is reset
            resetContainerDrag();

            afterPinTransition(playerInstance, true);

            $stickyContainerEl.addClass('is-stuck');
        }

        function onUnpin(playerInstance) {
            afterPinTransition(playerInstance, false);

            $stickyContainerEl.removeClass('is-stuck');
        }

        function dismiss() {
            playerService.clear();

            resetContainerDrag();
            $stickyContainerEl.removeClass('is-stuck');

            // deactive swiper
            swiper.active(false);
        }

        function addSwipeHandling(el) {
            // threshold in pixels to swipe
            var threshold = 150;

            // start position
            var start = 0;
            var moved = 0;

            swiper = betterSwipe.bind(
                el,
                {
                    start: function(coords, event) {
                        if (!playerService.isPinned()) {
                            return;
                        }

                        // remember start position
                        start = coords.x;

                        // add css class to prevent transitions
                        $stickyContainerEl.addClass('is-dragging');
                    },
                    move: function(coords, event) {
                        var diff = coords.x - start;

                        // if absolute threshold reached in either direction (0 to 1)
                        moved = Math.abs(diff) / threshold;

                        if (moved > 0) {
                            isDragging = true;
                        }

                        // update css based on how much the container was dragged
                        $stickyContainerEl.css({
                            marginLeft: diff + 'px',
                            opacity: 1 - moved
                        });
                    },
                    end: function() {
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

        function resetContainerDrag() {
            if ($stickyContainerEl.hasClass('is-dragging')) {
                // wait for drag reset transition to finish
                $stickyContainerEl.one(utils.getPrefixedEventNames('transitionEnd'), function (event) {
                    isDragging = false;
                });
            } else {
                isDragging = false;
            }

            $stickyContainerEl.removeClass('is-dragging');
            $stickyContainerEl.removeAttr('style');
        }

    }

}());
