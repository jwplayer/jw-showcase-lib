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
        .directive('jwScroll', scrollDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwScrollDirective
     *
     * @example
     *
     * ```
     * <jw-scroll delegate="delegate">
     *     <ul>
     *         <li ng-repeat="item in items">{{ item }}</li>
     *     </ul>
     * </jw-scroll>
     * ```
     */

    scrollDirective.$inject = ['$timeout', 'platform'];
    function scrollDirective ($timeout, platform) {
        return {
            restrict:    'E',
            link:        link,
            transclude:  true,
            templateUrl: 'views/core/scroll.html',
            scope:       {
                delegate: '='
            }
        };

        function link (scope, element) {

            var jsScrolling = !platform.isMobile;
            var instance    = null;

            activate();

            ////////////

            /**
             * Initialize
             */
            function activate () {

                if (jsScrolling) {
                    $timeout(initializeIScroll);
                }

                scope.delegate = {
                    scrollTo: scrollTo,
                    refresh:  refresh
                };

                scope.$on('$destroy', destroyHandler);
            }

            /**
             * Handle destroy event
             */
            function destroyHandler () {

                if (instance) {
                    instance.destroy();
                }

                scope.delegate = null;
            }

            /**
             * Initialize iScroll plugin
             */
            function initializeIScroll () {

                instance = new window.IScroll(element[0].firstChild, {
                    disableMouse:   true,
                    disablePointer: true,
                    mouseWheel:     true,
                    scrollbars:     true
                });
            }

            /**
             * Scroll to given position
             * @param x
             * @param y
             * @param duration
             */
            function scrollTo (x, y, duration) {

                if (jsScrolling) {
                    instance.scrollTo(x, y, duration);
                }
                else {
                    window.TweenLite.to(element[0].firstChild, 0.3, {
                        scrollTop: 0
                    });
                }
            }

            /**
             * Refresh scroll content
             */
            function refresh () {

                if (jsScrolling) {
                    instance.refresh();
                }
            }
        }
    }

}());
