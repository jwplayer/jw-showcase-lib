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
        .controller('HeaderSearchBarController', HeaderSearchBarController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.HeaderBackButtonController
     *
     * @requires $state
     * @requires jwShowcase.core.appStore
     * @requires jwShowcase.core.apiConsumer
     */
    HeaderSearchBarController.$inject = ['$state', 'appStore', 'apiConsumer'];
    function HeaderSearchBarController ($state, appStore, apiConsumer) {

        var vm = this;

        vm.appStore = appStore;

        vm.closeSearchButtonClickHandler = closeSearchButtonClickHandler;
        vm.searchInputChangeHandler      = searchInputChangeHandler;
        vm.searchInputKeyupHandler       = searchInputKeyupHandler;

        ////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.core.HeaderSearchBarController#closeSearchButtonHandler
         * @methodOf jwShowcase.core.HeaderSearchBarController
         *
         * @description
         * Handle click event on the close search button.
         *
         * @param {$event} event Synthetic event object.
         */
        function closeSearchButtonClickHandler () {

            appStore.searchBarActive = false;
            appStore.searchPhrase    = '';
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.HeaderSearchBarController#searchInputChangeHandler
         * @methodOf jwShowcase.core.HeaderSearchBarController
         *
         * @description
         * Handle change event off the search input.
         *
         * @param {$event} event Synthetic event object.
         */
        function searchInputChangeHandler () {

            searchAndDisplayResults();
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.HeaderSearchBarController#searchInputKeyupHandler
         * @methodOf jwShowcase.core.HeaderSearchBarController
         *
         * @description
         * Handle keyup event off the search input.
         *
         * @param {$event} event Synthetic event object.
         */
        function searchInputKeyupHandler ($event) {

            // esc
            if (27 === $event.which) {

                appStore.searchPhrase    = '';
                appStore.searchBarActive = false;
            }

            // enter
            if (13 === $event.which) {

                searchAndDisplayResults();
            }
        }

        /**
         * Get search results and go to search state
         */
        function searchAndDisplayResults () {

            apiConsumer
                .getSearchFeed(appStore.searchPhrase)
                .then(function () {

                    if ($state.$current.name !== 'root.search') {
                        $state.go('root.search');
                    }
                });
        }
    }

}());
