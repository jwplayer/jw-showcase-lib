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
     * @name jwSearch
     * @module jwShowcase.core
     *
     * @description
     * Render the header menu element.
     *
     * @example
     *
     * ```html
     * <jw-header-menu></jw-header-menu>
     * ```
     */
    angular
        .module('jwShowcase.core')
        .component('jwSearch', {
            controllerAs: 'vm',
            controller:   SearchController,
            templateUrl:  'views/core/search.html'
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.SearchController
     *
     * @requires jwShowcase.config
     */
    SearchController.$inject = ['$rootScope', '$state', 'config', 'apiConsumer'];
    function SearchController ($rootScope, $state, config, apiConsumer) {

        var vm = this;

        vm.config   = config;

        vm.searchPhrase    = '';
        vm.searchBarActive = false;

        vm.closeSearchButtonClickHandler = closeSearchButtonClickHandler;
        vm.searchButtonClickHandler      = searchButtonClickHandler;
        vm.searchInputKeyupHandler       = searchInputKeyupHandler;
        vm.searchInputChangeHandler      = searchInputChangeHandler;

        vm.$onInit = activate;

        //////////////////

        function activate () {

            $rootScope.$on('$stateChangeSuccess', function (event, toState) {

                if ('root.search' !== toState.name) {
                    vm.searchPhrase    = '';
                    vm.searchBarActive = false;
                }
            });
        }

        function closeSearchButtonClickHandler () {

            vm.searchBarActive = false;
            vm.searchPhrase    = '';
        }

        function searchButtonClickHandler () {

            vm.searchBarActive = true;

            setTimeout(function () {
                document.querySelector('.jw-search-input').focus();
            }, 300);
        }

        function searchInputKeyupHandler (event) {

            // esc
            if (27 === event.which) {

                vm.searchPhrase    = '';
                vm.searchBarActive = false;
            }

            // enter
            if (13 === event.which) {

                searchAndDisplayResults();
            }
        }

        function searchInputChangeHandler () {

            searchAndDisplayResults();
        }


        /**
         * Get search results and go to search state
         */
        function searchAndDisplayResults () {

            apiConsumer
                .getSearchFeed(vm.searchPhrase)
                .then(function () {

                    if ($state.$current.name !== 'root.search') {
                        $state.go('root.search');
                    }
                });
        }
    }

}());
