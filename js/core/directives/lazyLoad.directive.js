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

    var LAZY_LOAD_OFFSET = 400;

    angular
        .module('jwShowcase.core')
        .directive('jwLazyLoad', jwLazyLoad);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwLazyLoad
     * @module jwShowcase.core
     *
     * @description
     * # jwLazyLoad
     * The `jwLazyLoad` directive is used to lazy load card-posters when they are not visible in the scroll view.
     * For optimization reasons the .jw-lazy-load className needs to be added to each slider or card manually in order
     * to prevent browser pre loading.
     *
     * @example
     *
     * <ion-view jw-lazy-load>
     *   <ion-content>
     *       <jw-card class="jw-lazy-load"></jw-card>
     *       <jw-card class="jw-lazy-load"></jw-card>
     *       <jw-card class="jw-lazy-load"></jw-card>
     *       <jw-card class="jw-lazy-load"></jw-card>
     *       <jw-card-slider class="jw-lazy-load"></jw-card-slider>
     *   </ion-content>
     * </ion-view>
     */

    jwLazyLoad.$inject = ['$timeout', 'utils'];
    function jwLazyLoad ($timeout, utils) {

        return {
            link:    link,
            scope:   false
        };

        function link (scope, element, attrs) {

            var updateDebounced = utils.debounce(update, 100);

            activate();

            /////////////////////////

            /**
             * Initialize directive
             */
            function activate () {

                window.addEventListener('scroll', updateDebounced, window.supportsPassive ? {passive: true} : false);
                scope.$on('$destroy', destroy);
                scope.$on('$viewContentUpdated', updateDebounced);

                $timeout(updateDebounced, 500);
            }

            /**
             * Handle $destroy event
             */
            function destroy () {

                window.removeEventListener('scroll', updateDebounced);
            }

            /**
             * Get all jw-lazy-load elements and check if they are visible.
             */
            function update () {

                var cardElements = findElements('.jw-lazy-load'),
                    visibleElements = [],
                    scrollPosition,
                    scrollOffset;

                if (!cardElements.length) {
                    return;
                }

                scrollPosition = document.body.scrollTop;
                scrollOffset = document.body.offsetHeight + scrollPosition + LAZY_LOAD_OFFSET;

                angular.forEach(cardElements, function (element) {

                    var top = element.getBoundingClientRect().top + scrollPosition;

                    // prevent recalculations and repaints by first collecting all visible elements. If we would remove
                    // a className directly the next getBoundingClientRect call will trigger a recalculation.

                    if (top <= scrollOffset) {
                        visibleElements.push(element);
                    }
                });

                angular.forEach(visibleElements, function (element) {
                    element.classList.remove('jw-lazy-load');
                });
            }

            /**
             * Find elements by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElements (selector) {

                return angular.element(element[0].querySelectorAll(selector));
            }
        }
    }

}());
