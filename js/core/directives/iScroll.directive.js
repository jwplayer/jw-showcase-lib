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
        .directive('jwIscroll', iScroll);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwIscroll
     */

    iScroll.$inject = ['$timeout'];
    function iScroll($timeout) {
        return {
            restrict: 'E',
            link: link
        };

        function link(scope, element) {
            var instance = null;
            $timeout(function () {
                instance = new IScroll(element[0], {
                    mouseWheel: true,
                    scrollbars: true
                });
            });

            scope.$on('$destroy', function() {
                if (instance) {
                    instance.destroy();
                }
            });
        }
    }
}());
