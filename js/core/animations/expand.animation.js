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
        .animation('.jw-expand-animation', expandAnimation);

    /**
     * @ngdoc overview
     * @name jwShowcase.core.expandAnimation
     *
     * @description
     * Animation which animates the height when entering or leaving.
     */

    expandAnimation.$inject = ['$timeout'];
    function expandAnimation ($timeout) {

        /**
         * Notify scrollCtrl that a resize happened
         * @param element
         */
        function notifyScroll (element) {

            var scrollElement = ionic.DomUtil.getParentWithClass(element, 'scroll-content', 10);

            if (scrollElement) {
                angular.element(scrollElement).scope().scrollCtrl.resize();
            }
        }

        return {
            enter: function (element, done) {

                element.css({
                    opacity: 0,
                    height:  0
                });

                $timeout(function () {
                    element.css({
                        opacity: 1,
                        height:  element[0].scrollHeight + 'px'
                    });

                    $timeout(function () {
                        element.css('height', 'auto');
                        notifyScroll(element[0]);
                        done();
                    }, 300);
                }, 100);
            },

            leave: function (element, done) {

                element.css({
                    height: element[0].scrollHeight + 'px'
                });

                $timeout(function () {
                    element.css({
                        opacity: 0,
                        height:  0
                    });

                    $timeout(function () {
                        notifyScroll(element[0]);
                        done();
                    }, 300);
                }, 100);
            }
        };
    }

}());
