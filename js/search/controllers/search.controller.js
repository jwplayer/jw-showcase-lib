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
        .module('jwShowcase.search')
        .controller('SearchController', SearchController);

    /**
     * @ngdoc controller
     * @name jwShowcase.search.SearchController
     */
    SearchController.$inject = ['$scope', '$state', '$stateParams', 'platform', 'searchFeed', 'api'];
    function SearchController ($scope, $state, $stateParams, platform, searchFeed, api) {

        var vm = this;

        vm.cardClickHandler     = cardClickHandler;
        vm.showMoreClickHandler = showMoreClickHandler;
        vm.itemsLeft            = itemsLeft;

        vm.feed = null;

        var limit = 10;

        if ($stateParams.searchInCaptions) {
            var partFeed = searchFeed.clone();

            partFeed.playlist = searchFeed.playlist.slice(0, limit);

            addItemsToFeed(partFeed.playlist).then(function () {
                vm.feed = partFeed;

                $scope.$apply();
            });
        } else {
            vm.feed = searchFeed;
        }

        function addItemsToFeed (items) {
            var query = $stateParams.query.replace(/\+/g, ' ');

            var patchItemPromises = items.map(function (item) {
                return api.patchItemWithCaptions(item, query);
            });

            return Promise.all(patchItemPromises);
        }

        ////////////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.search.SearchController#cardClickHandler
         * @methodOf jwShowcase.search.SearchController
         *
         * @description
         * Handle click event on the card.
         *
         * @param {jwShowcase.core.item}    item            Clicked item
         * @param {boolean}                 clickedOnPlay   Did the user clicked on the play button
         * @param {number}                  [startTime]     Time to seek to once the video starts
         */
        function cardClickHandler (item, clickedOnPlay, startTime) {
            $state.go('root.videoFromSearch', {
                query:     $state.params.query,
                mediaId:   item.mediaid,
                slug:      item.$slug,
                startTime: startTime,
                autoStart: clickedOnPlay || platform.isMobile || typeof startTime !== 'undefined'
            });
        }

        /**
         * Are there any items left to show
         * @returns {boolean}
         */
        function itemsLeft() {
            return  !!(vm.feed && (searchFeed.playlist.length > vm.feed.playlist.length));
        }

        /**
         * @ngdoc method
         * @name jwShowcase.search.SearchController#showMoreClickHandler
         * @methodOf jwShowcase.search.SearchController
         *
         * @description
         * Handle click event on the show more button
         */
        function showMoreClickHandler () {
            var feedPlaylistLength = vm.feed.playlist.length;
            var toBeAddedMediaItems = searchFeed.playlist.slice(feedPlaylistLength, feedPlaylistLength + limit);

            addItemsToFeed(toBeAddedMediaItems).then(function () {
                vm.feed.playlist = vm.feed.playlist.concat(toBeAddedMediaItems);

                $scope.$apply();
            });
        }
    }

}());
