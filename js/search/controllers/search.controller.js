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
    SearchController.$inject = ['$q', '$state', '$stateParams', 'platform', 'searchFeed', 'api'];

    function SearchController ($q, $state, $stateParams, platform, searchFeed, api) {

        var vm               = this;
        var limit            = 10;
        var searchInCaptions = $stateParams.searchInCaptions && platform.screenSize() !== 'mobile';

        vm.cardClickHandler     = cardClickHandler;
        vm.showMoreClickHandler = showMoreClickHandler;
        vm.itemsLeft            = itemsLeft;

        vm.feed      = null;
        vm.searching = true;

        activate();

        ////////////////////////

        /**
         * Initialize controller
         */
        function activate () {
            if (!searchInCaptions) {
                vm.feed      = searchFeed.clone();
                vm.searching = false;
                return;
            }

            var clone = searchFeed.clone();

            clone.playlist = searchFeed.playlist.slice(0, limit);

            addItemsToFeed(clone.playlist).then(function () {
                vm.feed      = clone;
                vm.searching = false;
            });
        }

        /**
         * Add items to feed
         * @param items
         */
        function addItemsToFeed (items) {
            var query = $stateParams.query.replace(/\+/g, ' ');

            var patchItemPromises = items.map(function (item) {
                return api.patchItemWithCaptions(item, query);
            });

            return $q.all(patchItemPromises);
        }

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
        function itemsLeft () {
            return !!(vm.feed && (searchFeed.playlist.length > vm.feed.playlist.length));
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
            var feedPlaylistLength  = vm.feed.playlist.length;
            var toBeAddedMediaItems = searchFeed.playlist.slice(feedPlaylistLength, feedPlaylistLength + limit);

            addItemsToFeed(toBeAddedMediaItems).then(function () {
                vm.feed.playlist = vm.feed.playlist.concat(toBeAddedMediaItems);
            });
        }
    }

}());
