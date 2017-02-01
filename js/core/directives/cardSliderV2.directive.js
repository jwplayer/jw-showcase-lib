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

    var LOADING_CARD_TEMPLATE = '<div class="jw-card-slider-slide jw-card-slider-slide-flag-loading">' +
        '<div class="jw-card jw-card-flag-default"><div class="jw-card-aspect"></span></div>' +
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

            var sliderList             = findElements('.jw-card-slider-list'),
                resizeHandlerDebounced = utils.debounce(resizeHandler, 100),
                index                  = 0,
                sliderHasMoved         = false,
                sliderCanSlide         = false,
                sliding                = false,
                totalItems             = 0,
                itemsVisible           = 1,
                itemsMargin            = 1,
                animation;

            scope.vm.slideLeft  = slideLeft;
            scope.vm.slideRight = slideRight;

            activate();

            /**
             * Initialize the directive.
             */
            function activate () {

                var classNameSuffix = scope.vm.featured ? 'featured' : 'default',
                    className       = 'jw-card-slider-flag-' + classNameSuffix,
                    loading         = scope.vm.feed.loading;

                element.addClass(className);

                if (loading) {
                    element.addClass('jw-card-slider-flag-loading');
                }

                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.feed.title || 'loading';
                }

                scope.$on('$destroy', destroyHandler);
                scope.vm.feed.on('update', feedUpdateHandler);
                window.addEventListener('resize', resizeHandlerDebounced);

                if (scope.vm.feed) {
                    totalItems = scope.vm.feed.playlist.length;
                }

                resizeHandler();
            }

            /**
             * Find child element by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElement (selector) {

                return angular.element(element[0].querySelector(selector))
            }

            /**
             * Find child elements by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElements (selector) {

                return angular.element(element[0].querySelectorAll(selector))
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

                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.feed.title;
                }

                totalItems = scope.vm.feed.playlist.length;

                element.removeClass('jw-card-slider-flag-loading');

                resizeHandler(true);
            }

            /**
             * Handle resize event
             */
            function resizeHandler (forceRender) {

                var newItemsVisible = angular.isNumber(scope.vm.cols) ? scope.vm.cols : utils.getValueForScreenSize(scope.vm.cols, 1),
                    needsRender     = newItemsVisible !== itemsVisible;

                itemsVisible   = newItemsVisible;
                itemsMargin    = newItemsVisible + 1;
                sliderCanSlide = totalItems > itemsVisible;

                sliderList.attr('class', 'jw-card-slider-list slides-' + itemsVisible);

                if (!sliderCanSlide) {
                    index          = 0;
                    sliderHasMoved = false;
                }

                findElements('.jw-card-slider-button').toggleClass('ng-hide', !sliderCanSlide);

                if (forceRender || needsRender) {
                    renderSlides();
                    moveSlider(0, false);
                }
            }

            function renderSlides () {

                var sliderList = angular.element('<div class="jw-card-slider-list slides-' + itemsVisible + '"></div>'),
                    slides     = Array.prototype.slice.call(findElement('.jw-card-slider-list').children()),
                    current    = index,
                    startIndex = sliderHasMoved ? itemsMargin : 0,
                    totalCols  = itemsVisible + itemsMargin;

                if (sliderHasMoved) {
                    current -= itemsMargin;
                    totalCols += itemsMargin;
                }

                if (scope.vm.feed.loading) {
                    for (var i = 0; i < itemsVisible; i++) {
                        findElement('.jw-card-slider-list').append(angular.element(LOADING_CARD_TEMPLATE));
                    }
                    return;
                }

                findElement('.jw-card-slider-button-flag-left').toggleClass('is-disabled', !sliderHasMoved);

                if (current < 0) {
                    current += totalItems;
                }

                for (var n = 0; n < totalCols; n++) {

                    if (current > totalItems - 1) {
                        if (!sliderCanSlide) {
                            break;
                        }

                        current -= totalItems;
                    }

                    var item = scope.vm.feed.playlist[current];

                    var slide = slides.find(function (slide) {
                        return slide.parentNode !== sliderList[0] && slide.getAttribute('key') === item.$key;
                    });

                    if (!slide) {
                        slide = compileSlide(item);
                    }

                    angular.element(slide).toggleClass('is-visible', n >= startIndex && n < startIndex + itemsVisible);

                    sliderList
                        .append(slide);

                    current++;
                }

                findElement('.jw-card-slider-list').html('');
                findElement('.jw-card-slider-list').append(sliderList.children());
            }

            function updateVisibleSlides (offset) {

                var from = sliderHasMoved ? itemsMargin : 0,
                    to   = from + itemsVisible;

                if (angular.isNumber(offset)) {
                    from += offset;
                    to += offset;
                }

                angular.forEach(findElement('.jw-card-slider-list').children(), function (slide, slideIndex) {
                    slide.classList.toggle('is-visible', slideIndex >= from && slideIndex < to);
                });
            }

            function compileSlide (item) {

                var childScope = scope.$new(false, scope);

                childScope.item = item;

                return $compile(angular.element(CARD_TEMPLATE))(childScope);
            }

            function slideLeft () {

                var toIndex   = index === 0 ? totalItems - itemsVisible : Math.max(0, index - itemsVisible),
                    slideCols = index - toIndex;

                if (sliding || !sliderHasMoved) {
                    return;
                }

                if (slideCols < 0) {
                    slideCols = (index + totalItems) - toIndex;
                }

                index = toIndex;

                updateVisibleSlides(-slideCols);

                moveSlider((slideCols / itemsVisible) * 100, true, function () {
                    renderSlides();
                    moveSlider(0, false);
                });
            }

            function slideRight () {

                var toIndex   = index + itemsVisible,
                    maxIndex  = totalItems - itemsVisible,
                    slideCols = itemsVisible;

                if (sliding) {
                    return;
                }

                if (index === maxIndex) {
                    toIndex = 0;
                }
                else if (toIndex >= maxIndex) {
                    toIndex   = maxIndex;
                    slideCols = toIndex - index;
                }

                index = toIndex;

                updateVisibleSlides(slideCols);

                moveSlider(((slideCols / itemsVisible) * 100) * -1, true, function () {

                    sliderHasMoved = true;

                    renderSlides();
                    moveSlider(0, false);
                });
            }

            /**
             * Move the slider to the given offset with or without animation.
             * @param {number} offset Offset
             * @param {boolean} animate Animate flag
             * @param {Function} [callback] Callback when slider has moved
             */
            function moveSlider (offset, animate, callback) {

                var listElement = findElement('.jw-card-slider-list');

                sliding = true;

                if (animation && animation._active) {
                    animation.kill();
                }

                if (sliderHasMoved) {
                    offset -= itemsMargin / itemsVisible * 100;
                }

                animation = window.TweenLite
                    .to(listElement, animate ? 0.3 : 0, {
                        x: offset + '%', z: 0.01, onComplete: onSlideComplete
                    });

                function onSlideComplete () {

                    sliding = false;

                    setTimeout(function () {
                        callback && callback();
                    }, 1);
                }
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
