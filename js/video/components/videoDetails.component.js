/**
 * Copyright 2017 Longtail Ad Solutions Inc.
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

    /**
     * @ngdoc component
     * @name jwVideoDetails
     * @module jwShowcase.video
     *
     * @description
     *
     * # jwVideoDetails
     * Render video details component.
     *
     * @example
     *
     * ```html
     * <jw-video-details item="item"></jw-video-details>
     * ```
     */
    angular
        .module('jwShowcase.video')
        .component('jwVideoDetails', {
            templateUrl:  'views/video/videoDetails.html',
            controller:   VideoDetailsController,
            controllerAs: 'vm',
            transclude:   true,
            bindings:     {
                'item': '='
            }
        });

    VideoDetailsController.$inject = ['$scope', 'popup', 'watchlist'];
    function VideoDetailsController ($scope, popup, watchlist) {

        var vm = this;

        vm.inWatchlist = false;

        vm.shareButtonClickHandler     = shareButtonClickHandler;
        vm.watchlistButtonClickHandler = watchlistButtonClickHandler;

        vm.$onInit = activate;

        //////////////

        /**
         * Initialize
         */
        function activate () {

            $scope.$watch(function () {
                return watchlist.hasItem(vm.item);
            }, function (val) {
                vm.inWatchlist = val;
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.video.VideoDetailsController#shareButtonClickHandler
         * @methodOf jwShowcase.video.ToolbarVideoController
         *
         * @description
         * Handle click event on the share button.
         */
        function shareButtonClickHandler (event) {

            popup.show({
                item:   vm.item,
                target: event.target
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.video.VideoDetailsController#watchlistButtonClickHandler
         * @methodOf jwShowcase.video.ToolbarVideoController
         *
         * @description
         * Handle click event on the watchlist button.
         */
        function watchlistButtonClickHandler () {

            if (vm.inWatchlist) {
                return watchlist.removeItem(vm.item);
            }

            watchlist.addItem(vm.item);
        }
    }

}());

