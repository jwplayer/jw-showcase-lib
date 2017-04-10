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
        .component('jwSidebarLayout', {
            templateUrl:  'views/core/sidebarLayout.html',
            transclude:   true,
            controllerAs: 'vm',
            controller:   SidebarLayoutController
        });

    /**
     * @ngdoc controller
     * @name jwShowcase.core.SidebarLayoutController
     *
     * @requires jwShowcase.core.sidebar
     */
    SidebarLayoutController.$inject = ['sidebar'];
    function SidebarLayoutController (sidebar) {

        var vm = this;

        vm.sidebar = sidebar;

        vm.backdropClickHandler = backdropClickHandler;
        vm.swipeLeftHandler     = swipeLeftHandler;

        ///////////////


        /**
         * @ngdoc method
         * @name jwShowcase.core.SidebarLayoutController#backdropClickHandler
         * @methodOf jwShowcase.core.SidebarLayoutController
         *
         * @description
         * Handle click event on the sidebar backdrop element.
         */
        function backdropClickHandler () {

            sidebar.hide();
        }

        /**
         * @ngdoc method
         * @name jwShowcase.core.SidebarLayoutController#swipeLeftHandler
         * @methodOf jwShowcase.core.SidebarLayoutController
         *
         * @description
         * Handle swipe to the left on the sidebar element.
         */
        function swipeLeftHandler () {

            sidebar.hide();
        }
    }

}());
