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
        .controller('HeaderMenuButtonController', HeaderMenuButtonController);

    /**
     * @ngdoc controller
     * @name jwShowcase.core.HeaderMenuButtonController
     *
     * @requires jwShowcase.core.menu
     */
    HeaderMenuButtonController.$inject = ['menu'];
    function HeaderMenuButtonController (menu) {

        var vm = this;

        vm.menuButtonClickHandler = menuButtonClickHandler;

        ////////////////

        /**
         * @ngdoc method
         * @name jwShowcase.core.HeaderMenuButtonController#menuButtonClickHandler
         * @methodOf jwShowcase.core.HeaderMenuButtonController
         *
         * @description
         * Handle click event on the menu button.
         *
         * @param {$event} event Synthetic event object.
         */
        function menuButtonClickHandler () {

            menu.toggle();
        }
    }

}());
