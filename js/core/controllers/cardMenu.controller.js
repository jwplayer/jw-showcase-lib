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
        .controller('CardMenuController', CardMenuController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.controller:CardMenuController
     *
     * @requires $scope
     * @requires $timeout
     * @requires jwShowcase.core.watchlist
     * @requires jwShowcase.core.watchProgress
     */
    CardMenuController.$inject = ['$scope', '$timeout', 'watchlist', 'watchProgress'];
    function CardMenuController ($scope, $timeout, watchlist, watchProgress) {

        var vm = this;

        vm.inWatchlist     = false;
        vm.inWatchProgress = false;

        vm.closeButtonClickHandler  = closeButtonClickHandler;
        vm.saveButtonClickHandler   = saveButtonClickHandler;
        vm.unsaveButtonClickHandler = unsaveButtonClickHandler;
        vm.removeButtonClickHandler = removeButtonClickHandler;

        activate();

        ////////////////////////

        /**
         * Initialize controller
         */
        function activate () {

            vm.inWatchlist     = watchlist.hasItem(vm.item);
            vm.inWatchProgress = watchProgress.hasItem(vm.item);

            $scope.$watch(function () {
                return watchlist.hasItem(vm.item);
            }, function (val, oldVal) {
                if (val !== oldVal) {
                    $timeout(function () {
                        vm.inWatchlist = val;
                    }, 200);
                }
            }, false);
        }

        /**
         * Handle click event on close button
         */
        function closeButtonClickHandler () {

            if (angular.isFunction(vm.onClose)) {
                vm.onClose();
            }
        }

        /**
         * Handle click event on save button
         */
        function saveButtonClickHandler () {

            watchlist.addItem(vm.item);
            vm.jwCard.showToast({template: 'savedVideo', duration: 1000});

            $timeout(function() {
                vm.onClose();
            }, 500);
        }

        /**
         * Handle click event on unsave button
         */
        function unsaveButtonClickHandler () {

            watchlist.removeItem(vm.item);
            vm.jwCard.showToast({template: 'unsavedVideo', duration: 1000});

            $timeout(function() {
                vm.onClose();
            }, 500);
        }

        /**
         * Handle click event on remove button
         */
        function removeButtonClickHandler () {

            watchProgress.removeItem(vm.item);
            vm.jwCard.showToast({template: 'removedVideo', duration: 1000});

            $timeout(function() {
                vm.onClose();
            }, 500);
        }
    }

})();
