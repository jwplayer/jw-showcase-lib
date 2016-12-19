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
        .module('jwShowcase.feed')
        .controller('FeedController', FeedController);

    /**
     * @ngdoc controller
     * @name jwShowcase.feed.FeedController
     *
     * @requires $scope
     */
    FeedController.$inject = ['$state', 'feed', 'config'];
    function FeedController ($state, feed, config) {

        var vm = this;

        vm.feed             = feed;
        vm.cardClickHandler = cardClickHandler;
        vm.hasHeader        = !config.hideHeader;

        ////////////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.feed.FeedController#cardClickHandler
         * @methodOf jwShowcase.feed.FeedController
         *
         * @description
         * Handle click event on the card.
         *
         * @param {jwShowcase.core.item}    item            Clicked item
         * @param {boolean}                 clickedOnPlay   Did the user clicked on the play button
         */
        function cardClickHandler (item, clickedOnPlay) {

            $state.go('root.video', {
                feedId:    item.$feedid || item.feedid,
                mediaId:   item.mediaid,
                autoStart: clickedOnPlay || ionic.Platform.isMobile
            });
        }
    }

}());
