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
            $stickyContainerEl = angular.element($element.find('div')[0]);

        vm.returnToVideo = returnToVideo;

        // player event handlers
        player.onPin(onPin);
        player.onUnpin(onUnpin);

        function returnToVideo() {
            if (isDragging) {
                return;
            }

            var playlistItem = player.getPlayer().getPlaylistItem();
            if (!playlistItem) {
                return;
            }

            return $state.go('root.video', {
                feedId:    playlistItem.feedid,
                mediaId:   playlistItem.mediaid,
                slug:      playlistItem.$slug
            });
        }

        function onPin(playerInstance, resume) {
            // make sure the container is reset
            resetContainerDrag();

            $stickyContainerEl.addClass('is-active');

            var playerInstanceEl = playerInstance.getContainer();

            // move player to this element
            $stickyContainerEl[0].appendChild(playerInstanceEl);

            addSwipeHandling(angular.element(playerInstanceEl));

            $timeout(function () {
                playerInstance.resize();
                playerInstance.setControls(false);

                if (resume) {
                    playerInstance.play();
                }
            }, 1);
        }

        function dismiss() {
            player.dismiss();

            resetContainerDrag();
            $stickyContainerEl.removeClass('is-active');
        }

        function onUnpin() {
            var oldPlayerInstance = player.getPlayer();

            $stickyContainerEl.one(
                utils.getPrefixedEventNames('animationEnd'),
                function() {
                    window.requestAnimationFrame(function() {
                        // remove manually
                        oldPlayerInstance.remove();
                        // empty sticky container div manually because jwplayer leaves stuff after removal
                        $stickyContainerEl.empty();

                        resetContainerDrag();
                        $stickyContainerEl.removeClass('is-active');

                        $stickyContainerEl.removeClass('is-deactivating');
                    });
                }
            );

            $stickyContainerEl.addClass('is-deactivating');
        }

        function addSwipeHandling($playerInstanceEl) {
            // threshold in pixels to swipe
            var threshold = 150;

            // start position
            var start = 0;
            var moved = 0;

            betterSwipe.bind(
                $playerInstanceEl,
                {
                    start: function(coords, event) {
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
                            transform: 'translateX(' + diff + 'px)',
                            opacity: 1 - moved
                        });
                    },
                    end: function() {
                        if (moved >= 1) {
                            dismiss();
                        } else {
                            resetContainerDrag();
                        }
                    },
                    cancel: function() {
                        resetContainerDrag();
                    },
                    leave: function() {
                        if (moved >= 1) {
                            dismiss();
                        } else {
                            resetContainerDrag();
                        }
                    }
                }
            );
        }

        function resetContainerDrag() {
            $stickyContainerEl.removeClass('is-dragging');
            $stickyContainerEl.removeAttr('style');
            $stickyContainerEl.one(utils.getPrefixedEventNames('transitionEnd'), function(event) {
                isDragging = false;
            });
        }

    }

}());
