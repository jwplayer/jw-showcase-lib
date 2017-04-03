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

    var MOBILE_SCREEN = window.matchMedia('(max-device-width: 767px)').matches;

    angular
        .module('jwShowcase.dashboard')
        .controller('DashboardController', DashboardController);

    /**
     * @ngdoc controller
     * @name jwShowcase.dashboard.DashboardController
     *
     * @requires $state
     * @requires jwShowcase.core.dataStore
     * @requires jwShowcase.core.userSettings
     * @requires jwShowcase.config
     */
    DashboardController.$inject = ['$scope', '$state', 'dataStore', 'userSettings', 'config'];
    function DashboardController ($scope, $state, dataStore, userSettings, config) {

        var vm = this;

        vm.dataStore             = dataStore;
        vm.userSettings          = userSettings;
        vm.showWatchProgressFeed = showWatchProgressFeed;
        vm.isMobileScreen        = MOBILE_SCREEN;

        vm.cardClickHandler = cardClickHandler;

        activate();

        ////////////

        /**
         * Initialize controller
         */
        function activate () {

            $state.history = [];
        }

        /**
         * @ngdoc method
         * @name jwShowcase.dashboard.DashboardController#cardClickHandler
         * @methodOf jwShowcase.dashboard.DashboardController
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
                slug:      item.$slug,
                autoStart: clickedOnPlay || !!window.cordova
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.dashboard.DashboardController#showWatchProgressFeed
         * @methodOf jwShowcase.dashboard.DashboardController
         *
         * @description
         * Determine if the watch progress feed needs to be shown
         *
         * @returns {boolean} True if the watchProgress feed needs to be shown
         */
        function showWatchProgressFeed () {

            var itemsLength = dataStore.watchProgressFeed.playlist.length;

            return config.enableContinueWatching && userSettings.settings.continueWatching && itemsLength > 0;
        }
    }

}());
