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
        .component('jwButtonBack', {
            controller:   ButtonBackController,
            controllerAs: 'vm',
            templateUrl:  'views/core/buttonBack.html'
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.ButtonBackController
     *
     * @requires $state
     * @requires $ionicHistory
     * @requires $ionicViewSwitcher
     * @requires jwShowcase.core.dataStore
     */
    ButtonBackController.$inject = ['$state', '$ionicHistory', '$ionicViewSwitcher', 'dataStore'];
    function ButtonBackController ($state, $ionicHistory, $ionicViewSwitcher, dataStore) {

        var vm = this;

        vm.backButtonClickHandler = backButtonClickHandler;

        ////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.core.ButtonBackController#backButtonClickHandler
         * @methodOf jwShowcase.core.ButtonBackController
         *
         * @description
         * Handle click event on the back button.
         */
        function backButtonClickHandler () {

            var viewHistory         = $ionicHistory.viewHistory(),
                backView            = viewHistory.backView,
                watchlistLength     = dataStore.watchlistFeed.playlist.length,
                watchProgressLength = dataStore.watchProgressFeed.playlist.length,
                stateName, stateParams;

            if (backView) {

                stateName   = backView.stateName;
                stateParams = backView.stateParams;

                if (stateName === 'root.feed') {

                    // watchlist is empty, do not return to this state
                    if (stateParams.feedId === dataStore.watchlistFeed.feedid && !watchlistLength) {
                        return goToDashboard();
                    }

                    // watchProgress is empty, do not return to this state
                    if (stateParams.feedId === dataStore.watchProgressFeed.feedid && !watchProgressLength) {
                        return goToDashboard();
                    }
                }

                // return to backView, but prevent going though all video states. Only go back to the last video state
                // if the current state is not the video state.
                if (stateName !== 'root.video' || $state.$current.name !== 'root.video') {
                    $ionicViewSwitcher.nextDirection('back');
                    $ionicHistory.goBack();
                    return;
                }
            }

            navigateBackInHierarchy();
        }

        /**
         * Navigate back in view hierarchy
         */
        function navigateBackInHierarchy () {

            var viewHistory = $ionicHistory.viewHistory(),
                history     = viewHistory.histories[$ionicHistory.currentHistoryId()],
                stack       = history ? history.stack : [],
                stackIndex  = history.cursor - 1,
                equalState;

            if (stackIndex > 0) {

                while (stackIndex >= 0) {

                    equalState = stack[stackIndex].stateId === viewHistory.currentView.stateId;

                    // search until dashboard or feed state is found
                    if (stack[stackIndex].stateName !== 'root.video' && !equalState) {
                        $ionicViewSwitcher.nextDirection('back');
                        stack[stackIndex].go();
                        return;
                    }

                    stackIndex--;
                }
            }

            // fallback to dashboard
            goToDashboard();
        }

        /**
         * Go to dashboard state with back transition
         */
        function goToDashboard () {

            $ionicViewSwitcher.nextDirection('back');
            $state.go('root.dashboard');
        }
    }

}());
