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

    angular
        .module('jwShowcase.core')
        .component('jwSidebar', {
            templateUrl:  'views/core/sidebar.html',
            controller:   SidebarController,
            controllerAs: 'vm'
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.SidebarController
     *
     * @requires jwShowcase.core.popup
     * @requires jwShowcase.core.dataStore
     * @requires jwShowcase.core.watchlist
     * @requires jwShowcase.core.watchProgress
     * @requires jwShowcase.core.userSettings
     * @requires jwShowcase.config
     */
    SidebarController.$inject = ['popup', 'dataStore', 'watchlist', 'watchProgress', 'userSettings', 'config'];
    function SidebarController (popup, dataStore, watchlist, watchProgress, userSettings, config) {

        var vm = this;

        vm.feeds     = [];
        vm.dataStore = dataStore;
        vm.config    = config;

        vm.watchlist     = vm.dataStore.watchlistFeed;
        vm.watchProgress = vm.dataStore.watchProgressFeed;

        vm.conserveBandwidth = userSettings.settings.conserveBandwidth;
        vm.continueWatching  = userSettings.settings.continueWatching;

        vm.clearWatchlist     = clearWatchlist;
        vm.clearWatchProgress = clearWatchProgress;

        vm.onChangeHandler = function (type) {
            userSettings.set(type, vm[type]);
        };

        activate();

        ////////////////

        /**
         * Initialize controller
         */
        function activate () {

            vm.feeds = [];

            if (angular.isArray(dataStore.feeds)) {
                vm.feeds = dataStore.feeds.slice();
            }

            if (dataStore.featuredFeed) {
                vm.feeds.unshift(dataStore.featuredFeed);
            }

            vm.feeds = vm.feeds.sort(function (a, b) {
                return a.title > b.title;
            });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.SidebarController#clearWatchlist
         * @methodOf jwShowcase.core.MenuController
         *
         * @description
         * Show confirmation modal and clear watchlist if the user clicks on 'ok'.
         */
        function clearWatchlist () {


            popup
                .show({
                    controller:  'ConfirmController as vm',
                    templateUrl: 'views/core/popups/confirm.html',
                    resolve:     {
                        message: 'Do you wish to clear your Saved videos list?'
                    }
                })
                .then(function (result) {

                    if (true === result) {
                        watchlist.clearAll();
                    }
                });
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.SidebarController#clearWatchProgress
         * @methodOf jwShowcase.core.MenuController
         *
         * @description
         * Show confirmation modal and clear watchProgress if the user clicks on 'ok'.
         */
        function clearWatchProgress () {

            popup
                .show({
                    controller:  'ConfirmController as vm',
                    templateUrl: 'views/core/popups/confirm.html',
                    resolve:     {
                        message: 'Do you wish to clear your Continue watching list?'
                    }
                })
                .then(function (result) {

                    if (true === result) {
                        watchProgress.clearAll();
                    }
                });
        }
    }

}());
