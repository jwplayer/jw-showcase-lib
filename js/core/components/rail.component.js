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

    /**
     * @ngdoc component
     * @name jwRail
     * @module jwShowcase.core
     *
     * @description
     * Render the rail element.
     *
     * @example
     *
     * ```html
     * <jw-rail feed="vm.feed" on-item-click="vm.itemClickHandler()"></jw-rail>
     * ```
     */
    angular
        .module('jwShowcase.core')
        .component('jwRail', {
            controllerAs: 'vm',
            controller:   RailController,
            templateUrl:  'views/core/rail.html',
            bindings:     {
                feed:             '<',
                currentlyPlaying: '<',
                onItemClick:      '&'
            }
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.RailController
     */
    RailController.$inject = [];
    function RailController () {

        var vm = this;

        vm.itemClickHandler = itemClickHandler;
        vm.showMoreButtonClickHandler = showMoreButtonClickHandler;

        vm.firstItem        = undefined;
        vm.items            = [];
        vm.itemsLimit       = 3;

        vm.$onChanges = changeHandler;

        //////////

        /**
         * Handle changes in component bindings
         */
        function changeHandler () {

            if (!vm.currentlyPlaying) {
                vm.items = vm.feed.playlist.slice();
                return;
            }

            var currentlyPlayingIndex = vm.feed.playlist.findIndex(function (item) {
                return item.mediaid === vm.currentlyPlaying.mediaid;
            });

            // copy and reorder playlist
            vm.items = vm.feed.playlist
                .slice(currentlyPlayingIndex)
                .concat(vm.feed.playlist.slice(0, currentlyPlayingIndex));

            // remove currently playing
            vm.items.shift();

            // set first item
            vm.firstItem = vm.items.shift();
        }

        /**
         * Handle click event on item
         * @param item
         */
        function itemClickHandler (item) {

            if (!angular.isFunction(vm.onItemClick)) {
                return;
            }

            // call function
            vm.onItemClick({newItem: item, clickedOnPlay: false});
        }

        /**
         * Handle click on show more button
         */
        function showMoreButtonClickHandler () {

            vm.itemsLimit = vm.items.length;
        }

    }

}());
