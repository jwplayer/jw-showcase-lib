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

    var CARD_TEMPLATE = '<div class="jw-card-slider-slide" key="{{ item.$key }}">' +
        '<jw-card item="item" featured="vm.featured" show-title="true" show-description="true" on-click="vm.onCardClick"></jw-card>' +
        '</div>';

    angular
        .module('jwShowcase.core')
        .directive('jwCardSliderV2', cardSliderDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwCardSlider
     * @module jwShowcase.core
     *
     * @description
     * # jwCardSlider
     * The `jwCardSlider` can be used to create a horizontal list of cards which can be moved horizontally. Each item
     * will be rendered in the {@link jwShowcase.core.directive:jwCard `jwCard`} directive.
     *
     * @scope
     *
     * @param {jwShowcase.core.feed}    feed            Feed which will be displayed in the slider.
     * @param {boolean|string=}         heading         Text which will be displayed in the title or false if no title
     *                                                  should be displayed.
     *
     * @param {Object|number=}          cols            How many columns should be visible. Can either be a fixed number or
     *                                                  an object with responsive columns (e.g. `{sm: 2, md: 4}`).
     *                                                  Available sizes; xs, sm, md, lg and xl.
     *
     * @param {boolean=}                featured        Featured slider flag
     * @param {function=}               onCardClick     Function which is being called when the user clicks on a card.
     * @param {object=}                 delegate        Exposes a small api to control the cardSlider.
     *
     * @requires $timeout
     * @requires jwShowcase.core.utils
     *
     * @example
     *
     * ```
     * <jw-card-slider feed="vm.feed" cols="1" featured="true"></jw-card-slider>
     * <jw-card-slider feed="vm.feed" cols="{xs: 2, sm: 3}" featured="false" heading="'Videos'"></jw-card-slider>
     * ```
     */
    cardSliderDirective.$inject = ['$timeout', '$compile', 'utils'];
    function cardSliderDirective ($timeout, $compile, utils) {

        return {
            scope:            {
                heading:     '=?',
                feed:        '=',
                cols:        '=',
                featured:    '=',
                onCardClick: '=',
                delegate:    '=?'
            },
            replace:          true,
            controller:       angular.noop,
            controllerAs:     'vm',
            bindToController: true,
            templateUrl:      'views/core/cardSliderV2.html',
            link:             link
        };

        function link (scope, element) {


            var sliderList             = childEl('.jw-card-slider-list'),
                resizeHandlerDebounced = utils.debounce(resizeHandler, 100),
                rendered               = false,
                index                  = 0,
                cols                   = 1,
                animation;

            scope.vm.slideLeft  = slideLeft;
            scope.vm.slideRight = slideRight;

            activate();

            /**
             * Initialize the directive.
             */
            function activate () {

                var classNameSuffix = scope.vm.featured ? 'featured' : 'default',
                    className       = 'jw-card-slider-flag-' + classNameSuffix;

                element.addClass(className);

                scope.$on('$destroy', destroyHandler);
                scope.vm.feed.on('update', feedUpdateHandler);
                window.addEventListener('resize', resizeHandlerDebounced);

                resizeHandler();
            }

            /**
             * Find child element by selector
             * @param {string} selector
             * @returns {Object}
             */
            function childEl (selector) {

                return angular.element(element[0].querySelector(selector))
            }

            /**
             * Clean up
             */
            function destroyHandler () {

                scope.vm.feed.off('update', feedUpdateHandler);
                window.removeEventListener('resize', resizeHandlerDebounced);
            }

            /**
             * Gets called when the feed gets updated
             */
            function feedUpdateHandler () {

                if (rendered) {
                    renderAllSlides();
                    return;
                }

                firstRender();
            }

            /**
             * Handle resize event
             */
            function resizeHandler () {

                console.log('resize');

                var toCols     = utils.getValueForScreenSize(scope.vm.cols, 1),
                    needsRender = toCols !== cols;

                sliderList.attr('class', 'jw-card-slider-list slides-' + toCols);

                cols = toCols;

                if (true === needsRender) {
                    renderAllSlides();
                }
            }

            /**
             * Initiate first render
             */
            function firstRender () {

                console.log('firstRender');

                renderSlides(index, 'curr');
                renderSlides(index + cols, 'next');

                rendered = true;
            }

            function renderAllSlides () {

                console.log('renderAllSlides');

                if (childEl('.jw-card-slider-list-prev').children().length > 0) {
                    renderSlides(index - cols, 'prev');
                }

                renderSlides(index, 'curr');
                renderSlides(index + cols, 'next');
            }

            function renderSlides (fromIndex, slider) {

                var sliderList = angular.element('<div class="jw-card-slider-list-' + slider + '"></div>'),
                    totalItems = scope.vm.feed.playlist.length,
                    current    = fromIndex,
                    item;

                if (current < 0) {
                    current = totalItems - current;
                }

                for (var i = 0; i < cols; i++) {

                    if (current > totalItems - 1) {
                        if (totalItems <= cols) {
                            continue;
                        }

                        current -= totalItems;
                    }

                    item = scope.vm.feed.playlist[current] || {};

                    sliderList.append(compileSlide(item));

                    current++;
                }

                childEl('.jw-card-slider-list-' + slider).replaceWith(sliderList);
            }

            function compileSlide (item) {

                var childScope  = scope.$new(true, scope);
                childScope.item = item;

                return $compile(angular.element(CARD_TEMPLATE))(childScope);
            }

            function slideLeft () {

                var prevSlider    = childEl('.jw-card-slider-list-prev'),
                    currentSlider = childEl('.jw-card-slider-list-curr');

                moveSlider(100, true, function () {

                    index -= cols;

                    if (index < 0) {
                        index = scope.vm.feed.playlist.length - index;
                    }

                    childEl('.jw-card-slider-list-next').html(currentSlider.html());
                    currentSlider.html(prevSlider.html());
                    moveSlider(0, false);

                    renderSlides(index - cols, 'prev');
                });
            }

            function slideRight () {

                var nextSlider    = childEl('.jw-card-slider-list-next'),
                    currentSlider = childEl('.jw-card-slider-list-curr');

                nextSlider.addClass('sliding');

                moveSlider(-100, true, function () {
                    index += cols;

                    if (index > scope.vm.feed.playlist.length) {
                        index -= scope.vm.feed.playlist.length;
                    }

                    nextSlider.removeClass('sliding');
                    childEl('.jw-card-slider-list-prev').html(currentSlider.html());
                    childEl('.jw-card-slider-list-curr').html(nextSlider.html());
                    moveSlider(0, false);

                    renderSlides(index + cols, 'next');
                });
            }

            /**
             * Move the slider to the given offset with or without animation.
             * @param {number} offset Offset
             * @param {boolean} animate Animate flag
             * @param {Function} [callback] Callback when slider has moved
             */
            function moveSlider (offset, animate, callback) {

                var listElement = childEl('.jw-card-slider-list');

                if (animation && animation._active) {
                    animation.kill();
                }

                animation = window.TweenLite
                    .to(listElement, animate ? 0.3 : 0, {
                        x: offset + '%', z: 0.01, onComplete: function () {
                            callback && callback();
                        }
                    });
            }

            /**
             * Get coords object from native touch event. Original code from ngTouch.
             *
             * @param {Event} event
             * @returns {{x: (number), y: (number)}}
             */
            function getCoords (event) {

                var originalEvent = event.originalEvent || event,
                    touches       = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches
                        : [originalEvent],
                    e             = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

                return {
                    x: e.clientX,
                    y: e.clientY
                };
            }

            /**
             * Ease out the given distance
             *
             * @param {number} current Current distance
             * @param {number} total Total distance
             * @returns {number}
             */
            function easeOutDistance (current, total) {

                return Math.sin((0.5 / total) * current) * current;
            }
        }
    }

}());
