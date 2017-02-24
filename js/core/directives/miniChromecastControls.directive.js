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
        .directive('jwMiniChromecastControls', miniChromecastControlsDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwMiniChromecastControls
     * @module jwShowcase.core
     */

    miniChromecastControlsDirective.$inject = ['utils'];
    function miniChromecastControlsDirective (utils) {

        return {
            restrict:         'E',
            controller:       'MiniChromecastControlsController',
            controllerAs:     'vm',
            templateUrl:      'views/core/miniChromecastControls.html',
            bindToController: true,
            transclude:       false,
            replace:          true,
            link:             link
        };

        function link (scope, element) {

        }
    }

}());

