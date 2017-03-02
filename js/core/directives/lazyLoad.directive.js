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

    jwLazyLoad.$inject = ['utils'];
    function jwLazyLoad (utils) {

        return {
            link:    link,
            scope:   false,
            require: '$ionicScroll'
        };

        function link (scope, element, attrs, $ionicScroll) {

            var contentView     = element[0].querySelector('.ionic-scroll'),
                scrollDebounced = utils.debounce(scroll, 100);

            activate();

            /////////////////////////

            /**
             * Initialize directive
             */
            function activate () {

                angular.element(contentView).on('scroll', scrollDebounced);
                scope.$on('$destroy', destroy);

                setTimeout(update, 1);
            }

            /**
             * Handle $destroy event
             */
            function destroy () {

                angular.element(contentView).off('scroll', scrollDebounced);
            }

            /**
             * Scroll handler
             */
            function scroll () {

                update();
            }

            /**
             * Get all jw-lazy-load elements and check if they are visible.
             */
            function update () {

                var cardElements = findElements('.jw-lazy-load'),
                    scrollOffset;

                if (!cardElements.length) {
                    return;
                }

                scrollOffset = contentView.offsetHeight + $ionicScroll.getScrollPosition().top + LAZY_LOAD_OFFSET;

                angular.forEach(cardElements, function (element) {

                    if (element.offsetTop <= scrollOffset) {
                        element.classList.remove('jw-lazy-load');
                    }
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
