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

    /**
     * @ngdoc component
     * @name jwDropdown
     * @module jwShowcase.core
     */

    angular
        .module('jwShowcase.core')
        .directive('jwDropdown', dropdownDirective);

    function dropdownDirective () {
        return {
            restrict:     'EA',
            controller:   DropdownController,
            controllerAs: 'vm',
            templateUrl:  'views/core/dropdown.html',
            transclude:   true,
            scope:        {
                open: '='
            }
        };
    }

    /**
     * @ngdoc controller
     * @name jwShowcase.core.DropdownController
     */
    DropdownController.$inject = ['$scope'];
    function DropdownController ($scope) {

        var vm = this;


        vm.isOpen = false;

        vm.toggle = toggle;
        vm.open   = open;
        vm.close  = close;

        $scope.$watch('open', function () {
           vm.isOpen = $scope.open;
        });

        ////////////////

        /**
         * Toggle dropdown
         */
        function toggle () {
            return vm.isOpen ? close() : open();
        }

        /**
         * Close dropdown
         */
        function close () {
            angular.element(document.body).off('click', clickOutside);
            vm.isOpen = false;
        }

        /**
         * Open dropdown
         */
        function open () {
            angular.element(document.body).on('click', clickOutside);
            vm.isOpen = true;
        }

        /**
         * Handle click outside
         */
        function clickOutside () {

            $scope.$apply(function () {
                close();
            });
        }
    }

}());